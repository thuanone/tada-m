// react
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';
// 3rd-party
import * as log from 'loglevel';
// carbon + pal
import { Close16, Edit16, Run32, Save16 } from '@carbon/icons-react';
import { Button, InlineLoading, InlineNotification, Tab, Tabs, TextInput } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader } from '@console/pal/Components';
// coligo
import * as appModel from '../../../../../common/model/application-model';
import * as commonModel from '../../../../../common/model/common-model';
import * as projectModel from '../../../../../common/model/project-model';
import * as memoryUtils from '../../../../../common/utils/memory-utils';
import * as coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../../common/validator/common-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as applicationApi from '../../../../api/application-api';
import t from '../../../../utils/i18n';
import clgContainerRegistryName from '../../../../utils/formatter/clgContainerRegistryName';
import toastNotification from '../../../../utils/toastNotification';
import * as viewApplicationModels from '../../../model/application-view-models';
import * as viewAppModels from '../../../model/application-view-models';
import * as viewCommonModels from '../../../model/common-view-model';
import { IActivity } from '../ApplicationDetailActivities/ApplicationActivity';
import ApplicationDetailActivities from '../ApplicationDetailActivities/ApplicationDetailActivities';
import ApplicationDetailTabCode from '../ApplicationDetailTabCode/ApplicationDetailTabCode';
import ApplicationDetailTabEnvironment from '../ApplicationDetailTabEnvironment/ApplicationDetailTabEnvironment';
import ApplicationDetailTabRuntime from '../ApplicationDetailTabRuntime/ApplicationDetailTabRuntime';
import ApplicationRevisionSelector from '../ApplicationRevisionSelector/ApplicationRevisionSelector';
import { keyValueToUIEnvItem } from '../../../../../common/utils/environment-utils';

interface IProps {
  application: appModel.IUIApplication;
  projectStatus?: projectModel.IUIProjectStatus;
  project?: projectModel.IUIProject;
  handleNewRevision: (newRevision: appModel.IUIApplicationRevision) => any;
}

interface IState {
  error: viewCommonModels.IClgInlineNotification;
  revision: appModel.IUIApplicationRevision;
  revisionName?: commonValidator.IClgTextField;
  isDomainReady: boolean;
  isFormInvalid: {
    [key: string]: boolean
  };
  isInvalid: boolean;
  activities: IActivity[];
  isSaving: boolean;
  project?: projectModel.IUIProject;
  revisionToSave: appModel.IUIApplicationRevision;
  unsavedChanges: {
    [key: string]: boolean
  };
}

class ApplicationDetailConfiguration extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailConfiguration';

  private readonly regionId: string;
  private readonly projectId: string;
  private readonly applicationId: string;

  private readonly REVISION_NAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.application.revisionName;

  private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.regionId = props.match.params.regionId;
    this.projectId = props.match.params.projectId;
    this.applicationId = props.match.params.applicationId;

    this.state = {
      activities: [],
      error: undefined,
      isDomainReady: this.props.projectStatus ? this.props.projectStatus.domain : false,
      isFormInvalid: {},
      isInvalid: false,
      isSaving: false,
      project: this.props.project,
      revision: this.props.application.revision,
      revisionToSave: undefined,
      unsavedChanges: {},
    };

    // binding all callback functions to this, in order to enable setState and this.state
    this.closeNotification = this.closeNotification.bind(this);
    this.enterEditMode = this.enterEditMode.bind(this);
    this.dismissUnsavedChanges = this.dismissUnsavedChanges.bind(this);
    this.deriveNewRevision = this.deriveNewRevision.bind(this);
    this.handleRevisionChange = this.handleRevisionChange.bind(this);
    this.handleUserUpdates = this.handleUserUpdates.bind(this);
    this.hasUnsavedChanges = this.hasUnsavedChanges.bind(this);
    this.invokeApplication = this.invokeApplication.bind(this);
    this.handleInvoke = this.handleInvoke.bind(this);
    this.onRevisionNameChange = this.onRevisionNameChange.bind(this);
    this.saveNewRevision = this.saveNewRevision.bind(this);
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.debug(`${fn}`);
    if (!this.state.isDomainReady && newProps.projectStatus && newProps.projectStatus.domain) {
      this.logger.debug(`${fn}- state update necessary -> isDomainReady? ${newProps.projectStatus.domain}`);
      this.setState({ isDomainReady: newProps.projectStatus.domain });
    }

    if (!this.state.project && newProps.project) {
      this.setState({ project: newProps.project });
    }
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}>`);
    this.logger.trace(`${fn}-${this.COMPONENT} ${this.state.activities.length}, revision: '${JSON.stringify(this.state.revision)}', revisionToSave: '${JSON.stringify(this.state.revisionToSave)}'`);
    return (
      <div className='clg-application-detail-page--configuration'>
        <div>
          <div className='bx--row'>
            <div className='bx--col-lg-10 bx--col-md-8 bx--col-sm-4 clg-card-container'>
              <Card>
                <CardHeader
                  className='clg-card-header'
                  small={true}
                  title={t('clg.nav.application.configuration')}
                >
                  {!this.state.revisionToSave &&
                    (
                      <Button kind='ghost' size='small' renderIcon={Edit16} onClick={this.enterEditMode} className={'create-newrevision-btn'}>{t('clg.page.application.action.newrevision')}</Button>
                    )}
                  {this.state.revisionToSave &&
                    (
                      <div className={`current-revision__actions ${(this.state.revisionName && typeof this.state.revisionName.invalid !== 'undefined') ? 'invalid-name' : ''}`}>
                        <Button kind='secondary' disabled={this.state.isSaving} size='small' renderIcon={Close16} onClick={this.dismissUnsavedChanges} className={'cancel-newrevision-btn'}>{t('clg.common.label.cancel')}</Button>
                        {this.state.isSaving ?
                          (
                            <InlineLoading status='active' description={t('clg.page.application.loading.saverevision')} />
                          ) : (
                            <Button kind='primary' disabled={this.state.isSaving || this.state.isInvalid} size='small' renderIcon={Save16} onClick={this.saveNewRevision} className={'save-newrevision-btn'}>{t('clg.common.label.saveanddeploy')}</Button>
                          )}
                      </div>
                    )}
                </CardHeader>
                <CardBody>
                  <div className='section current-revision'>
                    {this.state.revisionToSave &&
                      (
                        <React.Fragment>
                          <div className='current-revision__name'>
                            <div className='bx--form-item bx--text-input-wrapper'>
                              <label className='bx--label'>{t('clg.application.newRevision')}</label>
                              <div className='new-name'>
                                <div className='new-name__base-part'>{`${this.props.application.name}-`}</div>
                                <TextInput
                                  className={'new-name__custom-part'}
                                  labelText={t('')}
                                  type={'text'}
                                  id={'revision-name'}
                                  disabled={this.state.isSaving}
                                  hideLabel={true}
                                  light={true}
                                  onChange={this.onRevisionNameChange}
                                  placeholder={t('clg.application.revname.placeholder')}
                                  invalid={this.state.revisionName && typeof this.state.revisionName.invalid !== 'undefined'}
                                  invalidText={this.state.revisionName ? t('clg.application.revname.invalid.' + this.state.revisionName.invalid, this.REVISION_NAME_RULES) : ''}
                                  value={this.state.revisionToSave.name}
                                />
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      )}

                    {!this.state.revisionToSave &&
                      (
                        <div className='current-revision__name'>
                          <ApplicationRevisionSelector application={this.props.application} revision={this.state.revision} handleChange={this.handleRevisionChange} />
                        </div>
                      )}
                  </div>
                  {this.state.error &&
                    (
                      <InlineNotification
                        kind={this.state.error.kind}
                        lowContrast={true}
                        title={this.state.error.title}
                        subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                        onCloseButtonClick={this.closeNotification}
                      />
                    )}
                  <div className='section revision-configuration'>
                    <Tabs type='container' className={'source-application-tabs clg-full-width-tabnav '} tabContentClassName={'application-section--content'} aria-label='configuration tabs'>
                      <Tab id={'application-tab-code'} tabIndex={0} label={(<span>{this.hasUnsavedChanges('code')}{t('clg.page.application.tab.source')}</span>)} className={'source-application-tab-content'} aria-label={t('clg.page.application.tab.source')}>
                        <ApplicationDetailTabCode revision={this.state.revisionToSave || this.state.revision} isEditMode={typeof this.state.revisionToSave !== 'undefined'} handleChange={this.handleUserUpdates} project={this.state.project} />
                      </Tab>
                      <Tab id={'application-tab-environment'} tabIndex={1} label={(<span>{this.hasUnsavedChanges('environment')}{t('clg.page.application.tab.env')}</span>)} aria-label={t('clg.page.application.tab.env')}>
                        <ApplicationDetailTabEnvironment projectId={this.projectId} regionId={this.regionId} revision={this.state.revisionToSave || this.state.revision} isEditMode={typeof this.state.revisionToSave !== 'undefined'} handleChange={this.handleUserUpdates} />
                      </Tab>
                      <Tab id={'application-tab-runtime'} tabIndex={2} label={(<span>{this.hasUnsavedChanges('runtime')}{t('clg.page.application.tab.runtime')}</span>)} aria-label={t('clg.page.application.tab.runtime')}>
                        <ApplicationDetailTabRuntime revision={this.state.revisionToSave || this.state.revision} isEditMode={typeof this.state.revisionToSave !== 'undefined'} handleChange={this.handleUserUpdates} />
                      </Tab>
                    </Tabs>
                  </div>
                </CardBody>
              </Card>
            </div>
            <div className='bx--col-lg-6 bx--col-md-8 bx--col-sm-4 clg-card-container'>
              <Card>
                <CardHeader
                  className='clg-card-header'
                  small={true}
                  title={t('clg.page.application.section.invocations')}
                >
                  <Button kind='primary' size='small' disabled={typeof this.props.application.latestReadyRevisionName === 'undefined' || !this.state.isDomainReady} renderIcon={Run32} onClick={this.invokeApplication} className={'invoke-application-btn'}>{t('clg.page.application.action.invoke')}</Button>
                </CardHeader>
                <CardBody>
                  <div className='section invocations'>
                    <div className='application-section--content no-pad-left'>
                      <ApplicationDetailActivities activities={this.state.activities} handleInvoke={this.handleInvoke} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private closeNotification() {
    this.setState({ error: undefined });
  }

  private hasUnsavedChanges(tab: string): React.ReactFragment {
    return (
      <React.Fragment>
        {this.state.unsavedChanges && this.state.unsavedChanges[tab] &&
          <span className='unsaved-changes'>&nbsp;</span>
        }
      </React.Fragment>
    );
  }

  private onRevisionNameChange(event) {
    const fn = 'onRevisionNameChange ';
    this.logger.debug(`${fn}- ${event.target.value}`);

    // populate the update
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.REVISION_NAME_RULES);

      // evaluate whether the save button must be disabled
      const shouldDisableSaveBtn = field.invalid ? true : false;

      this.setState({ revisionName: field });
      this.handleUserUpdates('name', { revisionName: field, shouldDisableSaveBtn });
    }
  }

  /**
   * This function receives an update from the revision selector child component.
   * @param {*} event - contains the selectedItem as property
   */
  private handleRevisionChange(event) {
    const fn = 'handleRevisionChange ';
    this.logger.debug(`${fn}- ${event.selectedItem.name}`);

    // TODO check for unsaved changes and let the user confirm that he accepts to dismiss these

    // by changing the state, we will apply the update to all nested objects
    this.setState({ revision: event.selectedItem, unsavedChanges: {}, revisionToSave: undefined, isFormInvalid: {}, isInvalid: false, revisionName: undefined });
  }

  private mergeLimitsIntoRevision(revision: appModel.IUIApplicationRevision, limits: viewApplicationModels.IViewApplicationLimits): appModel.IUIApplicationRevision {
    const mergedRev = Object.assign({}, revision);
    mergedRev.cpus = limits.cpus.val;
    mergedRev.maxScale = limits.maxScale.val;
    mergedRev.memory = limits.memory.val && memoryUtils.convertValueToBytes(`${limits.memory.val}Mi`);
    mergedRev.minScale = limits.minScale.val;
    mergedRev.timeoutSeconds = limits.timeoutSeconds.val;
    mergedRev.containerConcurrency = limits.containerConcurrency.val;
    return mergedRev;
  }

  private mergeEnvironmentIntoRevision(revision: appModel.IUIApplicationRevision, environment: viewApplicationModels.IViewApplicationEnvironment): appModel.IUIApplicationRevision {
    const mergedRev = Object.assign({}, revision);
    mergedRev.parameters = [];
    if (environment.parameters) {
      for (const param of environment.parameters) {
        mergedRev.parameters.push(keyValueToUIEnvItem(param));
      }
    }
    return mergedRev;
  }

  private mergeCodeIntoRevision(revision: appModel.IUIApplicationRevision, code: viewApplicationModels.IViewApplicationCode): appModel.IUIApplicationRevision {
    const mergedRev = Object.assign({}, revision);
    mergedRev.image = code.image.val;
    mergedRev.imagePullSecret = clgContainerRegistryName.isDummRegistry(code.registry) ? undefined : code.registry.name;
    return mergedRev;
  }

  private deriveNewRevision() {
    const derivedRevision = Object.assign({}, this.state.revision);
    derivedRevision.name = this.getGeneratedRevName(this.props.application);
    return derivedRevision;
  }

  private updateFormStatus(formState: {}, area: string, shouldBeDisabled: boolean) {
    if (shouldBeDisabled) {
      formState[area] = true;
    } else if (formState[area]) {
      delete formState[area];
    }
  }

  private enterEditMode() {
    const fn = 'enterEditMode ';
    this.logger.debug(`${fn}>`);

    const revisionToSave: appModel.IUIApplicationRevision = this.state.revisionToSave || this.deriveNewRevision();

    // this flag indicates whether the create button shall be deactivated, or not
    const isFormInvalid = {};

    const unsavedChanges = {};

    const isInvalid = false;

    // set the information that an update happened into the components state
    this.logger.debug(`${fn}- revisionToSave: '${JSON.stringify(revisionToSave)}'`);
    this.setState({ unsavedChanges, revisionToSave, isFormInvalid, isInvalid });
  }

  /**
   * This functions receives update events from child components.
   * In case a new update comes in, this component ensures that unsaved changes state (see tabs) is set.
   * Additionally, this function ensures that the overall page state is kept up-to-date.
   * @param {string} sourceType - the source where the update was received from (either: 'source', or 'limits')
   * @param {*} updatedValues - an map that contains all updates that were made. this object will be merged into the page state
   */
  private handleUserUpdates(sourceType, updatedValues: viewAppModels.IViewApplicationLimits | viewAppModels.IViewApplicationCode | viewAppModels.IViewApplicationEnvironment | any) {
    const fn = '_handleUserUpdates ';
    this.logger.debug(`${fn}- ${sourceType} - updates: '${JSON.stringify(updatedValues)}'`);

    let revisionToSave: appModel.IUIApplicationRevision = this.state.revisionToSave || this.deriveNewRevision();

    // this flag indicates whether the create button shall be deactivated, or not
    const isFormInvalid = this.state.isFormInvalid;

    if (updatedValues && sourceType === 'code') {
      revisionToSave = this.mergeCodeIntoRevision(revisionToSave, updatedValues);
      // checks whether the update values fit
      this.updateFormStatus(isFormInvalid, 'code', updatedValues.shouldDisableSaveBtn);
    }

    if (updatedValues && sourceType === 'environment') {
      revisionToSave = this.mergeEnvironmentIntoRevision(revisionToSave, updatedValues);
      // checks whether the update values fit
      this.updateFormStatus(isFormInvalid, 'environment', updatedValues.shouldDisableSaveBtn);
    }

    if (updatedValues && sourceType === 'runtime') {
      revisionToSave = this.mergeLimitsIntoRevision(revisionToSave, updatedValues);
      // checks whether the update values fit
      this.updateFormStatus(isFormInvalid, 'runtime', updatedValues.shouldDisableSaveBtn);
    }

    if (updatedValues && sourceType === 'name') {
      revisionToSave.name = updatedValues.revisionName.val;
      // checks whether the update values fit
      this.updateFormStatus(isFormInvalid, 'name', updatedValues.shouldDisableSaveBtn);
    }

    const unsavedChanges = this.state.unsavedChanges;
    unsavedChanges[sourceType] = true;

    // check whether one of the form parts has been marked invalid
    const isInvalid = isFormInvalid.code || isFormInvalid.environment || isFormInvalid.runtime || isFormInvalid.name;

    // set the information that an update happened into the components state
    this.logger.debug(`${fn}- revisionToSave: '${JSON.stringify(revisionToSave)}'`);
    this.setState({ unsavedChanges, revisionToSave, isFormInvalid, isInvalid });
  }

  private getGeneratedRevName(application: appModel.IUIApplication) {
    return `${Math.random().toString(36).replace(/[^a-z1-9]+/g, '').substr(0, 6)}-${application.generation + 1}`;
  }

  private dismissUnsavedChanges() {
    const fn = 'dismissUnsavedChanges ';
    this.logger.debug(`${fn}> `);

    const rev = this.state.revision;

    this.setState({ revision: rev, unsavedChanges: {}, revisionToSave: undefined, isFormInvalid: {}, isInvalid: false, revisionName: undefined });
    this.logger.debug(`${fn}<`);
  }

  private saveNewRevision() {
    const fn = 'saveNewRevision ';
    this.logger.debug(`${fn}>`);

    // show the loading animation
    this.setState({ isSaving: true });

    // save the new revision
    applicationApi.saveApplicationRevision(this.props.application, this.state.revisionToSave)
      .then((requestResult: commonModel.IUIRequestResult) => {
        this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

        // extract the created application from the response result
        const updatedApplication: appModel.IUIApplication = requestResult.payload;

        // we need to adjust the name to fully align with the revision name
        const newRevision = this.state.revisionToSave;
        newRevision.name = `${this.props.application.name}-${this.state.revisionToSave.name}`;

        // update the revision and hide the loading animation
        this.setState({ isSaving: false, unsavedChanges: {}, revision: newRevision, revisionToSave: undefined, isFormInvalid: {}, isInvalid: false, revisionName: undefined });

        // populate the change to the parent component
        this.props.handleNewRevision(this.state.revisionToSave);

        // show a toast notification
        const successNotification: viewCommonModels.IClgToastNotification = {
          kind: 'success',
          subtitle: t('clg.page.application.success.createNewRevision.subtitle', { name: newRevision.name }),
          title: t('clg.page.application.success.createNewRevision.title'),
        };
        toastNotification.add(successNotification);

        this.logger.debug(`${fn}< updated application: '${JSON.stringify(updatedApplication)}'`);
      })
      .catch((requestError: commonModel.UIRequestError) => {
        this.logger.warn(`${fn}- An error occurred while saving the new revision : '${JSON.stringify(requestError)}'`);

        this.setState({ isSaving: false });

        // we need to adjust the name to fully align with the revision name
        const revisionName = `${this.props.application.name}-${this.state.revisionToSave.name}`;

        // in case the response could not be mapped to a specific creation error, we should use a generic one
        const errorNotification: viewCommonModels.IClgToastNotification = {
          kind: 'error',
          subtitle: t('clg.page.application.error.saveRevisionFailed.subtitle', { name: revisionName }),
          title: t('clg.page.application.error.saveRevisionFailed.title'),
        };
        toastNotification.add(errorNotification);
      });
  }

  private handleInvoke() {
    this.invokeApplication();
  }

  private invokeApplication() {
    const fn = 'invokeApplication ';
    this.logger.debug(`${fn}>`);

    // create the next invocation object
    const activity: IActivity = {
      collapsed: false,
      id: this.state.activities.length,
      resolved: false,
      startTime: Date.now(),
      startDate: new Date().toISOString(),
      title: this.props.application.latestReadyRevisionName || this.props.application.name,
      type: 'invoke',
    };

    if (this.state.activities.length > 0) {
      // hide the last result
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.activities[this.state.activities.length - 1].collapsed = true;
    }

    // add this invocation to the view
    const updatedActivations = this.state.activities.concat(activity);

    this.logger.debug(`${fn}- ${updatedActivations.length} invocations`);
    // this.setState({ invocations: updatedActivations });
    this.setState({ activities: updatedActivations });

    // build the application url
    const applicationUrl: string = this.props.application.publicServiceUrl || '';

    // invoke the application
    applicationApi.doInvokeApplication(this.props.application, applicationUrl)
      .then((result: commonModel.IUIRequestResult) => {
        this.logger.debug(`${fn}- invocation succeeded: '${JSON.stringify(result)}'`);

        const invocationResult: appModel.IUIApplicationInvocationResult = result.payload;

        // application could be invoked properly
        activity.success = true;
        activity.resolved = true;
        activity.responseBody = invocationResult.responseBody;
        activity.durationInMillis = invocationResult.durationInMillis;
        activity.endDate = new Date().toISOString();

        // set the state to trigger a re-render
        this.setState({ activities: this.state.activities });
      })
      .catch((requestError: commonModel.UIRequestError) => {
        this.logger.debug(`${fn}- invocation done but failed - ${commonModel.stringifyUIRequestError(requestError)}`);
        activity.success = false;
        activity.resolved = true;
        activity.responseBody = `${requestError.statusCode ? `${requestError.statusCode}` : 'UNKNOWN ERROR'}`;
        activity.endDate = new Date().toISOString();
        activity.durationInMillis = (Date.now() - activity.startTime);

        // set the state to trigger a re-render
        this.setState({ activities: this.state.activities });
      });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailConfiguration.propTypes = {
  application: PropTypes.object.isRequired,
  handleNewRevision: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      applicationId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      regionId: PropTypes.string.isRequired,
    }),
  }),
  project: PropTypes.object,
  projectStatus: PropTypes.object,
};

const withRouterApplicationDetailConfiguration = withRouter(ApplicationDetailConfiguration);
export { ApplicationDetailConfiguration };
export default withRouterApplicationDetailConfiguration;

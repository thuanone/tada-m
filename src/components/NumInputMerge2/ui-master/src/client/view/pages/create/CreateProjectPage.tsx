// react
import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { InlineNotification, NotificationActionButton, TextInput } from '@console/pal/carbon-components-react';
import { OrderSummaryV2, PageHeader } from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { ResourceTagArea } from '@console/pal/Connected';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import * as projectApi from '../../../api/project-api';
import app from '../../../utils/app';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import nav from '../../../utils/nav';
import ClgBanner from '../../components/ClgBanner/ClgBanner';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgRegionSelector from '../../components/ClgRegionSelector/ClgRegionSelector';
import ClgResourceGroupSelector from '../../components/ClgResourceGroupSelector/ClgResourceGroupSelector';
import * as viewCommonModel from '../../model/common-view-model';
import GlobalStateContext from '../../common/GlobalStateContext';
import { ClgLiftedLimitations } from '../../common/ClgLiftedLimitations';
import { IUIRequestResult } from '../../../../common/model/common-model';

// see: https://github.ibm.com/ibmcloud/platform-unification/blob/master/architecture/purchasing/oneEstimatorSchema.md
interface IEstimateData {
  lineItem: {
    estimateType: 'basic-plan',
    costEstimate: {
      nonVariables: [{
        price: [{ cost: 0 }],
        type: 'recurring',
      }]
    },
    id: string,
    planId: string,
    regionId: string,
    shortDescription: string,
    subtitle: string,
    title: string,
  };
  version: '1.0';
}

interface IProps {
  history: any;
}

interface IState {
  error?: viewCommonModel.IClgInlineNotification;
  estimateData: IEstimateData;
  projectName: commonValidator.IClgTextField;
  isCreateDisabled: boolean;
  isCreateDisabledDueToLimitations: boolean;
  isCreating: boolean;
  isCreationModalOpen: boolean;
  isLoading: boolean;
  isLoadingResourceGroup: boolean;
  selectedRegion: projectModel.IUIRegion;
  selectedResourceGroup: projectModel.IUIResourceGroup;
  tags: string[];
}

class CreateProjectPage extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'CreateProjectPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly NAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.project.name;
  private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

  constructor(props) {
    super(props);
    this.state = {
      estimateData: {
        lineItem: {
          costEstimate: {
            nonVariables: [
              {
                price: [{ cost: 0 }],
                type: 'recurring',
              }
            ]
          },
          estimateType: 'basic-plan',
          id: '',
          planId: 'd0cc9165-0ca4-417a-a331-3a22d4e41ea0',
          regionId: '',
          shortDescription: '',
          subtitle: t('clg.page.overview.tag.experimental'),
          title: '',
        },
        version: '1.0',
      },
      isCreateDisabled: true,
      isCreateDisabledDueToLimitations: false,
      isCreating: false,
      isCreationModalOpen: false,
      isLoading: true,
      isLoadingResourceGroup: true,
      projectName: {
        val: '',
      },
      selectedRegion: undefined,
      selectedResourceGroup: undefined,
      tags: [],
    };

    this.handleProjectNameChange = this.handleProjectNameChange.bind(this);
    this.createNewProject = this.createNewProject.bind(this);
    this.createNewProjectConfirm = this.createNewProjectConfirm.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleModalCancel = this.handleModalCancel.bind(this);
    this.closeNotification = this.closeNotification.bind(this);
    this.onRegionError = this.onRegionError.bind(this);
    this.onRegionSelection = this.onRegionSelection.bind(this);
    this.onResourceGroupError = this.onResourceGroupError.bind(this);
    this.onResourceGroupSelection = this.onResourceGroupSelection.bind(this);
    this.onTagListChange = this.onTagListChange.bind(this);
    this.shouldDisableCreate = this.shouldDisableCreate.bind(this);
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug('componentDidMount');

    app.arrivedOnPage('clg.pages.create.project');

    // set the focus directly to the project name field
    setTimeout(() => {
      if (document.getElementById('create-project-name')) {
        document.getElementById('create-project-name').focus();
      }
    }, 1000);

    // check if there are project limitations which disable creating more than 1 project per region
    projectApi.getRegions().then(({payload}) => {
      this.logger.debug(`${fn}- getRegions: '${payload}'`);
      // if only one region TODO: change after experimental
      if (payload && payload.length >= 1) {
        this.logger.debug(`${fn}- getRegions: 'only one region'`);
        // and if already one project created
        projectApi.getAllProjects().then((projectsResult: IUIRequestResult) => {
          if (projectsResult.payload && projectsResult.payload.length >= 1) {
            this.logger.debug(`${fn}- getAllProjects: 'one or more project(s) existing'`);
            // and if lift-limitations is false
            if (this.context.liftedProjectLimitations === false) { // FIXME ER: this evaluation seems not to work properly!!!
              this.logger.debug(`${fn}- 'limitations are not lifted for this user -> create disabled'`);
              this.setState({isCreateDisabledDueToLimitations: true});
            }
          }
        });
      }
    });

    this.setState({ isLoading: false });
  }

  public render() {
    const language = getLocale(window.navigator.language);
    this.logger.debug(`render - lang: '${language}', isCreateDisabledDueToLimitations? ${this.state.isCreateDisabledDueToLimitations} isCreateDisabled? ${this.state.isCreateDisabled}`);

    if (this.state.isLoading && !this.state.error) { return (<div className='page create-pages'><PageHeaderSkeleton actions={false} breadrumbs={true} title={true} /></div>); }

    let limitationBanner;
    if (!this.context.liftedProjectLimitations) {
      limitationBanner = (
        <ClgBanner
          className='banner--experimental-limitations'
          icon={<img src={img.get('clg-experimental-banner')} alt='experimental-limitations' />}
          title={t('clg.banner.limitations-experimental.title')}
          description={t('clg.banner.limitations-experimental.description')}
          moreLabel='clg.banner.limitations-experimental.more'
          moreLink={nav.getDocsLink('limits-experimental')}
        />
      );
    }

    return (
      <React.Fragment>
        <div className='page create-pages'>
          <div className='coligo-create--content'>
            <PageHeader
              className='coligo-create--header'
              title={t('clg.page.create.project.title')}
              linkComponent={Link}
              breadcrumbs={[{
                to: nav.toGettingStartedOverview(),
                value: t('clg.breadcrumb.home'),
              }]}
            />
            <div className='bx--grid page-content coligo-form'>
              {this.state.error &&
                (
                  <React.Fragment>
                    <InlineNotification
                      kind={this.state.error.kind}
                      statusIconDescription={this.state.error.title}
                      lowContrast={true}
                      title={this.state.error.title}
                      subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                      onCloseButtonClick={this.closeNotification}
                      actions={this.state.error.actionFn &&
                        (
                          <NotificationActionButton
                            onClick={this.state.error.actionFn}
                          >
                            {this.state.error.actionTitle}
                          </NotificationActionButton>
                        )
                      }
                    />
                    {this.state.error.clgId &&
                      <div className='coligo-id'>ErrorID: {this.state.error.clgId}</div>
                    }
                  </React.Fragment>
                )
              }
              <ClgLiftedLimitations />

              {limitationBanner}

              <h4 className='productive-heading-03 first-section'>{t('clg.page.create.project.configure.location')}</h4>
              <div className='bx--row details-container last-row-of-section'>
                <div className='bx--col-lg-4 bx--col-md-4 bx--col-sm-4'>
                  <ClgRegionSelector onError={this.onRegionError} onSelect={this.onRegionSelection} disabled={this.state.isCreating} />
                </div>
              </div>

              <h4 className='productive-heading-03'>{t('clg.page.create.project.configure.project')}</h4>
              <div className='details-container'>
                <div className='bx--row'>
                  <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                    <TextInput
                      id={'create-project-name'}
                      labelText={t('clg.common.label.name')}
                      placeholder={t('clg.page.create.project.name.placeholder')}
                      type={'text'}
                      value={this.state.projectName.val}
                      invalid={typeof this.state.projectName.invalid !== 'undefined'}
                      invalidText={t('clg.project.name.invalid.' + this.state.projectName.invalid, this.NAME_RULES)}
                      onChange={this.handleProjectNameChange}
                      tabIndex={0}
                      disabled={this.state.isCreating}
                    />
                  </div>
                </div>
                <div className='bx--row'>
                  <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                    <ClgResourceGroupSelector onError={this.onResourceGroupError} onSelect={this.onResourceGroupSelection} disabled={this.state.isCreating} />
                  </div>
                </div>
                <div className='bx--row'>
                  <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                    <ResourceTagArea id='project-tags' i18nLanguage={language} isEditable={true} disabled={this.state.isCreating} toolTipDirection='right' inline={true} light={false} onChange={this.onTagListChange} />
                  </div>
                </div>
              </div>
            </div>
            <OrderSummaryV2
              estimateData={this.state.estimateData}
              estimateButtonProps={{
                disabled: this.state.isCreateDisabled || this.state.isCreating,
              }}
              isFree={true}
              items={[
                {
                  details: [
                    { name: t('clg.page.create.project.summary.proj.text') },
                  ],
                  name: t('clg.page.create.project.summary.proj.title'),
                  value: t('clg.page.create.project.summary.proj.price')
                }
              ]}
              locale={language}
              primaryButtonText={t('clg.common.label.create')}
              primaryButtonLoading={this.state.isCreating}
              primaryButtonLoadingText={t('clg.page.create.project.summary.loadingText')}
              primaryButtonProps={{
                disabled: this.state.isCreateDisabledDueToLimitations || this.state.isCreateDisabled,
                onClick: this.createNewProjectConfirm,
              }}
              secondaryButtonText={t('clg.common.label.cancel')}
              secondaryButtonProps={{
                disabled: this.state.isCreating,
                onClick: this.handleCancel,
              }}
              termsText={<a className='bx--link' href='https://www.ibm.com/software/sla/sladb.nsf/sla/bm-6605-19' target='_blank' rel='noopener noreferrer'>{t('clg.page.create.project.summary.sum.termsandconditions')}</a>}
              totalCost={t('clg.page.create.project.summary.sum.price')}
              totalCostText={`${t('clg.page.create.project.summary.sum.text')}`}
            />
          </div>
          <ClgConfirmationModal
            id={'confirm-project-creation-modal'}
            isDanger={false}
            isSubmitting={this.state.isCreating}
            onSubmitHandler={this.createNewProject}
            onCancelHandler={this.handleModalCancel}
            heading={t('clg.modal.project.create.title')}
            isOpen={this.state.isCreationModalOpen}
            label={t('clg.modal.project.create.label')}
            primaryBtnText={t('clg.modal.project.create.ok')}
            secondaryBtnText={t('clg.modal.button.cancel')}
            messages={[t('clg.modal.project.create.message', { name: this.state.projectName.val })]}
          />
        </div>
      </React.Fragment>
    );
  }

  public onResourceGroupError(error) {
    this.logger.debug('onResourceGroupError');
    this.setState({
      error
    });
  }

  public onResourceGroupSelection(resourceGroup: projectModel.IUIResourceGroup) {
    this.logger.debug(`onResourceGroupSelection > id: '${(resourceGroup && resourceGroup.id)}'`);
    this.setState(() => ({
      isCreateDisabled: this.shouldDisableCreate(this.state.projectName, resourceGroup, this.state.selectedRegion),
      isLoadingResourceGroup: false,
      selectedResourceGroup: resourceGroup
    }));
  }

  public onRegionError(error) {
    this.logger.debug('onRegionError');
    this.setState({
      error
    });
  }

  public onRegionSelection(region: projectModel.IUIRegion) {
    this.logger.debug(`onRegionSelection > region: '${(region && region.id)}'`);

    // update the estimateData object
    const updatedEstimateData = this.state.estimateData;
    updatedEstimateData.lineItem.regionId = region && region.id;

    this.setState(() => ({
      error: undefined,
      estimateData: updatedEstimateData,
      isCreateDisabled: this.shouldDisableCreate(this.state.projectName, this.state.selectedResourceGroup, region),
      selectedRegion: region
    }));
  }

  public onTagListChange(event) {
    this.logger.debug(`onTagListChange > event: '${JSON.stringify(event)}'`);
    let tags = this.state.tags;

    // check whether there are new tags that should be added
    if (event && event.toAttach && Array.isArray(event.toAttach) && event.toAttach.length > 0) {
      tags = [];
      for (const newTag of event.toAttach) {
        if (newTag.name) {
          tags.push(newTag.name);
        }
      }

      // update the state
      this.setState({ tags });
    }
    this.logger.debug(`onTagListChange < tags: '${JSON.stringify(tags)}'`);
  }

  private createNewProjectConfirm(keys) {
    this.logger.debug('createNewProjectConfirm');

    this.setState({ isCreationModalOpen: true, });
  }

  private handleModalCancel() {
    this.logger.debug('handleModalCancel');
    this.setState({ isCreationModalOpen: false, });
  }

  private closeNotification() {
    this.setState({ error: undefined });
  }

  private shouldDisableCreate(
    projectName: commonValidator.IClgTextField,
    resourceGroup: projectModel.IUIResourceGroup,
    region: projectModel.IUIRegion): boolean {
    const fn = 'shouldDisableCreate ';

    this.logger.debug(`${fn}> projectName: '${JSON.stringify(projectName)}', resourceGroup: '${JSON.stringify(resourceGroup)}', region: '${JSON.stringify(region)}'`);

    // check if all fields were validated
    if (projectName.val && typeof projectName.invalid === 'undefined' && resourceGroup && resourceGroup.id && region && region.id) {
      this.logger.debug(`${fn}< false`);
      return false;
    }

    // disable the create button
    this.logger.debug(`${fn}< true`);
    return true;
  }

  private handleCancel() {
    this.logger.debug('handleCancel');
    this.props.history.goBack();
  }

  private handleProjectNameChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.NAME_RULES);

      // update the estimateData object
      const updatedEstimateData = this.state.estimateData;
      updatedEstimateData.lineItem.title = field.val;
      updatedEstimateData.lineItem.id = field.val;

      this.setState({
        error: undefined,
        estimateData: updatedEstimateData,
        isCreateDisabled: this.shouldDisableCreate(field, this.state.selectedResourceGroup, this.state.selectedRegion),
        projectName: field,
      });
    }
  }

  private createNewProject() {
    this.logger.debug('createNewProject');

    this.setState({ isCreating: true, isCreationModalOpen: false });

    // build the project that shall be created
    const projectToCreate: projectModel.IUIProject = {
      crn: undefined,
      id: undefined,
      kind: `${commonModel.UIEntityKinds.PROJECT}`,
      name: this.state.projectName.val,
      region: this.state.selectedRegion.id,
      resourceGroupId: this.state.selectedResourceGroup.id,
      tags: this.state.tags,
    };

    // create the project using a thin client-side API layer
    projectApi.createNewProject(projectToCreate).then((requestResult: commonModel.IUIRequestResult) => {
      this.logger.debug(`createNewProject - result: '${commonModel.stringify(requestResult)}'`);

      // hide the loading animation
      this.setState({ isCreating: false, isCreationModalOpen: false });

      // extract the created project from the response result
      const createdProject: projectModel.IUIProject = requestResult.payload;

      // navigate to the project list page
      this.props.history.push(nav.toProjectList());
    }).catch((requestError: commonModel.UIRequestError) => {
      this.logger.warn(`createNewProject - An error occurred during project creation: '${JSON.stringify(requestError)}'`);

      if (requestError.error && requestError.error.name === 'FailedToCreateProjectBecauseAlreadyExistsError') {
        // invalidate the projectName
        const projectName = this.state.projectName;
        projectName.invalid = 'EXISTS';

        // set the inline notification
        const projectExistsNotification: viewCommonModel.IClgInlineNotification = {
          kind: 'error',
          subtitle: t('clg.page.create.project.error.projectExists.desc', { name: this.state.projectName.val, region: t(`clg.common.region.${this.state.selectedRegion.id}`) }),
          title: t('clg.page.create.project.error.projectExists.title'),
        };
        this.setState({ error: projectExistsNotification, isCreating: false, isCreateDisabled: true, projectName });
      } else if (requestError.error && requestError.error.name === 'FailedToCreateProjectBecauseLimitReachedError') {
        const projectExistsNotification: viewCommonModel.IClgInlineNotification = {
          kind: 'error',
          subtitle: t('clg.page.create.project.error.projectLimitReached.desc'),
          title: t('clg.page.create.project.error.projectLimitReached.title'),
        };
        this.setState({ isCreating: false, isCreateDisabled: true, error: projectExistsNotification, });
      } else {
        // in case the response could not be mapped to a specific creation error, we should use a generic one
        const errorNotification: viewCommonModel.IClgInlineNotification = {
          // clgId: requestError.clgId,
          kind: 'error',
          title: t('clg.page.create.project.error.creationFailed.title'),
        };
        this.setState({ isCreating: false, error: errorNotification });
      }
    });
  }
}

CreateProjectPage.contextType = GlobalStateContext;
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateProjectPage.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func,
    push: PropTypes.func,
  }),
};
export { CreateProjectPage };
export default withRouter(CreateProjectPage);

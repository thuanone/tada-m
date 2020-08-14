// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import { cloneDeep } from 'lodash';
import * as log from 'loglevel';

// carbon + pal
import { SidePanel, SidePanelContainer } from '@console/pal/Components/SidePanel';
import { ProgressIndicator, ProgressStep } from '@console/pal/carbon-components-react';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as buildModel from '../../../../../../../common/model/build-model';
import * as commonModel from '../../../../../../../common/model/common-model';
import * as configModel from '../../../../../../../common/model/config-model';
import * as projectModel from '../../../../../../../common/model/project-model';
import coligoValidatorConfig from '../../../../../../../common/validator/coligo-validator-config';
import { TextValidator } from '../../../../../../../common/validator/text-validator';
import {
  getValidatedTextField,
} from '../../../../../../../common/validator/common-validator';
import * as buildApi from '../../../../../../api/build-api';
import t from '../../../../../../utils/i18n';
import clgContainerRegistryName from '../../../../../../utils/formatter/clgContainerRegistryName';
import { IClgToastNotification } from '../../../../../model/common-view-model';
import ClgRegistryModal from '../../../../../components/ClgRegistryModal/ClgRegistryModal';
import BuildStepSource from './BuildStepSource';
import BuildStepStrategy from './BuildStepStrategy';
import BuildStepOutput from './BuildStepOutput';
import {
  IViewBuildSource,
  IViewBuildStrategy,
  IViewBuildOutput
} from '../../../../../model/build-view-model';
import toastNotification from '../../../../../../utils/toastNotification';

interface IProps {
  onClose: () => void;
  onUpdate: (createdBuild: buildModel.IUIBuild) => void;
  open: boolean;
  project?: projectModel.IUIProject;
}

interface IState {
  buildToCreate?: buildModel.IUIEditBuild;
  createFn?: () => void;
  hasInvalidData: boolean;
  hasStepSourceInvalidData: boolean;
  hasStepStrategyInvalidData: boolean;
  hasStepOutputInvalidData: boolean;
  isCreating: boolean;
  isRegistryModalOpen: boolean;
  outputStepInput: IViewBuildOutput;
  reloadRegistriesFn: () => void;
  sourceStepInput: IViewBuildSource;
  strategyStepInput: IViewBuildStrategy;
}

// setup the logger
const COMPONENT = 'BuildSidePanel';
const logger = log.getLogger(COMPONENT);

class BuildSidePanel extends React.Component<IProps, IState> {

  private readonly globalTextValidator = new TextValidator();

  constructor(props) {
    super(props);
    logger.debug('constructor');

    this.state = {
      isCreating: false,
      isRegistryModalOpen: false,
      hasInvalidData: true,
      hasStepSourceInvalidData: true,
      hasStepStrategyInvalidData: true,
      hasStepOutputInvalidData: true,
      outputStepInput: {
        outputRegistry: undefined,
        outputImage: getValidatedTextField('', this.globalTextValidator, coligoValidatorConfig.build.outputImage, true),
      },
      reloadRegistriesFn: undefined,
      sourceStepInput: {
        name: getValidatedTextField('', this.globalTextValidator, coligoValidatorConfig.build.name, true),
        sourceCredentials: undefined,
        sourceUrl: getValidatedTextField('', this.globalTextValidator, coligoValidatorConfig.build.sourceUrl, true),
        sourceRev: getValidatedTextField('', this.globalTextValidator, coligoValidatorConfig.build.sourceRev, true),
      },
      strategyStepInput: {
        strategyName: getValidatedTextField(coligoValidatorConfig.build.strategyName.default, this.globalTextValidator, coligoValidatorConfig.build.strategyName, true),
      },
    };

    // handling user inputs
    this.handleUserUpdates = this.handleUserUpdates.bind(this);
    this.updateValuesFromOutputTab = this.updateValuesFromOutputTab.bind(this);
    this.updateValuesFromSourceTab = this.updateValuesFromSourceTab.bind(this);
    this.updateValuesFromStrategyTab = this.updateValuesFromStrategyTab.bind(this);

    // finalizing the creation
    this.buildBuildForSaving = this.buildBuildForSaving.bind(this);
    this.create = this.create.bind(this);
    this.onCreationSucceeded = this.onCreationSucceeded.bind(this);
    this.onCreationFailed = this.onCreationFailed.bind(this);

    // registry selector
    this.receiveReloadRegistriesFn = this.receiveReloadRegistriesFn.bind(this);
    this.openContainerRegistryModal = this.openContainerRegistryModal.bind(this);

    // registry related functions
    this.closeContainerRegistryModal = this.closeContainerRegistryModal.bind(this);
    this.onCreatedNewRegistry = this.onCreatedNewRegistry.bind(this);
  }

  public openContainerRegistryModal() {
    logger.debug('openContainerRegistryModal');
    this.setState({ isRegistryModalOpen: true, });
  }

  public closeContainerRegistryModal() {
    logger.debug('closeContainerRegistryModal');
    this.setState({ isRegistryModalOpen: false, });

    // reload all registries
    this.state.reloadRegistriesFn();
  }

  public onCreatedNewRegistry(registry: configModel.IUIRegistrySecret) {
    logger.debug('onCreatedNewRegistry');

    // close the sidepanel
    this.closeContainerRegistryModal();

    this.setState((oldState) => {
      oldState.outputStepInput.outputRegistry = registry;
      return oldState;
    });
  }

  public componentDidMount() {
    // reset the invalide states
    this.setState((oldState) => {
      oldState.sourceStepInput.name.invalid = undefined;
      oldState.sourceStepInput.sourceUrl.invalid = undefined;
      oldState.outputStepInput.outputImage.invalid = undefined;
      return oldState;
    });
  }

  /**
   * This functions receives update events from child components.
   * In case a new update comes in, this component ensures that unsaved changes state (see tabs) is set.
   * Additionally, this function ensures that the overall page state is kept up-to-date.
   * @param {string} sourceType - the source where the update was received from (either: 'source', 'strategy' or 'limits')
   * @param {*} updatedValues - an map that contains all updates that were made. this object will be merged into the page state
   */
  public handleUserUpdates(sourceType, updatedValues) {
    const fn = 'handleUserUpdates ';
    logger.debug(`${fn}- ${sourceType} - updates: '${JSON.stringify(updatedValues)}'`);

    let buildMods = this.state.buildToCreate;

    if (!buildMods) {
      // create a new buildToCreateObject
      buildMods = {
        name: this.state.sourceStepInput.name,
        outputRegistry: this.state.outputStepInput.outputRegistry,
        outputImage: this.state.outputStepInput.outputImage,
        sourceUrl: this.state.sourceStepInput.sourceUrl,
        sourceRev: this.state.sourceStepInput.sourceRev,
        strategyName: this.state.strategyStepInput.strategyName,
      };
    }

    if (updatedValues && sourceType === 'output') {
      this.updateValuesFromOutputTab(buildMods, updatedValues);
    }

    if (updatedValues && sourceType === 'source') {
      this.updateValuesFromSourceTab(buildMods, updatedValues);
    }

    if (updatedValues && sourceType === 'strategy') {
      this.updateValuesFromStrategyTab(buildMods, updatedValues);
    }

    this.setState({
      buildToCreate: buildMods,
      hasStepSourceInvalidData: this.hasStepSourceInvalidBuildModifications(buildMods),
      hasStepStrategyInvalidData: this.hasStepStrategyInvalidBuildModifications(buildMods),
      hasStepOutputInvalidData: this.hasStepOutputInvalidBuildModifications(buildMods),
    });
  }

  public updateValuesFromOutputTab(buildMods: buildModel.IUIEditBuild, updatedValues: IViewBuildOutput) {
    buildMods.outputImage = updatedValues.outputImage;
    buildMods.outputRegistry = updatedValues.outputRegistry;
  }

  public updateValuesFromSourceTab(buildMods: buildModel.IUIEditBuild, updatedValues: IViewBuildSource) {
    buildMods.sourceUrl = updatedValues.sourceUrl;
    buildMods.sourceRev = updatedValues.sourceRev;
    buildMods.name = updatedValues.name;
  }

  public updateValuesFromStrategyTab(buildMods: buildModel.IUIEditBuild, updatedValues: IViewBuildStrategy) {
    buildMods.strategyName = updatedValues.strategyName;
  }

  public onCreationSucceeded(createdBuild: buildModel.IUIBuild) {
    const fn = 'onCreationSucceeded ';
    logger.debug(`${fn}> createdBuild: '${buildModel.stringify(createdBuild)}'`);

    // set the loading state
    this.setState({ isCreating: false });

    this.props.onUpdate(createdBuild);

    logger.debug(`${fn}<`);
  }

  public onCreationFailed(requestError: commonModel.UIRequestError) {
    const fn = 'onCreationFailed ';
    logger.debug(`${fn}> error: ${commonModel.stringifyUIRequestError(requestError)}`);

    // set the loading state
    this.setState({ isCreating: false });

    logger.debug(`${fn}<`);
  }

  public create() {
    const fn = 'create ';
    logger.debug(`${fn}> `);

    // set the loading state
    this.setState({ isCreating: true });

    const buildToCreate = this.buildBuildForSaving();

    buildApi
      .createBuild(this.props.project.region, this.props.project.id, buildToCreate)
      .then((createdBuild: buildModel.IUIBuild) => {

        // show a toast notification
        const successNotification: IClgToastNotification = {
          kind: 'success',
          subtitle: t('clg.build.sidepanel.success.subtitle', { name: createdBuild.name }),
          title: t('clg.build.sidepanel.success.title'),
        };
        toastNotification.add(successNotification);

        this.setState({
          buildToCreate: undefined,
          isCreating: false,
        }, () => {
          if (this.props.onUpdate) {
            this.props.onUpdate(createdBuild);
          }
        });
        logger.debug(`${fn}< SUCCESS`);
      })
      .catch((requestError: commonModel.UIRequestError) => {
        logger.error(`${fn}- failed to save Build - error message: ${requestError.message}`, requestError);

        this.setState({ isCreating: false });

        if (requestError.error && requestError.error.name === 'FailedToCreateBuildBecauseAlreadyExistsError') {
          // invalidate the buildName
          const buildName = this.state.buildToCreate.name;
          buildName.invalid = 'EXISTS';

          // set the toast notification
          const buildExistsNotification: IClgToastNotification = {
            kind: 'error',
            subtitle: t('clg.build.sidepanel.error.buildExists.desc', { name: buildToCreate.name }),
            title: t('clg.build.sidepanel.error.buildExists.title'),
          };
          toastNotification.add(buildExistsNotification);
        } else {

          // show a toast notification
          const errorNotification: IClgToastNotification = {
            kind: 'error',
            title: t('clg.build.sidepanel.error.creationFailed.title'),
          };
          toastNotification.add(errorNotification);
          logger.debug(`${fn}< FAILED`);
        }
      });
  }

  public renderProgressIndicator(currentStep: number) {
    return (
      <div className='clg-progress-indicator'>
        <ProgressIndicator currentIndex={currentStep}>
          <ProgressStep
            label={t('clg.build.sidepanel.progress.step1.title')}
          />
          <ProgressStep
            label={t('clg.build.sidepanel.progress.step2.title')}
          />
          <ProgressStep
            label={t('clg.build.sidepanel.progress.step3.title')}
          />
        </ProgressIndicator>
      </div>
    );
  }

  public render() {
    logger.debug('render');

    // render nothing if the project is not set, properly!
    if (typeof this.props.project === 'undefined') {
      return <React.Fragment />;
    }

    // render nothing if the sidepanel is not open
    if (!!!this.props.open) {
      return <React.Fragment />;
    }

    return (
      <div>
        <SidePanelContainer
          closePanelText={t('clg.common.label.close')}
          hasOverlay={false}
          hideBottomNav={false}
          isOpen={this.props.open}
          locale={getLocale(window.navigator.language)}
          onCloseClick={this.props.onClose}
          onDoneClick={this.create}
          onCancelClick={this.props.onClose}
          panelSize={'large'}
        >
          <SidePanel
            id='build-panel-source'
            title={t('clg.build.sidepanel.build.title')}
            primaryButtonDisabled={this.state.hasStepSourceInvalidData}
          >
            <div className='clg--side-panel'>
              <div className='subtitle'>{t('clg.build.sidepanel.subtitle')}</div>
              <div>{this.renderProgressIndicator(0)}</div>
              <BuildStepSource
                handleChange={this.handleUserUpdates}
                inputValues={this.state.sourceStepInput}
              />
            </div>
          </SidePanel>
          <SidePanel
            id='build-panel-strategy'
            title={t('clg.build.sidepanel.build.title')}
            primaryButtonDisabled={this.state.hasStepStrategyInvalidData}
          >
            <div className='clg--side-panel'>
              <div className='subtitle'>{t('clg.build.sidepanel.subtitle')}</div>
              <div>{this.renderProgressIndicator(1)}</div>
              <BuildStepStrategy
                handleChange={this.handleUserUpdates}
                inputValues={this.state.strategyStepInput}
              />
            </div>
          </SidePanel>
          <SidePanel
            id='build-panel-output'
            title={t('clg.build.sidepanel.build.title')}
            primaryButtonDisabled={this.state.hasStepOutputInvalidData}
            doneIsLoading={this.state.isCreating}
          >
            <div className='clg--side-panel'>
              <div className='subtitle'>{t('clg.build.sidepanel.subtitle')}</div>
              <div>{this.renderProgressIndicator(2)}</div>
              <BuildStepOutput
                handleChange={this.handleUserUpdates}
                inputValues={this.state.outputStepInput}
                openContainerRegistryModal={this.openContainerRegistryModal}
                project={this.props.project}
                receiveReloadRegistriesFn={this.receiveReloadRegistriesFn}
              />
            </div>
          </SidePanel>
        </SidePanelContainer>

        <ClgRegistryModal
          open={this.state.isRegistryModalOpen}
          onClose={this.closeContainerRegistryModal}
          onCreated={this.onCreatedNewRegistry}
          project={this.props.project}
        />
      </div>
    );
  }

  /**
   * Uses this.state.buildToCreate data to build an IUIBuild object that can be
   * sent to updateBuild() api call
   */
  private buildBuildForSaving(): buildModel.IUIBuild {
    // this object contains all user inputs
    const buildMods = this.state.buildToCreate;

    // create the build that shall be created
    const buildForSaving: buildModel.IUIBuild = {
      id: undefined,
      kind: commonModel.UIEntityKinds.BUILD,
      name: buildMods.name.val,
      projectId: this.props.project.id,
      regionId: this.props.project.region,

      outputCredentials: clgContainerRegistryName.isDummRegistry(buildMods.outputRegistry) ? undefined : buildMods.outputRegistry.name,
      outputImage: buildMods.outputImage.val,
      sourceUrl: buildMods.sourceUrl.val,
      sourceRev: buildMods.sourceRev.val,
      strategyKind: 'ClusterBuildStrategy',
      strategyName: buildMods.strategyName.val,
    };

    return buildForSaving as buildModel.IUIBuild;
  }

  /**
   * Returns false, if the current build modifications are ok from a validation standpoint and can be
   * used to build a valid update API request.
   */
  private hasStepSourceInvalidBuildModifications(buildMods: buildModel.IUIEditBuild): boolean {
    const fn = 'hasStepSourceInvalidBuildModifications ';
    logger.debug(`${fn}>`);

    if (!buildMods
      || buildMods.name.invalid
      || buildMods.name.val === ''
      || buildMods.sourceUrl.invalid
      || buildMods.sourceUrl.val === ''
      || buildMods.sourceRev.invalid) {

      logger.debug(`${fn}< true`);
      return true;
    }

    logger.debug(`${fn}< false`);
    return false;
  }

  /**
   * Returns false, if the current build modifications are ok from a validation standpoint and can be
   * used to build a valid update API request.
   */
  private hasStepStrategyInvalidBuildModifications(buildMods: buildModel.IUIEditBuild) {
    const fn = 'hasStepStrategyInvalidBuildModifications ';
    logger.debug(`${fn}>`);
    if (!buildMods
      || buildMods.strategyName.invalid
      || buildMods.strategyName.val === '') {

      logger.debug(`${fn}< true`);
      return true;
    }

    logger.debug(`${fn}< false`);
    return false;
  }

  /**
   * Returns false, if the current build modifications are ok from a validation standpoint and can be
   * used to build a valid update API request.
   */
  private hasStepOutputInvalidBuildModifications(buildMods: buildModel.IUIEditBuild) {
    const fn = 'hasStepOutputInvalidBuildModifications ';
    logger.debug(`${fn}>`);
    if (!buildMods
      || buildMods.outputImage.invalid
      || buildMods.outputImage.val === ''
      || !buildMods.outputRegistry
      || buildMods.outputRegistry.name === '') {

      logger.debug(`${fn}< true`);
      return true;
    }

    logger.debug(`${fn}< false`);
    return false;
  }

  private receiveReloadRegistriesFn(reloadFn: any) {
    this.setState({ reloadRegistriesFn: reloadFn });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildSidePanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  project: PropTypes.object,
};

export default BuildSidePanel;

// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { SidePanel, SidePanelContainer } from '@console/pal/Components/SidePanel';
import { InlineNotification, NotificationActionButton, ProgressIndicator, ProgressStep } from '@console/pal/carbon-components-react';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as configModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import * as commonValidator from '../../../../common/validator/common-validator';
import t from '../../../utils/i18n';
import ClgRegistryModal from '../ClgRegistryModal/ClgRegistryModal';
import ClgRegistrySelector from '../ClgRegistrySelector/ClgRegistrySelector';
import * as viewCommonModel from '../../model/common-view-model';
import ClgImageRefSelectors from '../ClgImageRefSelectors/ClgImageRefSelectors';

interface IProps {
  allowInputDerivation: boolean;
  allowToUsePublicRegistry?: boolean;
  image?: commonValidator.IClgTextField;
  onClose: () => void;
  onChange: (event: any) => void;
  open: boolean;
  project?: projectModel.IUIProject;
  registryName?: string;
}

interface IState {
  errorOnRegistrySelection?: viewCommonModel.IClgInlineNotification;
  imageRef?: string;
  isCreating: boolean;
  isFormValid: boolean;
  isRegistryModalOpen: boolean;
  ownUpdate: boolean;
  registryName?: string;
  reloadRegistriesFn: () => void;
  selectedRegistry?: configModel.IUIRegistrySecret;
}

interface IStateUpdate {
  image?: commonValidator.IClgTextField;
  open?: boolean;
  ownUpdate: boolean;
  registryName?: string;
}

// setup the logger
const COMPONENT = 'ClgContainerImageSelectorSidePanel';
const logger = log.getLogger(COMPONENT);

class ClgContainerImageSelectorSidePanel extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props: IProps, state: IState) {
    const fn = 'getDerivedStateFromProps ';
    logger.trace(`${fn}> props: '${JSON.stringify(props)}', state: ${JSON.stringify(state)}`);

    if (props.open || state.ownUpdate) {
      logger.debug(`${fn}< - no update due to sidepanel is now open or own update`);
      return { ownUpdate: false };
    }

    const stateUpdate: IStateUpdate = { ownUpdate: false };

    // check whether the registryName has been updated
    if (!state.registryName || state.registryName !== props.registryName) {
      stateUpdate.registryName = props.registryName;
    }

    // check whether the registryName and the selectedRegistry are out-of-sync
    if (props.registryName !== (state.selectedRegistry && state.selectedRegistry.name)) {
      stateUpdate.registryName = props.registryName;
    }

    // check whether the state needs to be updated
    if (Object.keys(stateUpdate).length > 1) {
      logger.debug(`${fn}< state update! ${JSON.stringify(stateUpdate)}`);
      return stateUpdate;
    }

    logger.debug(`${fn}<`);
    return null;
  }

  constructor(props) {
    super(props);
    logger.debug('constructor');

    this.state = {
      isCreating: false,
      isFormValid: false,
      isRegistryModalOpen: false,
      ownUpdate: false,
      reloadRegistriesFn: undefined,
      registryName: props.registryName,
    };

    this.onRegistrySelection = this.onRegistrySelection.bind(this);
    this.onRegistrySelectionError = this.onRegistrySelectionError.bind(this);

    // registry related functions
    this.receiveReloadRegistriesFn = this.receiveReloadRegistriesFn.bind(this);
    this.openContainerRegistryModal = this.openContainerRegistryModal.bind(this);
    this.closeContainerRegistryModal = this.closeContainerRegistryModal.bind(this);
    this.onCreatedNewRegistry = this.onCreatedNewRegistry.bind(this);

    this.onImageRefChange = this.onImageRefChange.bind(this);

    // finalizer functions
    this.onImageSelected = this.onImageSelected.bind(this);
    this.onNextStep = this.onNextStep.bind(this);
  }

  public onRegistrySelectionError(errorOnRegistrySelection) {
    logger.debug('onRegistrySelectionError');
    this.setState({
      errorOnRegistrySelection,
      ownUpdate: true,
    });
  }

  public onRegistrySelection(registry: configModel.IUIRegistrySecret) {
    const fn = 'onRegistrySelection ';
    logger.debug(`${fn}> registry: '${(registry && registry.id)}'`);

    this.setState(() => ({
      errorOnRegistrySelection: undefined,
      ownUpdate: true,
      registryName: registry.id,
      selectedRegistry: registry,
    }), () => {
      if (this.props.project) {
        // load all images of the selected registry
        // this.loadRegistryImages(); // we may consider to load the registry images here, to safe some time
      }
    });
    logger.debug(`${fn}<`);
  }

  public openContainerRegistryModal() {
    logger.debug('openContainerRegistryModal');
    this.setState({ isRegistryModalOpen: true, ownUpdate: true, });
  }

  public closeContainerRegistryModal() {
    logger.debug('closeContainerRegistryModal');
    this.setState({ isRegistryModalOpen: false, ownUpdate: true, });

    // reload all registries
    this.state.reloadRegistriesFn();
  }

  public onCreatedNewRegistry(registry: configModel.IUIRegistrySecret) {
    logger.debug('onCreatedNewRegistry');

    // close the sidepanel
    this.closeContainerRegistryModal();

    this.onRegistrySelection(registry);
  }

  public onImageSelected() {
    logger.debug('onImageSelected >');

    logger.debug(`onImageSelected - image: '${this.state.imageRef}', selectedRegistry: '${this.state.selectedRegistry && this.state.selectedRegistry.name}'`);

    // publish the changes to the parent
    this.props.onChange({ image: this.state.imageRef, registry: this.state.selectedRegistry });
  }

  public onImageRefChange(newImageRef: string) {
    logger.debug('onImageRefChange >');

    logger.debug(`onImageRefChange - newImageRef: '${newImageRef}'`);

    // publish the changes to the parent
    if (newImageRef) {
      this.setState({ imageRef: newImageRef, isFormValid: true });
    } else {
      this.setState({ imageRef: undefined, isFormValid: false });
    }
  }

  public onNextStep() {
    logger.debug('onNextStep');
    return true;
  }

  public renderProgressIndicator(currentStep: number) {
    return (
      <div className='clg-progress-indicator'>
        <ProgressIndicator currentIndex={currentStep}>
          <ProgressStep
            label={t('clg.cmp.containerimage.sidepanel.progress.step1.title')}
            secondaryLabel={t('clg.cmp.containerimage.sidepanel.progress.step1.label')}
          />
          <ProgressStep
            label={t('clg.cmp.containerimage.sidepanel.progress.step2.title')}
            secondaryLabel={t('clg.cmp.containerimage.sidepanel.progress.step2.label')}
          />
        </ProgressIndicator>
      </div>
    );
  }

  public renderErrorNotification(errorNotification: viewCommonModel.IClgInlineNotification) {
    if (!errorNotification) {
      return <React.Fragment />;
    }
    return (
      <div className='error-state'>
        <InlineNotification
          kind={errorNotification.kind}
          statusIconDescription={errorNotification.title}
          lowContrast={true}
          title={errorNotification.title}
          subtitle={(<span>{t(errorNotification.subtitle)}</span>)}
          onCloseButtonClick={errorNotification.actionFn}
          actions={errorNotification.actionFn &&
            (
              <NotificationActionButton
                onClick={errorNotification.actionFn}
              >
                {errorNotification.actionTitle}
              </NotificationActionButton>
            )
          }
        />
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
          className='clg-container-image-selector-sidepanel'
          closePanelText={t('clg.common.label.close')}
          hasOverlay={true}
          hideBottomNav={false}
          isOpen={this.props.open}
          locale={getLocale(window.navigator.language)}
          onCloseClick={this.props.onClose}
          onCancelClick={this.props.onClose}
          onDoneClick={this.onImageSelected}
          onNextClick={this.onNextStep}
          panelSize={'large'}
        >
          <SidePanel
            id='container-image-panel_registry-selector'
            title={t('clg.cmp.containerimage.sidepanel.title')}
          >
            <div className='clg--side-panel'>
              <div className='subtitle'>{t('clg.cmp.containerimage.sidepanel.subtitle')}</div>
              <div>{this.renderProgressIndicator(0)}</div>

              <div className='coligo-form'>
                {this.renderErrorNotification(this.state.errorOnRegistrySelection)}
                <ClgRegistrySelector
                  addRegistryFn={this.openContainerRegistryModal}
                  allowToUsePublicRegistry={this.props.allowToUsePublicRegistry}
                  light={true}
                  onError={this.onRegistrySelectionError}
                  onGetReloadFn={this.receiveReloadRegistriesFn}
                  onSelect={this.onRegistrySelection}
                  project={this.props.project}
                  selectedRegistryName={this.state.registryName}
                  showAddBtn={true}
                />
              </div>
            </div>
          </SidePanel>
          <SidePanel
            id='container-image-panel_image-selector'
            title={t('clg.cmp.containerimage.sidepanel.title')}
            primaryButtonDisabled={!this.state.isFormValid}
            doneIsLoading={this.state.isCreating}
          >
            <div className='clg--side-panel'>
              <div className='subtitle'>{t('clg.cmp.containerimage.sidepanel.subtitle')}</div>
              <div>{this.renderProgressIndicator(1)}</div>

              <ClgImageRefSelectors onChange={this.onImageRefChange} project={this.props.project} selectedRegistry={this.state.selectedRegistry} />
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

  private receiveReloadRegistriesFn(reloadFn: any) {
    this.setState({ reloadRegistriesFn: reloadFn, ownUpdate: true });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgContainerImageSelectorSidePanel.propTypes = {
  allowInputDerivation: PropTypes.bool,
  allowToUsePublicRegistry: PropTypes.bool,
  image: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  project: PropTypes.object,
  registryName: PropTypes.string,
};

export default ClgContainerImageSelectorSidePanel;


import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { InlineNotification, NotificationActionButton, } from '@console/pal/carbon-components-react';

// codeengine
import * as projectModel from '../../../../../../../common/model/project-model';
import { validateField } from '../../../../../../../common/validator/common-validator';
import t from '../../../../../../utils/i18n';
import ClgImageRefSelectors from '../../../../../components/ClgImageRefSelectors/ClgImageRefSelectors';
import ClgRegistrySelector from '../../../../../components/ClgRegistrySelector/ClgRegistrySelector';
import { IViewBuildOutput } from '../../../../../model/build-view-model';
import * as viewCommonModel from '../../../../../model/common-view-model';

interface IProps {
  inputValues: IViewBuildOutput;
  handleChange: (key: string, value: IViewBuildOutput) => any;
  openContainerRegistryModal: () => void;
  project: projectModel.IUIProject;
  receiveReloadRegistriesFn: (fn: any) => void;
}

interface IState {
  errorOnRegistrySelection?: viewCommonModel.IClgInlineNotification;
  currentValues: IViewBuildOutput;
  error?: viewCommonModel.IClgInlineNotification;
}

// setup the logger
const COMPONENT = 'BuildStepOutput';
const logger = log.getLogger(COMPONENT);

class BuildStepOutput extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      currentValues: props.inputValues,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this.closeNotification = this.closeNotification.bind(this);
    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onImageRefChange = this.onImageRefChange.bind(this);
    this.onRegistryChange = this.onRegistryChange.bind(this);
  }

  public onRegistrySelectionError(errorOnRegistrySelection) {
    logger.debug('onRegistrySelectionError');
    this.setState({
      errorOnRegistrySelection,
    });
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
    logger.debug(`render - image: '${this.state.currentValues.outputImage && this.state.currentValues.outputImage.val}', registry: '${this.state.currentValues.outputRegistry && this.state.currentValues.outputRegistry.name}'`);

    return (
      <div className=''>
        <div className='bx--form__fieldset'>
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
          <div>
            {this.renderErrorNotification(this.state.errorOnRegistrySelection)}
            <ClgRegistrySelector
              addRegistryFn={this.props.openContainerRegistryModal}
              allowToUsePublicRegistry={false}
              light={true}
              onError={this.onRegistrySelectionError}
              onGetReloadFn={this.props.receiveReloadRegistriesFn}
              onSelect={this.onRegistryChange}
              project={this.props.project}
              selectedRegistryName={this.state.currentValues.outputRegistry && this.state.currentValues.outputRegistry.name}
              showAddBtn={true}
            />
            <ClgImageRefSelectors
              image={this.state.currentValues.outputImage}
              onChange={this.onImageRefChange}
              project={this.props.project}
              selectedRegistry={this.state.currentValues.outputRegistry}
            />
          </div>
        </div>
      </div>
    );
  }

  private closeNotification() {
    this.setState({ error: undefined, });
  }

  private onImageRefChange(imageRef) {
    logger.debug(`onImageRefChange > imageRef: '${imageRef}'`);

    this.setState((oldState: IState) => {
      oldState.currentValues.outputImage.val = imageRef;
      validateField(oldState.currentValues.outputImage);

      return oldState;
    }, () => {
      this.populateChangesToParent();
    });
  }

  private onRegistryChange(registry) {
    logger.debug(`onRegistryChange > registry: '${JSON.stringify(event)}'`);

    this.setState((oldState: IState) => {
      oldState.currentValues.outputRegistry = registry;
      return oldState;
    }, () => {
      this.populateChangesToParent();
    });
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private populateChangesToParent() {
    // TODO decide whether an update should be populated, or not.

    this.props.handleChange('output', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildStepOutput.propTypes = {
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
  openContainerRegistryModal: PropTypes.func.isRequired,
  project: PropTypes.object,
  receiveReloadRegistriesFn: PropTypes.func.isRequired,
};

export default BuildStepOutput;

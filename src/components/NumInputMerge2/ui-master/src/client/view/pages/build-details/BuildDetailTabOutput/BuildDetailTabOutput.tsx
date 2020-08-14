
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { InlineNotification, NotificationActionButton, } from '@console/pal/carbon-components-react';

import * as projectModel from '../../../../../common/model/project-model';
import { validateField } from '../../../../../common/validator/common-validator';
import t from '../../../../utils/i18n';
import ClgContainerImage from '../../../components/ClgContainerImage/ClgContainerImage';
import { IViewBuildOutput } from '../../../model/build-view-model';
import * as viewCommonModel from '../../../model/common-view-model';

interface IProps {
  allowInputDerivation: boolean;
  inputValues: IViewBuildOutput;
  handleChange: (key: string, value: IViewBuildOutput) => any;
  project: projectModel.IUIProject;
}

interface IState {
  currentValues: IViewBuildOutput;
  error?: viewCommonModel.IClgInlineNotification;
  project?: projectModel.IUIProject;
  ownUpdate?: boolean;
}

interface IStateUpdate {
  currentValues?: IViewBuildOutput;
  project?: projectModel.IUIProject;
  ownUpdate: boolean;
}

// setup the logger
const COMPONENT = 'BuildDetailTabOutput';
const logger = log.getLogger(COMPONENT);

class BuildDetailTabOutput extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props, state) {
    const fn = 'getDerivedStateFromProps ';
    logger.debug(`${fn}- props: ${JSON.stringify(props)}, state: ${JSON.stringify(state)}`);

    if (!props.allowInputDerivation || state.ownUpdate) {
      logger.debug(`${fn}< - no updated due to edit mode or own update`);
      return { ownUpdate: false };
    }

    const stateUpdate: IStateUpdate = { ownUpdate: false };

    if (props.inputValues) {
      stateUpdate.currentValues = props.inputValues;
    }

    // check whether the project has been loaded
    if (!state.project && props.project) {
      stateUpdate.project = props.project;
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

    this.state = {
      currentValues: props.inputValues,
      project: props.project,
      ownUpdate: false,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this.closeNotification = this.closeNotification.bind(this);
    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onImageChange = this.onImageChange.bind(this);
  }

  public render() {
    logger.debug(`render - image: '${this.state.currentValues.outputImage && this.state.currentValues.outputImage.val}', registry: '${this.state.currentValues.outputRegistry && this.state.currentValues.outputRegistry.name}'`);

    return (
      <div className='clg-build-detail-page--output coligo-tab'>
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
            <ClgContainerImage
              idPrefix={'build-output'}
              isEditMode={!this.props.allowInputDerivation}
              image={this.state.currentValues.outputImage}
              nlsKeyPrefix='clg.build'
              onChange={this.onImageChange}
              project={this.state.project}
              registryName={this.state.currentValues.outputRegistry && this.state.currentValues.outputRegistry.name}
              allowToUsePublicRegistry={false}
              light={false}
            />
          </div>
        </div>
      </div>
    );
  }

  private closeNotification() {
    this.setState({ error: undefined, ownUpdate: true, });
  }

  private onImageChange(event) {
    logger.debug(`onImageChange > event: '${JSON.stringify(event)}'`);

    this.setState((oldState: IState) => {
      oldState.currentValues.outputImage = event.image;
      if (event.registry) {
        oldState.currentValues.outputRegistry = event.registry;
      }
      validateField(oldState.currentValues.outputImage);

      oldState.ownUpdate = true;
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
BuildDetailTabOutput.propTypes = {
  allowInputDerivation: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
  project: PropTypes.object,
};

export default BuildDetailTabOutput;

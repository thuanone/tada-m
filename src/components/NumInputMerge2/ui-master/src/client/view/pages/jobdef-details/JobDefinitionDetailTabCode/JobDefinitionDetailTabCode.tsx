
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// pal + carbon
import {
  TextArea,
} from '@console/pal/carbon-components-react';

import * as projectModel from '../../../../../common/model/project-model';
import { validateField } from '../../../../../common/validator/common-validator';
import t from '../../../../utils/i18n';
import ClgContainerImage from '../../../components/ClgContainerImage/ClgContainerImage';
import { IViewJobDefinitionCode } from '../../../model/job-view-model';

interface IProps {
  allowInputDerivation?: boolean;
  inputValues: IViewJobDefinitionCode;
  handleChange: (key: string, value: IViewJobDefinitionCode) => any;
  project: projectModel.IUIProject;
}

interface IState {
  currentValues: IViewJobDefinitionCode;
  ownUpdate?: boolean;
  project?: projectModel.IUIProject;
}

interface IStateUpdate {
  currentValues?: IViewJobDefinitionCode;
  project?: projectModel.IUIProject;
  ownUpdate: boolean;
}

// setup the logger
const COMPONENT = 'JobDefinitionDetailTabCode';
const logger = log.getLogger(COMPONENT);

class JobDefinitionDetailTabCode extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props: IProps, state: IState) {
    const fn = 'getDerivedStateFromProps ';
    logger.trace(`${fn}- props: ${JSON.stringify(props)}, state: ${JSON.stringify(state)}`);

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
      ownUpdate: false,
      project: props.project,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onImageChange = this.onImageChange.bind(this);
    this.onArgsChange = this.onArgsChange.bind(this);
    this.onCommandChange = this.onCommandChange.bind(this);
  }

  public render() {
    logger.debug(`render - image: '${this.state.currentValues.image && this.state.currentValues.image.val}', registry: ${this.state.currentValues.imagePullSecret && this.state.currentValues.imagePullSecret.name}`);

    return (
      <div className='clg-jobdef-detail-page--code coligo-tab'>
        <div className='bx--form__fieldset'>
          <ClgContainerImage
            idPrefix={'jobdef'}
            isEditMode={!this.props.allowInputDerivation}
            image={this.state.currentValues.image}
            nlsKeyPrefix='clg.jobdefinition'
            onChange={this.onImageChange}
            project={this.state.project}
            registryName={this.state.currentValues.imagePullSecret && this.state.currentValues.imagePullSecret.name}
            allowToUsePublicRegistry={true}
          />
          <TextArea
            className='some-class'
            cols={50}
            disabled={false}
            id='jobdefinition-commands'
            invalid={false}
            labelText={t('clg.jobdefinition.command.label')}
            light={false}
            onChange={this.onCommandChange}
            placeholder={t('clg.jobdefinition.command.placeholder')}
            rows={4}
            value={this.state.currentValues.command.val}
          />
          <div className='is-last-item'>
            <TextArea
              className='some-class'
              cols={50}
              disabled={false}
              id='jobdefinition-arguments'
              invalid={false}
              labelText={t('clg.jobdefinition.arguments.label')}
              light={false}
              onChange={this.onArgsChange}
              placeholder={t('clg.jobdefinition.arguments.placeholder')}
              rows={4}
              value={this.state.currentValues.args.val}
            />
          </div>
        </div>
      </div>
    );
  }

  private onArgsChange(event) {
    const fn = 'onArgsChange ';
    logger.debug(`${fn}- ${event.target.value}`);

    const val = event.target.value || '';
    this.setState((oldState: IState) => {
      oldState.currentValues.args.val = val;
      oldState.ownUpdate = true;
      return oldState;
    }, () => {
      this.populateChangesToParent();
    });
  }

  private onCommandChange(event) {
    const fn = 'onCommandChange ';

    const val = event.target.value || '';
    this.setState((oldState: IState) => {
      oldState.currentValues.command.val = val;
      oldState.ownUpdate = true;
      return oldState;
    }, () => {
      this.populateChangesToParent();
    });
  }

  private onImageChange(event) {
    logger.debug(`onImageChange > event: '${JSON.stringify(event)}'`);

    this.setState((oldState: IState) => {
      oldState.currentValues.image = event.image;
      oldState.currentValues.imagePullSecret = event.registry;
      validateField(oldState.currentValues.image);

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

    this.props.handleChange('code', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobDefinitionDetailTabCode.propTypes = {
  allowInputDerivation: PropTypes.bool,
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
  project: PropTypes.object,
};

export default JobDefinitionDetailTabCode;

// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal

// code-engine
import * as appModel from '../../../../../common/model/application-model';
import * as commonValidator from '../../../../../common/validator/common-validator';
import * as viewApplicationModels from '../../../model/application-view-models';
import { IKeyValue } from '../../../model/common-view-model';
import { uiEnvItemToKeyValue } from '../../../../../common/utils/environment-utils';
import ClgEnvironmentVariablesTable from '../../../components/ClgEnvironmentVariablesTable/ClgEnvironmentVariablesTable';

interface IProps {
  handleChange: (key: string, updatedValues: viewApplicationModels.IViewApplicationEnvironment) => any;
  isEditMode: boolean;
  projectId: string;
  regionId: string;
  revision: appModel.IUIApplicationRevision;
}

interface IState {
  envVariables: IKeyValue[];
  isSaveDisabled: boolean;
}

class ApplicationDetailTabEnvironment extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailTabEnvironment';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    const envVariablesFields: IKeyValue[] = [];
    if (props.revision.parameters && Array.isArray(props.revision.parameters)) {
      for (const envParameter of props.revision.parameters) {
        envVariablesFields.push(uiEnvItemToKeyValue(envParameter));
      }
    }

    this.state = {
      envVariables: envVariablesFields,
      isSaveDisabled: false,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this._populateChangesToParent = this._populateChangesToParent.bind(this);
    this.handleEnvVariablesChange = this.handleEnvVariablesChange.bind(this);
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug(`${fn}> ...`);

    // we need to set the state right after initializing the form, to reset the state
    this.setState({
      isSaveDisabled: this.shouldDisableSave(
        this.state.envVariables),
    });

    this.logger.debug(`${fn}componentDidMount <`);
  }

  public UNSAFE_componentWillReceiveProps(newProps: IProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.debug(`${fn} - props: '${JSON.stringify(newProps)}'`);

    // decide whether to update the environment properties or, not
    // in case the edit mode is active, we must not override the state
    if (newProps.revision && !newProps.isEditMode) {
      const envVariablesFields: IKeyValue[] = [];

      // check whether the environment parameters shall be set
      if (newProps.revision.parameters && Array.isArray(newProps.revision.parameters)) {
        for (const envParameter of newProps.revision.parameters) {
          envVariablesFields.push(uiEnvItemToKeyValue(envParameter));
        }
      }

      // update the environment in the state
      this.setState({ envVariables: envVariablesFields, });
    }
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}- envVariables: '${JSON.stringify(this.state.envVariables)}'`);
    return (
      <div className='clg-application-detail-page--environment coligo-tab'>
        <ClgEnvironmentVariablesTable
            allowInputDerivation={!this.props.isEditMode}
            emptyText={'clg.page.application.tab.env.noVariables'}
            handleChange={this.handleEnvVariablesChange}
            envVariables={this.state.envVariables}
            projectId={this.props.projectId}
            regionId={this.props.regionId}
        />
      </div>
    );
  }

  private handleEnvVariablesChange(envVariables: commonValidator.IClgKeyValueFields): void {
    if (envVariables) {
      this.setState(() => {
        return {
          envVariables: envVariables.val,
        };
      }, () => {
        this._populateChangesToParent();
      });
    }
  }

  private isEnvVariableValid(envParameter: IKeyValue): boolean {
    if (!envParameter.name.val || envParameter.name.invalid || envParameter.value.invalid) {
      return false;
    }

    return true;
  }

  private shouldDisableSave(
    envVariables: IKeyValue[]): boolean {
      const fn = 'shouldDisableSave ';

      this.logger.debug(`${fn}>`);

      let allEnvParametersAreValid = true;
      // check if all variable fields are valid
      for (const variableToCheck of envVariables) {
        if (!this.isEnvVariableValid(variableToCheck)) {
          allEnvParametersAreValid = false;
          break;
        }
      }

      if (!allEnvParametersAreValid) {
        // disable the create button
        this.logger.debug(`${fn}< true`);
        return true;
      }

      this.logger.debug(`${fn}< false`);
      return false;
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private _populateChangesToParent() {

    // evaluate whether the save button must be disabled
    const shouldDisableSaveBtn = this.shouldDisableSave(this.state.envVariables);

    this.props.handleChange('environment', { parameters: this.state.envVariables, shouldDisableSaveBtn });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailTabEnvironment.propTypes = {
  handleChange: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  revision: PropTypes.object.isRequired,
};

export default ApplicationDetailTabEnvironment;

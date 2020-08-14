// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal

// coligo
import {IViewJobDefinitionEnvironment} from '../../../model/job-view-model';
import * as commonValidator from '../../../../../common/validator/common-validator';
import ClgEnvironmentVariablesTable from '../../../components/ClgEnvironmentVariablesTable/ClgEnvironmentVariablesTable';

interface IProps {
  allowInputDerivation?: boolean;
  inputValues: IViewJobDefinitionEnvironment;
  handleChange: (key: string, value: IViewJobDefinitionEnvironment) => any;
  projectId: string;
  regionId: string;
}

interface IState {
  currentValues: IViewJobDefinitionEnvironment;
}

class JobDefinitionDetailTabEnvironment extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props: IProps, state: IState) {
    if (props.allowInputDerivation) {
      return {
        currentValues: props.inputValues,
      };
    } else {
      return null;
    }
  }

  private readonly COMPONENT = 'JobDefinitionDetailTabEnvironment';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.state = {
      currentValues: props.inputValues,
    };

    if (!this.state.currentValues.env) {
      this.state.currentValues.env = [];
    }

    // bind the onChangeCurrency functions to this, to allow state updates
    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.handleEnvVariablesChange = this.handleEnvVariablesChange.bind(this);
  }

  public getSnapshotBeforeUpdate(prevProps, prevState) {
    // The return value for this lifecycle will be passed as the third parameter to componentDidUpdate
    return null;
  }

  public componentDidUpdate(prevProps, prevState, snapshot) {
    // perform action -after- the component got re-rendered with new props
  }

  public render() {
    this.logger.debug(`render - currentValues: '${JSON.stringify(this.state.currentValues)}'`);
    return (
        <div className='clg-jobdef-detail-page--parameters coligo-tab'>
          <ClgEnvironmentVariablesTable
              allowInputDerivation={this.props.allowInputDerivation}
              emptyText={'clg.page.jobs.configuration.tab.env.noParameters'}
              handleChange={this.handleEnvVariablesChange}
              envVariables={this.state.currentValues.env}
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
          currentValues: {
            env: envVariables.val,
          }
        };
      }, () => {
        this.populateChangesToParent();
      });
    }
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private populateChangesToParent() {
    // TODO decide whether an update should be populated, or not.

    this.props.handleChange('environment', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobDefinitionDetailTabEnvironment.propTypes = {
  allowInputDerivation: PropTypes.bool,
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
};

export default JobDefinitionDetailTabEnvironment;

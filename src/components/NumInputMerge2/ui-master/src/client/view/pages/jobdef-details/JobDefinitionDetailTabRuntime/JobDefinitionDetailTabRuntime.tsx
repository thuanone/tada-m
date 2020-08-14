import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// coligo
import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import {IClgTextField, validateField} from '../../../../../common/validator/common-validator';
import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import {IViewJobDefinitionRuntime} from '../../../model/job-view-model';

const MIN_CPU = coligoValidatorConfig.job.cpu.min;
const MAX_CPU = coligoValidatorConfig.job.cpu.max;

interface IProps {
  allowInputDerivation?: boolean;
  inputValues: IViewJobDefinitionRuntime;
  handleChange: (key: string, value: IViewJobDefinitionRuntime) => any;
}

interface IState {
  currentValues: IViewJobDefinitionRuntime;
}

class JobDefinitionDetailTabRuntime extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props: IProps, state: IState) {
    if (props.allowInputDerivation) {
      return {
        currentValues: props.inputValues,
      };
    } else {
      return null;
    }
  }

  private readonly COMPONENT = 'JobDefinitionDetailTabRuntime';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.state = {
      currentValues: props.inputValues,
    };

    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onMemoryChange = this.onMemoryChange.bind(this);
    this.onCpusChange = this.onCpusChange.bind(this);
    this.onNumberChange = this.onNumberChange.bind(this);
  }

  public getSnapshotBeforeUpdate(prevProps, prevState) {
    // The return value for this lifecycle will be passed as the third parameter to componentDidUpdate
    return null;
  }

  public componentDidUpdate(prevProps, prevState, snapshot) {
    // perform action -after- the component got re-rendered with new props
  }

  public render() {
    this.logger.debug(`render - memory: '${this.state.currentValues.memory.val}', cpus: '${this.state.currentValues.cpus.val}'`);
    return (
      <div className='clg-jobdef-detail-page--limits coligo-tab'>
        <div className='bx--row is-last-item'>
          <div className='bx--col-xlg-12 bx--col-lg-16 bx--col-md-8'>
            <div className='form-section section'>
              <div className='form-section--content bx--row'>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasTooltip={true}
                      inputId={'input-memory-limit'}
                      inputClassName='resource-limit-input clg-temp-override'
                      nlsKey='clg.jobdefinition.limit.memory'
                      onChange={this.onMemoryChange}
                      textField={this.state.currentValues.memory}
                  />
                </div>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasTooltip={true}
                      inputId={'input-cpu-limit'}
                      inputClassName='resource-limit-input clg-temp-override'
                      nlsKey='clg.jobdefinition.limit.cpus'
                      onChange={this.onCpusChange}
                      textField={this.state.currentValues.cpus}
                      validationRules={{ min: MIN_CPU, max: MAX_CPU }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private onMemoryChange(event) {
    const newValue = event.target.value;
    this.onNumberChange('memory', newValue);
  }

  private onCpusChange(event) {
    const newValue = event.target.value;
    this.onNumberChange('cpus', newValue);
  }

  private onNumberChange(stateParam, newValue) {
    const fn = 'onNumberChange ';
    this.logger.debug(`${fn}- ${stateParam} value: '${newValue}'`);
    let val;

    if (newValue) {
      val = parseInt(newValue, 10);
    } else {
      // assume empty input field
      val = 0;
    }

    if (!isNaN(val)) {
      this.setState((oldState) => {
        this.logger.debug(`${fn}- New value for ${stateParam} = ${val}`);
        const values = oldState.currentValues;
        (values[stateParam] as IClgTextField).val = (!newValue) ? '' : val;
        validateField(values[stateParam]);

        return {
          currentValues: values
        };
      }, () => {
          this.populateChangesToParent();
      });
    } else {
      this.logger.debug(`${fn}- Cannot update number`);
    }
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private populateChangesToParent() {
    this.props.handleChange('runtime', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobDefinitionDetailTabRuntime.propTypes = {
  allowInputDerivation: PropTypes.bool,
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
};

export default JobDefinitionDetailTabRuntime;

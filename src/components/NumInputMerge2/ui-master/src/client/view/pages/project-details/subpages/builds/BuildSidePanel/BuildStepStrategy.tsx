import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// coligo
import {validateField} from '../../../../../../../common/validator/common-validator';
import ClgTextInput from '../../../../../components/ClgTextInput/ClgTextInput';
import {IViewBuildStrategy} from '../../../../../model/build-view-model';

interface IProps {
  inputValues: IViewBuildStrategy;
  handleChange: (key: string, value: IViewBuildStrategy) => any;
}

interface IState {
  currentValues: IViewBuildStrategy;
}

class BuildStepStrategy extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props, state) {
    if (props.allowInputDerivation) {
      return {
        currentValues: props.inputValues,
      };
    } else {
      return null;
    }
  }

  private readonly COMPONENT = 'BuildStepStrategy';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.state = {
      currentValues: props.inputValues,
    };

    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onStrategyNameChange = this.onStrategyNameChange.bind(this);
  }

  public render() {
    this.logger.debug(`render - strategy: '${this.state.currentValues.strategyName}'`);

    return (
      <div className='clg-build-detail-page--strategy coligo-tab'>
        <div className='bx--form__fieldset'>
          <div className='is-last-item'>
            <ClgTextInput
                data-focus-first={true}
                hasTooltip={true}
                hasHelperText={false}
                hasPlaceholderText={true}
                inputId={'build-strategy-image'}
                isDisabled={true}
                light={true}
                nlsKey='clg.build.strategyName'
                onChange={this.onStrategyNameChange}
                textField={this.state.currentValues.strategyName}
            />
          </div>
        </div>
      </div>
    );
  }

  private onStrategyNameChange(event) {
    const fn = 'onStrategyNameChange ';

    const val = event.target.value;
    this.setState((oldState) => {
      oldState.currentValues.strategyName.val = val;
      validateField(oldState.currentValues.strategyName);
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

    this.props.handleChange('strategy', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildStepStrategy.propTypes = {
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
};

export default BuildStepStrategy;

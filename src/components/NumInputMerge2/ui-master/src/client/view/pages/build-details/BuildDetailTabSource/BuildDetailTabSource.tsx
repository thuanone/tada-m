// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// coligo
import {validateField} from '../../../../../common/validator/common-validator';
import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import {IViewBuildSource} from '../../../model/build-view-model';

interface IProps {
  allowInputDerivation: boolean;
  inputValues: IViewBuildSource;
  handleChange: (key: string, value: IViewBuildSource) => any;
}

interface IState {
  currentValues: IViewBuildSource;
}

class BuildDetailTabSource extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props, state) {
    if (props.allowInputDerivation) {
      return {
        currentValues: props.inputValues,
      };
    } else {
      return null;
    }
  }

  private readonly COMPONENT = 'BuildDetailTabSource';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.state = {
      currentValues: props.inputValues,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this.populateChangesToParent = this.populateChangesToParent.bind(this);
    this.onSourceUrlChange = this.onSourceUrlChange.bind(this);
    this.onSourceRevChange = this.onSourceRevChange.bind(this);
  }

  public render() {
    this.logger.debug(`render - source: '${this.state.currentValues.sourceUrl}'`);

    return (
      <div className='clg-build-detail-page--source coligo-tab'>
        <div className='bx--form__fieldset'>
            <ClgTextInput
                hasTooltip={true}
                hasHelperText={false}
                hasPlaceholderText={true}
                inputId={'build-source-image'}
                light={false}
                nlsKey='clg.build.sourceUrl'
                onChange={this.onSourceUrlChange}
                textField={this.state.currentValues.sourceUrl}
            />
          <div className='is-last-item'>
            <ClgTextInput
                hasTooltip={true}
                hasHelperText={false}
                hasPlaceholderText={true}
                inputId={'build-source-rev'}
                light={false}
                nlsKey='clg.build.sourceRev'
                onChange={this.onSourceRevChange}
                textField={this.state.currentValues.sourceRev || { val: '' }}
            />
          </div>
        </div>
      </div>
    );
  }

  private onSourceUrlChange(event) {
    const fn = 'onSourceUrlChange ';

    const val = event.target.value;
    this.setState((oldState) => {
      oldState.currentValues.sourceUrl.val = val;
      validateField(oldState.currentValues.sourceUrl);
      return oldState;
    }, () => {
      this.populateChangesToParent();
    });
  }
  private onSourceRevChange(event) {
    const fn = 'onSourceRevChange ';

    const val = event.target.value;
    this.setState((oldState) => {
      oldState.currentValues.sourceRev.val = val;
      validateField(oldState.currentValues.sourceRev);
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

    this.props.handleChange('source', this.state.currentValues);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildDetailTabSource.propTypes = {
  allowInputDerivation: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  inputValues: PropTypes.object.isRequired,
};

export default BuildDetailTabSource;

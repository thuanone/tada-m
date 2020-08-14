// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// coligo
import * as appModel from '../../../../../common/model/application-model';
import * as memoryUtils from '../../../../../common/utils/memory-utils';
import * as coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../../common/validator/common-validator';
import { FloatValidator } from '../../../../../common/validator/float-validator';
import { MemoryValidator } from '../../../../../common/validator/memory-validator';
import { NumberValidator } from '../../../../../common/validator/number-validator';
import t from '../../../../utils/i18n';
import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import * as viewApplicationModels from '../../../model/application-view-models';

interface IProps {
  handleChange: (key: string, limits: viewApplicationModels.IViewApplicationLimits) => any;
  isEditMode: boolean;
  revision: appModel.IUIApplicationRevision;
}

interface IState {
  isSaveDisabled: boolean;
  memory: commonValidator.IClgNumberField;
  cpus: commonValidator.IClgNumberField;
  timeoutSeconds: commonValidator.IClgNumberField;
  containerConcurrency: commonValidator.IClgNumberField;
  minScale: commonValidator.IClgNumberField;
  maxScale: commonValidator.IClgNumberField;
}

class ApplicationDetailTabRuntime extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailTabRuntime';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly REQUESTS_PARALLEL_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.containerConcurrency;
  private readonly CPU_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.cpu;
  private readonly MAX_SCALE_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.maxScale;
  private readonly MEMORY_UNIT: string = 'mi';
  private readonly MEMORY_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.memory;
  private readonly MIN_SCALE_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.minScale;
  private readonly TIMEOUT_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.timeout;

  private readonly floatValidator: commonValidator.IClgFieldValidator = new FloatValidator();
  private readonly memoryValidator: commonValidator.IClgFieldValidator = new MemoryValidator();
  private readonly numberValidator: commonValidator.IClgFieldValidator = new NumberValidator();

  constructor(props) {
    super(props);
    this.logger.debug(`constructor - props: '${JSON.stringify(props)}'`);

    this.state = {
      containerConcurrency: {
        val: props.revision.containerConcurrency
      },
      cpus: {
        val: props.revision.cpus
      },
      isSaveDisabled: false,
      maxScale: {
        val: props.revision.maxScale
      },
      memory: {
        val: props.revision.memory && memoryUtils.convertBytesToUnit(props.revision.memory, this.MEMORY_UNIT),
      },
      minScale: {
        val: props.revision.minScale
      },
      timeoutSeconds: {
        val: props.revision.timeoutSeconds
      },
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this._populateChangesToParent = this._populateChangesToParent.bind(this);
    this.onMemoryChange = this.onMemoryChange.bind(this);
    this.onCpusChange = this.onCpusChange.bind(this);
    this.onRequestTimeoutChange = this.onRequestTimeoutChange.bind(this);
    this.onMinScaleChange = this.onMinScaleChange.bind(this);
    this.onMaxScaleChange = this.onMaxScaleChange.bind(this);
    this.onContainerConcurrencyChange = this.onContainerConcurrencyChange.bind(this);
    this.shouldDisableSave = this.shouldDisableSave.bind(this);
  }

  public UNSAFE_componentWillReceiveProps(newProps: IProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.debug(`${fn}- newProps.isEditMode? ${newProps.isEditMode}, props: '${JSON.stringify(newProps)}'`);

    // decide whether to update the limits or, not
    // in case the edit mode is active, we must not override the state
    if (newProps.revision && !newProps.isEditMode) {
      const memoryToUse = newProps.revision.memory && memoryUtils.convertBytesToUnit(newProps.revision.memory, this.MEMORY_UNIT);
      this.logger.debug(`${fn}- the component state needs an update`);
      this.setState({
        containerConcurrency: { val: newProps.revision.containerConcurrency },
        cpus: { val: newProps.revision.cpus },
        maxScale: { val: newProps.revision.maxScale },
        memory: { val: memoryToUse },
        minScale: { val: newProps.revision.minScale },
        timeoutSeconds: { val: newProps.revision.timeoutSeconds },
      });
    }
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug(`${fn}>`);

    // we need to set the state right after initializing the form, to reset the state
    this.setState({
      isSaveDisabled: this.shouldDisableSave(
        this.state.memory,
        this.state.cpus,
        this.state.timeoutSeconds,
        this.state.containerConcurrency,
        this.state.minScale,
        this.state.maxScale),
    });

    this.logger.debug(`${fn}<`);
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}> ${this.props.revision && this.props.revision.name}`);

    return (
      <div className='clg-application-detail-page--limits coligo-tab'>
        <div className='bx--row'>
          <div className='bx--col-xlg-10 bx--col-lg-16 bx--col-md-8'>
            <div className='form-section section'>
              <h6 className='form-section--header productive-heading-01'>{t('clg.page.application.section.instance')}</h6>
              <div className='form-section--content bx--row'>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasPlaceholderText={true}
                      hasTooltip={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-memory`}
                      nlsKey='clg.application.limit.memory'
                      onChange={this.onMemoryChange}
                      textField={this.state.memory}
                      validationRules={this.MEMORY_RULES}
                  />
                </div>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasPlaceholderText={true}
                      hasTooltip={true}
                      hasTooltipFooter={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-cpus`}
                      nlsKey='clg.application.limit.cpus'
                      onChange={this.onCpusChange}
                      textField={this.state.cpus}
                      validationRules={this.CPU_RULES}
                  />
                </div>
              </div>
            </div>
            <div className='form-section section'>
              <h6 className='form-section--header productive-heading-01'>{t('clg.page.application.section.requests')}</h6>
              <div className='form-section--content bx--row'>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasTooltip={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-timeoutSeconds`}
                      nlsKey='clg.application.limit.timeoutSeconds'
                      onChange={this.onRequestTimeoutChange}
                      textField={this.state.timeoutSeconds}
                      validationRules={this.TIMEOUT_RULES}
                  />
                </div>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasTooltip={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-containerConcurrency`}
                      nlsKey='clg.application.limit.containerConcurrency'
                      onChange={this.onContainerConcurrencyChange}
                      textField={this.state.containerConcurrency}
                      validationRules={this.REQUESTS_PARALLEL_RULES}
                  />
                </div>
              </div>
            </div>
            <div className='form-section section'>
              <h6 className='form-section--header productive-heading-01'>{t('clg.page.application.section.scaling')}</h6>
              <div className='form-section--content bx--row is-last-item'>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasPlaceholderText={true}
                      hasTooltip={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-minScale`}
                      nlsKey='clg.application.limit.minScale'
                      onChange={this.onMinScaleChange}
                      textField={this.state.minScale}
                      validationRules={this.MIN_SCALE_RULES}
                  />
                </div>
                <div className='bx--col-md-4'>
                  <ClgTextInput
                      hasPlaceholderText={true}
                      hasTooltip={true}
                      inputClassName='resource-limit-input'
                      inputId={`${this.props.revision.name}_-limit-maxScale`}
                      nlsKey='clg.application.limit.maxScale'
                      onChange={this.onMaxScaleChange}
                      textField={this.state.maxScale}
                      validationRules={this.MAX_SCALE_RULES}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private shouldDisableSave(
    memory: commonValidator.IClgNumberField,
    cpus: commonValidator.IClgNumberField,
    timeout: commonValidator.IClgNumberField,
    containerConcurrency: commonValidator.IClgNumberField,
    minScale: commonValidator.IClgNumberField,
    maxScale: commonValidator.IClgNumberField): boolean {
      const fn = 'shouldDisableSave ';

      this.logger.debug(`${fn}>`);

      // check if all fields were validated
      if (!memory.invalid &&
        !cpus.invalid &&
        !timeout.invalid &&
        !containerConcurrency.invalid &&
        !minScale.invalid &&
        !maxScale.invalid) {
          this.logger.debug(`${fn}< false`);
          return false;
      }

      // disable the create button
      this.logger.debug(`${fn}< true`);
      return true;
  }

  private onMemoryChange(event) {
    const fn = 'onMemoryChange ';
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.memoryValidator, this.MEMORY_RULES);
      this.logger.debug(`${fn}- val: '${event.target.value}', field: ${JSON.stringify(field)}`);
      this._populateChangesToParent(
        field,
        this.state.cpus,
        this.state.timeoutSeconds,
        this.state.containerConcurrency,
        this.state.minScale,
        this.state.maxScale);
      this.setState({ memory: field });
    }
  }

  private onCpusChange(event) {
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.floatValidator, this.CPU_RULES);
      this._populateChangesToParent(
        this.state.memory,
        field,
        this.state.timeoutSeconds,
        this.state.containerConcurrency,
        this.state.minScale,
        this.state.maxScale);
      this.setState({ cpus: field });
    }
  }

  private onMinScaleChange(event) {
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.MIN_SCALE_RULES);
      this._populateChangesToParent(
        this.state.memory,
        this.state.cpus,
        this.state.timeoutSeconds,
        this.state.containerConcurrency,
        field,
        this.state.maxScale);
      this.setState({ minScale: field });
    }
  }

  private onMaxScaleChange(event) {
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.MAX_SCALE_RULES);
      this._populateChangesToParent(
        this.state.memory,
        this.state.cpus,
        this.state.timeoutSeconds,
        this.state.containerConcurrency,
        this.state.minScale,
        field);
      this.setState({ maxScale: field });
    }
  }

  private onContainerConcurrencyChange(event) {
    const fn = 'onContainerConcurrencyChange ';
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.REQUESTS_PARALLEL_RULES);
      this.logger.debug(`${fn}- val: '${event.target.value}', field: '${JSON.stringify(field)}'`);
      this.setState({ containerConcurrency: field });
      this._populateChangesToParent(
        this.state.memory,
        this.state.cpus,
        this.state.timeoutSeconds,
        field,
        this.state.minScale,
        this.state.maxScale);
    }
  }

  private onRequestTimeoutChange(event) {
    if (event.target) {
      const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.TIMEOUT_RULES);
      this._populateChangesToParent(
        this.state.memory,
        this.state.cpus,
        field,
        this.state.containerConcurrency,
        this.state.minScale,
        this.state.maxScale);
      this.setState({ timeoutSeconds: field });
    }
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private _populateChangesToParent(
    memory: commonValidator.IClgNumberField,
    cpus: commonValidator.IClgNumberField,
    timeoutSeconds: commonValidator.IClgNumberField,
    containerConcurrency: commonValidator.IClgNumberField,
    minScale: commonValidator.IClgNumberField,
    maxScale: commonValidator.IClgNumberField) {

    // evaluate whether the save button must be disabled
    const shouldDisableSaveBtn = this.shouldDisableSave(memory, cpus, timeoutSeconds, containerConcurrency, minScale, maxScale);

    this.props.handleChange('runtime', { memory, cpus, timeoutSeconds, containerConcurrency, minScale, maxScale, shouldDisableSaveBtn });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailTabRuntime.propTypes = {
  handleChange: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  revision: PropTypes.object.isRequired,
};

export default ApplicationDetailTabRuntime;

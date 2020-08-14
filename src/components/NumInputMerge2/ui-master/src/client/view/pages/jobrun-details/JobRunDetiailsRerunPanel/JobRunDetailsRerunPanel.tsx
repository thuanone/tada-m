// react
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

import { Button } from '@console/pal/carbon-components-react';
import { Add16 } from '@carbon/icons-react';
import {
    SidePanel,
    SidePanelContainer
} from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';
import { IUIJobDefinition, IUIJobRun, UIJobStatus } from '../../../../../common/model/job-model';
import { MemoryValidator } from '../../../../../common/validator/memory-validator';
import { NumberValidator } from '../../../../../common/validator/number-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import {
    getValidatedNumberField,
    getValidatedTextField,
    validateField,
} from '../../../../../common/validator/common-validator';
import * as memUtils from '../../../../../common/utils/memory-utils';
import { IUIEditJobRun } from '../../../model/job-view-model';
import * as jobApi from '../../../../api/job-api';
import nav from '../../../../utils/nav';
import toastNotification from '../../../../utils/toastNotification';
import { IClgToastNotification } from '../../../model/common-view-model';
import * as commonModel from '../../../../../common/model/common-model';

// 3rd-party
import * as log from 'loglevel';

import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import t from '../../../../utils/i18n';

import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';

const MIN_CPU = coligoValidatorConfig.job.cpu.min;
const MAX_CPU = coligoValidatorConfig.job.cpu.max;

const MIN_RETRIES = coligoValidatorConfig.job.retryLimit.min;
const MAX_RETRIES = coligoValidatorConfig.job.retryLimit.max;

const MIN_TIMEOUT = coligoValidatorConfig.job.maxExecutionTime.min;
const MAX_TIMEOUT = coligoValidatorConfig.job.maxExecutionTime.max;

const GlobalMemoryValidator = new MemoryValidator();
const GlobalNumberValidator = new NumberValidator();
const GlobalTextValidator = new TextValidator();

interface IProps {
    jobRun: IUIJobRun;
    history: any[];
    jobDefinitionName: string;
    regionId: string;
    projectId: string;
    rerun: boolean;
    disabled: boolean;
    className: string;
}

interface IState {
    openSidePanel: boolean;
    sidePanelInputFields: IUIEditJobRun;
    hasInvalidData: boolean;
}

class JobRunDetailsRerunPanel extends React.Component<IProps, IState> {

    public static defaultProps = {
        disabled: false,
    };

    private readonly COMPONENT = 'JobRunDetailsPage';

    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        const fn = 'constructor ';
        this.logger.debug(`${fn}>`);

        this.logger.debug(`${fn}jobRunId: ${this.props.jobRun.id}`);
        const sidePanelInputFields: IUIEditJobRun = {
            arraySpec: {
                val: '0,1-2',
            },
            cpus: {
                val: this.props.jobRun.spec.cpus,
            },
            memory: {
                val: memUtils.convertBytesToDisplayValue(this.props.jobRun.spec.memory, 'mib'),
            },
            retries: {
                val: 2,
            },
            timeout: {
                val: 60,
            },
        };

        this.state = {
            openSidePanel: false,
            sidePanelInputFields,
            hasInvalidData: false,
        };

        // use the bind to enable setState within this function

        this.handleInvoke = this.handleInvoke.bind(this);
        this.initSidePanel = this.initSidePanel.bind(this);
        this.navigateToJobRunDetailPage = this.navigateToJobRunDetailPage.bind(this);
        this.onSidePanelCancelClick = this.onSidePanelCancelClick.bind(this);
        this.onSidePanelCloseClick = this.onSidePanelCloseClick.bind(this);
        this.openSidePanelForJobRun = this.openSidePanelForJobRun.bind(this);
        this.onSidePanelCancelClick = this.onSidePanelCancelClick.bind(this);
        this.onSidePanelCloseClick = this.onSidePanelCloseClick.bind(this);
        this.onChangeArraySpec = this.onChangeArraySpec.bind(this);
        this.onChangeCpu = this.onChangeCpu.bind(this);
        this.onChangeMemory = this.onChangeMemory.bind(this);
        this.onChangeRetries = this.onChangeRetries.bind(this);
        this.onChangeTimeout = this.onChangeTimeout.bind(this);
        this.onChangeSidePanelInputField = this.onChangeSidePanelInputField.bind(this);
    }

    public render() {
        return (
            <React.Fragment>
                {this.props.rerun ?
                (
                    <Button
                        kind='primary'
                        onClick={this.openSidePanelForJobRun}
                        disabled={this.props.disabled}
                        className={this.props.className}
                    >
                        {t('clg.page.jobdetails.rerun')}
                    </Button>
                )
                :
                (
                    <Button
                        kind='primary'
                        size='small'
                        onClick={this.openSidePanelForJobRun}
                        renderIcon={Add16}
                        className={'invoke-application-btn ' + this.props.className}
                        disabled={this.props.disabled}
                    >
                        {t('clg.page.jobs.action.invoke')}
                    </Button>
                )
            }
                <SidePanelContainer
                    previousText={t('clg.common.label.back')}
                    cancelText={t('clg.common.label.cancel')}
                    closePanelText={t('clg.common.label.close')}
                    doneText={t('clg.page.jobs.action.invoke')}
                    hasOverlay={true}
                    isOpen={this.state.openSidePanel}
                    locale={getLocale(window.navigator.language)}
                    nextText={t('clg.common.label.next')}
                    onCancelClick={this.onSidePanelCancelClick}
                    onCloseClick={this.onSidePanelCloseClick}
                    onDoneClick={this.handleInvoke}
                    panelSize={'large'}
                >
                    <SidePanel
                        id={`sidepanel_jobdef_${this.props.jobDefinitionName}`}
                        primaryButtonDisabled={this.state.hasInvalidData}
                        title={this.props.rerun ? t('clg.page.jobdetails.sidepanel.title') : t('clg.page.jobs.configuration.sidepanel.title')}
                    >
                        <div className='coligo-panel'>
                            <div tabIndex={0} />
                            <div className={'bx--row'}>
                                <ClgTextInput
                                    className={'bx--col-lg-12 bx--col-md-6 bx--col-sm-3'}
                                    hasTooltip={true}
                                    inputId={'jobs-sp-arrayspec'}
                                    light={true}
                                    nlsKey='clg.jobdefinition.limit.arraySpec'
                                    onChange={this.onChangeArraySpec}
                                    textField={this.state.sidePanelInputFields.arraySpec}
                                // validationRules={{ min: MIN_ARRAY_SIZE, max: MAX_ARRAY_SIZE }}
                                />
                            </div>
                            <div className={'bx--row'}>
                                <ClgTextInput
                                    className={'bx--col-lg-12 bx--col-md-6 bx--col-sm-3'}
                                    hasTooltip={true}
                                    inputId={'jobs-sp-cpus'}
                                    light={true}
                                    nlsKey='clg.jobdefinition.limit.cpus'
                                    onChange={this.onChangeCpu}
                                    textField={this.state.sidePanelInputFields.cpus}
                                    validationRules={{ min: MIN_CPU, max: MAX_CPU }}
                                />
                            </div>
                            <div className={'bx--row'}>
                                <ClgTextInput
                                    className={'bx--col-lg-12 bx--col-md-6 bx--col-sm-3'}
                                    hasTooltip={true}
                                    inputId={'jobs-sp-memory'}
                                    light={true}
                                    nlsKey='clg.jobdefinition.limit.memory'
                                    onChange={this.onChangeMemory}
                                    textField={this.state.sidePanelInputFields.memory}
                                />
                            </div>
                            <div className={'bx--row'}>
                                <ClgTextInput
                                    className={'bx--col-lg-12 bx--col-md-6 bx--col-sm-3'}
                                    hasTooltip={true}
                                    inputId={'jobs-sp-retries'}
                                    light={true}
                                    nlsKey='clg.jobdefinition.limit.retries'
                                    onChange={this.onChangeRetries}
                                    textField={this.state.sidePanelInputFields.retries}
                                    validationRules={{ min: MIN_RETRIES, max: MAX_RETRIES }}
                                />
                            </div>
                            <div className={'bx--row is-last-row'}>
                                <ClgTextInput
                                    className={'bx--col-lg-12 bx--col-md-6 bx--col-sm-3'}
                                    hasTooltip={true}
                                    inputId={'jobs-sp-timeout'}
                                    light={true}
                                    nlsKey='clg.jobdefinition.limit.timeout'
                                    onChange={this.onChangeTimeout}
                                    textField={this.state.sidePanelInputFields.timeout}
                                    validationRules={{ min: MIN_TIMEOUT, max: MAX_TIMEOUT }}
                                />
                            </div>
                        </div>
                    </SidePanel>
                </SidePanelContainer>
            </React.Fragment>
        );
    }

    public navigateToJobRunDetailPage(jobrunId: string): void {
        this.props.history.push(nav.toJobRunDetail(this.props.regionId, this.props.projectId, jobrunId));
    }

    private handleInvoke() {

        // build the actual JobRun definition and invoke it
        const JobRunDef: IUIJobRun = {
            arraySpec: this.state.sidePanelInputFields.arraySpec.val,
            definitionName: this.props.jobDefinitionName,
            generateName: this.props.jobDefinitionName + '-jobrun-',
            kind: 'JobRun',
            maxExecutionTime: this.state.sidePanelInputFields.timeout.val,
            retryLimit: this.state.sidePanelInputFields.retries.val,
            spec: {
                containerName: this.props.jobRun.spec.containerName,
                image: this.props.jobRun.spec.image,
            },
        };

        JobRunDef.spec.memory = memUtils.convertValueToBytes(`${this.state.sidePanelInputFields.memory.val}mib`);
        JobRunDef.spec.cpus = this.state.sidePanelInputFields.cpus.val;

        jobApi.createJobRun(this.props.regionId, this.props.projectId, JobRunDef)
            .then((createdResult: IUIJobRun) => {
                // show a toast notification
                const successNotification: IClgToastNotification = {
                    caption: t('clg.page.jobs.success.invokeJobRun.caption'),
                    kind: 'success',
                    subtitle: t('clg.page.jobs.success.invokeJobRun.subtitle'),
                    title: t('clg.page.jobs.success.invokeJobRun.title'),
                };
                toastNotification.add(successNotification);

                // close the side panel
                this.setState({
                    openSidePanel: false,
                }, () => {

                    // update the cache for jobruns of this jobdefinition after a short delay

                    // TODO CACHE??
                    // if (this.cacheUpdateFn) {
                    //     setTimeout(this.cacheUpdateFn, 500);
                    // }

                    // direct the user to the jobrun detail page
                    this.navigateToJobRunDetailPage(createdResult.id);
                });

            })
            .catch((errorResult: commonModel.UIRequestError) => {
                this.logger.warn(`createJobRun - Failed to create job run - message: ${errorResult.message}`);

                // show a toast error notification
                const jobRunErrorNotification: IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.jobs.error.invokeJobRun.subtitle'),
                    title: t('clg.page.jobs.error.invokeJobRun.title'),
                };
                toastNotification.add(jobRunErrorNotification);

                // close the side panel
                this.setState({
                    openSidePanel: false,
                });
            });
    }

    private onChangeSidePanelInputField(fieldName, newValue) {
        let val;

        if (newValue) {
            val = parseInt(newValue, 10);
        } else {
            // assume empty input field
            val = 0;
        }

        if (!isNaN(val)) {
            this.setState((oldState) => {
                const values = oldState.sidePanelInputFields;
                values[fieldName].val = (!newValue) ? '' : val;
                validateField(values[fieldName]);
                return {
                    hasInvalidData: this.hasInvalidFields(values),
                    sidePanelInputFields: values,
                };
            });
        } else {
            this.logger.debug('Cannot update number');
        }
    }

    private onChangeArraySpec(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState((oldState) => {
                const values = oldState.sidePanelInputFields;
                values.arraySpec.val = val;
                validateField(values.arraySpec);
                return {
                    hasInvalidData: this.hasInvalidFields(values),
                    sidePanelInputFields: values,
                };
            });
        } else {
            this.logger.debug('Cannot update number');
        }
    }

    private onChangeCpu(event) {
        this.onChangeSidePanelInputField('cpus', event.target.value);
    }

    private onChangeMemory(event) {
        this.onChangeSidePanelInputField('memory', event.target.value);
    }

    private onChangeRetries(event) {
        this.onChangeSidePanelInputField('retries', event.target.value);
    }

    private onChangeTimeout(event) {
        this.onChangeSidePanelInputField('timeout', event.target.value);
    }

    private onSidePanelCancelClick() {
        this.setState({
            openSidePanel: false,
        });
    }

    private onSidePanelCloseClick() {
        this.setState({
            openSidePanel: false,
        });
    }

    private openSidePanelForJobRun() {
        this.setState((oldState) => {
            return {
                openSidePanel: false,
            };
        }, () => {
            this.initSidePanel();
        });
    }

    private hasInvalidFields(inputFields: IUIEditJobRun): boolean {
        const fn = 'hasInvalidFields ';
        let allValid = true;
        for (const field of Object.values(inputFields)) {
            if (typeof field.invalid !== 'undefined') {
                allValid = false;
            }
        }
        this.logger.debug(`${fn}< ${!allValid}`);
        return !allValid;
    }

    private initSidePanel() {
        // build new valid/invalid input fields tracking object and put it into our state here
        const arraySpec = this.props.jobRun.failedIndices || '1';
        const sidePanelInputFields: IUIEditJobRun = {
            arraySpec: getValidatedTextField(arraySpec, GlobalTextValidator, coligoValidatorConfig.job.arraySpec, true),
            cpus: getValidatedNumberField(this.props.jobRun.spec.cpus, GlobalNumberValidator, coligoValidatorConfig.job.cpu, true),
            memory: getValidatedNumberField(memUtils.convertBytesToDisplayValue(this.props.jobRun.spec.memory, 'mib'), GlobalMemoryValidator, coligoValidatorConfig.job.memory, true),
            retries: getValidatedNumberField(coligoValidatorConfig.job.retryLimit.default, GlobalNumberValidator, coligoValidatorConfig.job.retryLimit, true),
            timeout: getValidatedNumberField(coligoValidatorConfig.job.maxExecutionTime.default, GlobalNumberValidator, coligoValidatorConfig.job.maxExecutionTime, true),
        };

        sidePanelInputFields.memory.invalid = undefined;
        sidePanelInputFields.retries.invalid = undefined;
        sidePanelInputFields.arraySpec.invalid = undefined;
        sidePanelInputFields.timeout.invalid = undefined;
        sidePanelInputFields.cpus.invalid = undefined;

        this.setState({
            hasInvalidData: this.hasInvalidFields(sidePanelInputFields),
            openSidePanel: true,
            sidePanelInputFields,
        });
    }
}

// @ts-ignore
JobRunDetailsRerunPanel.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    jobRun: PropTypes.object.isRequired,
    jobDefinitionName: PropTypes.string.isRequired,
    regionId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    rerun: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
};

export { JobRunDetailsRerunPanel };
export default withRouter(JobRunDetailsRerunPanel);

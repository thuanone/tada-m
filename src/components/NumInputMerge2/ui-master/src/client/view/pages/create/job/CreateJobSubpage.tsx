// react
import PropTypes from 'prop-types';
import React from 'react';
// 3rd-party
import * as crypto from 'crypto';
import * as log from 'loglevel';
// carbon + pal
import { ChevronDown16, ChevronUp16, } from '@carbon/icons-react';
import { InlineNotification, NotificationActionButton, TextInput, } from '@console/pal/carbon-components-react';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
// coligo
import {
    IUIEnvItems,
    UIEntityKinds,
    UIRequestError
} from '../../../../../common/model/common-model';
import * as configModel from '../../../../../common/model/config-model';
import * as jobModel from '../../../../../common/model/job-model';
import * as projectModel from '../../../../../common/model/project-model';
import * as memUtils from '../../../../../common/utils/memory-utils';
import { convertBytesToDisplayValue } from '../../../../../common/utils/memory-utils';
import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import {
    getValidatedNumberField,
    getValidatedTextField,
    IClgKeyValueFields,
    IClgNumberField,
    IClgTextField,
    validateField
} from '../../../../../common/validator/common-validator';
import { MemoryValidator } from '../../../../../common/validator/memory-validator';
import { NumberValidator } from '../../../../../common/validator/number-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as jobApi from '../../../../api/job-api';
import t from '../../../../utils/i18n';
import clgContainerRegistryName from '../../../../utils/formatter/clgContainerRegistryName';
import nav from '../../../../utils/nav';
import toastNotification from '../../../../utils/toastNotification';
import { TextArea } from '../../../common/carbon';
import { IComponentTypes } from '../../../common/types';
import ClgContainerImage from '../../../components/ClgContainerImage/ClgContainerImage';
import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import * as viewCommonModel from '../../../model/common-view-model';
import { keyValueToUIEnvItem } from '../../../../../common/utils/environment-utils';
import ClgEnvironmentVariablesTable from '../../../components/ClgEnvironmentVariablesTable/ClgEnvironmentVariablesTable';

const GlobalTextValidator = new TextValidator();
const GlobalMemoryValidator = new MemoryValidator();
const GlobalNumberValidator = new NumberValidator();

const MIN_CPU = coligoValidatorConfig.job.cpu.min;
const MAX_CPU = coligoValidatorConfig.job.cpu.max;

interface IProps {
    history: any;
    onCreateDisabledChanged: (compType, newValue) => void;
    onGetCreateFunction: (createFn) => void;
    onGetSelectFunction: (jobFn) => void;
    onIsCreatingChanged: (compType, isCreating) => void;
    selectedProject: projectModel.IUIProject;
}

interface IState {
    arguments: string;  // 'Args' in the UI
    command: string;  // 'Command' in the UI
    cpus: IClgNumberField;
    envVariables: IClgKeyValueFields;
    envVariablesChanged?: boolean;
    envVariablesCollapsed: boolean;
    error?: viewCommonModel.IClgInlineNotification;
    image: IClgTextField;
    isNameInvalid: boolean;
    isCreateDisabled: boolean;
    isCreating: boolean;
    isLoading: boolean;
    jobDefName: IClgTextField;
    memory: IClgNumberField;
    ownUpdate: boolean;
    runtimeSettingsCollapsed: boolean;
    selectedProject?: projectModel.IUIProject;
    selectedRegistry: configModel.IUIRegistrySecret;
}

interface IStateUpdate {
    selectedProject?: projectModel.IUIProject;
    ownUpdate: boolean;
}

function randomStr(len: number) {
    return crypto.randomBytes(len).toString('hex').slice(0, len).toLowerCase();
}

// setup the logger
const COMPONENT = 'CreateJobSubpage';
const logger = log.getLogger(COMPONENT);

class CreateJobSubpage extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        const fn = 'getDerivedStateFromProps ';
        logger.trace(`${fn}> props: '${JSON.stringify(props)}', state: ${JSON.stringify(state)}`);

        if (state.ownUpdate) {
            logger.debug(`${fn}< - no updated due to own update`);
            return { ownUpdate: false };
        }

        const stateUpdate: IStateUpdate = { ownUpdate: false };

        // check whether the project has been loaded
        if (!state.selectedProject && props.selectedProject || (state.selectedProject && state.selectedProject.id) !== (props.selectedProject && props.selectedProject.id)) {
            stateUpdate.selectedProject = props.selectedProject;
        }

        // check whether the state needs to be updated
        if (Object.keys(stateUpdate).length > 1) {
            logger.debug(`${fn}< state update! ${JSON.stringify(stateUpdate)}`);
            return stateUpdate;
        }

        logger.debug(`${fn}<`);
        return null;
    }

    private mounted = false;

    constructor(props: IProps) {
        super(props);
        this.state = {
            arguments: '',
            command: '',
            cpus: getValidatedNumberField(coligoValidatorConfig.job.cpu.default, GlobalNumberValidator, coligoValidatorConfig.job.cpu, true),
            envVariables: {
                val: [],
            },
            envVariablesChanged: false,
            envVariablesCollapsed: true,
            image: getValidatedTextField('', GlobalTextValidator, coligoValidatorConfig.job.image, true),
            isCreateDisabled: true,
            isCreating: false,
            isLoading: true,
            isNameInvalid: false,
            jobDefName: getValidatedTextField('', GlobalTextValidator, coligoValidatorConfig.job.name, true),
            memory: getValidatedNumberField(convertBytesToDisplayValue(coligoValidatorConfig.job.memory.default, 'mib'), GlobalMemoryValidator, coligoValidatorConfig.job.memory, true),
            ownUpdate: false,
            runtimeSettingsCollapsed: true,
            selectedRegistry: null,
        };

        // resetting '.invalid' fields for all input fields, so they only show the invalid information, once a field got changed
        this.state.cpus.invalid = undefined;
        this.state.image.invalid = undefined;
        this.state.jobDefName.invalid = undefined;
        this.state.memory.invalid = undefined;

        this.handleArgumentsChange = this.handleArgumentsChange.bind(this);
        this.handleCommandChange = this.handleCommandChange.bind(this);
        this.handleEnvVariablesChange = this.handleEnvVariablesChange.bind(this);
        this.handleJobDefNameChange = this.handleJobDefNameChange.bind(this);
        this.onImageChange = this.onImageChange.bind(this);
        this.handleJobDefMemChange = this.handleJobDefMemChange.bind(this);
        this.handleJobDefCpuChange = this.handleJobDefCpuChange.bind(this);
        this.createNewJobDefinition = this.createNewJobDefinition.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.initialize = this.initialize.bind(this);
        this.closeNotification = this.closeNotification.bind(this);
        this.setIsCreateDisabled = this.setIsCreateDisabled.bind(this);
        this.setIsCreating = this.setIsCreating.bind(this);
        this.toggleEnvVariables = this.toggleEnvVariables.bind(this);
        this.toggleRuntimeSettings = this.toggleRuntimeSettings.bind(this);
        this.unsetIsCreateDisabled = this.unsetIsCreateDisabled.bind(this);
        this.unsetIsCreating = this.unsetIsCreating.bind(this);

        if (props.onGetCreateFunction) {
            props.onGetCreateFunction(this.createNewJobDefinition);
        }

        if (props.onGetSelectFunction) {
            props.onGetSelectFunction(this.initialize);
        }
    }

    public componentDidMount() {
        logger.debug('componentDidMount > ...');

        this.setState({ isLoading: false });
        this.checkInputFieldValidity();

        window.scrollTo(0, 0);
        this.mounted = true;

        this.setIsCreateDisabled();
    }

    /**
     * Re-initialize state, when this subpage becomes active again (like checking status of Create Button, etc)
     */
    public initialize() {
        if (this.mounted) {
            logger.debug('initialize');
            this.setIsCreateDisabled();
        }
    }

    public onImageChange(event) {
        logger.debug(`onImageChange > event: '${JSON.stringify(event)}'`);

        this.setState((oldState: IState) => {
            oldState.image.val = event.image.val;
            validateField(oldState.image);
            oldState.ownUpdate = true;
            return oldState;
        }, () => {
            this.checkInputFieldValidity();
        });

        this.setState({
            selectedRegistry: event.registry,
            ownUpdate: true,
        });
    }

    public render() {
        if (this.state.isLoading && !this.state.error) { return <PageHeaderSkeleton title={true} breadcrumbs={true} />; }
        return (
            <React.Fragment>
                {this.state.error &&
                    (
                        <InlineNotification
                            kind={this.state.error.kind}
                            lowContrast={true}
                            statusIconDescription={this.state.error.title}
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
                    )
                }
                <div className='bx--row last-row-of-section'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <TextInput
                            id={'create-jobdefinition-name'}
                            labelText={t('clg.common.label.name')}
                            placeholder={t('clg.page.create.jobdefinition.name.placeholder')}
                            type={'text'}
                            invalid={!!this.state.jobDefName.invalid}
                            invalidText={t('clg.jobdefinition.name.invalid.' + this.state.jobDefName.invalid, { maxLength: coligoValidatorConfig.job.name.maxLength })}
                            onChange={this.handleJobDefNameChange}
                            value={this.state.jobDefName.val}
                            tabIndex={0}
                        />
                    </div>
                </div>
                <h4 className='productive-heading-03 main-section'>{t('clg.page.create.app.code.heading')}</h4>
                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                        {t('clg.page.create.jobdefinition.code.description')}
                    </div>
                </div>
                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <ClgContainerImage
                            hasHelperText={true}
                            idPrefix='create-jobdefinition'
                            image={this.state.image}
                            registryName={this.state.selectedRegistry && this.state.selectedRegistry.name}
                            nlsKeyPrefix='clg.jobdefinition'
                            onChange={this.onImageChange}
                            project={this.state.selectedProject}
                            allowToUsePublicRegistry={true}
                        />
                    </div>
                </div>

                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <TextArea
                            className='some-class'
                            cols={50}
                            disabled={false}
                            id='jobdefinition-commands'
                            invalid={false}
                            labelText={t('clg.jobdefinition.command.label')}
                            light={false}
                            onChange={this.handleCommandChange}
                            placeholder={t('clg.jobdefinition.command.placeholder')}
                            rows={4}
                            value={this.state.command}
                        />
                    </div>
                </div>

                <div className='bx--row last-row-of-section'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <TextArea
                            className='some-class'
                            cols={50}
                            disabled={false}
                            id='jobdefinition-arguments'
                            invalid={false}
                            labelText={t('clg.jobdefinition.arguments.label')}
                            light={false}
                            onChange={this.handleArgumentsChange}
                            placeholder={t('clg.jobdefinition.arguments.placeholder')}
                            rows={4}
                            value={this.state.arguments}
                        />
                    </div>
                </div>

                <h4 className='productive-heading-03 main-section'>
                    {this.state.runtimeSettingsCollapsed === true &&
                        <a id={'runtime-section-toggle'} className='section-toggle' onClick={this.toggleRuntimeSettings}><ChevronDown16 /></a>
                    }
                    {this.state.runtimeSettingsCollapsed === false &&
                        <a id={'runtime-section-toggle'} className='section-toggle' onClick={this.toggleRuntimeSettings}><ChevronUp16 /></a>
                    }
                    {t('clg.page.create.jobdefinition.settings.heading')}
                </h4>
                {this.state.runtimeSettingsCollapsed === false &&
                    (
                        <div className='collapsable-section'>
                            <div className='bx--row'>
                                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                                    {t('clg.page.create.jobdefinition.settings.description')}
                                </div>
                            </div>

                            <div className='bx--row'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-jobdefinition-mem'
                                        nlsKey='clg.jobdefinition.limit.memory'
                                        onChange={this.handleJobDefMemChange}
                                        textField={this.state.memory}
                                    />
                                </div>
                            </div>

                            <div className='bx--row last-row-of-section'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-jobdefinition-cpu'
                                        nlsKey='clg.jobdefinition.limit.cpus'
                                        onChange={this.handleJobDefCpuChange}
                                        textField={this.state.cpus}
                                        validationRules={{ min: MIN_CPU, max: MAX_CPU }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                <h4 className='productive-heading-03'>
                    {this.state.envVariablesCollapsed === true &&
                        <a id={'environment-section-toggle'} className='section-toggle' onClick={this.toggleEnvVariables}><ChevronDown16 /></a>
                    }
                    {this.state.envVariablesCollapsed === false &&
                        <a id={'environment-section-toggle'} className='section-toggle' onClick={this.toggleEnvVariables}><ChevronUp16 /></a>
                    }{t('clg.page.create.app.variables.heading')}
                </h4>
                {this.state.envVariablesCollapsed === false &&
                    (
                        <div className='collapsable-section'>
                        <ClgEnvironmentVariablesTable
                            allowInputDerivation={!this.state.envVariablesChanged}
                            envVariables={[]}
                            handleChange={this.handleEnvVariablesChange}
                            projectId={this.props.selectedProject && this.props.selectedProject.id}
                            regionId={this.props.selectedProject && this.props.selectedProject.region}
                        />
                        </div>
                    )}
            </React.Fragment>
        );
    }

    private toggleEnvVariables(): void {
        this.setState({ envVariablesCollapsed: !this.state.envVariablesCollapsed, ownUpdate: true });
    }

    private toggleRuntimeSettings(): void {
        this.setState({ runtimeSettingsCollapsed: !this.state.runtimeSettingsCollapsed, ownUpdate: true });
    }

    private closeNotification() {
        this.setState({ error: undefined, ownUpdate: true });
    }

    private checkInputFieldValidity() {
        let hasInvalidFields = false;
        let hasEmptyFields = false;  // empty (but required AND NOT invalid) fields are considered to be fields that were intentionally left blank at the beginning!

        if (this.state.image.invalid ||
            this.state.jobDefName.invalid ||
            this.state.memory.invalid ||
            this.state.cpus.invalid ||
            this.state.envVariables.invalid) {

            hasInvalidFields = true;
        }

        if (!this.state.image.val ||
            !this.state.jobDefName.val) {
            hasEmptyFields = true;
        }

        if (hasInvalidFields ||
            hasEmptyFields) {
            this.setIsCreateDisabled();
        } else {
            this.unsetIsCreateDisabled();
        }

        return hasInvalidFields;
    }

    private setIsCreateDisabled() {
        if (this.props.onCreateDisabledChanged) {
            this.props.onCreateDisabledChanged(IComponentTypes.JOBDEF, true);
        }

        this.setState({
            isCreateDisabled: true,
            ownUpdate: true,
        });
    }

    private setIsCreating() {
        if (this.props.onIsCreatingChanged) {
            this.props.onIsCreatingChanged(IComponentTypes.JOBDEF, true);
        }

        this.setState({
            isCreating: true,
            ownUpdate: true,
        });
    }

    private unsetIsCreateDisabled() {
        if (this.props.onCreateDisabledChanged) {
            this.props.onCreateDisabledChanged(IComponentTypes.JOBDEF, false);
        }

        this.setState({
            isCreateDisabled: false,
            ownUpdate: true,
        });
    }

    private unsetIsCreating() {
        if (this.props.onIsCreatingChanged) {
            this.props.onIsCreatingChanged(IComponentTypes.JOBDEF, false);
        }

        this.setState({
            isCreating: false,
            ownUpdate: true,
        });
    }

    private handleCancel() {
        logger.debug('handleCancel');
        this.props.history.goBack();
    }

    private handleCommandChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState({
                command: val,
                ownUpdate: true,
            });
        }
    }

    private handleArgumentsChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState({
                arguments: val,
                ownUpdate: true,
            });
        }
    }

    private handleJobDefNameChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState((oldState: IState) => {
                oldState.jobDefName.val = val;
                validateField(oldState.jobDefName);
                oldState.ownUpdate = true;

                return oldState;
            }, () => {
                this.checkInputFieldValidity();
                this.closeNotification();
            });
        }
    }

    private handleJobDefMemChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState((oldState: IState) => {
                oldState.memory.val = val;
                validateField(oldState.memory);
                oldState.ownUpdate = true;

                return oldState;
            }, () => {
                this.checkInputFieldValidity();
            });
        }
    }

    private handleJobDefCpuChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState((oldState: IState) => {
                oldState.cpus.val = val;
                validateField(oldState.cpus);
                oldState.ownUpdate = true;

                return oldState;
            }, () => {
                this.checkInputFieldValidity();
            });
        }
    }

    private handleEnvVariablesChange(envVariables: IClgKeyValueFields): void {
        if (envVariables) {
            this.setState((oldState) => {
                return {
                    envVariables,
                    envVariablesChanged: true,
                    ownUpdate: true,
                };
            }, () => {
                this.checkInputFieldValidity();
            });
        }
    }

    private convertEnvVariables(envVariables: IClgKeyValueFields): IUIEnvItems {
        const envVars: IUIEnvItems = [];
        if (envVariables && envVariables.val && Array.isArray(envVariables.val) && envVariables.val.length > 0) {
            for (const keyValuePair of envVariables.val) {
                envVars.push(keyValueToUIEnvItem(keyValuePair));
            }
        }
        return envVars;
    }

    private createNewJobDefinition() {
        const fn = 'createNewJobDefinition ';
        logger.debug(`${fn}>`);

        this.setIsCreating();

        // build the application that shall be created
        const jobDefToCreate: jobModel.IUIJobDefinition = {
            id: this.state.jobDefName.val,
            kind: UIEntityKinds.JOBDEFINITION,
            name: this.state.jobDefName.val,

            spec: {
                args: this.state.arguments ? this.state.arguments.split('\n') : [],
                command: this.state.command ? this.state.command.split('\n') : [],
                containerName: `${this.state.jobDefName.val}-${randomStr(8)}`,
                cpus: this.state.cpus.val,
                env: this.convertEnvVariables(this.state.envVariables),
                image: this.state.image.val,
                imagePullSecret: clgContainerRegistryName.isDummRegistry(this.state.selectedRegistry) ? undefined : this.state.selectedRegistry.name,
                memory: memUtils.convertValueToBytes(this.state.memory.val + 'mib'),  // display unit is always MiB
            },
        };

        // create the application using a thin client-side API layer
        jobApi.createJobDefinition(this.props.selectedProject.region,
            this.props.selectedProject.id,
            jobDefToCreate)
            .then((result: jobModel.IUIJobDefinition) => {
                logger.debug(`${fn}result: '${jobModel.stringify(result)}'`);

                // hide the loading animation
                this.unsetIsCreating();

                // show a toast notification
                const successNotification: viewCommonModel.IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.create.jobdefinition.success.subtitle', { name: result.name }),
                    title: t('clg.page.create.jobdefinition.success.title'),
                };
                toastNotification.add(successNotification);

                // navigate to newly create JobDefinition details page
                this.props.history.push(nav.toJobDefinitionDetail(this.props.selectedProject.region, this.props.selectedProject.id, result.id));
            }).catch((requestError: UIRequestError) => {
                logger.warn(`${fn}- An error occurred during job definition creation: '${JSON.stringify(requestError)}'`);

                if (requestError.error && requestError.error.name === 'FailedToCreateJobDefBecauseAlreadyExistsError') {
                    // invalidate the appName
                    const jobDefName = this.state.jobDefName;
                    jobDefName.invalid = 'EXISTS';

                    const jobDefExistsNotification: viewCommonModel.IClgInlineNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.create.jobdefinition.error.jobDefExists.desc', { name: this.state.jobDefName.val, project: this.props.selectedProject.name }),
                        title: t('clg.page.create.jobdefinition.error.jobDefExists.title'),
                    };
                    this.setState({ error: jobDefExistsNotification, jobDefName, isCreateDisabled: true, ownUpdate: true });
                } else {
                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModel.IClgInlineNotification = {
                        // clgId: requestError.clgId,
                        kind: 'error',
                        title: t('clg.page.create.jobdefinition.error.creationFailed.title'),
                    };
                    this.setState({ error: errorNotification, ownUpdate: true });
                }

                // scroll to the top of the page
                window.scrollTo(0, 0);

                this.unsetIsCreating();
            });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateJobSubpage.propTypes = {
    history: PropTypes.shape({
        goBack: PropTypes.func,
        push: PropTypes.func,
    }),
};

export { CreateJobSubpage };

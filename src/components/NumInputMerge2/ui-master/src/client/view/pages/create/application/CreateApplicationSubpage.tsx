// react
// carbon + pal
import { ChevronDown16, ChevronUp16, } from '@carbon/icons-react';
import { InlineNotification, NotificationActionButton, TextInput, } from '@console/pal/carbon-components-react';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
// 3rd-party
import * as log from 'loglevel';
import PropTypes from 'prop-types';
import React from 'react';
// coligo
import * as appModel from '../../../../../common/model/application-model';
import {
    IUIEnvItems,
    IUIRequestResult,
    UIEntityKinds,
    UIRequestError
} from '../../../../../common/model/common-model';
import * as configModel from '../../../../../common/model/config-model';
import * as projectModel from '../../../../../common/model/project-model';
import * as memoryUtils from '../../../../../common/utils/memory-utils';
import * as coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../../common/validator/common-validator';
import { FloatValidator } from '../../../../../common/validator/float-validator';
import { MemoryValidator } from '../../../../../common/validator/memory-validator';
import { NumberValidator } from '../../../../../common/validator/number-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as applicationApi from '../../../../api/application-api';
import t from '../../../../utils/i18n';
import clgContainerRegistryName from '../../../../utils/formatter/clgContainerRegistryName';
import nav from '../../../../utils/nav';
import toastNotification from '../../../../utils/toastNotification';
import { IComponentTypes } from '../../../common/types';
import ClgContainerImage from '../../../components/ClgContainerImage/ClgContainerImage';
import ClgTextInput from '../../../components/ClgTextInput/ClgTextInput';
import * as viewCommonModel from '../../../model/common-view-model';
import { keyValueToUIEnvItem } from '../../../../../common/utils/environment-utils';
import ClgEnvironmentVariablesTable from '../../../components/ClgEnvironmentVariablesTable/ClgEnvironmentVariablesTable';

interface IProps {
    history: any;
    onCreateDisabledChanged: (compType, newValue) => void;
    onGetCreateFunction: (createFn) => void;
    onGetSelectFunction: (appFn) => void;
    onIsCreatingChanged: (compType, isCreating) => void;
    selectedProject: projectModel.IUIProject;
}

interface IState {
    error?: viewCommonModel.IClgInlineNotification;
    image: commonValidator.IClgTextField;
    imagePullSecret: configModel.IUIRegistrySecret;
    applicationName: commonValidator.IClgTextField;
    envVariables: commonValidator.IClgKeyValueFields;
    envVariablesChanged?: boolean;
    envVariablesCollapsed: boolean;
    failedToListProjects: string;
    isCreateDisabled: boolean;
    isCreating: boolean;
    isLoading: boolean;
    isLoadingProjects: boolean;
    memory: commonValidator.IClgNumberField;
    cpus: commonValidator.IClgNumberField;
    selectedProject?: projectModel.IUIProject;
    timeoutSeconds: commonValidator.IClgNumberField;
    containerConcurrency: commonValidator.IClgNumberField;
    ownUpdate: boolean;
    minScale: commonValidator.IClgNumberField;
    maxScale: commonValidator.IClgNumberField;
    runtimeSettingsCollapsed: boolean;
}

interface IStateUpdate {
    selectedProject?: projectModel.IUIProject;
    ownUpdate: boolean;
}

// setup the logger
const COMPONENT = 'CreateApplicationSubpage';
const logger = log.getLogger(COMPONENT);

class CreateApplicationSubpage extends React.Component<IProps, IState> {
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

    private readonly REQUESTS_PARALLEL_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.containerConcurrency;
    private readonly CPU_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.cpu;
    private readonly MAX_SCALE_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.maxScale;
    private readonly MEMORY_UNIT: string = 'mi';
    private readonly MEMORY_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.memory;
    private readonly MIN_SCALE_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.minScale;
    private readonly NAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.application.name;
    private readonly TIMEOUT_RULES: commonValidator.IClgNumberFieldRules = coligoValidatorConfig.default.application.timeout;

    private readonly floatValidator: commonValidator.IClgFieldValidator = new FloatValidator();
    private readonly memoryValidator: commonValidator.IClgFieldValidator = new MemoryValidator();
    private readonly numberValidator: commonValidator.IClgFieldValidator = new NumberValidator();
    private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

    constructor(props) {
        super(props);

        // calculate the default values
        const defaultMemory = memoryUtils.convertBytesToUnit(this.MEMORY_RULES.default, this.MEMORY_UNIT);
        logger.debug('constructor');

        this.state = {
            applicationName: {
                val: '',
            },
            containerConcurrency: {
                val: this.REQUESTS_PARALLEL_RULES.default,
            },
            cpus: {
                val: this.CPU_RULES.default,
            },
            envVariables: {
                val: [],
            },
            envVariablesChanged: false,
            envVariablesCollapsed: true,
            failedToListProjects: null,
            image: {
                val: '',
            },
            imagePullSecret: undefined,
            isCreateDisabled: true,
            isCreating: false,
            isLoading: true,
            isLoadingProjects: true,
            ownUpdate: false,
            maxScale: {
                val: this.MAX_SCALE_RULES.default,
            },
            memory: {
                val: defaultMemory,
            },
            minScale: {
                val: this.MIN_SCALE_RULES.default,
            },
            runtimeSettingsCollapsed: true,
            timeoutSeconds: {
                val: this.TIMEOUT_RULES.default,
            },
        };

        this.changeState = this.changeState.bind(this);
        this.closeNotification = this.closeNotification.bind(this);
        this.createNewApplication = this.createNewApplication.bind(this);
        this.handleApplicationNameChange = this.handleApplicationNameChange.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleEnvVariablesChange = this.handleEnvVariablesChange.bind(this);
        this.handleImageChange = this.handleImageChange.bind(this);
        this.handleInstanceMemChange = this.handleInstanceMemChange.bind(this);
        this.handleInstanceCpuChange = this.handleInstanceCpuChange.bind(this);
        this.handleRequestTimeoutChange = this.handleRequestTimeoutChange.bind(this);
        this.handleRequestsParallelChange = this.handleRequestsParallelChange.bind(this);
        this.handleScalingMinChange = this.handleScalingMinChange.bind(this);
        this.handleScalingMaxChange = this.handleScalingMaxChange.bind(this);
        this.initialize = this.initialize.bind(this);
        this.shouldDisableCreate = this.shouldDisableCreate.bind(this);
        this.toggleEnvVariables = this.toggleEnvVariables.bind(this);
        this.toggleRuntimeSettings = this.toggleRuntimeSettings.bind(this);

        if (props.onGetSelectFunction) {
            props.onGetSelectFunction(this.initialize);
        }
    }

    public changeState(newState) {
        logger.debug('changeState >');
        if (this.props.onIsCreatingChanged &&
            newState &&
            (typeof newState.isCreating === 'boolean')) {
            this.props.onIsCreatingChanged(IComponentTypes.APP, newState.isCreating);
        }

        if (this.props.onCreateDisabledChanged &&
            newState &&
            (typeof newState.isCreateDisabled === 'boolean')) {
            this.props.onCreateDisabledChanged(IComponentTypes.APP, newState.isCreateDisabled);
        }

        if (this.props.onGetCreateFunction) {
            this.props.onGetCreateFunction(this.createNewApplication);
        }

        newState.ownUpdate = true;

        this.setState(() => {
            return newState;
        });
        logger.debug('changeState <');
    }

    public componentDidMount() {
        logger.debug('componentDidMount >');

        // we need to set the state right after initializing the form, to reset the state in case the user switched between app and job
        this.changeState({
            isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                this.state.image,
                this.state.imagePullSecret,
                this.state.memory,
                this.state.cpus,
                this.state.timeoutSeconds,
                this.state.containerConcurrency,
                this.state.minScale,
                this.state.maxScale,
                this.state.envVariables),
            isLoading: false,
        });

        window.scrollTo(0, 0);

        this.mounted = true;

        logger.debug('componentDidMount <');
    }

    /**
     * Re-initialize state, when this subpage becomes active again (like checking status of Create Button, etc)
     */
    public initialize() {
        if (this.mounted) {
            this.changeState({
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
                isLoading: false,
            });
        }
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
                            id={'create-application-name'}
                            labelText={t('clg.common.label.name')}
                            placeholder={t('clg.page.create.app.name.placeholder')}
                            type={'text'}
                            invalid={typeof this.state.applicationName.invalid !== 'undefined'}
                            invalidText={t('clg.application.name.invalid.' + this.state.applicationName.invalid, this.NAME_RULES)}
                            onChange={this.handleApplicationNameChange}
                            tabIndex={0}
                        />
                    </div>
                </div>
                <h4 className='productive-heading-03 main-section'>{t('clg.page.create.app.code.heading')}</h4>
                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                        {t('clg.page.create.app.code.description')}
                    </div>
                </div>
                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <ClgContainerImage
                            hasHelperText={true}
                            idPrefix='create-application'
                            image={this.state.image}
                            registryName={this.state.imagePullSecret && this.state.imagePullSecret.name}
                            nlsKeyPrefix='clg.application'
                            onChange={this.handleImageChange}
                            project={this.state.selectedProject}
                            allowToUsePublicRegistry={true}
                        />
                    </div>
                </div>

                <h4 className='productive-heading-03 main-section'>
                    {this.state.runtimeSettingsCollapsed === true &&
                        <a id={'runtime-section-toggle'} className='section-toggle' onClick={this.toggleRuntimeSettings}><ChevronDown16 /></a>
                    }
                    {this.state.runtimeSettingsCollapsed === false &&
                        <a id={'runtime-section-toggle'} className='section-toggle' onClick={this.toggleRuntimeSettings}><ChevronUp16 /></a>
                    }{t('clg.page.create.app.settings.heading')}
                </h4>
                {this.state.runtimeSettingsCollapsed === false &&
                    (
                        <div className='collapsable-section'>
                            <div className='bx--row'>
                                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 section-subtitle'>
                                    {t('clg.page.create.app.settings.description')}
                                </div>
                            </div>
                            <h6 className='productive-heading-02 subsection-heading'>{t('clg.page.create.app.settings.instance')}</h6>
                            <div className='bx--row'>
                                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                                    {t('clg.page.create.app.settings.instance.description')}
                                </div>
                            </div>
                            <div className='bx--row'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-application-instance-mem'
                                        nlsKey='clg.application.limit.memory'
                                        onChange={this.handleInstanceMemChange}
                                        textField={this.state.memory}
                                        validationRules={this.MEMORY_RULES}
                                    />
                                </div>
                            </div>
                            <div className='bx--row last-row-of-section'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        hasTooltipFooter={true}
                                        inputId='create-application-instance-cpu'
                                        nlsKey='clg.application.limit.cpus'
                                        onChange={this.handleInstanceCpuChange}
                                        textField={this.state.cpus}
                                        validationRules={this.CPU_RULES}
                                    />
                                </div>
                            </div>

                            <h6 className='productive-heading-02 subsection-heading'>{t('clg.page.create.app.settings.requests')}</h6>
                            <div className='bx--row'>
                                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                                    {t('clg.page.create.app.settings.requests.description')}
                                </div>
                            </div>
                            <div className='bx--row'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-application-requests-timeout'
                                        nlsKey='clg.application.limit.timeoutSeconds'
                                        onChange={this.handleRequestTimeoutChange}
                                        textField={this.state.timeoutSeconds}
                                        validationRules={this.TIMEOUT_RULES}
                                    />
                                </div>
                            </div>
                            <div className='bx--row last-row-of-section'>
                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-application-container-concurrency'
                                        nlsKey='clg.application.limit.containerConcurrency'
                                        onChange={this.handleRequestsParallelChange}
                                        textField={this.state.containerConcurrency}
                                        validationRules={this.REQUESTS_PARALLEL_RULES}
                                    />
                                </div>
                            </div>

                            <h6 className='productive-heading-02 subsection-heading'>{t('clg.page.create.app.settings.scaling')}</h6>
                            <div className='bx--row'>
                                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                                    {t('clg.page.create.app.settings.scaling.description')}
                                </div>
                            </div>
                            <div className='bx--row last-row-of-section'>
                                <div className='bx--col-lg-4 bx--col-md-4 bx--col-sm-4 first-of-group'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-application-scaling-min'
                                        nlsKey='clg.application.limit.minScale'
                                        onChange={this.handleScalingMinChange}
                                        textField={this.state.minScale}
                                        validationRules={this.MIN_SCALE_RULES}
                                    />
                                </div>
                                <div className='bx--col-lg-4 bx--col-md-4 bx--col-sm-4'>
                                    <ClgTextInput
                                        hasTooltip={true}
                                        inputId='create-application-scaling-max'
                                        nlsKey='clg.application.limit.maxScale'
                                        onChange={this.handleScalingMaxChange}
                                        textField={this.state.maxScale}
                                        validationRules={this.MAX_SCALE_RULES}
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
        this.changeState({ error: undefined });
    }

    private shouldDisableCreate(
        name: commonValidator.IClgField,
        image: commonValidator.IClgField,
        imagePullSecret: configModel.IUIRegistrySecret,
        memory: commonValidator.IClgField,
        cpus: commonValidator.IClgField,
        timeout: commonValidator.IClgField,
        containerConcurrency: commonValidator.IClgField,
        minScale: commonValidator.IClgField,
        maxScale: commonValidator.IClgField,
        envVariables: commonValidator.IClgKeyValueFields): boolean {
        const fn = 'shouldDisableCreate ';
        logger.debug(`${fn}>`);

        // check if all mandatory fields are set are set
        const allFieldsSet = name.val && name.val !== '' && image.val && image.val !== '' && this.props.selectedProject;

        // check if all fields were validated
        if (allFieldsSet &&
            !name.invalid &&
            !image.invalid &&
            !memory.invalid &&
            !cpus.invalid &&
            !timeout.invalid &&
            !containerConcurrency.invalid &&
            !minScale.invalid &&
            !maxScale.invalid &&
            !envVariables.invalid) {
            logger.debug(`${fn}< false`);
            return false;
        }

        // disable the create button
        logger.debug(`${fn}< true`);
        return true;
    }

    private handleCancel(): void {
        logger.debug('handleCancel');
        this.props.history.goBack();
    }

    private handleApplicationNameChange(event): void {
        if (event.target) {
            const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.NAME_RULES);
            this.changeState({
                applicationName: field,
                error: undefined,
                isCreateDisabled: this.shouldDisableCreate(field,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
            });
        }
    }

    private handleImageChange(event): void {
        if (event) {

            this.changeState({
                image: event.image,
                imagePullSecret: event.registry,
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    event.image,
                    event.registry,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
            });
        }
    }

    private handleInstanceMemChange(event): void {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.memoryValidator, this.MEMORY_RULES);
            this.changeState({
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    field,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
                memory: field,
            });
        }
    }

    private handleInstanceCpuChange(event): void {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.floatValidator, this.CPU_RULES);
            this.changeState({
                cpus: field,
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    field,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
            });
        }
    }

    private handleRequestTimeoutChange(event): void {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.TIMEOUT_RULES);
            this.changeState({
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    field,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
                timeoutSeconds: field,
            });
        }
    }

    private handleRequestsParallelChange(event): void {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.REQUESTS_PARALLEL_RULES);
            this.changeState({
                containerConcurrency: field,
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    field,
                    this.state.minScale,
                    this.state.maxScale,
                    this.state.envVariables),
            });
        }
    }

    private handleScalingMinChange(event) {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.MIN_SCALE_RULES);
            this.changeState({
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    field,
                    this.state.maxScale,
                    this.state.envVariables),
                minScale: field,
            });
        }
    }

    private handleScalingMaxChange(event) {
        if (event.target) {
            const field: commonValidator.IClgNumberField = commonValidator.getValidatedNumberField(event.target.value, this.numberValidator, this.MAX_SCALE_RULES);
            this.changeState({
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    field,
                    this.state.envVariables),
                maxScale: field,
            });
        }
    }

    private handleEnvVariablesChange(envVariables: commonValidator.IClgKeyValueFields): void {
        if (envVariables) {
            this.changeState({
                envVariablesChanged: true,
                envVariables,
                isCreateDisabled: this.shouldDisableCreate(this.state.applicationName,
                    this.state.image,
                    this.state.imagePullSecret,
                    this.state.memory,
                    this.state.cpus,
                    this.state.timeoutSeconds,
                    this.state.containerConcurrency,
                    this.state.minScale,
                    this.state.maxScale,
                    envVariables),
            });
        }
    }

    private convertEnvVariables(envVariables: commonValidator.IClgKeyValueFields): IUIEnvItems {
        const envVars: IUIEnvItems = [];
        if (envVariables && envVariables.val && Array.isArray(envVariables.val) && envVariables.val.length > 0) {
            for (const keyValuePair of envVariables.val) {
                envVars.push(keyValueToUIEnvItem(keyValuePair));
            }
        }
        return envVars;
    }

    private createNewApplication() {
        const fn = 'createNewApplication ';
        logger.debug(`${fn}>`);

        this.changeState({ isCreating: true });

        // build the application that shall be created
        const appToCreate: appModel.IUIApplication = {
            id: undefined,
            kind: UIEntityKinds.APPLICATION,
            name: this.state.applicationName.val,
            regionId: undefined,
            template: {
                containerConcurrency: this.state.containerConcurrency.val,
                cpus: this.state.cpus.val,
                image: this.state.image.val,
                imagePullSecret: clgContainerRegistryName.isDummRegistry(this.state.imagePullSecret) ? undefined : this.state.imagePullSecret.name,
                maxScale: this.state.maxScale.val,
                memory: memoryUtils.convertValueToBytes(`${this.state.memory.val}Mi`),
                minScale: this.state.minScale.val,
                parameters: this.convertEnvVariables(this.state.envVariables),
                timeoutSeconds: this.state.timeoutSeconds.val,
            }
        };

        // create the application using a thin client-side API layer
        applicationApi.createNewApplication(appToCreate, this.props.selectedProject).then((requestResult: IUIRequestResult) => {
            // hide the loading animation
            this.changeState({ isCreating: false, });

            // extract the created application from the response result
            const createdApp: appModel.IUIApplication = requestResult.payload;
            logger.debug(`${fn}- createdApp: '${appModel.stringify(createdApp)}'`);

            // show a toast notification
            const successNotification: viewCommonModel.IClgToastNotification = {
                kind: 'success',
                subtitle: t('clg.page.create.app.success.subtitle', { name: createdApp.name }),
                title: t('clg.page.create.app.success.title'),
            };
            toastNotification.add(successNotification);

            // navigate to newly created application
            this.props.history.push(nav.toApplicationDetail(createdApp.regionId, this.props.selectedProject.id, createdApp.name));
        }).catch((requestError: UIRequestError) => {
            logger.warn(`${fn}- An error occurred during application creation: '${JSON.stringify(requestError)}'`);

            if (requestError.error && requestError.error.name === 'FailedToCreateApplicationBecauseAlreadyExistsError') {
                // invalidate the appName
                const applicationName = this.state.applicationName;
                applicationName.invalid = 'EXISTS';

                const appExistsNotification: viewCommonModel.IClgInlineNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.create.app.error.appExists.desc', { name: this.state.applicationName.val, project: this.props.selectedProject.name }),
                    title: t('clg.page.create.app.error.appExists.title'),
                };
                this.changeState({ applicationName, isCreating: false, isCreateDisabled: true, error: appExistsNotification, });
            } else if (requestError.error && requestError.error.name === 'FailedToCreateApplicationBecauseBadRequestError') {
                const badInputNotification: viewCommonModel.IClgInlineNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.create.app.error.badInput.desc'),
                    title: t('clg.page.create.app.error.badInput.title'),
                };
                this.changeState({ isCreating: false, error: badInputNotification, });
            } else {
                // in case the response could not be mapped to a specific creation error, we should use a generic one
                const errorNotification: viewCommonModel.IClgInlineNotification = {
                    // clgId: requestError.clgId,
                    kind: 'error',
                    title: t('clg.page.create.app.error.creationFailed.title'),
                };
                this.changeState({ isCreating: false, error: errorNotification });
            }
        });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateApplicationSubpage.propTypes = {
    history: PropTypes.shape({
        goBack: PropTypes.func,
        push: PropTypes.func,
    }),
    onCreateDisabledChanged: PropTypes.func.isRequired,
    onGetCreateFunction: PropTypes.func.isRequired,
    onIsCreatingChanged: PropTypes.func.isRequired,
    selectedProject: PropTypes.object,
};
export { CreateApplicationSubpage };

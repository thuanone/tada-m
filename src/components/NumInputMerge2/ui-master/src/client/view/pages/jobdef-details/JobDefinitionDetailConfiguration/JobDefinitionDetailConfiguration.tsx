// react
// carbon + pal
import { Close16, Save16 } from '@carbon/icons-react';
import { Button, InlineLoading, InlineNotification, Tab, Tabs } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader } from '@console/pal/Components';
// 3rd-party
import { cloneDeep } from 'lodash';
import * as log from 'loglevel';
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';
// coligo
import * as commonModel from '../../../../../common/model/common-model';
import * as projectModel from '../../../../../common/model/project-model';
import { IUIJobDefinition } from '../../../../../common/model/job-model';
import * as memUtils from '../../../../../common/utils/memory-utils';
import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import {
    getValidatedNumberField,
    getValidatedTextField,
} from '../../../../../common/validator/common-validator';
import { MemoryValidator } from '../../../../../common/validator/memory-validator';
import { NumberValidator } from '../../../../../common/validator/number-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as jobApi from '../../../../api/job-api';
import t from '../../../../utils/i18n';
import clgContainerRegistryName from '../../../../utils/formatter/clgContainerRegistryName';
import toastNotification from '../../../../utils/toastNotification';
import ClgJobRunDetailsTable from '../../../components/ClgJobRunDetailsTable/ClgJobRunDetailsTable';
import { IClgInlineNotification, IClgToastNotification, IKeyValue } from '../../../model/common-view-model';
import {
    IUIEditJobDefinition,
    IViewJobDefinitionCode,
    IViewJobDefinitionEnvironment,
    IViewJobDefinitionRuntime
} from '../../../model/job-view-model';
import JobDefinitionDetailTabCode from '../JobDefinitionDetailTabCode/JobDefinitionDetailTabCode';
import JobDefinitionDetailTabEnvironment from '../JobDefinitionDetailTabEnvironment/JobDefinitionDetailTabEnvironment';
import JobDefinitionDetailTabRuntime from '../JobDefinitionDetailTabRuntime/JobDefinitionDetailTabRuntime';
import JobRunDetailsRerunPanel from '../../jobrun-details/JobRunDetiailsRerunPanel/JobRunDetailsRerunPanel';

import { keyValueToUIEnvItem, uiEnvItemToKeyValue } from '../../../../../common/utils/environment-utils';

interface IInvocation {
    success?: boolean;
    resolved: boolean;
    responseBody?: string;
    durationInMillis?: number;
    endDate?: string;
    endTime?: number;
    collapsed: boolean;
    id: number;
    title: string;
}

interface IProps {
    history: any;
    jobDefinition: IUIJobDefinition;
    onGetJobRunInfo?: (jobInfo) => void;
    onResetJobDefinition: () => void;
    onUpdateJobDefinition: (updatedJobDef: IUIJobDefinition) => void;
    project?: projectModel.IUIProject;
}

interface IState {
    activeTab: number;
    error: IClgInlineNotification;
    hasInvalidData: boolean;
    invocations: IInvocation[];
    isInvokingJobRun: boolean;
    isSaving: boolean;
    unsavedChanges: {
        [key: string]: boolean
    };
    jobDefinitionModifications?: IUIEditJobDefinition;
    codeTabInput?: IViewJobDefinitionCode;
    envTabInput?: IViewJobDefinitionEnvironment;
    runtimeTabInput?: IViewJobDefinitionRuntime;
    openSidePanel: boolean;
}

const GlobalTextValidator = new TextValidator();
const GlobalMemoryValidator = new MemoryValidator();
const GlobalNumberValidator = new NumberValidator();

class JobDefinitionDetailConfiguration extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        if (!state.jobDefinitionModifications) {
            const envFields = ([] as IKeyValue[]);

            if (props.jobDefinition.spec && props.jobDefinition.spec.env) {
                for (const envVar of props.jobDefinition.spec.env) {
                    envFields.push(uiEnvItemToKeyValue(envVar));
                }
            }

            return {
                codeTabInput: {
                    args: {
                        val: props.jobDefinition.spec && props.jobDefinition.spec.args && props.jobDefinition.spec.args.join('\n'),
                    },
                    command: {
                        val: props.jobDefinition.spec && props.jobDefinition.spec.command && props.jobDefinition.spec.command.join('\n'),
                    },
                    image: getValidatedTextField(props.jobDefinition.spec.image, GlobalTextValidator, coligoValidatorConfig.job.image, true),
                    imagePullSecret: props.jobDefinition.spec.imagePullSecret && {name : props.jobDefinition.spec.imagePullSecret},
                },
                envTabInput: {
                    env: envFields,
                },
                project: props.project,
                runtimeTabInput: {
                    cpus: getValidatedNumberField(props.jobDefinition.spec.cpus, GlobalNumberValidator, coligoValidatorConfig.job.cpu, true),
                    memory: getValidatedNumberField(memUtils.convertBytesToDisplayValue(props.jobDefinition.spec.memory, 'mib'), GlobalMemoryValidator, coligoValidatorConfig.job.memory, true),
                },
                unsavedChanges: {},
            };
        } else {
            return null;
        }
    }

    private readonly regionId: string;
    private readonly projectId: string;
    private readonly jobDefinitionId: string;

    private readonly COMPONENT = 'JobDefinitionDetailConfiguration';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private cacheUpdateFn;

    constructor(props) {
        super(props);

        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;
        this.jobDefinitionId = props.match.params.jobDefinitionId;

        this.state = {
            activeTab: 0,
            error: undefined,
            hasInvalidData: false,
            invocations: [],
            isInvokingJobRun: false,
            isSaving: false,
            openSidePanel: false,
            unsavedChanges: {},
        };

        // binding all callback functions to this, in order to enable setState and this.state
        this.closeNotification = this.closeNotification.bind(this);
        this.dismissUnsavedChanges = this.dismissUnsavedChanges.bind(this);
        this.handleUserUpdates = this.handleUserUpdates.bind(this);
        this.itemLabelToString = this.itemLabelToString.bind(this);
        this.getUnsavedChangesConditionalMarkup = this.getUnsavedChangesConditionalMarkup.bind(this);
        this.hasAnyUnsavedChanges = this.hasAnyUnsavedChanges.bind(this);
        this.onSelectTab = this.onSelectTab.bind(this);
        this.saveUpdatedJobDefinition = this.saveUpdatedJobDefinition.bind(this);
        this.updateValuesFromCodeTab = this.updateValuesFromCodeTab.bind(this);
        this.updateValuesFromEnvironmentTab = this.updateValuesFromEnvironmentTab.bind(this);
        this.updateValuesFromRuntimeTab = this.updateValuesFromRuntimeTab.bind(this);
        this.buildJobDefinitionForSaving = this.buildJobDefinitionForSaving.bind(this);
        this.hasValidJobDefinitionModifications = this.hasValidJobDefinitionModifications.bind(this);
        this.onError = this.onError.bind(this);
        this.getCacheUpdateFn = this.getCacheUpdateFn.bind(this);
    }

    public render() {
        this.logger.debug(`render > hasUnsavedChanges? ${this.hasAnyUnsavedChanges()}`);

        const isInEditMode = this.hasAnyUnsavedChanges();
        return (
            <div className='clg-jobdef-detail-page--configuration'>
                <div>
                    <div className='bx--row'>
                        <div className='bx--col-xlg-8 bx--col-lg-8 bx--col-md-8 bx--col-sm-4 clg-card-container'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    small={true}
                                    title={t('clg.nav.job.configuration')}
                                >
                                    {/* the invoke button should be shown in case there are no pending updates */}
                                    {!isInEditMode &&
                                        (
                                            <React.Fragment>
                                                &nbsp;
                                            </React.Fragment>
                                        )}

                                    {isInEditMode &&
                                        (
                                            <React.Fragment>
                                                <div className='actions-btns'>
                                                    <Button id={'cancel-changes-btn'} className='clg-edit-cancel-btn' kind='secondary' disabled={this.state.isSaving} size='small' renderIcon={Close16} onClick={this.dismissUnsavedChanges}>{t('clg.common.label.cancel')}</Button>
                                                    {this.state.isSaving ?
                                                        (
                                                            <InlineLoading status='active' description={t('clg.page.jobs.loading.saveJobDefinition')} />
                                                        ) : (
                                                            <Button id={'save-changes-btn'} kind='primary' disabled={this.state.isSaving || !this.hasValidJobDefinitionModifications()} size='small' renderIcon={Save16} onClick={this.saveUpdatedJobDefinition}>{t('clg.common.label.save')}</Button>
                                                        )}
                                                </div>
                                            </React.Fragment>
                                        )}
                                </CardHeader>
                                <CardBody>
                                    {this.state.error &&
                                        (
                                            <InlineNotification
                                                kind={this.state.error.kind}
                                                lowContrast={true}
                                                title={this.state.error.title}
                                                subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                                                onCloseButtonClick={this.closeNotification}
                                            />
                                        )}
                                    <div className='section configuration-tabs'>
                                        <Tabs type='container' className={'source-application-tabs clg-full-width-tabnav '} tabContentClassName={'application-section--content'} onSelectionChange={this.onSelectTab} aria-label='configuration tabs'>
                                            <Tab
                                                aria-label={t('clg.page.jobs.tab.source')}
                                                id={'jobdefinition-tab-code'}
                                                tabIndex={0}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('code')}{t('clg.page.jobs.tab.source')}</span>)}
                                                className={'source-application-tab-content'}
                                            >
                                                <JobDefinitionDetailTabCode
                                                    allowInputDerivation={!this.state.jobDefinitionModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.codeTabInput}
                                                    project={this.props.project}
                                                />
                                            </Tab>
                                            <Tab
                                                aria-label={t('clg.page.jobs.tab.env')}
                                                id={'jobdefinition-tab-environment'}
                                                tabIndex={1}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('environment')}{t('clg.page.jobs.tab.env')}</span>)}
                                            >
                                                <JobDefinitionDetailTabEnvironment
                                                    allowInputDerivation={!this.state.jobDefinitionModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.envTabInput}
                                                    projectId={this.projectId}
                                                    regionId={this.regionId}
                                                />
                                            </Tab>
                                            <Tab
                                                aria-label={t('clg.page.jobs.tab.runtime')}
                                                id={'jobdefinition-tab-runtime'}
                                                tabIndex={2}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('runtime')}{t('clg.page.jobs.tab.runtime')}</span>)}
                                            >
                                                <JobDefinitionDetailTabRuntime
                                                    allowInputDerivation={!this.state.jobDefinitionModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.runtimeTabInput}
                                                />
                                            </Tab>
                                        </Tabs>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        <div className='bx--col-xlg-8 bx--col-lg-8 bx--col-md-8 bx--col-sm-4 clg-card-container jobrun-list-card'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    small={true}
                                    title={t('clg.page.jobs.section.invocations')}
                                >
                                    <div className='actions-btns'>
                                        {/* <Button kind='primary' disabled={isInEditMode} size='small' onClick={this.openSidePanelForInvokingJobRun} renderIcon={Add16} className={'invoke-application-btn'}>{t('clg.page.jobs.action.invoke')}</Button> */}
                                        <JobRunDetailsRerunPanel
                                           jobRun={{
                                               spec: {
                                                   cpus: this.props.jobDefinition.spec.cpus,
                                                   memory: this.props.jobDefinition.spec.memory,
                                                   image: this.props.jobDefinition.spec.image,
                                                   containerName: this.props.jobDefinition.spec.containerName,
                                               }
                                           }}
                                           disabled={isInEditMode}
                                           jobDefinitionName={this.props.jobDefinition.name}
                                           regionId={this.regionId}
                                           projectId={this.projectId}
                                           rerun={false}
                                        />
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className='section jobrun-list'>
                                        <div className='application-section--content no-pad-left'>
                                            <ClgJobRunDetailsTable
                                                getUpdateCacheFnRef={this.getCacheUpdateFn}
                                                history={this.props.history}
                                                jobDefinitionName={this.props.jobDefinition.name}
                                                regionId={this.regionId}
                                                projectId={this.projectId}
                                                errorHandler={this.onError}
                                                onGetJobRunInfo={this.props.onGetJobRunInfo}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private closeNotification() {
        this.setState({ error: undefined });
    }

    private onError(error) {
        this.logger.warn('ERROR received from JobRun Table component', error);
    }

    private getCacheUpdateFn(fn) {
        this.cacheUpdateFn = fn;
    }

    private onSelectTab(tabIndex: number) {
        this.logger.debug('onSelectTab - Active Tab: ' + tabIndex);
        this.setState({
            activeTab: tabIndex,
        });
    }

    private updateValuesFromCodeTab(jobDefMods: IUIEditJobDefinition, updatedValues: IViewJobDefinitionCode) {
        jobDefMods.args = updatedValues.args;
        jobDefMods.command = updatedValues.command;
        jobDefMods.image = updatedValues.image;
    }

    private updateValuesFromEnvironmentTab(jobDefMods: IUIEditJobDefinition, updatedValues: IViewJobDefinitionEnvironment) {
        jobDefMods.env = updatedValues.env;
    }

    private updateValuesFromRuntimeTab(jobDefMods: IUIEditJobDefinition, updatedValues: IViewJobDefinitionRuntime) {
        jobDefMods.cpus = updatedValues.cpus;
        jobDefMods.memory = updatedValues.memory;
    }

    private getUnsavedChangesConditionalMarkup(tab: string): React.ReactFragment {
        return (
            <React.Fragment>
                {this.state.unsavedChanges && this.state.unsavedChanges[tab] &&
                    <span className='unsaved-changes'>&nbsp;</span>
                }
            </React.Fragment>
        );
    }

    private hasAnyUnsavedChanges(): boolean {
        for (const [key, value] of Object.entries(this.state.unsavedChanges)) {
            if (value === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * This functions receives update events from child components.
     * In case a new update comes in, this component ensures that unsaved changes state (see tabs) is set.
     * Additionally, this function ensures that the overall page state is kept up-to-date.
     * @param {string} sourceType - the source where the update was received from (either: 'source', or 'limits')
     * @param {*} updatedValues - an map that contains all updates that were made. this object will be merged into the page state
     */
    private handleUserUpdates(sourceType, updatedValues) {
        const fn = 'handleUserUpdates ';
        this.logger.debug(`${fn}- ${sourceType} - updates: '${JSON.stringify(updatedValues)}'`);

        let jobDefMods = this.state.jobDefinitionModifications;

        if (!jobDefMods) {
            // create a new jobDefinitionModificationsObject
            jobDefMods = {
                args: this.state.codeTabInput.args,
                command: this.state.codeTabInput.command,
                cpus: this.state.runtimeTabInput.cpus,
                env: this.state.envTabInput.env,
                image: this.state.codeTabInput.image,
                imagePullSecret: this.state.codeTabInput.imagePullSecret,
                memory: this.state.runtimeTabInput.memory,
            };
        }

        if (updatedValues && sourceType === 'code') {
            this.updateValuesFromCodeTab(jobDefMods, updatedValues);
        }

        if (updatedValues && sourceType === 'environment') {
            this.updateValuesFromEnvironmentTab(jobDefMods, updatedValues);
        }

        if (updatedValues && sourceType === 'runtime') {
            this.updateValuesFromRuntimeTab(jobDefMods, updatedValues);
        }

        const unsavedChanges = this.state.unsavedChanges;
        unsavedChanges[sourceType] = true;

        this.setState({
            jobDefinitionModifications: jobDefMods,
            unsavedChanges,
        });
    }

    private dismissUnsavedChanges() {
        const fn = 'dismissUnsavedChanges ';
        this.logger.debug(`${fn}> `);

        this.setState({
            jobDefinitionModifications: undefined,
            unsavedChanges: {},
        }, () => {
            if (this.props.onResetJobDefinition) {
                this.props.onResetJobDefinition();
            }
        });

        this.logger.debug(`${fn}<`);
    }

    /**
     * Uses this.state.jobDefinitionModifications data to build an IUIJobDefinition object that can be
     * sent to updateJobDefinition() api call
     */
    private buildJobDefinitionForSaving(): IUIJobDefinition {
        const jobDefinitionForSaving: IUIJobDefinition = cloneDeep(this.props.jobDefinition);

        // now apply all modifications
        const jobDefMods = this.state.jobDefinitionModifications;

        if (jobDefMods) {
            jobDefinitionForSaving.spec.args = jobDefMods.args.val ? jobDefMods.args.val.split('\n') : [];
            jobDefinitionForSaving.spec.command = jobDefMods.command.val ? jobDefMods.command.val.split('\n') : [];
            jobDefinitionForSaving.spec.cpus = jobDefMods.cpus.val;

            jobDefinitionForSaving.spec.env = [];

            for (const param of jobDefMods.env) {
                // filter out those env params with empty key (only happens for at most one param)
                if (param.name.val) {
                    jobDefinitionForSaving.spec.env.push(keyValueToUIEnvItem(param));
                }
            }

            jobDefinitionForSaving.spec.image = jobDefMods.image.val;
            jobDefinitionForSaving.spec.imagePullSecret = clgContainerRegistryName.isDummRegistry(jobDefMods.imagePullSecret) ? undefined : jobDefMods.imagePullSecret.name;
            jobDefinitionForSaving.spec.memory = memUtils.convertValueToBytes(`${jobDefMods.memory.val}mib`);
        }

        return jobDefinitionForSaving;
    }

    /**
     * Returns true, if the current jobdefinition modifications are ok from a validation standpoint and can be
     * used to build a valid update API request.
     */
    private hasValidJobDefinitionModifications() {
        // walk through the whole modifications object and check for any defined 'invalid' fields
        let result = true;

        const jobDefMods = this.state.jobDefinitionModifications;

        if (jobDefMods) {
            if (jobDefMods.args.invalid) {
                result = false;
            }

            if (jobDefMods.command.invalid) {
                result = false;
            }

            if (jobDefMods.cpus.invalid) {
                result = false;
            }

            for (const param of jobDefMods.env) {
                if (param.name.invalid) {
                    result = false;
                    break;
                }

                if (param.value.invalid) {
                    result = false;
                    break;
                }
            }

            if (jobDefMods.image.invalid) {
                result = false;
            }

            if (jobDefMods.memory.invalid) {
                result = false;
            }
        } else {
            // if no jobDefMods are present, we should also not send an update request, as there are no updates available
            result = false;
        }

        return result;
    }

    private saveUpdatedJobDefinition() {
        const fn = 'saveUpdatedJobDefinition ';
        this.logger.debug(`${fn}>`);

        // show the loading animation
        this.setState({ isSaving: true });

        jobApi.updateJobDefinition(this.regionId, this.projectId, this.buildJobDefinitionForSaving())
            .then((updatedJobDef: IUIJobDefinition) => {

                // show a toast notification
                const successNotification: IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.jobs.success.updatingJobDefinition.subtitle', { name: updatedJobDef.name }),
                    title: t('clg.page.jobs.success.updatingJobDefinition.title'),
                };
                toastNotification.add(successNotification);

                this.setState({
                    isSaving: false,
                    jobDefinitionModifications: undefined,
                    unsavedChanges: {},
                }, () => {
                    if (this.props.onUpdateJobDefinition) {
                        this.props.onUpdateJobDefinition(updatedJobDef);
                    }
                });
                this.logger.debug(`${fn}< SUCCESS`);
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.logger.error(`${fn}- failed to save JobDefinition - error message: ${requestError.message}`, requestError);

                this.setState({ isSaving: false });

                // show a toast notification
                const errorNotification: IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.jobs.error.updatingJobDefinition.subtitle', { name: this.props.jobDefinition.name }),
                    title: t('clg.page.jobs.error.updatingJobDefinition.title'),
                };
                toastNotification.add(errorNotification);
                this.logger.debug(`${fn}< FAILED`);
            });
    }

    private itemLabelToString(item) {
        return item ? item.label : '';
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobDefinitionDetailConfiguration.propTypes = {
    env: PropTypes.array,
    jobDefinition: PropTypes.object.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            jobDefinitionId: PropTypes.string.isRequired,
            projectId: PropTypes.string.isRequired,
            regionId: PropTypes.string.isRequired,
        }),
    }),
    onResetJobDefinition: PropTypes.func,
    onUpdateJobDefinition: PropTypes.func,
    project: PropTypes.object,
    source: PropTypes.shape({
        image: PropTypes.string.isRequired,
    }),
};

export { JobDefinitionDetailConfiguration };
export default withRouter(JobDefinitionDetailConfiguration);

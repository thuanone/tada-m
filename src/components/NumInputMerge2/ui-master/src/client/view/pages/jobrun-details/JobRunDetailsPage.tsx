// react
import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// carbon + pal
import {
    CheckmarkFilled16,
    ErrorFilled16,
    InProgress16,
    Time16,
} from '@carbon/icons-react';
import { OverflowMenuItem, Tile } from '@console/pal/carbon-components-react';
import {
    Card,
    CardBody,
    CardHeader,
    Message,
    PageHeader,
    PageHeaderActionsPanel,
} from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { ObserveButton } from '@console/pal/Connected';
import { getLocale } from '@console/pal/Utilities';
import {
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    StructuredListWrapper
} from '../../common/carbon';

// 3rd-party
import * as log from 'loglevel';
import queryString from 'query-string';
import JSONPretty from 'react-json-pretty';

import * as commonModel from '../../../../common/model/common-model';
import { IUIJobRun, UIJobStatus } from '../../../../common/model/job-model';
import { IUIEditJobRun } from '../../model/job-view-model';
import { IUIProject, IUIProjectStatus } from '../../../../common/model/project-model';
import * as memUtils from '../../../../common/utils/memory-utils';

import flags from '../../../api/flags';
import * as jobDefinitionApi from '../../../api/job-api';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import * as dateUtils from '../../../utils/date';
import clgJobRunStatus from '../../../utils/formatter/clgJobRunStatus';
import t from '../../../utils/i18n';
import modal from '../../../utils/modal';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgExpandableSection from '../../components/ClgExpandableSection/ClgExpandableSection';
import ClgProjectExpirationWarnings from '../../components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';
import * as viewCommonModels from '../../model/common-view-model';
import { IClgInlineNotification } from '../../model/common-view-model';
import { IJobRunInfo } from '../../model/job-view-model';
import { IUIEnvItem } from '../../../../common/model/common-model';
import clgEnvName from '../../../utils/formatter/clgEnvName';
import clgEnvValue from '../../../utils/formatter/clgEnvValue';

import JobRunDetailsRerunPanel from './JobRunDetiailsRerunPanel/JobRunDetailsRerunPanel';

interface IProps {
    history: any[];
    location: {
        search: string
    };
    match: any;
}

interface IState {
    error?: IClgInlineNotification;
    isDebugEnabled?: boolean;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    isLoading: boolean;
    isLoadingJobRun: boolean;
    isLoadingProject: boolean;
    jobDefinitionName: string;
    jobRun: IUIJobRun;
    jobRunId: string;
    jobRunInfo: IJobRunInfo;
    openSidePanel: boolean;
    project?: IUIProject;
    projectStatus?: IUIProjectStatus;
    sidePanelInputFields: IUIEditJobRun;
    hasInvalidData: boolean;
}

class JobRunDetailsPage extends React.Component<IProps, IState> {
    private readonly regionId: string;
    private readonly projectId: string;
    private jobRunId: string;
    private subpage: string;
    private cacheIdJobRun: string;
    private cacheIdProject: string;
    private removeJobRunCacheListener: () => any;
    private removeProjectCacheListener: () => any;
    private removeProjectStatusCacheListener: () => any;

    private readonly CACHE_KEY_JOBRUN = 'coligo-job-run';
    private readonly CACHE_KEY_PROJECT = 'coligo-project';
    private readonly CACHE_KEY_PROJECT_STATUS = 'coligo-project-status';
    private readonly COMPONENT = 'JobRunDetailsPage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        const fn = 'constructor ';
        this.logger.debug(`${fn}>`);
        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;

        this.init = this.init.bind(this);

        this.state = {
            isDebugEnabled: false, // check whether there is a query parameter 'debug'
            isDeleting: false,
            isDeletionModalOpen: false,
            isLoading: true,
            isLoadingJobRun: false,
            isLoadingProject: false,
            jobDefinitionName: '',
            jobRun: undefined,
            jobRunId: props.match.params.jobRunId,
            jobRunInfo: {
                numFailedJobs: -1,
                numRunningJobs: -1,
                numSucceededJobs: -1,
            },
            openSidePanel: false,
            sidePanelInputFields: undefined,
            hasInvalidData: false,
        };

        this.init(props);

        // use the bind to enable setState within this function
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.deleteJobDefinitionHandler = this.deleteJobDefinitionHandler.bind(this);
        this.getBreadcrumb = this.getBreadcrumb.bind(this);
        this.loadJobRun = this.loadJobRun.bind(this);
        this.loadProject = this.loadProject.bind(this);
        this.navigateToProjectDetailPage = this.navigateToProjectDetailPage.bind(this);
        this.onGetJobRunInfo = this.onGetJobRunInfo.bind(this);
        this.renderCommand = this.renderCommand.bind(this);
        this.renderArgument = this.renderArgument.bind(this);
        this.renderEnvParam = this.renderEnvParam.bind(this);
    }

    public init(props) {
        const fn = 'constructor ';
        this.logger.debug(`${fn}jobRunId: ${this.state.jobRunId}`);
        this.subpage = props.match.params.subpage || 'configuration';
        this.cacheIdJobRun = `region/${this.regionId}/project/${this.projectId}/job/${this.state.jobRunId}`;
        this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);

        this.setState({ isLoading: false });

        // load the jobrun
        this.loadJobRun();

        // load the project
        this.loadProject();

        app.arrivedOnPage('clg.pages.jobrun');

        // check whether there is a query parameter 'debug' and if the DevOps feature flag is turned on
        if (queryString.parse(this.props.location.search).debug) {
            this.logger.debug(`${fn}- evaluating feature flag ...`);
            flags.getFlag('coligo-ui-devops', (flag) => {
                this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
                if (flag && flag.value === true) {
                    this.setState({ isDebugEnabled: true });
                }
            });
        }
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.match.params.jobRunId !== this.props.match.params.jobRunId) {
            this.setState({
                isLoading: false,
                jobRunId: this.props.match.params.jobRunId,
            }, () => {
                this.init(this.props);
                this.loadJobRun();
            });
        }

    }

    public componentWillUnmount() {
        this.logger.debug('componentWillUnmount');
        // remove the cache listener in order to avoid background syncs with the backend
        if (this.removeJobRunCacheListener) {
            this.removeJobRunCacheListener();
        }

        if (this.removeProjectCacheListener) {
            this.removeProjectCacheListener();
        }

        if (this.removeProjectStatusCacheListener) {
            this.removeProjectStatusCacheListener();
        }
    }

    public getBreadcrumb() {
        const breadcrumbs = [];
        breadcrumbs.push({
            to: nav.toGettingStartedOverview(),
            value: t('clg.breadcrumb.home'),
        }, {
            to: nav.toProjectList(),
            value: t('clg.breadcrumb.projects'),
        }, {
            to: nav.toProjectDetail(this.regionId, this.projectId),
            value: this.state.project ? this.state.project.name : '...',
        },
            {
                to: nav.toJobDefinitionDetail(this.regionId, this.projectId, this.state.jobDefinitionName),
                value: this.state.jobDefinitionName ? this.state.jobDefinitionName : '...',
            }
        );
        return breadcrumbs;
    }

    public convertUIJobStatusToString(): string {
        let label: string = t('clg.formatter.label.unknown');
        const jobRun = this.state.jobRun;
        if (jobRun.isDeleting) {
            label = t('clg.page.jobs.status.deleting');
        } else {
            const status: UIJobStatus = jobRun.status;
            if (status) {
                switch (status) {
                    case UIJobStatus.FAILED:
                        label = t('clg.page.jobs.status.failed');
                        break;
                    case UIJobStatus.SUCCEEDED:
                        label = t('clg.page.jobs.status.succeeded');
                        break;
                    case UIJobStatus.WAITING:
                        label = t('clg.page.jobs.status.waiting');
                        break;
                    case UIJobStatus.RUNNING:
                        label = t('clg.page.jobs.status.running.simple');
                        break;
                }
            }
        }

        return label;
    }

    public deleteJobDefinitionHandler() {
        this.logger.debug('deleteApplicationHandler');

        this.setState({ isDeletionModalOpen: true, });
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}>`);

        // show the loading animation
        this.setState({ isDeleting: true });

        // delete the application
        jobDefinitionApi.deleteJobRun(this.regionId, this.projectId, this.state.jobRunId)
            .then((requestResult: commonModel.IUIRequestResult) => {
                this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

                // show a toast notification
                const successNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.jobs.success.deleteJobRun.subtitle', { name: this.state.jobRun.name }),
                    title: t('clg.page.jobs.success.deleteJobRun.title'),
                };
                toastNotification.add(successNotification);

                // hide the loading animation
                this.setState({ isDeleting: false, isDeletionModalOpen: false });

                // navigate to the projects overview page
                this.navigateToProjectDetailPage();

                this.logger.debug(`${fn}<`);
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.logger.warn(`${fn}- An error occurred while deleting the application: '${JSON.stringify(requestError)}'`);

                // in case the response could not be mapped to a specific creation error, we should use a generic one
                const errorNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.jobs.error.deleteJobRun.subtitle', { name: this.state.jobRun.name, code: requestError.error._code }),
                    title: t('clg.page.jobs.error.deleteJobRun.title'),
                };
                toastNotification.add(errorNotification);

                this.setState({ isDeleting: false, isDeletionModalOpen: false });
                this.logger.debug(`${fn}< ERR`);
            });
    }

    public navigateToProjectDetailPage(): void {
        if (this.state.jobDefinitionName) {
            this.props.history.push(nav.toJobDefinitionDetail(this.regionId, this.projectId, this.state.jobDefinitionName));
        } else {
            // in case the JobRun got deleted, before it was fully loaded, we fall back to the project details page
            this.props.history.push(nav.toProjectDetail(this.regionId, this.projectId));
        }
    }

    public cancelDeletionHandler() {
        this.logger.debug('cancelDeletionHandler');
        this.setState({ isDeletionModalOpen: false, });
    }

    public onGetJobRunInfo(jobInfo: IJobRunInfo) {
        this.logger.debug('onGetJobRunInfo');
        this.setState({
            jobRunInfo: jobInfo,
        });
    }

    public render() {
        const fn = 'render ';
        this.logger.debug(`${fn}>`);
        let createdDate;
        let completedDate;

        const localeToUse = getLocale(window.navigator.language);

        const pageClassNames = 'page detail-page';

        const environmentVariables = [];

        if ((!this.state.jobRun || !this.state.project) && !this.state.error) {
            return <div className={pageClassNames}><PageHeaderSkeleton title={true} breadcrumbs={true} /></div>;
        }

        // there are cases where the effective spec can be undefined
        const jobRunSpec = this.state.jobRun.effectiveSpec || this.state.jobRun.spec;

        if (jobRunSpec.env) {
            let idx = 0;
            for (const envParam of jobRunSpec.env) {
                environmentVariables.push(this.renderEnvParam(envParam, idx));
                idx += 1;
            }
        }

        createdDate = dateUtils.format(this.state.jobRun.created, localeToUse, true);
        completedDate = dateUtils.format(this.state.jobRun.completed, localeToUse, true);

        if (this.state.error) {
            return (
                <div className={pageClassNames}>
                    <PageHeader
                        breadcrumbs={this.getBreadcrumb()}
                        linkComponent={Link}
                        title={t('clg.page.error.title')}
                    />
                    <div className='page-content'>
                        <Message
                            caption={this.state.error.clgId || ''}
                            text={`${t('clg.page.error.title')} ${t('clg.page.error.subtitle')}`}
                            icon='ERROR'
                            isTileWrapped={true}
                        />
                    </div>
                </div>
            );
        }

        // ensure that the project contains the project status
        const projectToUse = this.state.project;
        if (projectToUse && this.state.projectStatus) {
            projectToUse.projectStatus = this.state.projectStatus;
        }

        const jobRunStatus = clgJobRunStatus.render(this.state.jobRun);
        return (
            <div className={pageClassNames}>
                <PageHeader
                    linkComponent={Link}
                    title={this.state.jobRun.name}
                    breadcrumbs={this.getBreadcrumb()}
                    surfacedDetails={(
                        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 0', }}>
                            {jobRunStatus && <div style={{ display: 'inline-block', margin: '0 0.5rem', }}>{jobRunStatus}</div>}
                        </div>
                    )}
                >
                    <PageHeaderActionsPanel locale={localeToUse}>
                        <OverflowMenuItem
                            disabled={!this.state.jobDefinitionName}
                            itemText={t('clg.page.jobdetails.action.delete')}
                            selectorPrimaryFocus={true}
                            onClick={this.deleteJobDefinitionHandler}
                        />
                    </PageHeaderActionsPanel>
                </PageHeader>
                <div className='page-content'>
                    <div className='bx--grid clg-jobrun-detail-page'>
                        <ClgProjectExpirationWarnings type='inline' projects={projectToUse && [projectToUse]} hideWarnings={true} />
                        <div className='bx--row'>
                            <div className='bx--col-xlg-12 bx--col-lg-16 clg-instance-status'>
                                <Card>
                                    <CardHeader
                                        className='clg-card-header'
                                        small={false}
                                        title={t('clg.page.jobdetails.instances.status.title')}
                                    >
                                        <div className='clg-card-header-button-container'>
                                            {this.state.jobRun.status === 'FAILED' &&
                                                (
                                                    <JobRunDetailsRerunPanel
                                                        jobRun={this.state.jobRun}
                                                        jobDefinitionName={this.state.jobDefinitionName}
                                                        regionId={this.regionId}
                                                        projectId={this.projectId}
                                                        rerun={true}
                                                        className='clg-jobrun-rerun-btn'
                                                    />
                                                )
                                            }
                                            <ObserveButton
                                                locale={localeToUse}
                                                location={this.state.jobRun.regionId}
                                                observeType='logging'
                                                route={{
                                                    search: `_platform:'Code Engine' app:${this.state.jobRun.definitionName}`,
                                                }}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div>
                                            <div className='bx--row'>
                                                <div className='bx--col-lg-3 bx--col-md-2 bx--col-sm-2 clg-tile-col first-col first-md-col first-sm-col'>
                                                    <Tile className='clg-status-tile' light={true}>
                                                        <h2 id={'job-instances-pending'}>{this.state.jobRun.instanceStatus.numWaiting}</h2>
                                                        <div className='clg-status-tile--details clg-item--status'>
                                                            <Time16 className='clg-item--status-icon' />
                                                            <span className='bx--label'>{t('clg.page.jobdetails.instances.status.pending')}</span>
                                                        </div>
                                                    </Tile>
                                                </div>
                                                <div className='bx--col-lg-3 bx--col-md-2 bx--col-sm-2 clg-tile-col last-sm-col'>
                                                    <Tile className='clg-status-tile' light={true}>
                                                        <h2 id={'job-instances-running'}>{this.state.jobRun.instanceStatus.numRunning}</h2>
                                                        <div className='clg-status-tile--details clg-item--status'>
                                                            {this.state.jobRun.instanceStatus.numRunning === 0 ? (
                                                                <span className='bx--label'>&#8212;&nbsp;</span>
                                                            ) : (
                                                                    <InProgress16 className='fill-running clg-item--status-icon' />
                                                                )}
                                                            <span className='bx--label'>{t('clg.page.jobdetails.instances.status.running')}</span>
                                                        </div>
                                                    </Tile>
                                                </div>
                                                <div className='bx--col-lg-3 bx--col-md-2 bx--col-sm-2 clg-tile-col first-sm-col'>
                                                    <Tile className='clg-status-tile' light={true}>
                                                        <h2 id={'job-instances-succeeded'}>{this.state.jobRun.instanceStatus.numSucceeded}</h2>
                                                        <div className='clg-status-tile--details clg-item--status'>
                                                            <CheckmarkFilled16 className='fill-success clg-item--status-icon' />
                                                            <span className='bx--label'>{t('clg.page.jobdetails.instances.status.completed')}</span>
                                                        </div>
                                                    </Tile>
                                                </div>
                                                <div className='bx--col-lg-3 bx--col-md-2 bx--col-sm-2 clg-tile-col last-md-col last-sm-col'>
                                                    <Tile className='clg-status-tile' light={true}>
                                                        <h2 id={'job-instances-failed'}>{this.state.jobRun.instanceStatus.numFailed}</h2>
                                                        <div className='clg-status-tile--details clg-item--status'>
                                                            <ErrorFilled16 className='fill-failed clg-item--status-icon' />
                                                            <span className='bx--label'>{t('clg.page.jobdetails.instances.status.failed')}</span>
                                                        </div>
                                                    </Tile>
                                                </div>
                                                <div className='bx--col-lg-4 bx--col-md-8 bx--col-sm-4 clg-tile-col first-md-col first-sm-col last-col last-md-col last-sm-col'>
                                                    <Tile className='clg-status-tile' light={true}>
                                                        <div className='clg-status--startdate'>
                                                            <div className='bx--label clg-field-label'>{t('clg.page.jobdetails.started.title')}</div>
                                                            <div id={'job-start-date'} className='clg-field-value'>{createdDate}</div>
                                                        </div>
                                                        <div className='clg-status--enddate'>
                                                            <div className='bx--label clg-field-label'>{t('clg.page.jobdetails.completed.title')}</div>
                                                            <div id={'job-completion-date'} className='clg-field-value'>{this.state.jobRun.completed ? completedDate : '\u2014'}</div>
                                                        </div>
                                                    </Tile>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        <div className='bx--row clg-jobrun-details-row'>
                            <div className='bx--col-xlg-12 bx--col-lg-16 clg-jobrun-details'>
                                <div className='bx--row'>
                                    <div className='bx--col-lg-8 bx--col-md-8 clg-card-container'>
                                        <Card>
                                            <CardHeader
                                                className='clg-card-header'
                                                small={false}
                                                title={t('clg.page.jobdetails.configuration.title')}
                                            />
                                            <CardBody>
                                                <div className='clg-jobrun-configuration'>
                                                    <div className='bx--row'>
                                                        <div className='bx--col-lg-16'>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.jobdefinition.imagePullSecret.label')}</div>
                                                                <div id={'job-imagepullsecret'} className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'>{jobRunSpec.imagePullSecret || t('clg.component.registrySelector.default.usepublic.label')}</div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.container.image.title')}</div>
                                                                <div id={'job-image'} className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'>{jobRunSpec.image}</div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.command.title')}</div>
                                                                <ClgExpandableSection
                                                                    className={'bx--col-lg-9 bx--col-md-5 bx--col-sm-2'}
                                                                    collapsedHeightCss={'auto'}
                                                                    expandedHeightCss={'auto'}
                                                                    id={'job-command'}
                                                                    isExpanded={false}
                                                                    maxHeight={0}
                                                                    noItemsText={t('clg.page.jobdetails.no.comand.title')}
                                                                    items={jobRunSpec.command}
                                                                    light={false}
                                                                    maxCollapsedItems={3}
                                                                    renderItemFn={this.renderCommand}
                                                                />
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.arraySpec.title')}</div>
                                                                <div
                                                                    className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'
                                                                    id={'job-arraysize'}
                                                                >
                                                                    {t('clg.page.jobdetails.arraySpec.value', { instances: this.state.jobRun.arraySpec })}
                                                                </div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.memory.title')}</div>
                                                                <div
                                                                    className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'
                                                                    id={'job-memory'}
                                                                >
                                                                    {memUtils.convertNumberToDisplayValueAndUnit(jobRunSpec.memory, false, 'B')}
                                                                </div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.cpu.title')}</div>
                                                                <div
                                                                    className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'
                                                                    id={'job-cpus'}
                                                                >
                                                                    {t('clg.page.jobdetails.cpu.value', { cpus: jobRunSpec.cpus })}
                                                                </div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.instance.retryLimit.title')}</div>
                                                                <div
                                                                    className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'
                                                                    id={'job-retries'}
                                                                >
                                                                    {t('clg.page.jobdetails.instance.retryLimit.value', { retries: this.state.jobRun.retryLimit })}
                                                                </div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.job.maxExecutionTime.title')}</div>
                                                                <div
                                                                    className='clg-jobrun-config-value bx--col-lg-9 bx--col-md-5 bx--col-sm-2'
                                                                    id={'job-timeout'}
                                                                >
                                                                    {t('clg.page.jobdetails.job.maxExecutionTime.value', { seconds: this.state.jobRun.maxExecutionTime })}
                                                                </div>
                                                            </div>
                                                            <div className='bx--row'>
                                                                <div className='clg-jobrun-config-key bx--col-lg-7 bx--col-md-3 bx--col-sm-2'>{t('clg.page.jobdetails.arguments.title')}</div>
                                                                <ClgExpandableSection
                                                                    className={'bx--col-lg-9 bx--col-md-5 bx--col-sm-2'}
                                                                    collapsedHeightCss={'auto'}
                                                                    expandedHeightCss={'auto'}
                                                                    id={'job-arguments'}
                                                                    isExpanded={false}
                                                                    maxHeight={0}
                                                                    noItemsText={t('clg.page.jobdetails.no.arguments.title')}
                                                                    items={jobRunSpec.args}
                                                                    light={false}
                                                                    maxCollapsedItems={3}
                                                                    renderItemFn={this.renderArgument}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                    <div className='bx--col-lg-8 bx--col-md-8 clg-card-container'>
                                        <Card>
                                            <CardHeader
                                                className='clg-card-header'
                                                small={false}
                                                title={t('clg.page.jobdetails.environment.title')}
                                            />
                                            <CardBody>
                                                <div className='clg-jobrun-environment'>
                                                    <div className='bx--row'>
                                                        <div className='bx--col-lg-16 clg-jobrun-environment-container'>
                                                            {environmentVariables.length > 0 ?
                                                                (
                                                                    <StructuredListWrapper
                                                                        ariaLabel={t('clg.page.jobdetails.environment.title')}
                                                                        border={false}
                                                                        selection={false}
                                                                    >
                                                                        <StructuredListHead>
                                                                            <StructuredListRow
                                                                                head={true}
                                                                                label={false}
                                                                                tabIndex={0}
                                                                            >
                                                                                <StructuredListCell
                                                                                    head={true}
                                                                                    noWrap={false}
                                                                                >
                                                                                    {t('clg.page.jobdetails.environment.name.title')}
                                                                                </StructuredListCell>
                                                                                <StructuredListCell
                                                                                    head={true}
                                                                                    noWrap={false}
                                                                                >
                                                                                    {t('clg.page.jobdetails.environment.value.title')}
                                                                                </StructuredListCell>
                                                                            </StructuredListRow>
                                                                        </StructuredListHead>
                                                                        <StructuredListBody>
                                                                            {environmentVariables}
                                                                        </StructuredListBody>
                                                                    </StructuredListWrapper>
                                                                ) : (
                                                                    <div className='clg-no-items'>{t('clg.page.jobdetails.no.environment.variables.title')}</div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {this.state.isDebugEnabled &&
                            (
                                <div className='debug-information'>
                                    <div className='debug-information--title'><h3>Debug information</h3></div>
                                    <h4>Global Context</h4>
                                    <pre>{JSON.stringify(this.context)}</pre>
                                    <br />
                                    <br />
                                    <h4>Coligo batch job '{this.state.jobRun.name}'</h4>
                                    <pre><JSONPretty id='json-pretty' data={this.state.jobRun} /></pre>
                                </div>
                            )
                        }
                    </div>
                </div>
                <ClgConfirmationModal
                    id={'job-delete-modal'}
                    isDanger={true}
                    isSubmitting={this.state.isDeleting}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.page.jobrun.delete.modal.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.jobrun.delete.ok')}
                    secondaryBtnText={t('clg.modal.button.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.jobrun'), [this.state.jobRun.name])]}
                />
            </div>
        );
    }

    private loadJobRun(): void {
        const fn = 'loadJobRun ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingJobRun: true });

        this.removeJobRunCacheListener = cache.listen(this.CACHE_KEY_JOBRUN, (jobRun: IUIJobRun) => {
            this.logger.debug(`${fn}- jobRun: '${JSON.stringify(jobRun)}'`);

            if ((jobRun.status === UIJobStatus.SUCCEEDED) ||
                (jobRun.status === UIJobStatus.FAILED)) {
                // no need to still keep loading the jobrun, if it is in a final state, like SUCCEEDED or FAILED
                this.removeJobRunCacheListener();
            }

            // set the page title
            app.setPageTitle('clg.pages.jobrun', jobRun);

            this.setState({ jobRun, error: null, isLoadingJobRun: false, jobDefinitionName: jobRun.definitionName });
            this.logger.debug(`${fn}< SUCCESS`);
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load JobRun - ${commonModel.stringifyUIRequestError(requestError)}`);
            const errorNotification: IClgInlineNotification = {
                actionFn: this.loadJobRun,
                actionTitle: t('clg.page.jobs.error.loadingJobRun.action'),
                kind: 'error',
                title: t('clg.page.jobs.error.loadingJobRun.title'),
            };
            this.setState({ jobRun: undefined, error: errorNotification, isLoadingJobRun: false, jobDefinitionName: undefined });
            this.logger.debug(`${fn}< FAILED`);
        });
        cache.update(this.cacheIdJobRun, this.CACHE_KEY_JOBRUN);
    }

    private loadProject(): void {
        const fn = 'loadProject ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingProject: true });

        this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, (project: IUIProject) => {
            this.logger.debug(`${fn}- project: '${JSON.stringify(project)}'`);

            // load the project status to see whether the domain is setup properly
            this.loadProjectStatus();

            this.setState({ project, isLoadingProject: false });

            // once we loaded the project, we can de-register from the cache listener
            this.removeProjectCacheListener();
            this.logger.debug(`${fn}< SUCCESS`);
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load project - ${commonModel.stringifyUIRequestError(requestError)}`);
            const errorNotification: IClgInlineNotification = {
                actionFn: this.loadProject,
                actionTitle: t('clg.page.application.error.loadingProject.action'),
                kind: 'error',
                title: t('clg.page.application.error.loadingProject.title'),
            };
            this.setState({ project: undefined, error: errorNotification, isLoadingProject: false });
            this.logger.debug(`${fn}< FAILED`);
        });
        cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT);
    }

    private loadProjectStatus(): void {
        const fn = 'loadProjectStatus ';
        this.logger.debug(`${fn}>`);

        // de-register the cache listener, otherwise we would end up in having another one
        if (this.removeProjectStatusCacheListener) {
            this.removeProjectStatusCacheListener();
        }

        this.removeProjectStatusCacheListener = cache.listen(this.CACHE_KEY_PROJECT_STATUS, (projectStatus: IUIProjectStatus) => {
            this.logger.debug(`${fn}- projectStatus: '${JSON.stringify(projectStatus)}'`);

            // FIXME remove this once the serving API provides the expireTimestamp - calculate the expiryDate
            // uncomment it for test purposes -> see: #317 for further information
            // projectStatus.expireTimestamp = projectStatus.expireTimestamp || (this.state.project && (this.state.project.created + 1000 * 60 * 60 * 24 * 7));

            // once loaded, we can de-register this check
            this.setState({ projectStatus });
            this.removeProjectStatusCacheListener();

            this.logger.debug(`${fn}< SUCCESS`);
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load status of project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT_STATUS}' - ${commonModel.stringifyUIRequestError(requestError)}`);
            this.setState({ projectStatus: undefined });
        });
        cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT_STATUS);
        this.logger.debug(`${fn}< FAILED`);
    }

    private renderCommand(cmd: string) {
        return React.createElement('div', {}, cmd);
    }

    private renderArgument(arg: string) {
        return React.createElement('div', {}, arg);
    }

    private renderEnvParam(envParam: IUIEnvItem, idx: number) {
        const nameStr = clgEnvName.value(envParam);
        const valueStr = clgEnvValue.value(envParam);

        return (
            <StructuredListRow
                head={false}
                label={false}
                tabIndex={0}
                key={nameStr}
            >
                <StructuredListCell
                    head={false}
                    id={`env-param-${idx}-key`}
                    noWrap={true}
                >
                    {nameStr}
                </StructuredListCell>
                <StructuredListCell
                    head={false}
                    id={`env-param-${idx}-value`}
                    noWrap={false}
                >
                    {valueStr}
                </StructuredListCell>
            </StructuredListRow>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobRunDetailsPage.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    location: PropTypes.shape({
        search: PropTypes.string,
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            jobRunId: PropTypes.string,
            projectId: PropTypes.string,
            regionId: PropTypes.string,
        }),
    }),
};

const withRouterApplicationDetailsPage = withRouter(JobRunDetailsPage);
withRouterApplicationDetailsPage.WrappedComponent.contextType = GlobalStateContext;
export default JobRunDetailsPage;

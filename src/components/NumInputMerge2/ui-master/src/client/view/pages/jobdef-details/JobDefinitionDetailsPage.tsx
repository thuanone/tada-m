// react
import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// 3rd-party
import { cloneDeep } from 'lodash';
import * as log from 'loglevel';
import queryString from 'query-string';
import JSONPretty from 'react-json-pretty';

// carbon + pal
import { CheckmarkFilled16, ErrorFilled16 } from '@carbon/icons-react';
import { OverflowMenuItem } from '@console/pal/carbon-components-react';
import { Message, PageHeader, PageHeaderActionsPanel, ResourceLevelNav, } from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as commonModel from '../../../../common/model/common-model';
import * as jobModel from '../../../../common/model/job-model';
import * as projectModel from '../../../../common/model/project-model';
import flagsApi from '../../../api/flags';
import * as jobDefinitionApi from '../../../api/job-api';
import { setPageTitle } from '../../../utils/app';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import modal from '../../../utils/modal';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgProjectExpirationWarnings from '../../components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';
import * as viewCommonModels from '../../model/common-view-model';
import { IJobRunInfo } from '../../model/job-view-model';
import JobDefinitionDetailConfiguration from './JobDefinitionDetailConfiguration/JobDefinitionDetailConfiguration';

interface IProps {
    history: any[];
    location: {
        search: string
    };
    match: any;
}

interface IState {
    jobdefinition?: jobModel.IUIJobDefinition;
    error?: any;
    isDebugEnabled?: boolean;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    isLoading: boolean;
    isLoadingJobDefinition: boolean;
    isLoadingProject: boolean;
    isSourceToImgEnabled: boolean;
    jobRunInfo: IJobRunInfo;
    project?: projectModel.IUIProject;
    projectStatus?: projectModel.IUIProjectStatus;
}

class JobDefinitionDetailsPage extends React.Component<IProps, IState> {
    private readonly regionId: string;
    private readonly projectId: string;
    private readonly jobDefinitionId: string;
    private subpage: string;
    private readonly cacheIdJobDefinition: string;
    private readonly cacheIdProject: string;
    private readonly navItems: any[];
    private removeJobDefinitionCacheListener: () => any;
    private removeProjectCacheListener: () => any;
    private removeProjectStatusCacheListener: () => any;

    private readonly CACHE_KEY_JOBDEFINITION = 'coligo-jobdefinition';
    private readonly CACHE_KEY_PROJECT = 'coligo-project';
    private readonly CACHE_KEY_PROJECT_STATUS = 'coligo-project-status';
    private readonly COMPONENT = 'JobDefinitionDetailsPage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;
        this.jobDefinitionId = props.match.params.jobDefinitionId;
        this.logger.debug(`constructor - jobDefinitionId: ${this.jobDefinitionId}`);
        this.subpage = props.match.params.subpage || 'configuration';
        this.cacheIdJobDefinition = `region/${this.regionId}/project/${this.projectId}/jobdefinition/${this.jobDefinitionId}`;
        this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;

        this.state = {
            isDebugEnabled: false, // check whether there is a query parameter 'debug'
            isDeleting: false,
            isDeletionModalOpen: false,
            isLoading: true,
            isLoadingJobDefinition: false,
            isLoadingProject: false,
            isSourceToImgEnabled: false,
            jobRunInfo: {
                numFailedJobs: -1,
                numRunningJobs: -1,
                numSucceededJobs: -1,
            }
        };

        // use the bind to enable setState within this function
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.deleteJobDefinitionHandler = this.deleteJobDefinitionHandler.bind(this);
        this.getBreadcrumb = this.getBreadcrumb.bind(this);
        this.loadJobDefinition = this.loadJobDefinition.bind(this);
        this.loadProject = this.loadProject.bind(this);
        this.loadProjectStatus = this.loadProjectStatus.bind(this);
        this.navigateToProjectDetailPage = this.navigateToProjectDetailPage.bind(this);
        this.onResetJobDefinition = this.onResetJobDefinition.bind(this);
        this.onUpdateJobDefinition = this.onUpdateJobDefinition.bind(this);
        this.onGetJobRunInfo = this.onGetJobRunInfo.bind(this);

        // prepare the resource level nav
        this.navItems = [{
            id: nav.toJobDefinitionDetail(this.regionId, this.projectId, this.jobDefinitionId),
            label: t('clg.nav.job.configuration'),
            to: nav.toJobDefinitionDetail(this.regionId, this.projectId, this.jobDefinitionId),
        },
        ];
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);

        this.setState({ isLoading: false });

        // load the jobdef
        this.loadJobDefinition();

        // load the project
        this.loadProject();

        app.arrivedOnPage('clg.pages.jobdef');

        // check whether there is a query parameter 'debug' and if the DevOps feature flag is turned on
        if (queryString.parse(this.props.location.search).debug) {
            this.logger.debug(`${fn}- evaluating feature flag ...`);
            flagsApi.getFlag('coligo-ui-devops', (flag) => {
                this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
                if (flag && flag.value === true) {
                    this.setState({ isDebugEnabled: true });
                }
            });
        }

        // check whether optional features are enabled
        const featureFlags = 'coligo-ui-feature-s2i,';

        flagsApi.getFlag(featureFlags, (flags) => {
            this.logger.debug(`${fn}- evaluated feature flags '${JSON.stringify(flags)}'`);
            if (!flags || !flags.value) {
                return;
            }

            // evaluate the source-to-image feature flag
            if (flags.value['coligo-ui-feature-s2i'] === true) {
                this.setState({ isSourceToImgEnabled: true });
            }
        });
    }

    public componentWillUnmount() {
        const fn = 'componentWillUnmount ';
        this.logger.debug(`${fn}>`);
        // remove the cache listener in order to avoid background syncs with the backend
        if (this.removeJobDefinitionCacheListener) {
            this.removeJobDefinitionCacheListener();
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
        });

        // push the breadcrumb item, if we know that s2i has been enabled
        if (this.state.isSourceToImgEnabled) {
            breadcrumbs.push({
                to: nav.toProjectDetailJobs(this.regionId, this.projectId),
                value: t('clg.breadcrumb.jobs'),
            });
        }

        return breadcrumbs;
    }

    public getJobDefinitionStatus(jobDefinition: jobModel.IUIJobDefinition) {
        // use thist.state.jobRunInfo to render the markup next to the page title

        const result = [];
        const jobRunInfo = this.state.jobRunInfo;

        if (jobRunInfo.numRunningJobs > -1) {
            result.push(React.createElement('span', {}, t('clg.page.jobs.jobdefinition.status.running', { running: jobRunInfo.numRunningJobs })));

            if ((jobRunInfo.numSucceededJobs > 0) ||
                (jobRunInfo.numFailedJobs > 0)) {
                result.push(React.createElement('span', {}, '|'));
                result.push(React.createElement('span', {}, [
                    React.createElement(CheckmarkFilled16, { className: 'fill-success' }),
                    t('clg.page.jobs.jobdefinition.status.succeeded', { succeeded: jobRunInfo.numSucceededJobs }),
                ]));
                result.push(React.createElement('span', {}, [
                    React.createElement(ErrorFilled16, { className: 'fill-failed' }),
                    t('clg.page.jobs.jobdefinition.status.failed', { failed: jobRunInfo.numFailedJobs }),
                ]));
            }
        }

        return result;
    }

    public deleteJobDefinitionHandler(keys) {
        this.logger.debug('deleteApplicationHandler');

        this.setState({ isDeletionModalOpen: true, });
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}>`);

        // show the loading animation
        this.setState({ isDeleting: true });

        // delete the jobdef
        jobDefinitionApi.deleteJobDefinition(this.regionId, this.projectId, this.state.jobdefinition)
            .then((requestResult: commonModel.IUIRequestResult) => {
                this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

                // show a toast notification
                const successNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.jobs.success.deleteJobDefinition.subtitle', { name: this.state.jobdefinition.name }),
                    title: t('clg.page.jobs.success.deleteJobDefinition.title'),
                };
                toastNotification.add(successNotification);

                // hide the loading animation
                this.setState({ isDeleting: false, isDeletionModalOpen: false });

                // navigate to the projects overview page
                this.navigateToProjectDetailPage();

                this.logger.debug(`${fn}<`);
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.logger.warn(`${fn}- An error occurred while deleting the jobdef: '${commonModel.stringifyUIRequestError(requestError)}'`);

                // in case the response could not be mapped to a specific creation error, we should use a generic one
                const errorNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.jobs.error.deleteJobDefinition.subtitle', { name: this.state.jobdefinition.name, code: requestError.error._code }),
                    title: t('clg.page.jobs.error.deleteJobDefinition.title'),
                };
                toastNotification.add(errorNotification);

                this.setState({ isDeleting: false, isDeletionModalOpen: false });
                this.logger.debug(`${fn}< ERR`);
            });
    }

    public navigateToProjectDetailPage(): void {
        this.props.history.push(nav.toProjectDetail(this.regionId, this.projectId));
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

    public onResetJobDefinition() {
        this.setState((oldState) => {
            return {
                jobdefinition: cloneDeep(oldState.jobdefinition),  // create a new object with the same values, forcing updates to all child components
            };
        });
    }

    public onUpdateJobDefinition(newJobDefinition: jobModel.IUIJobDefinition) {
        this.logger.debug('onUpdateJobDefinition');

        this.setState({
            jobdefinition: cloneDeep(newJobDefinition),
        });
    }

    public render() {
        this.logger.debug('render');
        const pageClassNames = 'page detail-page';

        // if the user clicks in the navigation we need to re-apply the subpage property
        this.subpage = this.props.match.params.subpage || 'configuration';

        if ((!this.state.jobdefinition || !this.state.project) && !this.state.error) {
            return <div className={pageClassNames}><PageHeaderSkeleton title={true} breadcrumbs={true} /></div>;
        }

        if (this.state.error) {
            return (
                <div className={pageClassNames}>
                    <PageHeader
                        breadcrumbs={this.getBreadcrumb()}
                        linkComponent={Link}
                        title={t('clg.page.error.title')}
                    />
                    <div className='has-side-nav page-content'>
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

        return (
            <div className={pageClassNames}>
                <PageHeader
                    linkComponent={Link}
                    title={this.state.jobdefinition.name}
                    breadcrumbs={this.getBreadcrumb()}
                >
                    <PageHeaderActionsPanel locale={getLocale(window.navigator.language)}>
                        <OverflowMenuItem
                            id={'delete-entity'}
                            itemText={t('clg.page.jobs.action.delete')}
                            selectorPrimaryFocus={true}
                            onClick={this.deleteJobDefinitionHandler}
                        />
                    </PageHeaderActionsPanel>
                </PageHeader>
                <ResourceLevelNav
                    className={'clg--resource-level-nav jobdef-nav'}
                    items={this.navItems}
                    linkComponent={Link}
                />
                <div className='has-side-nav page-content'>
                    <div className='bx--grid clg-jobdef-detail-page'>

                        <ClgProjectExpirationWarnings type='inline' projects={projectToUse && [projectToUse]} hideWarnings={true} />

                        {this.subpage === 'configuration' &&
                            (
                                <JobDefinitionDetailConfiguration
                                    history={this.props.history}
                                    jobDefinition={this.state.jobdefinition}
                                    onGetJobRunInfo={this.onGetJobRunInfo}
                                    onResetJobDefinition={this.onResetJobDefinition}
                                    onUpdateJobDefinition={this.onUpdateJobDefinition}
                                    project={this.state.project}
                                />
                            )
                        }

                        {this.state.isDebugEnabled &&
                            (
                                <div className='debug-information'>
                                    <div className='debug-information--title'><h3>Debug information</h3></div>
                                    <h4>Global Context</h4>
                                    <pre>{JSON.stringify(this.context)}</pre>
                                    <br />
                                    <br />
                                    <h4>JobDef '{this.state.jobdefinition.name}'</h4>
                                    <pre><JSONPretty id='json-pretty' data={this.state.jobdefinition} /></pre>
                                </div>
                            )
                        }
                    </div>
                </div>
                <ClgConfirmationModal
                    addConfirmationCheck={true}
                    id={'jobdefinition-delete-modal'}
                    isDanger={true}
                    isSubmitting={this.state.isDeleting}
                    itemsToConfirm={[this.state.jobdefinition.name]}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.modal.jobdefinition.delete.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.jobdefinition.delete.ok')}
                    secondaryBtnText={t('clg.modal.button.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.jobdefinition'), [this.state.jobdefinition.name])]}
                />
            </div>
        );
    }

    private loadJobDefinition(): void {
        const fn = 'loadJobDefinition ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingJobDefinition: true });

        this.removeJobDefinitionCacheListener = cache.listen(this.CACHE_KEY_JOBDEFINITION, (jobdefinition: jobModel.IUIJobDefinition) => {
            this.logger.debug(`${fn}- jobdefinition: '${jobModel.stringify(jobdefinition)}'`);

            this.setState({ jobdefinition, error: null, isLoadingJobDefinition: false });

            // set the page title
            setPageTitle('clg.pages.jobdef', jobdefinition);

            // once we loaded the jobdef, we can de-register from the cache listener
            this.removeJobDefinitionCacheListener();
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load JobDefinition - ${commonModel.stringifyUIRequestError(requestError)}`);

            // TODO set a more specific error
            const errorNotification: viewCommonModels.IClgInlineNotification = {
                actionFn: this.loadJobDefinition,
                actionTitle: t('clg.page.jobs.error.loadingJobDefinition.action'),
                kind: 'error',
                title: t('clg.page.jobs.error.loadingJobDefinition.title'),
            };
            this.setState({ jobdefinition: undefined, error: requestError, isLoadingJobDefinition: false });
        });
        cache.update(this.cacheIdJobDefinition, this.CACHE_KEY_JOBDEFINITION);
    }

    private loadProject(): void {
        const fn = 'loadProject ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingProject: true });

        this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, (project: projectModel.IUIProject) => {
            this.logger.debug(`${fn}- project: '${projectModel.stringify(project)}'`);

            // load the project status to see whether the domain is setup properly
            this.loadProjectStatus();

            this.setState({ project, isLoadingProject: false });

            // once we loaded the project, we can de-register from the cache listener
            this.removeProjectCacheListener();
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load project - ${commonModel.stringifyUIRequestError(requestError)}`);

            // TODO set a more specific error + this error should not blow the whole page
            const errorNotification: viewCommonModels.IClgInlineNotification = {
                actionFn: this.loadProject,
                actionTitle: t('clg.page.application.error.loadingProject.action'),
                kind: 'error',
                title: t('clg.page.application.error.loadingProject.title'),
            };
            this.setState({ project: undefined, error: requestError, isLoadingProject: false });
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

        this.removeProjectStatusCacheListener = cache.listen(this.CACHE_KEY_PROJECT_STATUS, (projectStatus: projectModel.IUIProjectStatus) => {
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
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobDefinitionDetailsPage.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    location: PropTypes.shape({
        search: PropTypes.string,
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            jobDefinitionId: PropTypes.string,
            projectId: PropTypes.string,
            regionId: PropTypes.string,
            subpage: PropTypes.string,
        }),
    }),
};

const withRouterApplicationDetailsPage = withRouter(JobDefinitionDetailsPage);
withRouterApplicationDetailsPage.WrappedComponent.contextType = GlobalStateContext;
export default JobDefinitionDetailsPage;

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
import { OverflowMenuItem } from '@console/pal/carbon-components-react';
import { Message, PageHeader, PageHeaderActionsPanel, ResourceLevelNav, } from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as buildModel from '../../../../common/model/build-model';
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import * as buildApi from '../../../api/build-api';
import flags from '../../../api/flags';
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
import BuildDetailConfiguration from './BuildDetailConfiguration/BuildDetailConfiguration';

interface IProps {
    history: any[];
    location: {
        search: string
    };
    match: any;
}

interface IState {
    build?: buildModel.IUIBuild;
    error?: any;
    isDebugEnabled?: boolean;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    isLoading: boolean;
    isLoadingBuild: boolean;
    isLoadingProject: boolean;
    project?: projectModel.IUIProject;
    projectStatus?: projectModel.IUIProjectStatus;
}

class BuildDetailsPage extends React.Component<IProps, IState> {
    private readonly regionId: string;
    private readonly projectId: string;
    private readonly buildId: string;
    private subpage: string;
    private readonly cacheIdBuild: string;
    private readonly cacheIdProject: string;
    private readonly navItems: any[];
    private removeBuildCacheListener: () => any;
    private removeProjectCacheListener: () => any;
    private removeProjectStatusCacheListener: () => any;

    private readonly CACHE_KEY_BUILD = 'coligo-build';
    private readonly CACHE_KEY_PROJECT = 'coligo-project';
    private readonly CACHE_KEY_PROJECT_STATUS = 'coligo-project-status';
    private readonly COMPONENT = 'BuildDetailsPage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;
        this.buildId = props.match.params.buildId;
        this.logger.debug(`constructor - buildId: ${this.buildId}`);
        this.subpage = props.match.params.subpage || 'configuration';
        this.cacheIdBuild = `region/${this.regionId}/project/${this.projectId}/build/${this.buildId}`;
        this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;

        this.state = {
            isDebugEnabled: false, // check whether there is a query parameter 'debug'
            isDeleting: false,
            isDeletionModalOpen: false,
            isLoading: true,
            isLoadingBuild: false,
            isLoadingProject: false,
        };

        // use the bind to enable setState within this function
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.deleteBuildHandler = this.deleteBuildHandler.bind(this);
        this.getBreadcrumb = this.getBreadcrumb.bind(this);
        this.loadBuild = this.loadBuild.bind(this);
        this.loadProject = this.loadProject.bind(this);
        this.loadProjectStatus = this.loadProjectStatus.bind(this);
        this.navigateToProjectDetailPage = this.navigateToProjectDetailPage.bind(this);
        this.onBuildLoaded = this.onBuildLoaded.bind(this);
        this.onBuildLoadingFailed = this.onBuildLoadingFailed.bind(this);
        this.onProjectLoaded = this.onProjectLoaded.bind(this);
        this.onProjectLoadingFailed = this.onProjectLoadingFailed.bind(this);
        this.onProjectStatusLoaded = this.onProjectStatusLoaded.bind(this);
        this.onProjectStatusLoadingFailed = this.onProjectStatusLoadingFailed.bind(this);
        this.onResetBuild = this.onResetBuild.bind(this);
        this.onUpdateBuild = this.onUpdateBuild.bind(this);

        // prepare the resource level nav
        this.navItems = [{
            id: nav.toBuildDetail(this.regionId, this.projectId, this.buildId),
            label: t('clg.nav.build.configuration'),
            to: nav.toBuildDetail(this.regionId, this.projectId, this.buildId),
        },
        ];
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);

        this.setState({ isLoading: false });

        // load the build
        this.loadBuild();

        // load the project
        this.loadProject();

        app.arrivedOnPage('clg.pages.build');

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

    public componentWillUnmount() {
        const fn = 'componentWillUnmount ';
        this.logger.debug(`${fn}>`);
        // remove the cache listener in order to avoid background syncs with the backend
        if (this.removeBuildCacheListener) {
            this.removeBuildCacheListener();
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
        }, {
            to: nav.toProjectDetailBuilds(this.regionId, this.projectId),
            value: t('clg.breadcrumb.builds'),
        });
        return breadcrumbs;
    }

    public deleteBuildHandler(keys) {
        this.logger.debug('deleteBuildHandler');

        this.setState({ isDeletionModalOpen: true, });
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}>`);

        // show the loading animation
        this.setState({ isDeleting: true });

        // delete the build
        buildApi.deleteBuild(this.regionId, this.projectId, this.state.build.name)
            .then((requestResult: commonModel.IUIRequestResult) => {
                this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

                // show a toast notification
                const successNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.build.success.deleteBuild.subtitle', { name: this.state.build.name }),
                    title: t('clg.page.build.success.deleteBuild.title'),
                };
                toastNotification.add(successNotification);

                // hide the loading animation
                this.setState({ isDeleting: false, isDeletionModalOpen: false });

                // navigate to the projects overview page
                this.navigateToProjectDetailPage();

                this.logger.debug(`${fn}<`);
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.logger.warn(`${fn}- An error occurred while deleting the build: '${commonModel.stringifyUIRequestError(requestError)}'`);

                // in case the response could not be mapped to a specific creation error, we should use a generic one
                const errorNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.build.error.deleteBuild.subtitle', { name: this.state.build.name, code: requestError.error._code }),
                    title: t('clg.page.build.error.deleteBuild.title'),
                };
                toastNotification.add(errorNotification);

                this.setState({ isDeleting: false, isDeletionModalOpen: false });
                this.logger.debug(`${fn}< ERR`);
            });
    }

    public navigateToProjectDetailPage(): void {
        this.props.history.push(nav.toProjectDetailBuilds(this.regionId, this.projectId));
    }

    public cancelDeletionHandler() {
        this.logger.debug('cancelDeletionHandler');
        this.setState({ isDeletionModalOpen: false, });
    }

    public onResetBuild() {
        this.setState((oldState) => {
            return {
                build: cloneDeep(oldState.build),  // create a new object with the same values, forcing updates to all child components
            };
        });
    }

    public onUpdateBuild(newBuild: buildModel.IUIBuild) {
        this.logger.debug('onUpdateBuild');

        this.setState({
            build: cloneDeep(newBuild),
        });
    }

    public onBuildLoaded(build: buildModel.IUIBuild): void {
        const fn = 'onBuildLoaded ';
        this.logger.debug(`${fn}> build: '${buildModel.stringify(build)}'`);

        this.setState({ build, error: null, isLoadingBuild: false });

        // set the page title
        setPageTitle('clg.pages.build', build);

        // once we loaded the build, we can de-register from the cache listener
        this.removeBuildCacheListener();

        this.logger.debug(`${fn}<`);
    }

    public onBuildLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onBuildLoadingFailed ';
        this.logger.error(`${fn}> failed to load Build - ${commonModel.stringifyUIRequestError(requestError)}`);

        // TODO set a more specific error
        const errorNotification: viewCommonModels.IClgInlineNotification = {
            actionFn: this.loadBuild,
            actionTitle: t('clg.page.build.error.loadingBuild.action'),
            kind: 'error',
            title: t('clg.page.build.error.loadingBuild.title'),
        };
        this.setState({ build: undefined, error: requestError, isLoadingBuild: false });

        this.logger.debug(`${fn}<`);
    }

    public onProjectLoaded(project: projectModel.IUIProject) {
        const fn = 'onProjectLoaded ';
        this.logger.debug(`${fn}> project: '${projectModel.stringify(project)}'`);

        // load the project status to see whether the domain is setup properly
        this.loadProjectStatus();

        this.setState({ project, isLoadingProject: false });

        // once we loaded the project, we can de-register from the cache listener
        this.removeProjectCacheListener();

        this.logger.debug(`${fn}<`);
    }

    public onProjectLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onProjectLoadingFailed ';
        this.logger.error(`${fn}> failed to load project - ${commonModel.stringifyUIRequestError(requestError)}`);

        // TODO set a more specific error + this error should not blow the whole page
        const errorNotification: viewCommonModels.IClgInlineNotification = {
            actionFn: this.loadProject,
            actionTitle: t('clg.page.application.error.loadingProject.action'),
            kind: 'error',
            title: t('clg.page.application.error.loadingProject.title'),
        };
        this.setState({ project: undefined, error: requestError, isLoadingProject: false });

        this.logger.debug(`${fn}<`);
    }

    public onProjectStatusLoaded(projectStatus: projectModel.IUIProjectStatus) {
        const fn = 'onProjectStatusLoaded ';
        this.logger.debug(`${fn}> projectStatus: '${JSON.stringify(projectStatus)}'`);

        // once loaded, we can de-register this check
        this.setState({ projectStatus });
        this.removeProjectStatusCacheListener();

        this.logger.debug(`${fn}<`);
    }

    public onProjectStatusLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onProjectStatusLoadingFailed ';
        this.logger.error(`${fn}> failed to load status of project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT_STATUS}' - ${commonModel.stringifyUIRequestError(requestError)}`);
        this.setState({ projectStatus: undefined });
        this.logger.debug(`${fn}<`);
    }

    public render() {
        this.logger.debug('render');
        const pageClassNames = 'page detail-page';

        // if the user clicks in the navigation we need to re-apply the subpage property
        this.subpage = this.props.match.params.subpage || 'configuration';

        if ((!this.state.build || !this.state.project) && !this.state.error) {
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
                    title={this.state.build.name}
                    breadcrumbs={this.getBreadcrumb()}
                >
                    <PageHeaderActionsPanel locale={getLocale(window.navigator.language)}>
                        <OverflowMenuItem
                            id={'delete-entity'}
                            itemText={t('clg.page.build.action.delete')}
                            selectorPrimaryFocus={true}
                            onClick={this.deleteBuildHandler}
                        />
                    </PageHeaderActionsPanel>
                </PageHeader>
                <ResourceLevelNav
                    className={'clg--resource-level-nav build-nav'}
                    items={this.navItems}
                    linkComponent={Link}
                />
                <div className='has-side-nav page-content'>
                    <div className='bx--grid clg-build-detail-page'>

                        <ClgProjectExpirationWarnings type='inline' projects={projectToUse && [projectToUse]} hideWarnings={true} />

                        {this.subpage === 'configuration' &&
                            (
                                <BuildDetailConfiguration
                                    history={this.props.history}
                                    build={this.state.build}
                                    onResetBuild={this.onResetBuild}
                                    onUpdateBuild={this.onUpdateBuild}
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
                                    <h4>S2I Build '{this.state.build.name}'</h4>
                                    <pre><JSONPretty id='json-pretty' data={this.state.build} /></pre>
                                </div>
                            )
                        }
                    </div>
                </div>
                <ClgConfirmationModal
                    addConfirmationCheck={true}
                    id={'build-delete-modal'}
                    isDanger={true}
                    isSubmitting={this.state.isDeleting}
                    itemsToConfirm={[this.state.build.name]}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.modal.build.delete.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.build.delete.ok')}
                    secondaryBtnText={t('clg.modal.button.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.build'), [this.state.build.name])]}
                />
            </div>
        );
    }

    private loadBuild(): void {
        const fn = 'loadBuild ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingBuild: true });

        this.removeBuildCacheListener = cache.listen(this.CACHE_KEY_BUILD, this.onBuildLoaded, this.onBuildLoadingFailed);
        cache.update(this.cacheIdBuild, this.CACHE_KEY_BUILD);

        this.logger.debug(`${fn}<`);
    }

    private loadProject(): void {
        const fn = 'loadProject ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingProject: true });

        this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, this.onProjectLoaded, this.onProjectLoadingFailed);
        cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT);

        this.logger.debug(`${fn}<`);
    }

    private loadProjectStatus(): void {
        const fn = 'loadProjectStatus ';
        this.logger.debug(`${fn}>`);

        // de-register the cache listener, otherwise we would end up in having another one
        if (this.removeProjectStatusCacheListener) {
            this.removeProjectStatusCacheListener();
        }

        this.removeProjectStatusCacheListener = cache.listen(this.CACHE_KEY_PROJECT_STATUS, this.onProjectStatusLoaded, this.onProjectStatusLoadingFailed);
        cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT_STATUS);

        this.logger.debug(`${fn}<`);
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildDetailsPage.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    location: PropTypes.shape({
        search: PropTypes.string,
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            buildId: PropTypes.string.isRequired,
            projectId: PropTypes.string.isRequired,
            regionId: PropTypes.string.isRequired,
            subpage: PropTypes.string,
        }),
    }),
};

const withRouterApplicationDetailsPage = withRouter(BuildDetailsPage);
withRouterApplicationDetailsPage.WrappedComponent.contextType = GlobalStateContext;
export default BuildDetailsPage;

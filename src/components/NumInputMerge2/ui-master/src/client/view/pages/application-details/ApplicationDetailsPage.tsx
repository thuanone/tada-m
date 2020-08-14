// react
import PropTypes from 'prop-types';
import React from 'react';
import {
  Link,
  withRouter
} from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';
import queryString from 'query-string';
import JSONPretty from 'react-json-pretty';

// carbon + pal
import { Launch16 } from '@carbon/icons-react';
import {
  Button,
  OverflowMenuItem,
} from '@console/pal/carbon-components-react';
import {
  Message,
  PageHeader,
  PageHeaderActionsPanel,
  ResourceLevelNav,
} from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as appModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import * as applicationApi from '../../../api/application-api';
import flagsApi from '../../../api/flags';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import clgAppInstances from '../../../utils/formatter/clgAppInstances';
import clgAppStatus from '../../../utils/formatter/clgAppStatus';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgProjectExpirationWarnings from '../../components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';
import * as viewCommonModels from '../../model/common-view-model';
import ApplicationDetailConfiguration from './ApplicationDetailConfiguration/ApplicationDetailConfiguration';
import ApplicationDetailInstances from './ApplicationDetailInstances/ApplicationDetailInstances';
import ApplicationDetailTraffic from './ApplicationDetailTraffic/ApplicationDetailTraffic';

interface IProps {
  history: any[];
  location: {
    search: string
  };
  match: any;
}

interface IState {
  areAlphaFeaturesEnabled: boolean;
  application?: appModel.IUIApplication;
  runningInstances?: appModel.IUIApplicationInstance[];
  error?: any;
  isDebugEnabled: boolean;
  isDeleting: boolean;
  isDeletionModalOpen: boolean;
  isLoading: boolean;
  isLoadingApplication: boolean;
  isLoadingApplicationInstances: boolean;
  isLoadingProject: boolean;
  isSourceToImgEnabled: boolean;
  navItems: any[];
  project?: projectModel.IUIProject;
  projectStatus?: projectModel.IUIProjectStatus;
}

class ApplicationDetailsPage extends React.Component<IProps, IState> {
  private readonly regionId: string;
  private readonly projectId: string;
  private readonly applicationId: string;
  private subpage: string;
  private readonly cacheIdApplication: string;
  private readonly cacheIdProject: string;
  private removeApplicationCacheListener: () => any;
  private removeProjectCacheListener: () => any;
  private removeApplicationInstancesCacheListener: () => any;
  private removeProjectStatusCacheListener: () => any;
  private readonly handleNewRevision: (newRevision: appModel.IUIApplicationRevision) => void;

  private readonly CACHE_KEY_APPLICATION = 'coligo-application';
  private readonly CACHE_KEY_APPLICATION_INSTANCES = 'coligo-application-instances';
  private readonly CACHE_KEY_PROJECT = 'coligo-project';
  private readonly CACHE_KEY_PROJECT_STATUS = 'coligo-project-status';
  private readonly COMPONENT = 'ApplicationDetailsPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.logger.debug('constructor');
    this.regionId = props.match.params.regionId;
    this.projectId = props.match.params.projectId;
    this.applicationId = props.match.params.applicationId;
    this.subpage = props.match.params.subpage || 'configuration';
    this.cacheIdApplication = `region/${this.regionId}/project/${this.projectId}/application/${this.applicationId}`;
    this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;

    this.state = {
      areAlphaFeaturesEnabled: false,
      isDebugEnabled: false, // check whether there is a query parameter 'debug'
      isDeleting: false,
      isDeletionModalOpen: false,
      isLoading: true,
      isLoadingApplication: false,
      isLoadingApplicationInstances: false,
      isLoadingProject: false,
      isSourceToImgEnabled: false,
      navItems: [{
        id: nav.toApplicationDetail(this.regionId, this.projectId, this.applicationId),
        label: t('clg.nav.application.configuration'),
        to: nav.toApplicationDetail(this.regionId, this.projectId, this.applicationId),
      }, {
        id: nav.toApplicationDetailTraffic(this.regionId, this.projectId, this.applicationId),
        label: t('clg.nav.application.versionTraffic'),
        to: nav.toApplicationDetailTraffic(this.regionId, this.projectId, this.applicationId),
      },
      ],
    };

    // use the bind to enable setState within this function
    this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
    this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
    this.deleteApplicationHandler = this.deleteApplicationHandler.bind(this);
    this.getBreadcrumbs = this.getBreadcrumbs.bind(this);
    this.handleNewRevision = this._handleNewRevision.bind(this);
    this.loadApplication = this.loadApplication.bind(this);
    this.loadApplicationInstances = this.loadApplicationInstances.bind(this);
    this.loadProject = this.loadProject.bind(this);
    this.loadProjectStatus = this.loadProjectStatus.bind(this);
    this.navigateToProjectDetailPage = this.navigateToProjectDetailPage.bind(this);
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug(`${fn} >`);

    this.setState({ isLoading: false });

    // load the application
    this.loadApplication();

    // load the project
    this.loadProject();

    app.arrivedOnPage('clg.pages.application');

    // check whether there is a query parameter 'debug' and if the DevOps feature flag is turned on
    if (queryString.parse(this.props.location.search).debug) {
      this.logger.debug(`${fn} - evaluating feature flag ...`);
      flagsApi.getFlag('coligo-ui-devops', (flag) => {
        this.logger.debug(`${fn} - evaluated feature flag '${JSON.stringify(flag)}'`);
        if (flag && flag.value === true) {
          this.setState({ isDebugEnabled: true });
        }
      });
    }

    // check whether optional features are enabled
    const featureFlags = 'coligo-ui-features-alpha,coligo-ui-feature-s2i';

    flagsApi.getFlag(featureFlags, (flags) => {
      this.logger.debug(`${fn}- evaluated feature flags '${JSON.stringify(flags)}'`);
      if (!flags || !flags.value) {
        return;
      }

      // evaluate the source-to-image feature flag
      if (flags.value['coligo-ui-feature-s2i'] === true) {
        this.setState({ isSourceToImgEnabled: true });
      }

      // evaluate the alpha-features feature flag
      if (flags.value['coligo-ui-features-alpha'] === true) {
        const navItems = this.state.navItems;
        navItems.push({
          id: nav.toApplicationDetailInstances(this.regionId, this.projectId, this.applicationId),
          label: t('clg.nav.application.instances'),
          to: nav.toApplicationDetailInstances(this.regionId, this.projectId, this.applicationId),
        });
        this.setState({ areAlphaFeaturesEnabled: true, navItems, });
      }
    });
  }

  public componentWillUnmount() {
    this.logger.debug('componentWillUnmount');
    // remove the cache listener in order to avoid background syncs with the backend
    if (this.removeApplicationCacheListener) {
      this.removeApplicationCacheListener();
    }
    if (this.removeApplicationInstancesCacheListener) {
      this.removeApplicationInstancesCacheListener();
    }
    if (this.removeProjectCacheListener) {
      this.removeProjectCacheListener();
    }
    if (this.removeProjectStatusCacheListener) {
      this.removeProjectStatusCacheListener();
    }
  }

  public getBreadcrumbs() {
    const breadcrumbs = [];
    breadcrumbs.push({
      to: nav.toGettingStartedOverview(),
      value: t('clg.breadcrumb.home'),
    }, {
      to: nav.toProjectList(),
      value: t('clg.breadcrumb.projects'),
    }, {
      to: nav.toProjectDetail(this.regionId, this.projectId),
      value: this.state.project ? this.state.project.name : '...', // TODO add project name
    });

    // push the breadcrumb item, if we know that s2i has been enabled
    if (this.state.isSourceToImgEnabled) {
      breadcrumbs.push({
        to: nav.toProjectDetailApplications(this.regionId, this.projectId),
        value: t('clg.breadcrumb.applications'),
      });
    }
    return breadcrumbs;
  }

  public deleteApplicationHandler(keys) {
    this.logger.debug('deleteApplicationHandler');

    this.setState({ isDeletionModalOpen: true, });
  }

  public confirmDeletionHandler() {
    const fn = 'confirmDeletionHandler ';
    this.logger.debug(`${fn}>`);

    // show the loading animation
    this.setState({ isDeleting: true });

    // delete the application
    applicationApi.deleteApplication(this.state.application)
      .then((requestResult: commonModel.IUIRequestResult) => {
        this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

        // show a toast notification
        const successNotification: viewCommonModels.IClgToastNotification = {
          kind: 'success',
          subtitle: t('clg.page.application.success.deleteApplication.subtitle', { name: this.state.application.name }),
          title: t('clg.page.application.success.deleteApplication.title'),
        };
        toastNotification.add(successNotification);

        // hide the loading animation
        this.setState({ isDeleting: false, isDeletionModalOpen: false });

        // navigate to the projects overview page
        this.navigateToProjectDetailPage();

        this.logger.debug(`${fn}<`);
      })
      .catch((requestError: commonModel.UIRequestError) => {
        this.logger.error(`${fn}- An error occurred while deleting the application '${this.state.application.name}' - ${commonModel.stringifyUIRequestError(requestError)}`);

        // in case the response could not be mapped to a specific creation error, we should use a generic one
        const errorNotification: viewCommonModels.IClgToastNotification = {
          kind: 'error',
          subtitle: t('clg.page.application.error.deleteApplication.subtitle', { name: this.state.application.name, code: requestError.clgId }),
          title: t('clg.page.application.error.deleteApplication.title'),
        };
        toastNotification.add(errorNotification);

        this.setState({ isDeleting: false, isDeletionModalOpen: false });
        this.logger.debug(`${fn}< ERR`);
      });
  }

  public navigateToProjectDetailPage(): void {
    this.props.history.push(nav.toProjectDetail(this.state.application.regionId, this.state.application.projectId));
  }

  public cancelDeletionHandler() {
    this.logger.debug('cancelDeletionHandler');
    this.setState({ isDeletionModalOpen: false, });
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}>`);
    const pageClassNames = 'page detail-page';

    // if the user clicks in the navigation we need to re-apply the subpage property
    this.subpage = this.props.match.params.subpage || 'configuration';

    if ((!this.state.application || !this.state.project) && !this.state.error) { return <div className={pageClassNames}><PageHeaderSkeleton title={true} breadcrumbs={true} /></div>; }
    if (this.state.error) {
      this.logger.debug(`${fn}< error`);
      return (
        <div className={pageClassNames}>
          <PageHeader
            breadcrumbs={this.getBreadcrumbs()}
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

    let applicationUrl;
    // if there is no ready revision, we should not point out the URL
    if (this.state.application.publicServiceUrl && this.state.application.latestReadyRevisionName) {
      applicationUrl = this.state.application.publicServiceUrl;

      // currently, service URLs are all pointing to HTTP, we should not link-out using HTTP
      applicationUrl = applicationUrl.replace('http://', 'https://');
    }

    const runningInstances = clgAppInstances.render(this.state.runningInstances);
    const appStatus = clgAppStatus.render(this.state.application);

    const isDomainReady: boolean = this.state.projectStatus ? this.state.projectStatus.domain : false;

    // ensure that the project contains the project status
    const projectToUse = this.state.project;
    if (projectToUse && this.state.projectStatus) {
      projectToUse.projectStatus = this.state.projectStatus;
    }

    this.logger.debug(`${fn}<`);
    return (
      <div className={pageClassNames}>
        <PageHeader
          title={this.state.application.name}
          linkComponent={Link}
          breadcrumbs={this.getBreadcrumbs()}
          surfacedDetails={(
            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 0', }}>
              {<div style={{ display: 'inline-block', margin: '0.4rem 0.5rem 0', }}>{appStatus}</div>}
              {runningInstances && <div style={{ marginTop: '0.3rem', }}><span className='resource-status--separator'>&nbsp;|&nbsp;</span>{runningInstances}</div>}
            </div>
          )}
        >
          {applicationUrl &&
            (
              <Button
                disabled={!isDomainReady}
                href={applicationUrl}
                id={'launch-application-url'}
                target='_blank'
                rel='noopener noreferrer'
                kind='tertiary'
                renderIcon={Launch16}
                size='field'
                title={t('clg.page.application.action.url.title', { appURL: applicationUrl, interpolation: { escapeValue: false } })}
              >
                {t('clg.page.application.action.url')}
              </Button>
            )
          }
          <PageHeaderActionsPanel locale={getLocale(window.navigator.language)}>
            <OverflowMenuItem
              itemText={t('clg.page.application.action.delete')}
              primaryFocus={true}
              onClick={this.deleteApplicationHandler}
            />
          </PageHeaderActionsPanel>
        </PageHeader>
        <ResourceLevelNav
          className={'clg--resource-level-nav'}
          items={this.state.navItems}
          linkComponent={Link}
        />
        <div className='has-side-nav page-content'>
          <div className='bx--grid clg-application-detail-page'>

            <ClgProjectExpirationWarnings type='inline' projects={projectToUse && [projectToUse]} hideWarnings={true} />

            {this.subpage === 'configuration' &&
              <ApplicationDetailConfiguration application={this.state.application} handleNewRevision={this.handleNewRevision} projectStatus={this.state.projectStatus} project={this.state.project} />
            }
            {this.subpage === 'traffic' &&
              <ApplicationDetailTraffic application={this.state.application} />
            }
            <ApplicationDetailInstances show={this.subpage === 'instances' && this.state.areAlphaFeaturesEnabled} appName={this.applicationId} runningInstances={this.state.runningInstances} />
            {this.state.isDebugEnabled &&
              (
                <div className='debug-information'>
                  <div className='debug-information--title'><h3>Debug information</h3></div>
                  <h4>Global Context</h4>
                  <pre>{JSON.stringify(this.context)}</pre>
                  <br />
                  <br />
                  <h4>Project '{this.state.project ? this.state.project.name : 'NOT LOADED'}'</h4>
                  <pre><JSONPretty id='json-pretty' data={this.state.project || {}} /></pre>
                  <br />
                  <br />
                  <h4>Application '{this.state.application ? this.state.application.name : 'NOT LOADED'}'</h4>
                  <pre><JSONPretty id='json-pretty' data={this.state.application || {}} /></pre>
                  <br />
                  <br />
                  <h4>{this.state.runningInstances ? this.state.runningInstances.length : 'ZERO'} Application Instances</h4>
                  <pre><JSONPretty id='json-pretty' data={this.state.runningInstances || []} /></pre>
                </div>
              )
            }
          </div>
        </div>
        <ClgConfirmationModal
          addConfirmationCheck={true}
          id={'application-delete-modal'}
          isDanger={true}
          isSubmitting={this.state.isDeleting}
          itemsToConfirm={[this.state.application.name]}
          onSubmitHandler={this.confirmDeletionHandler}
          onCancelHandler={this.cancelDeletionHandler}
          heading={t('clg.modal.application.delete.title')}
          isOpen={this.state.isDeletionModalOpen}
          primaryBtnText={t('clg.modal.application.delete.ok')}
          secondaryBtnText={t('clg.modal.button.cancel')}
          messages={[t('clg.modal.application.delete.message', { name: this.state.application.name })]}
        />
      </div>
    );
  }

  private _handleNewRevision(newRevision: appModel.IUIApplicationRevision): void {
    const fn = '_handleNewRevision ';
    this.logger.debug(`${fn}> newRevision: '${JSON.stringify(newRevision)}'`);

    // re-load the entire application
    this.loadApplication();

    // trigger a reload of the application instances
    this.loadApplicationInstances();

    this.logger.debug(`${fn}<`);
  }

  private stateIsSettled(status: commonModel.UIEntityStatus): boolean {
    return status === commonModel.UIEntityStatus.READY || status === commonModel.UIEntityStatus.FAILED;
  }

  private loadApplication(): void {
    const fn = 'loadApplication ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeApplicationCacheListener) {
      this.removeApplicationCacheListener();
    }

    // reset the error state
    this.setState({ error: undefined, isLoadingApplication: true });

    this.removeApplicationCacheListener = cache.listen(this.CACHE_KEY_APPLICATION, (application: appModel.IUIApplication) => {
      this.logger.debug(`${fn}- application: '${appModel.stringify(application)}'`);

      // there are cases where it was not possible to load a revision (e.g. right after the app has been created)
      // in those situations we are reloading the app until all data could be fetched properly!
      if (!application.revision) {
        return;
      }

      // set the page title
      app.setPageTitle('clg.pages.application', application);

      // check whether the lastReady revision has changed
      if (this.state.application && this.state.application.latestReadyRevisionName !== application.latestReadyRevisionName) {
        // show a toast notification
        const successNotification: viewCommonModels.IClgToastNotification = {
          kind: 'success',
          subtitle: t('clg.page.application.success.newReadyRevision.subtitle', { name: application.latestReadyRevisionName }),
          title: t('clg.page.application.success.newReadyRevision.title'),
        };
        toastNotification.add(successNotification);
      }

      this.setState({ application, error: undefined, isLoadingApplication: false });

      if (this.stateIsSettled(application.status) && application.revision && this.stateIsSettled(application.revision.status)) {
        // once we loaded the application, we can de-register from the cache listener
        this.removeApplicationCacheListener();
        this.logger.debug(`${fn}- unregister app reload, revision is ready`);
      }

      // once we have a valid revision, we should track the running instances (if the instances are not tracked already)
      if (typeof application.latestReadyRevisionName !== 'undefined' && typeof this.state.runningInstances === 'undefined') {
        this.loadApplicationInstances();
      }
      this.logger.debug(`${fn}<`);
      return;
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load application '${this.cacheIdApplication}' from '${this.CACHE_KEY_APPLICATION}' - ${commonModel.stringifyUIRequestError(requestError)}`);

      // TODO set a more specific error
      const errorNotification: viewCommonModels.IClgInlineNotification = {
        actionFn: this.loadApplication,
        actionTitle: t('clg.page.application.error.loadingApplication.action'),
        kind: 'error',
        title: t('clg.page.application.error.loadingApplication.title'),
      };

      this.setState({ application: undefined, error: requestError, isLoadingApplication: false });
    });
    cache.update(this.cacheIdApplication, this.CACHE_KEY_APPLICATION);
  }

  /**
   * By loading the running instances of an application we can show to current utilization of the application
   */
  private loadApplicationInstances(): void {
    const fn = 'loadApplicationInstances ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeApplicationInstancesCacheListener) {
      this.removeApplicationInstancesCacheListener();
    }

    // reset the error state
    this.setState({ error: undefined, isLoadingApplicationInstances: true });

    this.removeApplicationInstancesCacheListener = cache.listen(this.CACHE_KEY_APPLICATION_INSTANCES, (applicationInstances: appModel.IUIApplicationInstance[]) => {
      this.logger.debug(`${fn}- '${applicationInstances ? applicationInstances.length : 'NULL'} instances`);

      // filter only running pods
      applicationInstances = applicationInstances.filter((applicationInstance: appModel.IUIApplicationInstance) => (applicationInstance.statusPhase === 'Running'));

      this.setState({ runningInstances: applicationInstances, error: undefined, isLoadingApplicationInstances: false });
      this.logger.debug(`${fn}< SUCCESS`);
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load application instances '${this.cacheIdApplication}' from '${this.CACHE_KEY_APPLICATION_INSTANCES}' - ${commonModel.stringifyUIRequestError(requestError)}`);

      // TODO set a more specific error + this error should not blow the whole page
      const errorNotification: viewCommonModels.IClgInlineNotification = {
        actionFn: this.loadApplicationInstances,
        actionTitle: t('clg.page.application.error.loadingApplicationInstances.action'),
        kind: 'error',
        title: t('clg.page.application.error.loadingApplicationInstances.title'),
      };
      this.setState({ runningInstances: undefined, error: requestError, isLoadingApplicationInstances: false });
      this.logger.debug(`${fn}< FAILED`);
    });
    cache.update(this.cacheIdApplication, this.CACHE_KEY_APPLICATION_INSTANCES);
  }

  private loadProject(): void {
    const fn = 'loadProject ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeProjectCacheListener) {
      this.removeProjectCacheListener();
    }

    // reset the error state
    this.setState({ error: undefined, isLoadingProject: true });

    this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, (project: projectModel.IUIProject) => {
      this.logger.debug(`${fn}- project: '${projectModel.stringify(project)}'`);

      this.setState({ project, isLoadingProject: false });

      // load the project status to see whether the domain is setup properly
      this.loadProjectStatus();

      // once we loaded the project, we can de-register from the cache listener
      this.removeProjectCacheListener();
      this.logger.debug(`${fn}< SUCCESS`);
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT}' - ${commonModel.stringifyUIRequestError(requestError)}`);

      // TODO set a more specific error + this error should not blow the whole page
      const errorNotification: viewCommonModels.IClgInlineNotification = {
        actionFn: this.loadProject,
        actionTitle: t('clg.page.application.error.loadingProject.action'),
        kind: 'error',
        title: t('clg.page.application.error.loadingProject.title'),
      };
      this.setState({ project: undefined, error: requestError, isLoadingProject: false });
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

    this.removeProjectStatusCacheListener = cache.listen(this.CACHE_KEY_PROJECT_STATUS, (projectStatus: projectModel.IUIProjectStatus) => {
      this.logger.debug(`${fn}- projectStatus: '${JSON.stringify(projectStatus)}'`);

      // FIXME remove this once the serving API provides the expireTimestamp - calculate the expiryDate
      // uncomment it for test purposes -> see: #317 for further information
      // projectStatus.expireTimestamp = projectStatus.expireTimestamp || (this.state.project && (this.state.project.created + 1000 * 60 * 60 * 24 * 7));

      // in case the domain is ready, we can de-register this check
      if (projectStatus && projectStatus.domain) {
        // check whether the project was waiting for the domain to get ready
        if (this.state.projectStatus && !this.state.projectStatus.domain) {
          this.showProjectProvisionedToast(this.state.project);
        }

        this.setState({ projectStatus });
        this.removeProjectStatusCacheListener();
        this.logger.debug(`${fn}- de-registered cache listener`);
      } else if (!this.state.projectStatus) {
        // if not set, set the initial project status, to be able to detect state updates
        this.setState({ projectStatus });
      }

      this.logger.debug(`${fn}< SUCCESS`);
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load status of project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT_STATUS}' - ${commonModel.stringifyUIRequestError(requestError)}`);
      this.setState({ projectStatus: undefined });
    });
    cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT_STATUS);
    this.logger.debug(`${fn}< FAILED`);
  }

  private showProjectProvisionedToast(project: projectModel.IUIProject) {
    const fn = 'showProjectProvisionedToast ';
    this.logger.debug(`${fn}- domain of project '${project.id}' is ready - show a toast!`);

    // show a toast notification
    const successNotification: viewCommonModels.IClgToastNotification = {
      kind: 'success',
      subtitle: t('clg.page.create.project.domain.success.subtitle', { name: project.name }),
      title: t('clg.page.create.project.domain.success.title'),
    };
    toastNotification.add(successNotification);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailsPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      applicationId: PropTypes.string,
      projectId: PropTypes.string,
      regionId: PropTypes.string,
      subpage: PropTypes.string,
    }),
  }),
};

const withRouterApplicationDetailsPage = withRouter(ApplicationDetailsPage);
withRouterApplicationDetailsPage.WrappedComponent.contextType = GlobalStateContext;
export default withRouterApplicationDetailsPage;

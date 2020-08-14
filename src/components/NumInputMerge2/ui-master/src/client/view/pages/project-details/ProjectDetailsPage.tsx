// react
import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// carbon + cloudpal
import { OverflowMenuItem } from '@console/pal/carbon-components-react';
import { Message, PageHeader, PageHeaderActionsPanel, ResourceLevelNav, } from '@console/pal/Components';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import { ResourceTagList, ResourceTagModal } from '@console/pal/Connected';
import { getLocale } from '@console/pal/Utilities';

// 3rd-party
import * as log from 'loglevel';
import queryString from 'query-string';

// coligo specific
import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import flagsApi from '../../../api/flags';
import * as projectApi from '../../../api/project-api';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import clgTenantStatus from '../../../utils/formatter/clgTenantStatus';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgProjectExpirationWarnings from '../../components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';
import * as viewCommonModels from '../../model/common-view-model';
import ApplicationsSubpage from './subpages/applications/ApplicationsSubpage';
import BuildsSubpage from './subpages/builds/BuildsSubpage';
import JobsSubpage from './subpages/jobs/JobsSubpage';
import ComponentListSubpage from './subpages/component-list/ComponentListSubpage';
import ConfigListSubpage from './subpages/config-list/ConfigListSubpage';
import JobListSubpage from './subpages/job-list/JobListSubpage';
import OverviewSubpage from './subpages/overview/OverviewSubpage';
import RegistriesSubpage from './subpages/registries/RegistriesSubpage';

interface ITag {
  name: string;
  type: string;
}

interface IProps {
  history: any[];
  location: {
    search: string
  };
  match: {
    params: any;
  };
}

interface IState {
  error: any;
  isDeleting: boolean;
  isDeletionModalOpen: boolean;
  isEditTagsModalOpen: boolean;
  isInstanceGraphEnabled: boolean;
  isLoadingProject: boolean;
  isNewNavStructureEnabled: boolean;
  navItems: any[];
  project?: projectModel.IUIProject;
  projectConsumptionInfo?: projectModel.IUIProjectConsumptionInfo;
  projectStatus?: projectModel.IUIProjectStatus;
  projectTags?: ITag[];
}

class ProjectDetailsPage extends React.Component<IProps, IState> {
  private readonly regionId: string;
  private readonly projectId: string;
  private readonly cacheIdProject: string;
  private removeProjectCacheListener: () => any;
  private removeProjectStatusCacheListener: () => any;
  private removeProjectConsumptionCacheListener: () => any;
  private filterString: string;
  private readonly errorHandler;

  private readonly CACHE_KEY_PROJECT = 'coligo-project';
  private readonly CACHE_KEY_PROJECT_STATUS = 'coligo-project-status';
  private readonly CACHE_KEY_PROJECT_CONSUMPTION = 'coligo-project-consumption';
  private readonly COMPONENT: string = 'ProjectDetailsPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.regionId = props.match.params.regionId;
    this.projectId = props.match.params.projectId;
    this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;

    this.state = {
      error: undefined,
      isDeleting: false,
      isDeletionModalOpen: false,
      isEditTagsModalOpen: false,
      isInstanceGraphEnabled: false,
      isLoadingProject: false,
      isNewNavStructureEnabled: false,
      navItems: [{
        id: nav.toProjectDetailComponents(this.regionId, this.projectId),
        label: t('clg.nav.project.components'),
        to: nav.toProjectDetailComponents(this.regionId, this.projectId),
      }, {
        id: nav.toProjectDetailJobRuns(this.regionId, this.projectId),
        label: t('clg.nav.project.jobruns'),
        to: nav.toProjectDetailJobRuns(this.regionId, this.projectId),
      },
      ],
    };

    // preparing the table
    this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
    this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
    this.showEditTagsModal = this.showEditTagsModal.bind(this);
    this.getBreadcrumbs = this.getBreadcrumbs.bind(this);
    this.errorHandler = this._errorHandler.bind(this);
    this.deleteProjectHandler = this.deleteProjectHandler.bind(this);
    this.navigateToProjectListPage = this.navigateToProjectListPage.bind(this);
    this.renderSubpageContent = this.renderSubpageContent.bind(this);
    this.tagsEditClose = this.tagsEditClose.bind(this);
    this.tagsEditSave = this.tagsEditSave.bind(this);
    this.tagsLoaded = this.tagsLoaded.bind(this);

    // project
    this.loadProject = this.loadProject.bind(this);
    this.onProjectLoaded = this.onProjectLoaded.bind(this);
    this.onFailedLoadingProject = this.onFailedLoadingProject.bind(this);

    // project status
    this.loadProjectStatus = this.loadProjectStatus.bind(this);
    this.onProjectStatusLoaded = this.onProjectStatusLoaded.bind(this);
    this.onFailedLoadingProjectStatus = this.onFailedLoadingProjectStatus.bind(this);

    // project consumption info
    this.loadProjectConsumptionInfo = this.loadProjectConsumptionInfo.bind(this);
    this.onProjectConsumptionInfoLoaded = this.onProjectConsumptionInfoLoaded.bind(this);
    this.onFailedLoadingProjectConsumptionInfo = this.onFailedLoadingProjectConsumptionInfo.bind(this);
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    app.arrivedOnPage('clg.pages.project');
    this.loadProject();

    const featureFlags = `${flagsApi.flags.FEATURE_CONTAINER_REGISTRIES},${flagsApi.flags.FEATURE_SOURCE_TO_IMAGE},${flagsApi.flags.FEATURE_ENVVAR_V2},${flagsApi.flags.ALPHA_FEATURES}`;

    // check whether secrets features (in-development) is enabled
    flagsApi.getFlag(featureFlags, (flags) => {
      this.logger.debug(`${fn}- evaluated feature flags '${JSON.stringify(flags)}'`);
      if (!flags || !flags.value) {
        return;
      }
      let navItems = [];

      let isNewNavStructureEnabled = false;

      // evaluate the source-to-image feature flag
      if (flags.value[flagsApi.flags.FEATURE_SOURCE_TO_IMAGE] === true) {

        isNewNavStructureEnabled = true;

        navItems.push({
          id: nav.toProjectDetail(this.regionId, this.projectId),
          label: t('clg.nav.project.overview'),
          to: nav.toProjectDetail(this.regionId, this.projectId),
        });
        navItems.push({
          id: nav.toProjectDetailApplications(this.regionId, this.projectId),
          label: t('clg.nav.project.applications'),
          to: nav.toProjectDetailApplications(this.regionId, this.projectId),
        });
        navItems.push({
          id: nav.toProjectDetailJobs(this.regionId, this.projectId),
          label: t('clg.nav.project.jobs'),
          to: nav.toProjectDetailJobs(this.regionId, this.projectId),
        });
        navItems.push({
          id: nav.toProjectDetailBuilds(this.regionId, this.projectId),
          label: t('clg.nav.project.builds'),
          to: nav.toProjectDetailBuilds(this.regionId, this.projectId),
        });
      } else {
        // restore the experimental defaults
        navItems = this.state.navItems;
      }

      // evaluate the secrets feature flag
      if (flags.value[flagsApi.flags.FEATURE_CONTAINER_REGISTRIES] === true) {
        navItems.push({
          id: nav.toProjectDetailRegistries(this.regionId, this.projectId),
          label: t('clg.nav.project.registries'),
          to: nav.toProjectDetailRegistries(this.regionId, this.projectId),
        });
      }
      if (flags.value[flagsApi.flags.FEATURE_ENVVAR_V2] === true) {
        navItems.push({
          id: nav.toProjectDetailConfig(this.regionId, this.projectId),
          label: t('clg.nav.project.config'),
          to: nav.toProjectDetailConfig(this.regionId, this.projectId),
        });
      }

      // check whether we should show the instance graph on the overview subpage
      let isInstanceGraphEnabled = false;
      if (flags.value[flagsApi.flags.FEATURE_ALPHA] === true) {
        isInstanceGraphEnabled = true;
      }

      this.setState({ navItems, isNewNavStructureEnabled, isInstanceGraphEnabled });
    });
  }

  public componentWillUnmount() {
    // remove the cache listener in order to avoid background syncs with the backend
    if (this.removeProjectCacheListener) {
      this.removeProjectCacheListener();
    }

    if (this.removeProjectStatusCacheListener) {
      this.removeProjectStatusCacheListener();
    }

    if (this.removeProjectConsumptionCacheListener) {
      this.removeProjectConsumptionCacheListener();
    }
  }

  public onProjectLoaded(project: projectModel.IUIProject) {
    const fn = 'onProjectLoaded ';
    this.logger.debug(`${fn}- project: '${JSON.stringify(project)}'`);

    // load the project status (domain status, expiretimestamp)
    this.loadProjectStatus();

    // load the project consumption info
    this.loadProjectConsumptionInfo();

    this.setState({ project, isLoadingProject: false });

    // set the page title
    app.setPageTitle('clg.pages.project', project);

    // once we loaded the project, we can de-register from the cache listener
    this.removeProjectCacheListener();
    this.logger.debug(`${fn}< SUCCESS`);
  }

  public onFailedLoadingProject(requestError: commonModel.UIRequestError) {
    const fn = 'onFailedLoadingProject ';
    this.logger.error(`${fn}- failed to load project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT}' - ${commonModel.stringifyUIRequestError(requestError)}`);

    let errorToShow = requestError;
    let projectToShow;

    // in case loading the project worked before, we don't want to blow the whole page
    if (this.state.project) {
      projectToShow = this.state.project;
      errorToShow = undefined;
    }

    this.setState({ project: projectToShow, error: errorToShow, isLoadingProject: false });
    this.logger.debug(`${fn}< FAILED`);
  }

  public onProjectStatusLoaded(projectStatus: projectModel.IUIProjectStatus) {
    const fn = 'onProjectStatusLoaded ';
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
  }

  public onFailedLoadingProjectStatus(requestError: commonModel.UIRequestError) {
    const fn = 'onFailedLoadingProjectStatus ';
    this.logger.error(`${fn}- failed to load status of project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT_STATUS}' - ${commonModel.stringifyUIRequestError(requestError)}`);
    this.setState({ projectStatus: undefined });
  }

  public onProjectConsumptionInfoLoaded(projectConsumptionInfo: projectModel.IUIProjectConsumptionInfo) {
    const fn = 'onProjectConsumptionInfoLoaded ';
    this.logger.debug(`${fn}- projectConsumptionInfo: '${projectModel.stringifyConsumption(projectConsumptionInfo)}'`);

    this.setState({ projectConsumptionInfo });

    this.logger.debug(`${fn}< SUCCESS`);
  }

  public onFailedLoadingProjectConsumptionInfo(requestError: commonModel.UIRequestError) {
    const fn = 'onFailedLoadingProjectConsumptionInfo ';
    this.logger.error(`${fn}- failed to load consumption info of project '${this.cacheIdProject}' from '${this.CACHE_KEY_PROJECT_CONSUMPTION}' - ${commonModel.stringifyUIRequestError(requestError)}`);
  }

  public getBreadcrumbs() {
    const breadcrumbs = [];
    breadcrumbs.push({
      to: nav.toGettingStartedOverview(),
      value: t('clg.breadcrumb.home'),
    }, {
      to: nav.toProjectList(),
      value: t('clg.breadcrumb.projects'),
    });
    return breadcrumbs;
  }

  public createComponent() {
    this.logger.debug('createComponent - create component clicked!');
    this.props.history.push(nav.toCreateComponent());
  }

  public _errorHandler(error: any) {
    this.logger.error('_errorHandler', error);
    this.setState(() => {
      return { error };
    });
  }

  public navigateToProjectListPage(): void {
    this.props.history.push(nav.toProjectList());
  }

  public renderSubpageContent(subpage: string) {
    switch (subpage) {
      case 'applications':
        return <ApplicationsSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'jobs':
        return <JobsSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'builds':
        return <BuildsSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'config':
        return <ConfigListSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'registries':
        return <RegistriesSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'jobruns':
        return <JobListSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} />;
      case 'components':
      case 'overview':
      default:
        if (this.state.isNewNavStructureEnabled) {
          return <OverviewSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} projectConsumptionInfo={this.state.projectConsumptionInfo} showInstances={this.state.isInstanceGraphEnabled} />;
        }
        return <ComponentListSubpage errorHandler={this.errorHandler} history={this.props.history} regionId={this.regionId} projectId={this.projectId} filterString={this.filterString} />;
    }
  }

  public render() {
    const fn = 'render ';
    const pageClassNames = 'page detail-page clg-project-detail-page';

    if ((!this.state.project || !this.state.project.name) && !this.state.error) { return <div className={pageClassNames}><PageHeaderSkeleton title={true} breadcrumbs={true} /></div>; }
    if (this.state.error) {
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

    const locale = getLocale(window.navigator.language);
    const maxCharacters: number = coligoValidatorConfig.default.project.tagsInHeader.maxCharacters;
    const maxCharactersTooltip: number = coligoValidatorConfig.default.project.tagsInHeader.maxCharactersTooltip;
    const maxTagsTooltip: number = coligoValidatorConfig.default.project.tagsInHeader.maxTagsTooltip;
    const numTagsDisplayed: number = coligoValidatorConfig.default.project.tagsInHeader.numTagsDisplayed;

    // take the activeHref from the pathname (it is important to have smthg without query params)
    const activeHref = window && window.location && window.location.pathname;

    // if the user clicks in the navigation we need to re-apply the subpage property
    const subpage = this.props.match.params.subpage || 'components';

    // retrieve the filter text from the URL
    const filterParam: string | string[] = queryString.parse(this.props.location.search).filter || '';
    if (filterParam && Array.isArray(filterParam)) {
      this.filterString = filterParam[0];
    } else {
      this.filterString = `${filterParam}`;
    }
    this.logger.debug(`${fn}filterString: '${this.filterString}'`);

    const tenantStatus = clgTenantStatus.render(this.state.projectStatus);

    // ensure that the project contains the project status
    const projectToUse = this.state.project;
    if (projectToUse && this.state.projectStatus) {
      projectToUse.projectStatus = this.state.projectStatus;
    }

    return (
      <div className={pageClassNames}>
        <PageHeader
          breadcrumbs={this.getBreadcrumbs()}
          linkComponent={Link}
          title={this.state.project.name}
          surfacedDetails={(
            <div style={{ display: 'flex', alignItems: 'center', margin: '0.2rem 0 0', }}>
              {this.state.projectStatus && !this.state.projectStatus.domain && (
                <div style={{ display: 'inline-block', margin: '0.2rem 0.5rem 0', }}>{tenantStatus}</div>
              )}
              <ResourceTagList
                iconDescription='tags'
                isEditable='always'
                locale={locale}
                maxCharacters={maxCharacters}
                maxCharactersTooltip={maxCharactersTooltip}
                maxTagsTooltip={maxTagsTooltip}
                numTagsDisplayed={numTagsDisplayed}
                onIconClick={this.showEditTagsModal}
                onLoad={this.tagsLoaded}
                reload={false}
                resourceId={this.state.project.crn}
                showAddLabelText={!this.state.projectTags || this.state.projectTags.length === 0}
                tags={this.state.projectTags || []}
              />
            </div>
          )}
        >
          <PageHeaderActionsPanel locale={locale}>
            <OverflowMenuItem
              id={'delete-entity'}
              itemText={t('clg.page.project.action.delete')}
              selectorPrimaryFocus={true}
              onClick={this.deleteProjectHandler}
            />
          </PageHeaderActionsPanel>
        </PageHeader>
        <ResourceLevelNav
          activeHref={activeHref}
          className={'clg--resource-level-nav'}
          items={this.state.navItems}
          linkComponent={Link}
        />
        <div className='has-side-nav page-content'>
          <div className='bx--grid'>
            <ClgProjectExpirationWarnings type='inline' projects={projectToUse && [projectToUse]} />
            {this.renderSubpageContent(subpage)}
          </div>
        </div>

        {this.state.project &&
          (
            <ResourceTagModal
              onClose={this.tagsEditClose}
              onSave={this.tagsEditSave}
              open={this.state.isEditTagsModalOpen}
              resourceId={this.state.project.crn}
            />
          )
        }
        <ClgConfirmationModal
          addConfirmationCheck={true}
          id={'project-delete-modal'}
          isDanger={true}
          isSubmitting={this.state.isDeleting}
          itemsToConfirm={[this.state.project.name]}
          onSubmitHandler={this.confirmDeletionHandler}
          onCancelHandler={this.cancelDeletionHandler}
          heading={t('clg.modal.project.delete.title')}
          isOpen={this.state.isDeletionModalOpen}
          primaryBtnText={t('clg.modal.project.delete.ok')}
          secondaryBtnText={t('clg.modal.button.cancel')}
          messages={[t('clg.modal.project.delete.message', { name: this.state.project.name })]}
        />
      </div>
    );
  }

  private loadProject(): void {
    const fn = 'loadProject ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeProjectCacheListener) {
      this.removeProjectCacheListener();
    }

    // reset the error state
    this.setState({ error: null, isLoadingProject: true });

    this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, this.onProjectLoaded, this.onFailedLoadingProject);
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

    this.removeProjectStatusCacheListener = cache.listen(this.CACHE_KEY_PROJECT_STATUS, this.onProjectStatusLoaded, this.onFailedLoadingProjectStatus);
    cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT_STATUS);
    this.logger.debug(`${fn}< FAILED`);
  }

  private loadProjectConsumptionInfo(): void {
    const fn = 'loadProjectConsumptionInfo ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeProjectConsumptionCacheListener) {
      this.removeProjectConsumptionCacheListener();
    }

    this.removeProjectConsumptionCacheListener = cache.listen(this.CACHE_KEY_PROJECT_CONSUMPTION, this.onProjectConsumptionInfoLoaded, this.onFailedLoadingProjectConsumptionInfo);
    cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT_CONSUMPTION);
    this.logger.debug(`${fn}<`);
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

  private deleteProjectHandler(keys) {
    this.logger.debug('deleteProjectHandler');

    this.setState({ isDeletionModalOpen: true, });
  }

  private confirmDeletionHandler() {
    const fn = 'confirmDeletionHandler ';
    this.logger.debug(`${fn}>`);

    // show the loading animation
    this.setState({ isDeleting: true });

    // delete the project
    projectApi.deleteProject(this.state.project.region, this.state.project.id)
      .then((requestResult: commonModel.IUIRequestResult) => {
        this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

        // show a toast notification
        const successNotification: viewCommonModels.IClgToastNotification = {
          kind: 'success',
          subtitle: t('clg.page.project.success.deleteProject.subtitle', { name: this.state.project.name }),
          title: t('clg.page.project.success.deleteProject.title'),
        };
        toastNotification.add(successNotification);

        // hide the loading animation
        this.setState({ isDeleting: false, isDeletionModalOpen: false });

        // navigate to the project list page
        this.navigateToProjectListPage();

        this.logger.debug(`${fn}<`);
      })
      .catch((requestError: commonModel.UIRequestError) => {
        this.logger.error(`${fn}- An error occurred while deleting the project '${this.state.project.id}' in region '${this.state.project.region}' - ${commonModel.stringifyUIRequestError(requestError)}`);

        // in case the response could not be mapped to a specific creation error, we should use a generic one
        const errorNotification: viewCommonModels.IClgToastNotification = {
          kind: 'error',
          subtitle: t('clg.page.project.error.deleteProject.subtitle', { name: this.state.project.name, code: requestError.clgId }),
          title: t('clg.page.project.error.deleteProject.title'),
        };
        toastNotification.add(errorNotification);

        this.setState({ isDeleting: false, isDeletionModalOpen: false });
        this.logger.debug(`${fn}< ERR`);
      });
  }

  private cancelDeletionHandler() {
    this.logger.debug('cancelDeletionHandler');
    this.setState({ isDeletionModalOpen: false, });
  }

  /**
   * This method is executed once the user clicked on edit tag icon wihtin a tag list
   */
  private showEditTagsModal() {
    this.logger.debug('showEditTagsModal');
    this.setState({ isEditTagsModalOpen: true });
  }

  /**
   * this method is executed once the user decided to close the edit tags modal
   */
  private tagsEditClose() {
    this.logger.debug('tagsEditClose');
    this.setState({ isEditTagsModalOpen: false });
  }

  /**
   * This method is executed in response to a succeeded tags update operation within the connected component ResourceTagModal.
   * It ensures that the state variable projectTagsFastAccessMap is updated with the new set of tags.
   * Additionally, it closes the modal by deleting the value of the state variable projectToEdit
   * @param saveResult the save result object that is passed in by the ResourceTagModal component
   */
  private tagsEditSave(saveResult) {
    this.logger.debug(`tagsEditSave > arg: ${JSON.stringify(saveResult)}`);

    if (saveResult && saveResult.success && saveResult.tags) {

      const projectTags: ITag[] = [];
      for (const tag of saveResult.tags) {
        projectTags.push({ name: tag, type: 'functional' });
      }

      // close the modal and update the project tags in the state
      this.setState({ isEditTagsModalOpen: false, projectTags });
    }
  }

  /**
   * This method is executed in response to a succeeded tag loading operation of the connected component ResourceTagList
   * @param loadedTags the response object of the succeeded tag load operation
   */
  private tagsLoaded(loadedTags: any) {
    this.logger.debug(`tagsLoaded > loadedTags: ${JSON.stringify(loadedTags)}`);

    if (loadedTags && loadedTags.success && loadedTags.tags) {

      // convert the list of loaded tags in a format that can be rendered by the TagList
      const projectTags: ITag[] = [];
      for (const tag of loadedTags.tags) {
        projectTags.push({ name: tag.name, type: 'functional' });
      }

      // store the updated tags in the state
      this.setState({ projectTags });
    }
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ProjectDetailsPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string,
      regionId: PropTypes.string,
      subpage: PropTypes.string,
    }),
  }),
};

const withRouterDetailsPage = withRouter(ProjectDetailsPage);
withRouterDetailsPage.WrappedComponent.contextType = GlobalStateContext;

export default withRouterDetailsPage;

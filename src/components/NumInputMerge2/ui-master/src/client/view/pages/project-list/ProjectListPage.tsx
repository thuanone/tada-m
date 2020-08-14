import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

import {
  Add16,
  Launch16,
  TrashCan16
} from '@carbon/icons-react';
import { Message, PageHeader, } from '@console/pal/Components';
import { ResourceTagList, ResourceTagModal } from '@console/pal/Connected';
import { getLocale } from '@console/pal/Utilities';

import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import { promiseEach } from '../../../../common/utils/promise-utils';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import flagsApi from '../../../api/flags';
import * as projectApi from '../../../api/project-api';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import clgDeferredValue from '../../../utils/formatter/clgDeferredValue';
import clgLocation from '../../../utils/formatter/clgLocation';
import clgProjectName from '../../../utils/formatter/clgProjectName';
import clgProjectStatus from '../../../utils/formatter/clgProjectStatus';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import modal from '../../../utils/modal';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import ClgConfirmationModal from '../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgProjectExpirationWarnings from '../../components/ClgProjectExpirationWarnings/ClgProjectExpirationWarnings';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../../components/ClgTableWrapper/ClgTableWrapper';
import ClgBanner from '../../components/ClgBanner/ClgBanner';
import ClgTeaser from '../../components/ClgTeaser/ClgTeaser';
import * as viewCommonModels from '../../model/common-view-model';
import GlobalStateContext from '../../common/GlobalStateContext';
import ClgLiftedLimitations from '../../common/ClgLiftedLimitations';

interface ITag {
  name: string;
  type: string;
}

interface IProps {
  history: any[];
}

interface IState {
  error: any;
  projects?: projectModel.IUIProject[];
  projectToEdit?: string;
  resourceGroups?: { [key: string]: projectModel.IUIResourceGroup };
  keysToDelete?: string[];
  isDeleting: boolean;
  isDeletionModalOpen: boolean;
  isLoadingProjects: boolean;
  isLoadingResourceGroups: boolean;
  isProjectExpirationEnabled: boolean;
  projectTagsFastAccessMap?: { [key: string]: ITag[] };
  projectsToDelete?: string[];
}

class ProjectListPage extends React.Component<IProps, IState> {
  private readonly columns: any[];
  private removeProjectsCacheListener: () => any;
  private removeResourceGroupsCacheListener: () => any;
  private actions: any[];
  private batchActions: any[];
  private itemsAccessMap: {};
  private clearSelectionFn;

  private readonly COMPONENT = 'ProjectListPage';
  private readonly CACHE_KEY_PROJECTS = 'coligo-projects';
  private readonly CACHE_KEY_RESOURCE_GROUPS = 'resource-groups';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isDeleting: false,
      isDeletionModalOpen: false,
      isLoadingProjects: false,
      isLoadingResourceGroups: false,
      isProjectExpirationEnabled: false,
      keysToDelete: undefined,
      projectTagsFastAccessMap: {},
      projects: undefined,
      projectsToDelete: undefined,
    };

    this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
    this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
    this.deleteItemHandler = this.deleteItemHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
    this.editTags = this.editTags.bind(this);
    this.getProjectStatus = this.getProjectStatus.bind(this);
    this.getRowActions = this.getRowActions.bind(this);
    this.loadProjects = this.loadProjects.bind(this);
    this.tagsLoaded = this.tagsLoaded.bind(this);
    this.tagsEditClose = this.tagsEditClose.bind(this);
    this.tagsEditSave = this.tagsEditSave.bind(this);
    this.loadResourceGroups = this.loadResourceGroups.bind(this);
    this.navigateToCreateProjectPage = this.navigateToCreateProjectPage.bind(this);
    this.onProjectsLoaded = this.onProjectsLoaded.bind(this);
    this.onProjectsLoadingFailed = this.onProjectsLoadingFailed.bind(this);
    this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
    this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

    this.columns = [
      {
        field: 'name',
        formatter: (item: projectModel.IUIProject) => {
          if (this.state.isProjectExpirationEnabled) {
            return clgProjectName.render(item);
          }
          return clgProjectName.value(item);
        },
        label: t('clg.page.projects.th.name'),
        stringValue: (item: projectModel.IUIProject) => (clgProjectName.value(item)),
      },
      {
        field: 'state',
        formatter: (item: projectModel.IUIProject) => (clgProjectStatus.render(item)),
        label: t('clg.page.projects.th.state'),
        stringValue: (item: projectModel.IUIProject) => (clgProjectStatus.value(item)),
      },
      {
        field: 'tags',
        formatter: (item: projectModel.IUIProject) => {
          if (clgProjectStatus.isDeleting(item)) {
            return '';
          }

          const locale = getLocale(window.navigator.language);
          const maxCharacters: number = coligoValidatorConfig.default.project.tagsInTable.maxCharacters;
          const maxCharactersTooltip: number = coligoValidatorConfig.default.project.tagsInTable.maxCharactersTooltip;
          const maxTagsTooltip: number = coligoValidatorConfig.default.project.tagsInTable.maxTagsTooltip;
          const numTagsDisplayed: number = coligoValidatorConfig.default.project.tagsInTable.numTagsDisplayed;

          // if they need to be loaded for the first time, we are using a connected component
          return (
            <ResourceTagList
              iconDescription=' '
              isEditable={item.isDisabled ? 'never' : 'always'}
              locale={locale}
              maxCharacters={maxCharacters}
              maxCharactersTooltip={maxCharactersTooltip}
              maxTagsTooltip={maxTagsTooltip}
              numTagsDisplayed={numTagsDisplayed}
              // tslint:disable-next-line:jsx-no-lambda
              onIconClick={() => this.editTags(item.crn)}
              // tslint:disable-next-line:jsx-no-lambda
              onLoad={(loadedTags) => { this.tagsLoaded(item.crn, loadedTags); }}
              reload={false}
              resourceId={item.crn}
              showAddLabelText={false}
              tags={this.state.projectTagsFastAccessMap[item.crn] || []}
            />
          );
        },
        label: t('clg.page.projects.th.tags'),
        stringValue: (item: projectModel.IUIProject) => {
          if (!this.state.projectTagsFastAccessMap[item.crn] || clgProjectStatus.isDeleting(item)) {
            return '';
          }

          let tagsString = '';
          for (const tag of this.state.projectTagsFastAccessMap[item.crn]) {
            tagsString += `${tag.name} `;
          }
          this.logger.debug(`stringValue - project ${item.crn}: '${tagsString}'`);
          return tagsString;
        },
      },
      {
        field: 'region',
        formatter: (item) => clgLocation.render(item.region),
        label: t('clg.page.projects.th.location'),
        stringValue: (item) => clgLocation.value(item.region),
      },
      {
        field: 'resourceGroupId',
        formatter: (item: projectModel.IUIProject) => clgDeferredValue.render(this.state.resourceGroups && this.state.resourceGroups[item.resourceGroupId] && this.state.resourceGroups[item.resourceGroupId].name, 30),
        label: t('clg.page.projects.th.resource-group'),
        stringValue: (item: projectModel.IUIProject) => clgDeferredValue.value(this.state.resourceGroups && this.state.resourceGroups[item.resourceGroupId] && this.state.resourceGroups[item.resourceGroupId].name),
      },
      {
        field: 'created',
        formatter: (item: projectModel.IUIProject) => {
          // render a the timeago value of the creation timestamp (e.g. 4 weeks ago)
          return React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '';
        },
        label: () => t('clg.page.projects.th.created'),
        stringValue: (item: projectModel.IUIProject) => `${this.state.isProjectExpirationEnabled ? item.projectStatus && item.projectStatus.expireTimestamp : item.created}` || '',
      },
    ];
    this.batchActions = [{
      handler: this.batchActionDeleteHandler,
      icon: TrashCan16,
      iconDescription: t('clg.page.projects.action.delete'),
      id: 'delete-rows-button',
      label: t('clg.page.projects.action.delete'),
      validate: this.validateDeleteBatchAction,
    }];

    this.actions = [{
      handler: () => this.navigateToCreateProjectPage(),
      icon: Add16,
      iconDescription: t('clg.page.projects.action.create-project'),
      id: 'create-project',
      label: t('clg.page.projects.action.create-project'),
    }];
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    app.arrivedOnPage('clg.pages.projects');

    // check whether we evaluate the project expiry status
    flagsApi.getFlag(flagsApi.flags.FEATURE_PROJECT_EXPIRATION, (flag) => {
      this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
      if (flag && flag.value === true) {
        this.setState({ isProjectExpirationEnabled: true });
      }
    });

    // load the projects and the resource groups
    this.loadProjects();
    this.loadResourceGroups();
  }

  public componentWillUnmount() {
    // remove the cache listener in order to avoid background syncs with the backend
    if (this.removeProjectsCacheListener) {
      this.removeProjectsCacheListener();
    }
    if (this.removeResourceGroupsCacheListener) {
      this.removeResourceGroupsCacheListener();
    }
  }

  public getRowActions() {
    return [];
  }

  public clickHandler(item: projectModel.IUIProject) {
    if (item.state === projectModel.UIResourceInstanceStatus.ACTIVE) {
      this.props.history.push(nav.toProjectDetail(item.region, item.id));
    }
  }

  public navigateToCreateProjectPage() {
    this.props.history.push(nav.toCreateProject());
  }

  public onProjectsLoaded(projects: projectModel.IUIProject[]) {
    const fn = 'onProjectsLoaded ';
    this.logger.debug(`${fn}>`);

    // only allow item updates from the backend, when there is no current Deleting action ongoing!
    if (this.state.isDeleting) {
      this.logger.debug(`${fn}< isDeleting - so skipping the update`);
    }

    this.itemsAccessMap = {};

    // rebuild the componentAccess map each time the cache gets updated
    for (const item of projects) {
      if (item.state === projectModel.UIResourceInstanceStatus.DELETING) {
        item.isDeleting = true;
        item.isDisabled = true;
      }

      // check whether the project is already ready (tenant and domain, too)
      if (item.state === projectModel.UIResourceInstanceStatus.ACTIVE) {
        const projectFromState = this.getProjectFromState(this.state.projects, item.id);

        // in case the project state has been loaded already, use this one
        if (projectFromState && projectFromState.projectStatus) {
          item.projectStatus = projectFromState.projectStatus;
        }

        // check whether we want to show a toast to honor the succeeded project creation
        if (projectFromState && projectFromState.state !== projectModel.UIResourceInstanceStatus.ACTIVE) {
          // show a toast notification
          const successNotification: viewCommonModels.IClgToastNotification = {
            kind: 'success',
            subtitle: t('clg.page.create.project.success.subtitle', { name: item.name }),
            title: t('clg.page.create.project.success.title'),
          };
          toastNotification.add(successNotification);
          this.logger.debug(`${fn}- creation of project '${item.id}' succeeded - show a toast!`);

          // set the tenant status, initially
          item.projectStatus = {
            domain: false,
            tenant: false,
          };
        }

        if (!item.projectStatus || item.projectStatus.domain === false) {
          this.logger.debug(`${fn}- loading status of project '${item.id}' - resourceState: '${item.state}' projectStatus: '${JSON.stringify(item.projectStatus)}'`);
          this.getProjectStatus(item.region, item.id);
        } else {
          this.logger.trace(`${fn}- no need to load status of project '${item.id}' - resourceState: '${item.state}' projectStatus: '${JSON.stringify(item.projectStatus)}'`);
        }
      }

      // in case the projects is still in creation mode, the table row should be disabled
      if (item.state === projectModel.UIResourceInstanceStatus.PROVISIONING) {
        item.isDisabled = true;
      }

      this.itemsAccessMap[item.id] = item;
    }

    this.logger.debug(`${fn}- ${projects ? projects.length : 'NULL'} projects`);

    this.setState({ projects, isLoadingProjects: false });
    this.logger.debug(`${fn}< SUCCESS`);
  }

  public onProjectsLoadingFailed(requestError: commonModel.UIRequestError) {
    const fn = 'onProjectsLoadingFailed ';
    this.logger.debug(`${fn}> failed to load projects - ${commonModel.stringifyUIRequestError(requestError)}`);

    let errorToShow = requestError;
    let projectsToShow;

    // in case loading projects worked before, we don't want to blow the whole page
    if (this.state.projects) {
      projectsToShow = this.state.projects;
      errorToShow = undefined;
    }

    // show global error state
    this.setState({ projects: projectsToShow, error: errorToShow, isLoadingProjects: false });
    this.logger.debug(`${fn}<`);
  }

  public render() {
    this.logger.debug('render');
    const pageClassNames = 'page list-page clg-project-list-page';

    if (this.state.error) {
      return (
        <div className={pageClassNames}>
          <PageHeader
            title={t('clg.page.projects.title')}
          />
          <div className='page-content'>
            <div className='bx--grid'>
              <Message
                caption={this.state.error.clgId || ''}
                text={`${t('clg.page.error.title')} ${t('clg.page.error.subtitle')}`}
                icon='ERROR'
                isTileWrapped={true}
              />
            </div>
          </div>
        </div>
      );
    }

    let limitationBanner;
    if (this.context.liftedProjectLimitations === false) {
      limitationBanner = (
        <ClgBanner
          className='banner--experimental-limitations'
          icon={<img src={img.get('clg-experimental-banner')} alt='experimental-limitations' />}
          title={t('clg.banner.limitations-experimental.title')}
          description={t('clg.banner.limitations-experimental.description')}
          moreLabel='clg.banner.limitations-experimental.more'
          moreLink={nav.getDocsLink('limits-experimental')}
        />
        );
    }

    return (
      <div className={pageClassNames}>
        <PageHeader title={t('clg.page.projects.title')} />
        <div className='page-content'>
          <div className='bx--grid'>
            <React.Fragment>
              <ClgLiftedLimitations />

              {limitationBanner}

              {this.state.isProjectExpirationEnabled && <ClgProjectExpirationWarnings type='inline' projects={this.state.projects} />}
              <ClgTableWrapper
                title=''
                description=''
                emptyStateComponent={this.renderEmptyState()}
                className='clg-datatable-sortable'
                columns={this.columns}
                items={this.state.projects}
                id='projects-table'
                key='projects-table'
                sortField='created'
                sortDir={-1}
                actions={this.actions}
                batchActions={this.batchActions}
                rowClickHandler={this.clickHandler}
                deleteItemHandler={this.deleteItemHandler}
                disableSelection={this.state.isDeleting}
                isDisabledKey={'isDisabled'}
                onGetClearSelectionFn={this.getClearSelectionFn}
              />
              {this.state.projectToEdit &&
                (
                  <ResourceTagModal
                    onClose={this.tagsEditClose}
                    onSave={this.tagsEditSave}
                    open={typeof this.state.projectToEdit !== 'undefined'}
                    resourceId={this.state.projectToEdit}
                  />
                )
              }
              <ClgConfirmationModal
                addConfirmationCheck={true}
                id={'projects-delete-modal'}
                itemsToConfirm={this.state.projectsToDelete}
                key={'projects-table-modal'}
                isDanger={true}
                onSubmitHandler={this.confirmDeletionHandler}
                onCancelHandler={this.cancelDeletionHandler}
                heading={t('clg.page.projects.delete.modal.title')}
                isOpen={this.state.isDeletionModalOpen}
                primaryBtnText={t('clg.modal.projects.delete.ok')}
                secondaryBtnText={t('clg.modal.button.cancel')}
                messages={[modal.formatBatchDeleteMessage(t('clg.components.type.project'), this.state.projectsToDelete)]}
              />
            </React.Fragment>
          </div>
        </div>
      </div>
    );
  }

  private renderEmptyState() {
    return (
      <div>
        <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2 no-projects'>
          <ClgTeaser
            icon={<img src={img.get('clg-items_projects')} alt='coligo projects' />}
            title='clg.page.projects.noprojects.title'
            description='clg.page.projects.noprojects.desc'
            moreLabel='clg.page.projects.noprojects.more'
            moreLink={nav.getDocsLink('projects')}
            moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
          />
        </div>
      </div>
    );
  }

  /**
   * This method is executed in response to a succeeded tag loading operation of the connected component ResourceTagList
   * @param projectCrn the crn of the project for which the tags have been loaded successfully
   * @param loadedTags the response object of the succeeded tag load operation
   */
  private tagsLoaded(projectCrn: string, loadedTags: any) {
    this.logger.debug(`tagsLoaded > projectCrn: ${projectCrn}, loadedTags: ${JSON.stringify(loadedTags)}`);

    if (loadedTags && loadedTags.success && loadedTags.tags) {

      // load all projectTags
      const projectTagsFastAccessMap = this.state.projectTagsFastAccessMap;

      // convert the list of loaded tags in a format that can be rendered by the TagList
      const projectTags: ITag[] = [];
      for (const tag of loadedTags.tags) {
        projectTags.push({ name: tag.name, type: 'functional' });
      }

      projectTagsFastAccessMap[projectCrn] = projectTags;

      // store the updated tags in the fast access map
      this.setState({ projectTagsFastAccessMap });
    }
  }

  /**
   * This method is executed once the user clicked on edit tag icon wihtin a tag list
   * @param projectCrn the crn of the project
   */
  private editTags(projectCrn) {
    this.logger.debug(`editTags > projectCrn: ${projectCrn}`);
    this.setState({ projectToEdit: projectCrn });
  }

  /**
   * this method is executed once the user decided to close the edit tags modal
   */
  private tagsEditClose() {
    this.logger.debug('tagsEditClose');
    this.setState({ projectToEdit: undefined });
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
      // load all projectTags
      const projectTagsFastAccessMap = this.state.projectTagsFastAccessMap;

      const projectTags: ITag[] = [];
      for (const tag of saveResult.tags) {
        projectTags.push({ name: tag, type: 'functional' });
      }

      // update the fast access map
      projectTagsFastAccessMap[this.state.projectToEdit] = projectTags;

      // close the modal and update the fast access map item of the edited project
      this.setState({ projectToEdit: undefined, projectTagsFastAccessMap });
    }
  }

  private getProjectFromState(projects: projectModel.IUIProject[], id: string): projectModel.IUIProject {
    if (!projects) {
      return undefined;
    }
    for (const project of projects) {
      if (project.id === id) {
        return project;
      }
    }
    return undefined;
  }

  private loadProjects(): void {
    const fn = 'loadProjects ';
    this.logger.debug(`${fn}>`);

    if (this.removeProjectsCacheListener) {
      this.removeProjectsCacheListener();
    }

    // reset the error state
    this.setState({ error: null, isLoadingProjects: true });

    this.removeProjectsCacheListener = cache.listen(this.CACHE_KEY_PROJECTS, this.onProjectsLoaded, this.onProjectsLoadingFailed);
    cache.update(null, this.CACHE_KEY_PROJECTS);
    this.logger.debug(`${fn}<`);
  }

  private loadResourceGroups(): void {
    const fn = 'loadResourceGroups ';
    this.logger.debug(`${fn}>`);

    if (this.removeResourceGroupsCacheListener) {
      this.removeResourceGroupsCacheListener();
    }

    // reset the error state
    this.setState({ error: null, isLoadingResourceGroups: true });

    this.removeResourceGroupsCacheListener = cache.listen(this.CACHE_KEY_RESOURCE_GROUPS, (resourceGroupList: projectModel.IUIResourceGroups) => {
      this.logger.debug(`${fn}- ${resourceGroupList ? resourceGroupList.length : 'NULL'} resource groups`);

      // convert the list of resource groups into a fast access map that can be used to resolve a resource group by using its ID
      const resourceGroupFastAccessMap = {};
      if (resourceGroupList) {
        for (const rg of resourceGroupList) {
          resourceGroupFastAccessMap[rg.id] = rg;
        }
      }

      // store the resource groups
      this.setState({ resourceGroups: resourceGroupFastAccessMap, isLoadingResourceGroups: false });

      // once loaded we can de-register the cache listener
      this.removeResourceGroupsCacheListener();
      this.logger.debug(`${fn}< SUCCESS`);
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load resource groups - ${commonModel.stringifyUIRequestError(requestError)}`);

      // show global error state
      this.setState({ resourceGroups: undefined, error: requestError, isLoadingResourceGroups: false });
      this.logger.debug(`${fn}< ERROR`);
    });
    cache.update(null, this.CACHE_KEY_RESOURCE_GROUPS);
  }

  private getProjectStatus(regionId: string, projectId: string) {
    const fn = 'getProjectStatus ';
    this.logger.debug(`${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

    projectApi.getProjectStatus(regionId, projectId)
      .then((requestResult: commonModel.IUIRequestResult) => {
        this.logger.debug(`${fn}- result: '${commonModel.stringifyUIRequestResult(requestResult)}'`);

        const currentProjectStatus: projectModel.IUIProjectStatus = requestResult.payload;

        // use this flag in order to optimize the number of re-renders
        let changeNeeded = false;

        const projectFromState = this.getProjectFromState(this.state.projects, projectId);
        if (!projectFromState) {
          return;
        }

        // FIXME remove this once the serving API provides the expireTimestamp - calculate the expiryDate
        // uncomment it for test purposes -> see: #317 for further information
        // currentProjectStatus.expireTimestamp = currentProjectStatus.expireTimestamp || projectFromState.created + 1000 * 60 * 60 * 24 * 7;

        const storedDomainStatus = projectFromState.projectStatus ? projectFromState.projectStatus.domain : true;
        const currentDomainStatus = currentProjectStatus.domain;
        this.logger.debug(`${fn}- storedDomainStatus? ${storedDomainStatus}, currentDomainStatus? ${currentDomainStatus}`);

        // determine whether the state has been changed
        if (storedDomainStatus !== currentDomainStatus || !projectFromState.projectStatus) {
          changeNeeded = true;
          // apply the new state
          projectFromState.projectStatus = currentProjectStatus;
        }

        // check whether the state has been to flipped to true, while the user was on the page
        if (!storedDomainStatus && currentDomainStatus) {
          this.showProjectProvisionedToast(projectFromState);
        }

        if (changeNeeded) {
          this.logger.debug(`${fn}- changeNeeded!`);
          // update the project list to reflect the status of the project that has been updated
          this.setState({ projects: this.state.projects });
        }
      }).catch((requestError: commonModel.UIRequestError) => {
        this.logger.warn(`${fn}- An error occurred while retrieving project status: '${commonModel.stringifyUIRequestError(requestError)}'`);
      });
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

  private batchActionDeleteHandler(keys) {
    const fn = 'batchActionDeleteHandler ';
    this.logger.debug(`${fn}> keys: '${JSON.stringify(keys)}'`);

    // in order to have proper names listed in the confirmation modal,
    // we must resolve the keys (aka GUIDs) to their appropriate project names

    const projectNames = [];
    for (const key of keys) {
      for (const project of this.state.projects) {
        if (project.id === key) {
          project.isDeleting = true;
          project.isDisabled = true; // allow table row to be displayed in disabled mode
          projectNames.push(project.name);
          break;
        }
      }
    }

    this.setState({
      isDeletionModalOpen: true,
      keysToDelete: keys,
      projectsToDelete: projectNames,
    });
  }

  private confirmDeletionHandler() {
    const fn = 'confirmDeletionHandler ';
    this.logger.debug(`${fn}>`);
    this.setState((currentState) => {

      // start deleting all selected projects here
      const keys = currentState.keysToDelete;

      this.logger.debug(`${fn}- Deleting ${keys.length} projects now...`);

      promiseEach(keys, 2, (key, idx) => {
        this.logger.debug(`${fn}- Deleting key '${key}' with array idx '${idx}'`);
        return projectApi.deleteProject('all', key)
          .then();
      }, (numInFlight, numResolved, numRejected) => {
        this.logger.debug(`${fn}- Deletion status: ${numInFlight} in-flight, ${numResolved} resolved, ${numRejected} rejected`);
      })
        .then(() => {
          this.logger.debug(`${fn}< SUCCESS - deleted ${keys.length} projects'`);

          this.clearSelection();

          // show a toast notification
          const successNotification: viewCommonModels.IClgToastNotification = {
            kind: 'success',
            subtitle: t('clg.page.project.success.deleteProjects.subtitle', { number: this.state.keysToDelete.length }),
            title: t('clg.page.project.success.deleteProjects.title'),
          };
          toastNotification.add(successNotification);

          // hide the loading animation
          this.setState({
            isDeleting: false,
            isDeletionModalOpen: false,
            keysToDelete: undefined,
            projectsToDelete: undefined,
          },
            () => {
              // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
              // Otherwise it would not have any effect
              cache.update(null, this.CACHE_KEY_PROJECTS);
            });
        })
        .catch((requestError: commonModel.UIRequestError) => {
          this.resetIsDeletingFlags();

          this.logger.error(`${fn}- failed to delete projects - ${commonModel.stringifyUIRequestError(requestError)}`);

          // in case the response could not be mapped to a specific creation error, we should use a generic one
          const errorNotification: viewCommonModels.IClgToastNotification = {
            kind: 'error',
            subtitle: t('clg.page.project.error.deleteProjects.subtitle', { code: (requestError && requestError.error && requestError.error._code) || '-1' }),
            title: t('clg.page.project.error.deleteProjects.title'),
          };
          toastNotification.add(errorNotification);

          this.setState({
            isDeleting: false,
            isDeletionModalOpen: false,
            keysToDelete: undefined,
            projectsToDelete: undefined,
          },
            () => {
              this.loadProjects();
            });

          this.logger.debug(`${fn}< FAILURE - could not delete ${keys.length} projects`);
        });

      return {
        isDeleting: true,
        isDeletionModalOpen: false,
      };
    });
  }

  private resetIsDeletingFlags() {
    // revert 'disabled' value on all projects that were marked for deletion before
    for (const key of this.state.keysToDelete) {
      const project = this.itemsAccessMap[key];
      if (!(project.state === projectModel.UIResourceInstanceStatus.DELETING)) {
        delete project.isDeleting;
        delete project.isDisabled;
      }
    }

    this.setState({
      isDeleting: false,
      isDeletionModalOpen: false,
    });
  }

  private validateDeleteBatchAction(): IClgTableWrapperValidationResult {
    return {
      valid: !this.state.isDeleting,
    };
  }

  private cancelDeletionHandler() {
    this.logger.debug('cancelDeletionHandler');

    this.resetIsDeletingFlags();

    this.setState({
      isDeleting: false,
      isDeletionModalOpen: false,
      keysToDelete: undefined,
      projectsToDelete: undefined
    });
  }

  private deleteItemHandler(item) {
    this.batchActionDeleteHandler([item.id]);
  }

  private clearSelection() {
    if (this.clearSelectionFn) {
      this.clearSelectionFn();
    }
  }

  private getClearSelectionFn(clearFn) {
    this.clearSelectionFn = clearFn;
  }
}
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.
ProjectListPage.contextType = GlobalStateContext;

// @ts-ignore
ProjectListPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default withRouter(ProjectListPage);

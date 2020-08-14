import * as commonModel from '../../../common/model/common-model';
import * as projModel from '../../../common/model/project-model';
import * as commonErrors from './../../../common/Errors';

import {
  IProjectInfo,
  IProjectResource,
  IResourceGroup,
  ITenantStatus
} from './../model/project-resource-model';

import * as k8sMapper from './../mapper/k8s-mapper';
import * as projectResourceMapper from '../mapper/project-resource-mapper';
import * as coligoService from '../services/coligo-service';
import * as k8sService from '../services/k8s-service';
import * as k8sBuildService from '../services/k8s-build-service';
import * as k8sKnService from '../services/k8s-knative-service';
import * as k8sJobsService from '../services/k8s-jobs-service';
import * as k8sSecretsService from '../services/k8s-secrets-service';
import * as k8sConfMapService from '../services/k8s-confmap-service';
import * as launchdarkly from '../services/launchdarkly-service';
import * as resourceControllerService from '../services/resource-controller-service';
import * as coligoUtils from '../utils/coligo-utils';
import * as middlewareUtils from '../utils/middleware-utils';

import * as accessDetailsModel from '../model/access-details-model';
import * as k8sModel from './../model/k8s-model';
import * as helpers from './common-middleware';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:project');

import * as blueProm from 'bluebird';

const INVALID_RESOURCE_PLAN_ID = 'RESOURCE_PLAN_NOT_SET';

const PROJECTEXPIRATION_FEATURE_FLAG = 'coligo-ui-feature-projectexpiration';

function getConfiguredResourcePlanId(): string {
  return process.env.coligoResourcePlanId ? process.env.coligoResourcePlanId : INVALID_RESOURCE_PLAN_ID;
}

export function getProject(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projModel.IUIProject> {
  const fn = 'getProject ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}', regionId: '${regionId}'`);

  return new Promise<projModel.IUIProject>((resolve, reject) => {
    // retrieve the list of multitenant projects
    const resourceControllerProm: Promise<IProjectResource> = resourceControllerService.getProjectResource(ctx, projectId, regionId);

    // wait for the coligo service to retrieve all projects
    resourceControllerProm.then((projectResource: IProjectResource) => {

      // convert the cloud resource to an coligoUI resource
      let project: projModel.IUIProject;
      if (projectResource) {
        project = projectResourceMapper.resourceToProject(projectResource);
      }

      // return the project
      logger.debug(ctx, `${fn}< project: '${JSON.stringify(project)}'`);
      resolve(project);
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve project '${projectId}' of region '${regionId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetProjectError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listProjects(ctx: commonModel.IUIRequestContext, regionId?: string): Promise<projModel.IUIProjects> {
  const fn = 'listProjects ';
  logger.debug(ctx, `${fn}>`);

  return new Promise<projModel.IUIProjects>((resolve, reject) => {
    // retrieve the list of multitenant projects
    const resourceControllerProm: Promise<IProjectResource[]> = resourceControllerService.getProjectResources(ctx, regionId);

    // wait for the coligo service to retrieve all projects
    resourceControllerProm.then((projectResources: IProjectResource[]) => {

      // map IProjectResource to IUIProjects
      let projects: projModel.IUIProjects = [];
      if (projectResources && projectResources.length > 0) {
        projects = projectResources.map((projectResource) => (projectResourceMapper.resourceToProject(projectResource)));
      }

      logger.debug(ctx, `${fn}< ${projects.length} projects`);

      // return the list of projects
      resolve(projects);
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve projects of region '${regionId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetProjectsError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listResourceGroups(ctx: commonModel.IUIRequestContext, regionId?: string): Promise<projModel.IUIResourceGroups> {
  const fn = 'listResourceGroups ';
  logger.debug(ctx, `${fn}>`);

  return new Promise<projModel.IUIResourceGroups>((resolve, reject) => {
    // retrieve the list of resource groups from the Cloud Resource Manager API
    const resourceControllerProm: Promise<IResourceGroup[]> = resourceControllerService.getResourceGroups(ctx);

    // wait for the coligo service to retrieve all resource groups
    resourceControllerProm.then((resourceGroupList: IResourceGroup[]) => {

      // map IProjectResource to IUIProjects
      let resourceGroups: projModel.IUIResourceGroups = [];
      if (resourceGroupList && resourceGroupList.length > 0) {
        resourceGroups = resourceGroupList.map((resourceGroup) => (projectResourceMapper.resourceControllerResourceToResourceGroup(resourceGroup)));
      }

      logger.debug(ctx, `${fn}< ${resourceGroups.length} resource groups`);

      // return the list of resource groups
      resolve(resourceGroups);
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve resource groups`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetResourceGroupsError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listRegions(ctx: commonModel.IUIRequestContext): Promise<projModel.IUIRegions> {
  const fn = 'listRegions ';
  logger.debug(ctx, `${fn}>`);

  return new Promise<projModel.IUIRegions>((resolve) => {
    // retrieve the list of regions
    const regions: projModel.IUIRegions = coligoUtils.getRegions();

    logger.debug(ctx, `${fn}< ${regions.length} regions`);

    // return the list of regions
    resolve(regions);
  });
}

/**
 * This method is responsible for creating a new project
 * @param ctx - the request context
 * @param projectToCreate - the project that should be created
 */
export function createProject(ctx: commonModel.IUIRequestContext, projectToCreate: projModel.IUIProject): Promise<projModel.IUIProject> {
  const fn = 'createProject ';
  logger.debug(ctx, `${fn}> projectToCreate: '${JSON.stringify(projectToCreate)}'`);

  // set the correct plan id for the resource
  projectToCreate.resourcePlanId = getConfiguredResourcePlanId();

  return new Promise<projModel.IUIProject>((resolve, reject) => {

    // check whether the resource plan id is configured properly
    if (projectToCreate.resourcePlanId === INVALID_RESOURCE_PLAN_ID) {
      const error = new commonErrors.FailedToCreateProjectDueToInvalidPlanIdError();
      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      throw error;
    }

    // convert the UI project to a cloud resource
    const projectInstanceToCreate: IProjectResource = projectResourceMapper.projectToResourceInstance(projectToCreate);

    // check whether there is a project with the same name in that region
    listProjects(ctx, projectToCreate.region)
      .then((existingProjects: projModel.IUIProject[]) => {
        logger.debug(ctx, `${fn}- user has already ${existingProjects && existingProjects.length} projects`);

        // check whether there is already a project with that name in the same region
        if (existingProjects) {
          for (const existingProject of existingProjects) {
            if (existingProject.name === projectInstanceToCreate.name && existingProject.region === projectInstanceToCreate.region) {
              throw new commonErrors.FailedToCreateProjectBecauseAlreadyExistsError(existingProject.name, existingProject.region);
            }
          }
        }

        // create the project resource
        return resourceControllerService.createProjectResource(ctx, projectInstanceToCreate);
      })
      .then((createdProjectResource: IProjectResource) => {
        logger.debug(ctx, `${fn}- created project resource: '${JSON.stringify(createdProjectResource)}'`);

        // map the project resource to an IUIProject
        const createdProject: projModel.IUIProject = projectResourceMapper.resourceToProject(createdProjectResource);

        logger.debug(ctx, `${fn}< '${JSON.stringify(createdProject)}'`);
        resolve(createdProject);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the project '${JSON.stringify(projectToCreate)}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateProjectError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function deleteProject(ctx: commonModel.IUIRequestContext, projectId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteProject ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // delete the project resource
    resourceControllerService.deleteProjectResource(ctx, projectId)
      .then((deletionResult) => {

        // craft a UIOperationResult
        const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(commonModel.UIOperationStatus.OK);

        logger.debug(ctx, `${fn}< '${JSON.stringify(operationResult)}'`);
        return resolve(operationResult);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to delete project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteProjectError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function getProjectStatus(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projModel.IUIProjectStatus> {
  const fn = 'getProjectStatus ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}', regionId: '${regionId}'`);

  // evaluate the feature flag that decides which backend should be called to retrieve the information
  return launchdarkly.getFlagSync(ctx, PROJECTEXPIRATION_FEATURE_FLAG)
    .catch((err) => {
      logger.error(ctx, `${fn}- Error while evaluating LaunchDarkly feature flag '${PROJECTEXPIRATION_FEATURE_FLAG}' - error: ${err.message}`);

      // fallback to the "old" backend aka play-safe
      return false;
    })
    .then((value: boolean) => {
      let projectStatusProm: Promise<projModel.IUIProjectStatus>;

      if (value === true) {
        // the endpoint that provides all project releated information
        projectStatusProm = this.getProjectInfo(ctx, projectId, regionId);
      } else {
        // the endpoint that only provides information related to the tenant status
        projectStatusProm = this.getTenantStatus(ctx, projectId, regionId);
      }

      logger.debug(ctx, `${fn}<`);
      return projectStatusProm;
    })
    .catch((err) => {
      logger.error(ctx, `${fn}- Error while retrieving project status of project '${projectId}' - error: ${err.message}`);

      // fallback to the "old" backend aka play-safe
      const projectStatusProm = this.getTenantStatus(ctx, projectId, regionId);

      logger.debug(ctx, `${fn}<`);
      return projectStatusProm;
    });
}

export function getTenantStatus(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projModel.IUIProjectStatus> {
  const fn = 'getTenantStatus ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}', regionId: '${regionId}'`);

  return new Promise<projModel.IUIProjectStatus>((resolve, reject) => {

    // retrieve the status of the tenant
    const tenantStatusProm: Promise<ITenantStatus> = coligoService.getTenantStatus(ctx, regionId, projectId);

    // wait for the coligo service to retrieve the status
    tenantStatusProm.then((tenantStatus: ITenantStatus) => {
      logger.debug(ctx, `${fn}- tenantStatus: '${JSON.stringify(tenantStatus)}'`);

      // convert the cloud resource to an coligoUI resource
      let projectStatus: projModel.IUIProjectStatus;
      if (tenantStatus) {
        projectStatus = projectResourceMapper.tenantStatusToProjectStatus(tenantStatus);
      } else {
        projectStatus = {
          domain: false,
          tenant: false,
        };
      }

      // return the projectStatus
      logger.debug(ctx, `${fn}< projectStatus: '${JSON.stringify(projectStatus)}'`);
      resolve(projectStatus);
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve status of project '${projectId}' of region '${regionId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetProjectStatusError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function getProjectInfo(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projModel.IUIProjectStatus> {
  const fn = 'getProjectInfo ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}', regionId: '${regionId}'`);

  return new Promise<projModel.IUIProjectStatus>((resolve, reject) => {

    // retrieve the information of the project
    const projectInfoProm: Promise<IProjectInfo> = coligoService.getProjectInfo(ctx, regionId, projectId);

    // wait for the coligo service to retrieve the information
    projectInfoProm.then((projectInfo: IProjectInfo) => {
      logger.debug(ctx, `${fn}- projectInfo: '${JSON.stringify(projectInfo)}'`);

      // convert the backend resource to an coligoUI resource
      let projectStatus: projModel.IUIProjectStatus;
      if (projectInfo) {
        projectStatus = projectResourceMapper.projectInfoToProjectStatus(projectInfo);
      } else {
        projectStatus = {
          domain: false,
          tenant: false,
        };
      }

      // return the projectStatus
      logger.debug(ctx, `${fn}< projectStatus: '${JSON.stringify(projectStatus)}'`);
      resolve(projectStatus);
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve information of project '${projectId}' of region '${regionId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetProjectStatusError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

function retrieveEntityStats(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Array<Promise<k8sModel.IResourceStats>> {

  const entityStatsProms: Array<Promise<k8sModel.IResourceStats>> = [];

  // get number of applications
  entityStatsProms.push(k8sKnService.getNumberOfKnServices(ctx, accessDetails));

  // get number of jobdefinitions and jobruns
  entityStatsProms.push(k8sJobsService.getNumberOfJobDefinitions(ctx, accessDetails));
  entityStatsProms.push(k8sJobsService.getNumberOfJobRuns(ctx, accessDetails));

  // get number of builds and build runs
  entityStatsProms.push(k8sBuildService.getNumberOfBuilds(ctx, accessDetails));
  entityStatsProms.push(k8sBuildService.getNumberOfBuildRuns(ctx, accessDetails));

  // get number of container registries and secrets
  entityStatsProms.push(k8sSecretsService.getNumberOfSecrets(ctx, accessDetails, 'registry'));
  entityStatsProms.push(k8sSecretsService.getNumberOfSecrets(ctx, accessDetails, 'generic'));

  // get number of config maps
  entityStatsProms.push(k8sConfMapService.getNumberOfConfigMaps(ctx, accessDetails));

  return entityStatsProms;
}

function getEntityStats(ctx: commonModel.IUIRequestContext, accessDetails: accessDetailsModel.IAccessDetails): Promise<{ [key: string]: number }> {
  const fn = 'getEntityStats ';
  logger.debug(ctx, `${fn}> accessDetails: '${accessDetailsModel.stringify(accessDetails)}'`);

  const entityStats: { [key: string]: number } = {};

  return new Promise((resolve, reject) => {
    const entityStatsProms: Array<Promise<k8sModel.IResourceStats>> = [];

    // trigger all entity stats retrievals
    entityStatsProms.push(...retrieveEntityStats(ctx, accessDetails));

    // wait for all entity stats
    Promise
      .all(entityStatsProms.map((prom: Promise<k8sModel.IResourceStats>) => prom.catch((err: Error) => err)))
      .then((allStats: k8sModel.IResourceStats[]) => {

        for (const stats of allStats) {
          entityStats[stats.id] = stats.count;
        }

        // return the stats as map that contains key value pairs
        logger.debug(ctx, `${fn}< entityStats: '${JSON.stringify(entityStats)}'`);
        resolve(entityStats);
      })
      .catch((err) => {
        logger.error(ctx, `${fn}- failed to retrieve entity stats`, err);
        logger.debug(ctx, `${fn}< EMPTY stats`);
        resolve(entityStats);
      });
  });
}

export function getProjectConsumptionInfo(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<projModel.IUIProjectConsumptionInfo> {
  const fn = 'getProjectConsumptionInfo ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

  return new Promise<projModel.IUIProjectConsumptionInfo>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const projectResourcesProm = kubeApiAccessDetailsProm
      .then((kubeAccessDetails: accessDetailsModel.IAccessDetails) => (
        // retrieve the all kube pods of the given namespace
        k8sService.getKubernetesPodsOfNamespace(ctx, kubeAccessDetails)
      ))
      .then((pods: k8sModel.IKubernetesPod[]) => {

        // filter only running pods
        pods = pods.filter((pod: k8sModel.IKubernetesPod) => (pod.status && pod.status.phase === 'Running'));

        // map each IKubernetesPod to an IUIInstance
        const instances: commonModel.IUIInstance[] = k8sMapper.podsToInstances(pods);

        // init a new consumption stats object
        const projectConsumptionInfo: projModel.IUIProjectConsumptionInfo = projModel.getNewProjectConsumptionInfo();

        projectConsumptionInfo.totalNumberOfInstances = instances.length;
        projectConsumptionInfo.instances = instances;

        // iterate over each pod and extract memory, cpu information
        instances.forEach((instance) => {
          projectConsumptionInfo.totalMemory += instance.memory;
          projectConsumptionInfo.totalCpus += instance.cpus;
          if (instance.componentKind === commonModel.UIEntityKinds.APPLICATION) {
            projectConsumptionInfo.numberOfAppInstances += 1;
            projectConsumptionInfo.memoryOfAppInstances += instance.memory;
            projectConsumptionInfo.cpusOfAppInstances += instance.cpus;
          } else if (instance.componentKind === commonModel.UIEntityKinds.BUILDRUN) {
            projectConsumptionInfo.numberOfBuildInstances += 1;
            projectConsumptionInfo.memoryOfBuildInstances += instance.memory;
            projectConsumptionInfo.cpusOfBuildInstances += instance.cpus;
          } else if (instance.componentKind === commonModel.UIEntityKinds.JOBRUN) {
            projectConsumptionInfo.numberOfJobInstances += 1;
            projectConsumptionInfo.memoryOfJobInstances += instance.memory;
            projectConsumptionInfo.cpusOfJobInstances += instance.cpus;
          }
        });

        logger.debug(ctx, `${fn}< ${projectConsumptionInfo && projectConsumptionInfo.totalNumberOfInstances} instances`);
        return projectConsumptionInfo;
      })
      .catch((err) => {
        logger.error(ctx, `${fn}- failed to retrieve resource consumption`, err);
        logger.debug(ctx, `${fn}< EMPTY consumption`);
        return projModel.getNewProjectConsumptionInfo();
      });

    const entityStatsProm = kubeApiAccessDetailsProm
      .then((kubeAccessDetails: accessDetailsModel.IAccessDetails) => (
        // retrieve the all entity statistics
        getEntityStats(ctx, kubeAccessDetails)
      ));

    // use bluebird join function to wait for the results of both calls
    blueProm
      .join(projectResourcesProm, entityStatsProm, (projectConsumption: projModel.IUIProjectConsumptionInfo, entityStats: {[key: string]: number}) => {

        // add the entity stats to the resource consumption
        projectConsumption.entityStats = entityStats;

        logger.debug(ctx, `${fn}< ${projModel.stringifyConsumption(projectConsumption)}`);
        resolve(projectConsumption);
      })
      .catch ((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the consumption info of project '${projectId}' in region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetProjectConsumptionInfoError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

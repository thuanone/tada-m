import { stringify } from './../../../common/Errors';
/**
 * This service provides methods to interact with the IBM Cloud Resource Controller API
 * For API docs see:
 *  Controller: https://cloud.ibm.com/apidocs/resource-controller/resource-controller
 *  Manager: https://cloud.ibm.com/apidocs/resource-controller/resource-manager
 */
const COMP_NAME = 'resource-controller';

import { IResourceControllerErrorResponse } from './../model/project-resource-model';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as nconf from 'nconf';

import * as commonModel from '../../../common/model/common-model';
import * as commonErrors from './../../../common/Errors';

import * as projectResourceMapper from '../mapper/project-resource-mapper';
import * as projectModel from '../model/project-resource-model';

import * as iamService from './ic-iam-service';

import * as coligoUtils from '../utils/coligo-utils';
import * as httpUtils from '../utils/http-utils';

const RESOURCE_ID = process.env.coligoResourceId;

const resourceControllerUrl = nconf.get('resourceControllerUrl') || process.env.resourceControllerUrl || 'https://resource-controller.cloud.ibm.com';

function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken: string): { [key: string]: string } {

  // retrieve a set of common headers from a utils functions
  const headers = Object.assign({}, httpUtils.getCommonHeaders(ctx, accessToken));

  // add resource controller specific headers
  headers.Accept = 'application/json';
  headers['Cache-Control'] = 'max-age=0, no-cache, no-store';
  headers['Content-Type'] = 'application/json';

  return headers;
}

function handleResourceControllerErrors(rcError: IResourceControllerErrorResponse, errMessage: string): commonErrors.GenericUIError {
  let err;
  if (rcError && rcError.status_code === 401) {
    err = new commonErrors.FailedToAccessResourceControllerDueTokenExpiredError(new Error(rcError.message));
  } else if (rcError && rcError.details && rcError.details.indexOf('E1012') > -1) {
    err = new commonErrors.FailedToCreateProjectBecauseLimitReachedError(new Error(rcError.message));
  }

  return err;
}

/**
 * Creates a project resource using the Cloud resource controller API
 * @param {IUIRequestContext} ctx - the HTTP context object which needs to be passed over to allow object caching
 * @param {String} resourceInstanceToCreate - the id of the region (e.g. us-south, us-east)
 */
export function createProjectResource(ctx: commonModel.IUIRequestContext, resourceInstanceToCreate: projectModel.IProjectResource): Promise<projectModel.IProjectResource> {
  const fn = 'createProjectResource ';
  logger.debug(ctx, `${fn}> resourceInstanceToCreate: '${JSON.stringify(resourceInstanceToCreate)}'`);

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::createProjectResource`;

  // retrieve the IAM token
  const accessToken = iamService.getIAMAccessToken(ctx);

  // map the project resource to a simpler payload object
  const instancePayload = {
    name: resourceInstanceToCreate.name,
    parameters: {
      name: resourceInstanceToCreate.name,
    },
    resource_group: resourceInstanceToCreate.resource_group_id,
    resource_plan_id: resourceInstanceToCreate.resource_plan_id,
    tags: resourceInstanceToCreate.tags || [],
    target: resourceInstanceToCreate.region,
  };
  logger.debug(ctx, `${fn}- instancePayload: '${JSON.stringify(instancePayload)}'`);

  const options = {
    cachePolicy: 'NO_CACHE',
    data: instancePayload,
    headers: getCommonHeaders(ctx, accessToken),
    json: true,
    method: 'POST',
    path: '/v2/resource_instances',
    strictSSL: true,
    urls: resourceControllerUrl,
  };
  // send the HTTP request
  return httpUtils
    .sendRequest(ctx, monitorName, options)
    .then((projectResourcesResult) => {

      if (!projectResourcesResult.id) {
        logger.warn(ctx, `${fn}- the retrieved result from the resource controller does not match our expectations (property id is missing). responseContent: '${JSON.stringify(projectResourcesResult)}'`);
        const errorToReject = new commonErrors.FailedToAccessResourceControllerDueWrongResponseFormatError(new Error('Result from the resource controller does not match our expectations (property id is missing)'));
        logger.debug(ctx, `${fn}< ERR - ${typeof errorToReject}`);
        throw errorToReject;
      }

      logger.debug(ctx, `resource: '${JSON.stringify(projectResourcesResult)}'`);

      // reduce the original resource instance objects to objects that our application needs
      const project: projectModel.IProjectResource = projectResourceMapper.resourceControllerResourceToProject(projectResourcesResult);
      logger.trace(ctx, `${fn}- project: '${JSON.stringify(project)}'`);

      logger.debug(ctx, `${fn}< '${project.guid}'`);
      return project;
    }).catch((err) => {
      let errorToReject = err;
      if ((err instanceof commonErrors.BackendApiError)) {
        // try to parse the error response
        const rcError: IResourceControllerErrorResponse = projectResourceMapper.parseResourceControllerError(err.responseContent);

        const errMessage = `Error creating project '${JSON.stringify(resourceInstanceToCreate)}' - rcError: '${JSON.stringify(rcError)}', error: '${err}'`;
        logger.warn(ctx, `${fn}- ${errMessage} - rcError: '${commonErrors.stringify(rcError)}'`);
        errorToReject = handleResourceControllerErrors(rcError, errMessage) || new commonErrors.FailedToCreateProjectError(new Error(errMessage));
      } else if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to create project '${JSON.stringify(resourceInstanceToCreate)}'`, err);
        // wrap the error object in a specifc coligo error object
        errorToReject = new commonErrors.FailedToCreateProjectError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
      throw errorToReject;
    });
}

export function getServiceStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  const fn = 'getServiceStatus ';
  logger.debug(ctx, `${fn}>`);

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::getServiceStatus`;

  const resourceControllerStatus: commonModel.IUIServiceStatus = {
    id: 'resource-controller',
    status: 'ERROR',
  };

  // retrieve the IAM token
  const accessToken = iamService.getIAMAccessToken(ctx);

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getCommonHeaders(ctx, accessToken),
    json: true,
    method: 'GET',
    path: '/info',
    urls: resourceControllerUrl,
  };

  // send the HTTP request
  return httpUtils
    .sendRequest(ctx, monitorName, options)
    .then((responseContent) => {

      // set the status
      resourceControllerStatus.status = 'OK';

      logger.debug(ctx, `${fn}< ${resourceControllerStatus.status}`);
      return resourceControllerStatus;
    }).catch((err) => {
      // set the status
      resourceControllerStatus.status = 'FAILED';

      if ((err instanceof commonErrors.BackendApiError)) {
        // try to parse the error response
        const rcError: IResourceControllerErrorResponse = projectResourceMapper.parseResourceControllerError(err.responseContent);
        resourceControllerStatus.details = rcError && rcError.message;
      } else {
        resourceControllerStatus.details = err.toString();
      }

      logger.debug(ctx, `${fn}< ${resourceControllerStatus.status}`);
      return resourceControllerStatus;
    });
}

/**
 * Retrieve all multi-tenant enabled projects of the given user
 * @param {IUIRequestContext} ctx - the HTTP context object which needs to be passed over to allow object caching
 * @param {String} regionId - the id of the region (e.g. us-south, us-east)
 */
export function getProjectResources(ctx: commonModel.IUIRequestContext, regionId: string, nexUrl?: string, list?: projectModel.IProjectResource[]): Promise<projectModel.IProjectResource[]> {
  const fn = 'getProjectResources ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', nexUrl: '${nexUrl}'`);

  // build the query
  const qs: { [key: string]: string } = {};

  // in case there is a next URL, we can skip the query creation, as the next url already contains all parameters
  if (!nexUrl) {
    qs.type = 'service_instance';
    qs.resource_id = RESOURCE_ID;
    qs.limit = '100'; // default and max page size
  }

  // retrieve the IAM token
  const accessToken = iamService.getIAMAccessToken(ctx);

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getCommonHeaders(ctx, accessToken),
    json: true,
    method: 'GET',
    path: nexUrl || `/v2/resource_instances?resource_id=${RESOURCE_ID}&type=service_instance`,
    qs,
    strictSSL: true,
    urls: resourceControllerUrl,
  };

  // the monitor name is used to track this request
  const monitorName = `${COMP_NAME}::getProjectResources`;

  // send the HTTP request
  return httpUtils
    .sendRequest(ctx, monitorName, options)
    .then((projectResourcesResult) => {

      if (!projectResourcesResult.resources) {
        logger.warn(ctx, `${fn}- the retrieved result from the resource controller does not match our expectations (resources are missing). responseContent: '${JSON.stringify(projectResourcesResult)}'`);
        const errorToReject = new commonErrors.FailedToAccessResourceControllerDueWrongResponseFormatError(new Error('Result from the resource controller does not match our expectations (resources are missing)'));
        logger.debug(ctx, `${fn}< ERR - ${typeof errorToReject}`);
        throw errorToReject;
      }
      logger.trace(ctx, `resources: '${JSON.stringify(projectResourcesResult.resources)}'`);

      // reduce the original namespace objects to objects that our application needs
      let projects: projectModel.IProjectResource[] = projectResourcesResult.resources.map(projectResourceMapper.resourceControllerResourceToProject);
      logger.debug(ctx, `${fn}- retrieved ${(projects && Array.isArray(projects)) ? projects.length : 'NULL'} projects`);
      logger.trace(ctx, `${fn}- projects: '${JSON.stringify(projects)}'`);

      // this filter all projects for specific regions
      projects = projects.filter((projectResource: projectModel.IProjectResource) => (coligoUtils.isMultitenantRegion(projectResource.region)));
      logger.debug(ctx, `${fn}- identified ${(projects && Array.isArray(projects)) ? projects.length : 'NULL'} potential coligo projects`);

      // concat the result with the given list
      const resultList = [...(list || []), ...(projects)];

      // check whether there are more pages that should be fetched
      if (projectResourcesResult.next_url) {
        logger.debug(ctx, `${fn}- next url: '${projectResourcesResult.next_url}'`);
        return getProjectResources(ctx, regionId, projectResourcesResult.next_url, resultList);
      }

      logger.debug(ctx, `${fn}< ${resultList.length} projects`);
      return resultList as projectModel.IProjectResource[];
    })
    .catch((err) => {
      let errorToReject = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve projects of region '${regionId}'`, err);
        // wrap the error object in a specifc coligo error object
        errorToReject = new commonErrors.FailedToGetProjectsError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
      throw errorToReject;
    });
}

export function getProjectResource(ctx: commonModel.IUIRequestContext, projectId: string, regionId: string): Promise<projectModel.IProjectResource> {
  const fn = 'getProjectResource ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}', regionId: '${regionId}'`);

  return new Promise<projectModel.IProjectResource>((resolve, reject) => {

    // retrieving a list of all project resources and then filtering the results
    // looks weird, but is necessary, due to the fact the you would need
    // a full crn to retrieve a single resource controller instance
    getProjectResources(ctx, regionId)
      .then((projects: projectModel.IProjectResource[]) => {

        if (projects) {
          for (const project of projects) {
            if (project.guid === projectId) {
              logger.debug(ctx, `${fn}< project: '${project.guid}'`);
              resolve(project);
              return;
            }
          }
        }

        const errorToReject = new commonErrors.FailedToGetProjectError(new Error(`Could not find project '${projectId}' in region '${regionId}'`));
        logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
        reject(errorToReject);
      })
      .catch((err) => {
        let errorToReject = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to retrieve project '${projectId}' of region '${regionId}'`, err);
          // wrap the error object in a specifc coligo error object
          errorToReject = new commonErrors.FailedToGetProjectError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
        reject(errorToReject);
      });
  });
}

/**
 * This function deletes a project resource
 *
 * @param {IUIRequestContext} ctx - the request context
 * @param {String} projectId - the short or long ID of the project instance
 */
export function deleteProjectResource(ctx: commonModel.IUIRequestContext, projectId: string): Promise<number> {
  const fn = 'deleteProjectResource ';
  logger.debug(ctx, `${fn}> projectId: '${projectId}'`);

  // input check
  if (!projectId) {
    const errorMsg = 'projectId must be set properly';
    logger.trace(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new commonErrors.FailedToDeleteProjectError(new Error(errorMsg)));
  }

  // retrieve the IAM token
  const accessToken = iamService.getIAMAccessToken(ctx);

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getCommonHeaders(ctx, accessToken),
    json: true,
    method: 'DELETE',
    path: `/v2/resource_instances/${projectId}`,
    strictSSL: true,
    urls: resourceControllerUrl,
  };

  // prepare performance monitoring
  const monitorName = `${COMP_NAME}::deleteProjectResource`;

  // send the HTTP request
  return httpUtils
    .sendRequest(ctx, monitorName, options)
    .then((result) => {
      logger.debug(ctx, `${fn}<`);
      return result;
    })
    .catch((err) => {
      let errorToReject = err;

      if ((err instanceof commonErrors.BackendApiError)) {
        // try to parse the error response
        const rcError: IResourceControllerErrorResponse = projectResourceMapper.parseResourceControllerError(err.responseContent);

        const errMessage = `Error deleting project '${projectId}' - rcError: '${JSON.stringify(rcError)}', error: '${err}'`;
        logger.warn(ctx, `${fn}- ${errMessage} - rcError: '${commonErrors.stringify(rcError)}'`);
        errorToReject = handleResourceControllerErrors(rcError, errMessage) || new commonErrors.FailedToDeleteProjectError(new Error(errMessage));
      } else if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to delete project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        errorToReject = new commonErrors.FailedToDeleteProjectError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
      throw errorToReject;
    });
}

/**
 * Retrieve all resource groups of the current account
 * @param {IUIRequestContext} ctx - the HTTP context object which needs to be passed over to allow object caching
 */
export function getResourceGroups(ctx: commonModel.IUIRequestContext): Promise<projectModel.IResourceGroup[]> {
  const fn = 'getResourceGroups ';
  logger.debug(ctx, `${fn}>`);

  // retrieve the account id from the request context
  const accountId = iamService.getAccountId(ctx);
  if (!accountId) {
    const errorToReject = new commonErrors.FailedToGetResourceGroupsError(new Error('Failed to retrieve the account id'));
    logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
    return Promise.reject(errorToReject);
  }

  // retrieve the IAM token
  const accessToken = iamService.getIAMAccessToken(ctx);

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getCommonHeaders(ctx, accessToken),
    json: true,
    method: 'GET',
    path: `/v2/resource_groups?account_id=${accountId}`,
    strictSSL: true,
    urls: resourceControllerUrl,
  };

  const monitorName = `${COMP_NAME}::getResourceGroups`;

  // send the HTTP request
  return httpUtils
    .sendRequest(ctx, monitorName, options)
    .then((resourceGroupsResult) => {

      if (!resourceGroupsResult.resources) {
        logger.warn(ctx, `${fn}- the retrieved result from the resource controller does not match our expectations (resources are missing). responseContent: '${JSON.stringify(resourceGroupsResult)}'`);
        const errorToReject = new commonErrors.FailedToAccessResourceControllerDueWrongResponseFormatError(new Error('Result from the resource controller does not match our expectations (resources are missing)'));
        logger.debug(ctx, `${fn}< ERR - ${typeof errorToReject}`);
        throw errorToReject;
      }

      logger.trace(ctx, `resources: '${JSON.stringify(resourceGroupsResult.resources)}'`);

      // TODO enabled paging

      // reduce the original resource group objects to objects that our application needs
      const resourceGroups: projectModel.IResourceGroup[] = resourceGroupsResult.resources.map(projectResourceMapper.resourceControllerResourceToResourceGroup);
      logger.debug(ctx, `${fn}- resourceGroups: '${JSON.stringify(resourceGroups)}'`);

      logger.debug(ctx, `${fn}< ${(resourceGroups && Array.isArray(resourceGroups)) ? resourceGroups.length : 'NULL'} resource groups`);
      return resourceGroups;
    }).catch((err) => {
      let errorToReject = err;

      if ((err instanceof commonErrors.BackendApiError)) {
        // try to parse the error response
        const rcError: IResourceControllerErrorResponse = projectResourceMapper.parseResourceControllerError(err.responseContent);

        const errMessage = `Error getting resource groups of account '${accountId}' - rcError: '${JSON.stringify(rcError)}', error: '${err}'`;
        logger.warn(ctx, `${fn}- ${errMessage} - rcError: '${commonErrors.stringify(rcError)}'`);
        errorToReject = handleResourceControllerErrors(rcError, errMessage) || new commonErrors.FailedToGetResourceGroupsError(new Error(errMessage));

      } else if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to retrieve resource groups of account '${accountId}'`, err);
        // wrap the error object in a specifc coligo error object
        errorToReject = new commonErrors.FailedToGetResourceGroupsError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${Object.prototype.toString.call(errorToReject)}: ${commonErrors.stringify(errorToReject)}`);
      throw errorToReject;
    });
}

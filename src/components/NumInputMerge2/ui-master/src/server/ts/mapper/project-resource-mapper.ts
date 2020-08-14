import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:project');

import * as commonModel from '../../../common/model/common-model';
import * as projectModel from '../../../common/model/project-model';
import * as projectResourceModel from '../model/project-resource-model';

import { safeSecondsToMillis, valueAOrB } from '../utils/middleware-utils';

function extractUUIDFromCrn(resource: any): string {

  if (!resource || !resource.id || !resource.account_id) {
    return undefined;
  }

  // "crn:v1:bluemix:public:functions:us-south:a/7658687ea07db8396963ebe2b8e1897d:0ca4b9a5-c9e8-4d1d-953b-3ffc3f1bd178::"
  let id = resource.id;
  const accountId = resource.account_id;

  // TODO make this more robust (e.g. by using regexp)
  id = id.substring(id.indexOf(accountId) + accountId.length + 1);
  id = id.substring(0, id.indexOf('::'));
  return id;
}

/**
 * This method converts a resource controller resource to an IProjectResource
 * @param item - a resource controller resource
 */
export function resourceControllerResourceToProject(resource: any): projectResourceModel.IProjectResource {
  const fn = 'resourceControllerResourceToProject ';
  logger.trace(`${fn}> resource: '${JSON.stringify(resource)}'`);

  if (!resource) {
    logger.trace(`${fn}< NULL - given resource is NULL or undefined`);
    return undefined;
  }

  // extract the resource UUID from the resource
  const identifier = extractUUIDFromCrn(resource);
  if (!identifier) {
    logger.trace(`${fn}< NULL - could not extract an identifier`);
    return undefined;
  }

  // build the project resource
  const project: projectResourceModel.IProjectResource = {
    created: Date.parse(resource.created_at),
    crn: resource.id,
    guid: identifier,
    last_operation: resource.last_operation,
    name: resource.name,
    region: resource.region_id,
    resource_group_id: resource.resource_group_id,
    resource_plan_id: resource.resource_plan_id,
    state: resource.state,
    tags: resource.tags,
  };

  logger.trace(`${fn}< '${JSON.stringify(project)}'`);
  return project;
}

/**
 * This method converts an IProjectResource to an IUIProject
 * @param {knativeModel.IProjectResource} projectResource - a ibm cloud resource
 */
export function resourceToProject(projectResource: projectResourceModel.IProjectResource): projectModel.IUIProject {
  const fn = 'resourceToProject ';
  logger.trace(`${fn}> projectResource: '${JSON.stringify(projectResource)}'`);

  if (!projectResource) {
    logger.trace(`${fn}< NULL - given project resource is NULL or undefined`);
    return undefined;
  }

  // build the IUIProject
  const project: projectModel.IUIProject = {
    created: projectResource.created,
    crn: projectResource.crn,
    id: projectResource.guid,
    kind: commonModel.UIEntityKinds.PROJECT,
    name: projectResource.name,
    region: projectResource.region,
    resourceGroupId: projectResource.resource_group_id,
    resourcePlanId: projectResource.resource_plan_id,
    state: toResourceInstanceState(projectResource.state, projectResource.last_operation),
  };

  logger.trace(`${fn}< '${JSON.stringify(project)}'`);
  return project;
}

/**
 * This method converts an IUIProject to an projectResourceModel.IProjectResource
 * @param {projectModel.IUIProject} project - a ibm cloud resource
 */
export function projectToResourceInstance(project: projectModel.IUIProject): projectResourceModel.IProjectResource {
  const fn = 'projectToResourceInstance ';
  logger.trace(`${fn}> project: '${JSON.stringify(project)}'`);

  if (!project) {
    logger.trace(`${fn}< NULL - given project is NULL or undefined`);
    return undefined;
  }

  // build the IProjectResource
  const resource: projectResourceModel.IProjectResource = {
    created: project.created,
    crn: project.crn,
    guid: project.id,
    name: project.name,
    region: project.region,
    resource_group_id: project.resourceGroupId,
    resource_plan_id: project.resourcePlanId,
    tags: project.tags,
  };

  logger.trace(`${fn}< '${JSON.stringify(resource)}'`);
  return resource;
}

/**
 * {"error_code":"RC-IamErrorResponse","message":"Token is expired","status_code":401,"transaction_id":"bss-b454461a71ee474d"}
 * @param responseBody the response body that should be parsed
 */
export function parseResourceControllerError(responseBody: any): projectResourceModel.IResourceControllerErrorResponse | any {
  const fn = 'parseResourceControllerError ';
  try {

    // NPE check
    if (!responseBody) {
      return undefined;
    }

    // check whether the given object is already a error response conform JSON object
    if (responseBody && responseBody.transaction_id) {
      return responseBody;
    }

    // check whether the response contains a HTML string
    if (responseBody.startsWith && responseBody.startsWith('<html')) {
      let message = responseBody;
      if (responseBody.indexOf('<title>') > -1) {
        const regex = /<title>(.*?)<\/title>/g;
        const matched = regex.exec(responseBody);
        if (matched && matched[1]) {
          message = matched[1];
        }
      }
      return {
        details: responseBody.replace(/(\r\n|\n|\r|\\n)/gm, ''),
        error_code: undefined,
        message,
        status_code: undefined,
        transaction_id: undefined,
      } as projectResourceModel.IResourceControllerErrorResponse;
    } else {

      // parse the response as HTML
      const resourceControllerError: projectResourceModel.IResourceControllerErrorResponse = JSON.parse(responseBody);
      return resourceControllerError;
    }
  } catch (parserError) {
    logger.warn(`${fn}- Failed to parse resource controller error: '${responseBody}' - error: ${parserError.message}`);
    return responseBody;
  }
}

/**
 * This method converts a resource controller resource to an IResourceGroup
 * @param item - a resource controller resource
 */
export function resourceControllerResourceToResourceGroup(resource: any): projectResourceModel.IResourceGroup {
  const fn = 'resourceControllerResourceToResourceGroup ';
  logger.trace(`${fn}> resource: '${JSON.stringify(resource)}'`);

  if (!resource) {
    logger.trace(`${fn}< NULL - given resource is NULL or undefined`);
    return undefined;
  }

  // build the resource group
  const resourceGroup: projectResourceModel.IResourceGroup = {
    crn: resource.crn,
    default: resource.default,
    id: resource.id,
    name: resource.name,
    state: resource.state,
  };

  logger.trace(`${fn}< '${JSON.stringify(resourceGroup)}'`);
  return resourceGroup;
}

function toResourceInstanceState(state: string, lastOperation?: any) {
  if (state === 'active') {
    // check for deprovisioning state first
    if (lastOperation &&
      (lastOperation.type === 'delete')) {
      return projectModel.UIResourceInstanceStatus.DELETING;
    } else {
      return projectModel.UIResourceInstanceStatus.ACTIVE;
    }
  }

  if (state === 'removed') {
    return projectModel.UIResourceInstanceStatus.REMOVED;
  }

  return projectModel.UIResourceInstanceStatus.PROVISIONING;
}

/**
 * This method converts an ITenantStatus to an IUIProjectStatus
 * @param {projectResourceModel.ITenantStatus} tenantStatus - a coligo status object
 */
export function tenantStatusToProjectStatus(tenantStatus: projectResourceModel.ITenantStatus): projectModel.IUIProjectStatus {
  const fn = 'tenantStatusToProjectStatus ';
  logger.trace(`${fn}> tenantStatus: '${JSON.stringify(tenantStatus)}'`);

  if (!tenantStatus) {
    logger.trace(`${fn}< NULL - given tenant status is NULL or undefined`);
    return undefined;
  }

  // build the IUIProjectStatus
  const projectStatus: projectModel.IUIProjectStatus = {
    domain: tenantStatus.Domainstatus === 'Ready',
    tenant: tenantStatus.Namespacestatus === 'Ready',
  };

  logger.trace(`${fn}< '${JSON.stringify(projectStatus)}'`);
  return projectStatus;
}

/**
 * This method converts an IProjectInfo to an IUIProjectStatus
 * @param {projectResourceModel.IProjectInfo} tenantStatus - a coligo status object
 */
export function projectInfoToProjectStatus(projectInfo: projectResourceModel.IProjectInfo): projectModel.IUIProjectStatus {
  const fn = 'projectInfoToProjectStatus ';
  logger.trace(`${fn}> projectInfo: '${JSON.stringify(projectInfo)}'`);

  if (!projectInfo) {
    logger.trace(`${fn}< NULL - given project info is NULL or undefined`);
    return undefined;
  }

  // build the IUIProjectStatus
  const projectStatus: projectModel.IUIProjectStatus = {
    domain: projectInfo.Domainstatus === 'Ready',
    expireTimestamp: safeSecondsToMillis(valueAOrB(projectInfo.Expiry, projectInfo.ExpireTimestamp)),
    tenant: projectInfo.Namespacestatus === 'Ready',
  };

  logger.trace(`${fn}< '${JSON.stringify(projectStatus)}'`);
  return projectStatus;
}

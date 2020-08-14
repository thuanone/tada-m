import { IKnativeConfiguration, IKnativeRevision, IKnativeService } from './../model/knative-model';

import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:knative');

import * as appModel from '../../../common/model/application-model';
import * as commonModel from '../../../common/model/common-model';
import { IUIEnvItems, UIEntityKinds } from '../../../common/model/common-model';
import * as cpuUtils from '../../../common/utils/cpu-utils';
import * as memoryUtils from '../../../common/utils/memory-utils';
import * as k8sModel from '../model/k8s-model';
import * as knativeModel from '../model/knative-model';
import {  } from './common-mapper';
import { getTimeInMillis, mapEnvItemsToEnvVarResult, mapEnvVarsToEnvItems } from './common-mapper';

/**
 * This method converts a IUIApplication to an IKnativeService
 * @param {appModel.IUIApplication} app - a coligo ui resource
 */
export function applicationToService(app: appModel.IUIApplication): knativeModel.IKnativeService {
  const fn = 'applicationToService ';
  logger.trace(`${fn}> app: '${JSON.stringify(app)}'`);

  if (!app) {
    logger.trace(`${fn}< NULL - given app is NULL or undefined`);
    return undefined;
  }

  let templateSpec;
  if (app.template) {
    // convert environment variables
    const envVarResult = mapEnvItemsToEnvVarResult(app.template.parameters);

    templateSpec = {
      containerConcurrency: app.template.containerConcurrency ? app.template.containerConcurrency : undefined,
      containers: [
        {
          env: envVarResult.env,
          envFrom: envVarResult.envFrom,
          image: app.template.image,
          resources: {
            limits: {
              cpu: app.template.cpus ? `${app.template.cpus}` : undefined,
              memory: app.template.memory ? `${app.template.memory}` : undefined,
            },
            requests: {
              cpu: app.template.cpus ? `${app.template.cpus}` : undefined,
              memory: app.template.memory ? `${app.template.memory}` : undefined,
            }
          }
        }
      ],
      timeoutSeconds: app.template.timeoutSeconds ? app.template.timeoutSeconds : undefined,
    };

    // add the image pull secret
    if (app.template.imagePullSecret) {
      templateSpec.imagePullSecrets = [{
        name: app.template.imagePullSecret,
      }];
    }
  }

  const templateMetadata = {
    annotations: {},
    name: undefined,
  };
  if (app.template && app.template.minScale) {
    templateMetadata.annotations['autoscaling.knative.dev/minScale'] = `${app.template.minScale}`;
  } else if (app.template && app.template.minScale === 0) {
    templateMetadata.annotations['autoscaling.knative.dev/minScale'] = '0';
  }

  if (app.template && app.template.maxScale) {
    templateMetadata.annotations['autoscaling.knative.dev/maxScale'] = `${app.template.maxScale}`;
  }

  // build the Knative Service
  const knService: knativeModel.IKnativeService = {
    apiVersion: `${knativeModel.KN_SERVING_API_GROUP}/${knativeModel.KN_SERVING_API_VERSION}`,
    kind: 'Service',
    metadata: {
      annotations: {},
      name: app.name,
    },
    spec: {
      template: {
        metadata: templateMetadata,
        spec: templateSpec || {},
      }
    }
  };

  logger.trace(`${fn}< '${JSON.stringify(knService)}'`);
  return knService;
}

/**
 * This method converts a IUIApplicationRevision to an IKnativeRevision
 * @param {appModel.IUIApplicationRevision} app - a coligo ui resource
 */
export function appRevisionToRevision(revision: appModel.IUIApplicationRevision): knativeModel.IKnativeRevision {
  const fn = 'appRevisionToRevision ';
  logger.trace(`${fn}> revision: '${JSON.stringify(revision)}'`);

  if (!revision) {
    logger.trace(`${fn}< NULL - given revision is NULL or undefined`);
    return undefined;
  }

  const metadata = {
    annotations: {},
    name: revision.name,
  };
  if (revision.minScale) {
    metadata.annotations['autoscaling.knative.dev/minScale'] = `${revision.minScale}`;
  } else if (revision.minScale === 0) {
    metadata.annotations['autoscaling.knative.dev/minScale'] = '0';
  }

  if (revision.maxScale) {
    metadata.annotations['autoscaling.knative.dev/maxScale'] = `${revision.maxScale}`;
  }

  // convert environment variables
  const envVarResult = mapEnvItemsToEnvVarResult(revision.parameters);

  // build the Knative Service
  const knService: knativeModel.IKnativeRevision = {
    metadata,
    spec: {
      containerConcurrency: revision.containerConcurrency ? revision.containerConcurrency : undefined,
      containers: [{
        env: envVarResult.env || [],
        envFrom: envVarResult.envFrom || [],
        image: revision.image,
        resources: {
          limits: {
            cpu: revision.cpus ? `${revision.cpus}` : undefined,
            memory: revision.memory ? `${revision.memory}` : undefined,
          },
          requests: {
            cpu: revision.cpus ? `${revision.cpus}` : undefined,
            memory: revision.memory ? `${revision.memory}` : undefined,
          }
        }
      }],
      timeoutSeconds: revision.timeoutSeconds ? revision.timeoutSeconds : undefined,
    },
  };

  // add the image pull secret
  if (revision.imagePullSecret) {
    knService.spec.imagePullSecrets = [{
      name: revision.imagePullSecret,
    }];
  }

  logger.trace(`${fn}< '${JSON.stringify(knService)}'`);
  return knService;
}

/**
 * This method converts an IKnativeService to an IUIApplication
 * @param {knativeModel.IKnativeService} service - a k8s knative resource
 */
export function serviceToApplication(service: knativeModel.IKnativeService, regionId: string, projectId: string): appModel.IUIApplication {
  const fn = 'serviceToApplication ';
  logger.trace(`${fn}> service: '${JSON.stringify(service)}', regionId: ${regionId}`);

  if (!service || !service.metadata || !service.metadata.name) {
    logger.trace(`${fn}< NULL - given service is NULL or undefined`);
    return undefined;
  }

  // build the IUIApplication
  const application: appModel.IUIApplication = {
    created: getTimeInMillis(service.metadata.creationTimestamp),
    generation: service.metadata.generation || 1,
    id: service.metadata.name,
    kind: UIEntityKinds.APPLICATION,
    latestCreatedRevisionName: service.status ? service.status.latestCreatedRevisionName : undefined,
    latestReadyRevisionName: service.status ? service.status.latestReadyRevisionName : undefined,
    name: service.metadata.name,
    namespace: service.metadata.namespace,
    projectId,
    publicServiceUrl: service.status ? service.status.url : undefined,
    regionId,
    status: getServiceStatus(service),
    statusConditions: getStatusConditions(service),
  };

  if (service.spec) {
    // craft app template that contains the base parameters (image, env, limits)
    const appTemplate: appModel.IUIApplicationTemplate = {
      containerConcurrency: getContainerConcurrency(service.spec.template),
      cpus: getCpu(service.spec.template),
      image: getImage(service.spec.template),
      imagePullSecret: getImagePullSecret(service.spec.template),
      maxScale: getScalingProp(service.spec.template, 'maxScale'),
      memory: getMemory(service.spec.template),
      minScale: getScalingProp(service.spec.template, 'minScale'),
      parameters: getEnvProperties(service.spec.template),
      timeoutSeconds: getTimeout(service.spec.template),
    };
    application.template = appTemplate;
  }

  logger.trace(`${fn}< '${JSON.stringify(application)}'`);
  return application;
}

export function servicesToApplications(services: knativeModel.IKnativeService[], regionId: string, projectId: string): appModel.IUIApplication[] {
  const fn = 'servicesToApplications ';
  logger.trace(`${fn}> services: '${JSON.stringify(services)}'`);

  if (!services || !Array.isArray(services)) {
    logger.trace(`${fn}< NULL - given services is NULL or undefined`);
    return undefined;
  }

  const applications: appModel.IUIApplication[] = services.map((service: knativeModel.IKnativeService) => (
    serviceToApplication(service, regionId, projectId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(applications)}'`);
  return applications;
}

export function revisionToAppRevision(knRevision: knativeModel.IKnativeRevision): appModel.IUIApplicationRevision {
  const fn = 'revisionToAppRevision ';
  logger.trace(`${fn}> knRevision: '${JSON.stringify(knRevision)}'`);

  if (!knRevision || !knRevision.metadata || !knRevision.metadata.name) {
    logger.trace(`${fn}< NULL - given revision is NULL or undefined`);
    return undefined;
  }

  // build the IUIApplicationRevision
  const appRevision: appModel.IUIApplicationRevision = {
    containerConcurrency: getContainerConcurrency(knRevision),
    cpus: getCpu(knRevision),
    created: getTimeInMillis(knRevision.metadata.creationTimestamp),
    generation: getRevisionGeneration(knRevision),
    id: knRevision.metadata.name,
    image: getImage(knRevision),
    imagePullSecret: getImagePullSecret(knRevision),
    kind: UIEntityKinds.APPLICATIONREVISION,
    maxScale: getScalingProp(knRevision, 'maxScale'),
    memory: getMemory(knRevision),
    minScale: getScalingProp(knRevision, 'minScale'),
    name: knRevision.metadata.name,
    namespace: knRevision.metadata.namespace,
    parameters: getEnvProperties(knRevision),
    status: getRevisionStatus(knRevision),
    statusConditions: getStatusConditions(knRevision),
    timeoutSeconds: getTimeout(knRevision),
  };

  logger.trace(`${fn}< '${JSON.stringify(appRevision)}'`);
  return appRevision;
}

export function configurationToAppConfiguration(knConfiguration: knativeModel.IKnativeConfiguration): appModel.IUIApplicationConfiguration {
  const fn = 'configurationToAppConfiguration ';
  logger.trace(`${fn}> knConfiguration: '${JSON.stringify(knConfiguration)}'`);

  if (!knConfiguration || !knConfiguration.status) {
    logger.trace(`${fn}< NULL - given configuration is NULL or undefined`);
    return undefined;
  }

  // build the IUIApplicationConfiguration
  const appRevision: appModel.IUIApplicationConfiguration = {
    statusConditions: getStatusConditions(knConfiguration),
  };

  logger.trace(`${fn}< '${JSON.stringify(appRevision)}'`);
  return appRevision;
}

export function revisionsToAppRevisions(knRevisions: knativeModel.IKnativeRevision[]): appModel.IUIApplicationRevision[] {
  const fn = 'revisionsToAppRevisions ';
  logger.trace(`${fn}> knRevisions: '${JSON.stringify(knRevisions)}'`);

  if (!knRevisions || !Array.isArray(knRevisions)) {
    logger.trace(`${fn}< NULL - given revisions is NULL or undefined`);
    return undefined;
  }

  const appRevisions: appModel.IUIApplicationRevision[] = knRevisions.map(revisionToAppRevision);

  logger.trace(`${fn}< '${JSON.stringify(appRevisions)}'`);
  return appRevisions;
}

export function routeToAppRoute(knRoute: knativeModel.IKnativeRoute): appModel.IUIApplicationRoute {
  const fn = 'routeToAppRoute ';
  logger.trace(`${fn}> knRoute: '${JSON.stringify(knRoute)}'`);

  if (!knRoute) {
    logger.trace(`${fn}< NULL - given route is NULL or undefined`);
    return undefined;
  }

  // build the IUIApplicationRoute
  const appRoute: appModel.IUIApplicationRoute = {
    routingTags: getRoutingTags(knRoute),
    trafficTargets: getTrafficTargets(knRoute),
  };

  logger.trace(`${fn}< '${JSON.stringify(appRoute)}'`);
  return appRoute;
}

/**
 * This helper function extracts all traffic targets from the service route
 * @param {knativeModel.IKnativeRoute} knRoute  - the Knative route resource of a service
 */
function getTrafficTargets(knRoute: knativeModel.IKnativeRoute): appModel.IUIApplicationTrafficTargets {
  const trafficTargets = {};
  if (knRoute && knRoute.status && knRoute.status.traffic && knRoute.status.traffic.length > 0) {
    for (const trafficItem of knRoute.status.traffic) {
      if (!trafficItem.revisionName) {
        continue;
      }
      const revName = trafficItem.revisionName;
      if (!trafficTargets[revName]) {
        trafficTargets[revName] = 0;
      }
      // we need to accumulate the percent, because a revision can be listed more than one time
      if (!isNaN(trafficItem.percent)) {
        trafficTargets[revName] += trafficItem.percent;
      }
    }
  }
  return trafficTargets;
}

/**
 * This helper function extracts all tagged revisions the service route
 * @param {*} route  - the Knative route resource of a service
 */
function getRoutingTags(knRoute: knativeModel.IKnativeRoute): appModel.IUIApplicationRoutingTags {
  const routingTags = {};
  if (knRoute && knRoute.status && knRoute.status.traffic && knRoute.status.traffic.length > 0) {
    for (const trafficItem of knRoute.status.traffic) {
      if (!trafficItem.revisionName) {
        continue;
      }
      const revName = trafficItem.revisionName;
      if (!routingTags[revName]) {
        routingTags[revName] = [];
      }

      // we are pushing tags into an array, because a revision can be tagged more than one time
      if (trafficItem.tag) {
        routingTags[revName].push(trafficItem.tag);
      }
      if (trafficItem.latestRevision) {
        routingTags[revName].push('latest');
      }
    }
  }
  return routingTags;
}

function getStatusConditionOfType(conditions: k8sModel.IKubernetesStatusCondition[], type: string) {
  for (const condition of conditions) {
    if (condition.type === type) {
      return condition;
    }
  }

  return undefined;
}

function getServiceStatus(service: IKnativeService): commonModel.UIEntityStatus {
  if (!service || !service.status || !service.status.conditions) {
    return commonModel.UIEntityStatus.FAILED;
  }

  const readyCondition = getStatusConditionOfType(service.status.conditions, 'Ready');

  if (readyCondition) {
    if (readyCondition.status === 'True') {
      return commonModel.UIEntityStatus.READY;
    } else if (readyCondition.status === 'Unknown') {
      // per default we assume that UNKNOWN means DEPLOYING
      return commonModel.UIEntityStatus.DEPLOYING;
    } else if (readyCondition.status === 'False') {

      // if a revision is missing, we need to check the configuration status.
      // if the configuration is OK, then there is might an deployment ongoing
      if (readyCondition.reason === 'RevisionMissing') {
        const configurationsReadyCondition = getStatusConditionOfType(service.status.conditions, 'ConfigurationsReady');
        if (configurationsReadyCondition && configurationsReadyCondition.status === 'True') {
          return commonModel.UIEntityStatus.DEPLOYING;
        } else if (configurationsReadyCondition && configurationsReadyCondition.status === 'Unknown') {
          return commonModel.UIEntityStatus.DEPLOYING;
        }
      }
    }
  }

  return commonModel.UIEntityStatus.FAILED;
}

function getStatusConditions(revision: IKnativeRevision | IKnativeService | IKnativeConfiguration): appModel.IUIApplicationStatusCondition[] {
  if (!revision || !revision.status || !revision.status.conditions) {
    return [];
  }

  const conditions: appModel.IUIApplicationStatusCondition[] = [];
  for (const condition of revision.status.conditions) {
    conditions.push({
      lastTransitionTime: getTimeInMillis(condition.lastTransitionTime),
      message: condition.message,
      reason: condition.reason,
      severity: condition.severity || 'Normal',
      status: condition.status,
      type: condition.type,
    });
  }

  return conditions;
}

function getRevisionStatus(revision: IKnativeRevision): commonModel.UIEntityStatus {
  if (!revision || !revision.status) {
    return commonModel.UIEntityStatus.FAILED;
  }

  if (!revision.status.conditions) {
    return commonModel.UIEntityStatus.DEPLOYING;
  }

  for (const condition of revision.status.conditions) {
    if (condition.type === 'Ready') {
      if (condition.status === 'True') {
        return commonModel.UIEntityStatus.READY;
      } else if (condition.status === 'Unknown') {
        // per default we assume that UNKNOWN means DEPLOYING
        return commonModel.UIEntityStatus.DEPLOYING;
      }
    }
  }

  return commonModel.UIEntityStatus.FAILED;
}

function hasContainer(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate) {
  return !(!knRevisionOrTemplate || !knRevisionOrTemplate.spec || !knRevisionOrTemplate.spec.containers || !Array.isArray(knRevisionOrTemplate.spec.containers) || knRevisionOrTemplate.spec.containers.length <= 0);
}

function getRevisionGeneration(knRevision: knativeModel.IKnativeRevision): number {
  const val: any = getMetadataLabel(knRevision, 'serving.knative.dev/configurationGeneration');

  if (isNaN(val)) {
    return 1;
  }

  return parseInt(val, 10);
}

function getMetadataLabel(knRevision: knativeModel.IKnativeRevision, labelName: string): string {
  if (!knRevision.metadata.labels) {
    return undefined;
  }
  return knRevision.metadata.labels[labelName];
}

function getCpu(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate): number {
  let val = getResourceValue(knRevisionOrTemplate, 'requests', 'cpu');

  // if the first attempt failed to retrieve the value from the requests property, try to fetch it from the max property
  if (!val || val === '-') {
    val = getResourceValue(knRevisionOrTemplate, 'limits', 'cpu');
  }

  // check whether the value is might not parsable
  if (!val || val === '-') {
    return undefined;
  }

  // convert the cpu unit into a number
  return cpuUtils.convertValueToFloat(val);
}

function getMemory(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate): number {
  let val = getResourceValue(knRevisionOrTemplate, 'requests', 'memory');

  // if the first attempt failed to retrieve the value from the requests property, try to fetch it from the limits property
  if (!val || val === '-') {
    val = getResourceValue(knRevisionOrTemplate, 'limits', 'memory');
  }

  // check whether the value is might not parsable
  if (!val || val === '-') {
    return undefined;
  }

  // convert the string into a number
  return memoryUtils.convertValueToBytes(val);
}

/**
 * helper function to extract necessary information from a knative container object
 * @param {IKnativeRevision|IKnativeServiceTemplate} knRevisionOrTemplate - the revision (a knative entity) or the //spec/template object of a service
 * @param {String} type - either 'limits' or 'requests'
 * @param {String} resource  - either 'cpu' or 'memory'
 */
function getResourceValue(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate, type: string, resource: string): string {
  if (!hasContainer(knRevisionOrTemplate)) {
    return '-';
  }
  const container = knRevisionOrTemplate.spec.containers[0];
  return (container.resources && container.resources[type] && container.resources[type][resource]) ? container.resources[type][resource] : '-';
}

function getScalingProp(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate, property) {
  if (!knRevisionOrTemplate || !knRevisionOrTemplate.metadata || !knRevisionOrTemplate.metadata.annotations) {
    return undefined;
  }
  return knRevisionOrTemplate.metadata.annotations[`autoscaling.knative.dev/${property}`] ? parseInt(knRevisionOrTemplate.metadata.annotations[`autoscaling.knative.dev/${property}`], 10) : undefined;
}

function getContainerConcurrency(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate) {
  if (!knRevisionOrTemplate || !knRevisionOrTemplate.spec) {
    return undefined;
  }

  // we need special handling for 0
  if (knRevisionOrTemplate.spec.containerConcurrency === 0) {
    return 0;
  }

  return knRevisionOrTemplate.spec.containerConcurrency || undefined;
}

function getTimeout(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate) {
  if (!knRevisionOrTemplate || !knRevisionOrTemplate.spec) {
    return undefined;
  }

  // we need special handling for 0
  if (knRevisionOrTemplate.spec.timeoutSeconds === 0) {
    return 0;
  }

  return knRevisionOrTemplate.spec.timeoutSeconds || undefined;
}

function getImage(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate) {
  if (!hasContainer(knRevisionOrTemplate)) {
    return undefined;
  }
  return knRevisionOrTemplate.spec.containers[0].image;
}

function getImagePullSecret(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate) {
  if (!knRevisionOrTemplate || !knRevisionOrTemplate.spec || !knRevisionOrTemplate.spec.imagePullSecrets) {
    return undefined;
  }
  return knRevisionOrTemplate.spec.imagePullSecrets[0].name;
}

function getEnvProperties(knRevisionOrTemplate: knativeModel.IKnativeRevision | knativeModel.IKnativeServiceTemplate): IUIEnvItems {
  if (!hasContainer(knRevisionOrTemplate)) {
    return undefined;
  }
  return mapEnvVarsToEnvItems(knRevisionOrTemplate.spec.containers[0].env, knRevisionOrTemplate.spec.containers[0].envFrom);
}

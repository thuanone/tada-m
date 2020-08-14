
import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:k8s');

import * as appModel from '../../../common/model/application-model';
import * as commonModel from '../../../common/model/common-model';
import * as cpuUtils from '../../../common/utils/cpu-utils';
import * as memoryUtils from '../../../common/utils/memory-utils';
import * as k8sModel from '../model/k8s-model';
import { getTimeInMillis } from './common-mapper';

export function podToAppInstance(pod: k8sModel.IKubernetesPod): appModel.IUIApplicationInstance {
  const fn = 'podToAppInstance ';
  logger.trace(`${fn}> pod: '${JSON.stringify(pod)}'`);

  if (!pod || !pod.metadata || !pod.metadata.name) {
    logger.trace(`${fn}< NULL - given pod is NULL or undefined`);
    return null;
  }

  // build the IUIApplicationInstance
  const appInstance: appModel.IUIApplicationInstance = {
    application: getMetadataLabel(pod, 'serving.knative.dev/service'),
    created: getTimeInMillis(pod.metadata.creationTimestamp),
    id: pod.metadata.name,
    name: pod.metadata.name,
    revision: getMetadataLabel(pod, 'serving.knative.dev/revision'),
    statusPhase: pod.status && pod.status.phase,
  };

  logger.trace(`${fn}< '${JSON.stringify(appInstance)}'`);
  return appInstance;
}

export function podsToAppInstances(pods: k8sModel.IKubernetesPod[]): appModel.IUIApplicationInstance[] {
  const fn = 'podsToAppInstances ';
  logger.trace(`${fn}> pods: '${JSON.stringify(pods)}'`);

  if (!pods || !Array.isArray(pods)) {
    logger.trace(`${fn}< NULL - given pods are NULL or undefined`);
    return null;
  }

  const appInstances: appModel.IUIApplicationInstance[] = pods.map(podToAppInstance);

  logger.trace(`${fn}< '${JSON.stringify(appInstances)}'`);
  return appInstances;
}

export function podToInstance(pod: k8sModel.IKubernetesPod): commonModel.IUIInstance {
  const fn = 'podToInstance ';
  logger.trace(`${fn}> pod: '${JSON.stringify(pod)}'`);

  if (!pod || !pod.metadata || !pod.metadata.name) {
    logger.trace(`${fn}< NULL - given pod is NULL or undefined`);
    return null;
  }

  let componentKind;
  let componentId;
  if (getMetadataLabel(pod, 'serving.knative.dev/service')) {
    componentId = getMetadataLabel(pod, 'serving.knative.dev/service');
    componentKind = commonModel.UIEntityKinds.APPLICATION;
  } else if (getMetadataLabel(pod, 'codeengine.cloud.ibm.com/job-definition')) {
    componentId = getMetadataLabel(pod, 'codeengine.cloud.ibm.com/job-definition');
    componentKind = commonModel.UIEntityKinds.JOBRUN;
  } else if (getMetadataLabel(pod, 'build.build.dev/name')) {
    componentId = getMetadataLabel(pod, 'build.build.dev/name');
    componentKind = commonModel.UIEntityKinds.BUILDRUN;
  }

  // build the IUIInstance
  const instance: commonModel.IUIInstance = {
    componentKind,
    componentId,
    created: getTimeInMillis(pod.metadata.creationTimestamp),
    id: pod.metadata.name,
    statusPhase: pod.status && pod.status.phase,
    memory: getMemory(pod),
    cpus: getCpu(pod),
  };

  logger.trace(`${fn}< '${JSON.stringify(instance)}'`);
  return instance;
}

export function podsToInstances(pods: k8sModel.IKubernetesPod[]): commonModel.IUIInstance[] {
  const fn = 'podsToInstances ';
  logger.trace(`${fn}> pods: '${JSON.stringify(pods)}'`);

  if (!pods || !Array.isArray(pods)) {
    logger.trace(`${fn}< NULL - given pods are NULL or undefined`);
    return null;
  }

  const instances: commonModel.IUIInstance[] = pods.map(podToInstance);

  logger.trace(`${fn}< '${JSON.stringify(instances)}'`);
  return instances;
}

function getMetadataLabel(pod: k8sModel.IKubernetesPod, labelName: string): string {
  if (!pod.metadata.labels) {
    return undefined;
  }
  return pod.metadata.labels[labelName];
}

/**
 * helper function to extract necessary information from a pod container object
 * @param {k8sModel.IKubernetesPod} knRevisionOrTemplate - the pod of a service
 * @param {String} type - either 'limits' or 'requests'
 * @param {String} resource  - either 'cpu' or 'memory'
 */
function getResourceValue(pod: k8sModel.IKubernetesPod, type: string, resource: string): string {
  if (!hasContainer(pod)) {
    return '-';
  }
  const container = pod.spec.containers[0];
  return (container.resources && container.resources[type] && container.resources[type][resource]) ? container.resources[type][resource] : '-';
}

function hasContainer(pod: k8sModel.IKubernetesPod) {
  return !(!pod || !pod.spec || !pod.spec.containers || !Array.isArray(pod.spec.containers) || pod.spec.containers.length <= 0);
}

function getCpu(pod: k8sModel.IKubernetesPod): number {
  let val = getResourceValue(pod, 'requests', 'cpu');

  // if the first attempt failed to retrieve the value from the requests property, try to fetch it from the max property
  if (!val || val === '-') {
    val = getResourceValue(pod, 'limits', 'cpu');
  }

  // check whether the value is might not parsable
  if (!val || val === '-') {
    return undefined;
  }

  // convert the cpu unit into a number
  return cpuUtils.convertValueToFloat(val);
}

function getMemory(pod: k8sModel.IKubernetesPod): number {
  let val = getResourceValue(pod, 'requests', 'memory');

  // if the first attempt failed to retrieve the value from the requests property, try to fetch it from the limits property
  if (!val || val === '-') {
    val = getResourceValue(pod, 'limits', 'memory');
  }

  // check whether the value is might not parsable
  if (!val || val === '-') {
    return undefined;
  }

  // convert the string into a number
  return memoryUtils.convertValueToBytes(val);
}

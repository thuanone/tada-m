import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:confmap');

import { UIEntityKinds } from '../../../common/model/common-model';
import * as commonConfigModel from '../../../common/model/config-model';
import * as k8sModel from '../model/k8s-model';
import { getTimeInMillis } from './common-mapper';

/**
 * This method converts a IUIConfigMap to an IKubernetesConfigMap
 * @param {commonConfigModel.IUIConfigMap} uiConfigMap - a coligo ui resource
 */
export function convertUiConfigMapToKubeConfigMap(uiConfigMap: commonConfigModel.IUIConfigMap): k8sModel.IKubernetesConfigMap {
  const fn = 'convertUiConfigMapToKubeConfigMap ';
  logger.trace(`${fn}>`);

  if (!uiConfigMap) {
    logger.trace(`${fn}< NULL - given uiConfigMap is NULL or undefined`);
    return undefined;
  }

  // build the Kube ConfigMap
  const kubeConfigMap: k8sModel.IKubernetesConfigMap = {
    apiVersion: 'v1',
    data: {},
    kind: 'ConfigMap',
    metadata: {
      creationTimestamp: null,
      name: uiConfigMap.name,
    },
  };

  // add all key value pairs
  for (const keyValuePair of uiConfigMap.data) {
    kubeConfigMap.data[keyValuePair.key] = keyValuePair.value;
  }

  logger.trace(`${fn}< '${JSON.stringify(kubeConfigMap)}'`);
  return kubeConfigMap;
}

/**
 * This method converts an IKubernetesConfigMap to an IUIConfigMap
 * @param {k8sModel.IKubernetesConfigMap} service - a k8s foobar resource
 */
export function convertKubeConfigMapToUiConfigMap(kubeConfigMap: k8sModel.IKubernetesConfigMap, regionId: string, projectId: string): commonConfigModel.IUIConfigMap {
  const fn = 'convertKubeConfigMapToUiConfigMap ';
  logger.trace(`${fn}> kubeConfigMap: '${JSON.stringify(kubeConfigMap)}', regionId: ${regionId}`);

  if (!kubeConfigMap || !kubeConfigMap.metadata || !kubeConfigMap.metadata.name) {
    logger.trace(`${fn}< NULL - given kubeConfigMap is NULL or undefined`);
    return undefined;
  }

  // build the IUIConfigMap
  const uiConfigMap: commonConfigModel.IUIConfigMap = {
    created: getTimeInMillis(kubeConfigMap.metadata.creationTimestamp),
    data: [],
    id: kubeConfigMap.metadata.name,
    kind: UIEntityKinds.CONFMAP,
    name: kubeConfigMap.metadata.name,
    namespace: kubeConfigMap.metadata.namespace,
    projectId,
    regionId,
  };

  if (kubeConfigMap.data) {
    for (const key of Object.keys(kubeConfigMap.data)) {
      uiConfigMap.data.push({ key, value: kubeConfigMap.data[key] });
    }
  }

  logger.trace(`${fn}< '${JSON.stringify(uiConfigMap)}'`);
  return uiConfigMap;
}

export function convertKubeConfigMapsToUiConfigMaps(kubeConfigMaps: k8sModel.IKubernetesConfigMap[], regionId: string, projectId: string): commonConfigModel.IUIConfigMap[] {
  const fn = 'convertKubeConfigMapsToUiConfigMaps ';
  logger.trace(`${fn}> ${kubeConfigMaps && kubeConfigMaps.length}kubeConfigMaps`);

  if (!kubeConfigMaps || !Array.isArray(kubeConfigMaps)) {
    logger.trace(`${fn}< NULL - given kubeConfigMaps is NULL or undefined`);
    return undefined;
  }

  const uiConfigMaps: commonConfigModel.IUIConfigMap[] = kubeConfigMaps.map((kubeConfigMap: k8sModel.IKubernetesConfigMap) => (
    convertKubeConfigMapToUiConfigMap(kubeConfigMap, regionId, projectId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiConfigMaps)}'`);
  return uiConfigMaps;
}

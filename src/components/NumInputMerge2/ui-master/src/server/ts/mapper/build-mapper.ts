import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:build');

import * as commonBuildModel from '../../../common/model/build-model';
import { UIEntityKinds } from '../../../common/model/common-model';
import * as buildModel from '../model/build-model';
import { getTimeInMillis } from './common-mapper';

/**
 * This method converts a IUIBuild to an IBuild
 * @param {commonBuildModel.IUIBuild} uiBuild - a coligo ui resource
 */
export function convertUiBuildToKubeBuild(uiBuild: commonBuildModel.IUIBuild): buildModel.IBuild {
  const fn = 'convertUiBuildToKubeBuild ';
  logger.trace(`${fn}>`);

  if (!uiBuild) {
    logger.trace(`${fn}< NULL - given uiBuild is NULL or undefined`);
    return undefined;
  }

  // build the Kube build
  const kubeBuild: buildModel.IBuild = {
    apiVersion: `${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}`,
    kind: UIEntityKinds.BUILD,
    metadata: {
      annotations: {
        'build.build.dev/build-run-deletion': 'true',
      },
      name: uiBuild.name,
    },
    spec: {
      output: {
        credentials: {
          name: uiBuild.outputCredentials,
        },
        image: uiBuild.outputImage,
      },
      source: {
        url: uiBuild.sourceUrl,
        revision: uiBuild.sourceRev,
      },
      strategy: {
        kind: uiBuild.strategyKind,
        name: uiBuild.strategyName,
      }
    },
  };

  logger.trace(`${fn}< '${JSON.stringify(kubeBuild)}'`);
  return kubeBuild;
}

/**
 * This method converts an IBuild to an IUIBuild
 * @param {buildModel.IBuild} service - a k8s build resource
 */
export function convertKubeBuildToUiBuild(kubeBuild: buildModel.IBuild, regionId: string, projectId: string): commonBuildModel.IUIBuild {
  const fn = 'convertKubeBuildToUiBuild ';
  logger.trace(`${fn}> kubeBuild: '${JSON.stringify(kubeBuild)}', regionId: ${regionId}`);

  if (!kubeBuild || !kubeBuild.metadata || !kubeBuild.metadata.name) {
    logger.trace(`${fn}< NULL - given kubeBuild is NULL or undefined`);
    return undefined;
  }

  // build the IUIBuild
  const uiBuild: commonBuildModel.IUIBuild = {
    created: getTimeInMillis(kubeBuild.metadata.creationTimestamp),
    id: kubeBuild.metadata.name,
    kind: UIEntityKinds.BUILD,
    name: kubeBuild.metadata.name,
    namespace: kubeBuild.metadata.namespace,
    outputCredentials: kubeBuild.spec.output.credentials && kubeBuild.spec.output.credentials.name,
    outputImage: kubeBuild.spec.output.image,
    projectId,
    regionId,
    sourceUrl: kubeBuild.spec.source.url,
    sourceRev: kubeBuild.spec.source.revision,
    strategyKind: kubeBuild.spec.strategy.kind,
    strategyName: kubeBuild.spec.strategy.name,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiBuild)}'`);
  return uiBuild;
}

export function convertKubeBuildsToUiBuilds(kubeBuilds: buildModel.IBuild[], regionId: string, projectId: string): commonBuildModel.IUIBuild[] {
  const fn = 'convertKubeBuildsToUiBuilds ';
  logger.trace(`${fn}> ${kubeBuilds && kubeBuilds.length} kubeBuilds`);

  if (!kubeBuilds || !Array.isArray(kubeBuilds)) {
    logger.trace(`${fn}< NULL - given kubeBuilds is NULL or undefined`);
    return undefined;
  }

  const uiBuilds: commonBuildModel.IUIBuild[] = kubeBuilds.map((kubeBuild: buildModel.IBuild) => (
    convertKubeBuildToUiBuild(kubeBuild, regionId, projectId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiBuilds)}'`);
  return uiBuilds;
}

/**
 * This method converts a IUIBuildRun to an IBuildRun
 * @param {commonBuildModel.IUIBuildRun} uiBuildRun - a coligo ui resource
 */
export function convertUiBuildRunToKubeBuildRun(uiBuildRun: commonBuildModel.IUIBuildRun): buildModel.IBuildRun {
  const fn = 'convertUiBuildRunToKubeBuildRun ';
  logger.trace(`${fn}>`);

  if (!uiBuildRun) {
    logger.trace(`${fn}< NULL - given uiBuildRun is NULL or undefined`);
    return undefined;
  }

  // build the Kube build run
  const kubeBuildRun: buildModel.IBuildRun = {
    apiVersion: `${buildModel.COLIGO_BUILD_API_GROUP}/${buildModel.COLIGO_BUILD_API_VERSION}`,
    kind: UIEntityKinds.BUILDRUN,
    metadata: {
      name: uiBuildRun.name
    },
    spec: {
      buildRef: {
        name: uiBuildRun.buildRef,
      },
    },
  };

  logger.trace(`${fn}< '${JSON.stringify(kubeBuildRun)}'`);
  return kubeBuildRun;
}

/**
 * This method converts an IBuildRun to an IUIBuildRun
 * @param {buildModel.IBuildRun} service - a k8s buildrun resource
 */
export function convertKubeBuildRunToUiBuildRun(kubeBuildRun: buildModel.IBuildRun, regionId: string, projectId: string): commonBuildModel.IUIBuildRun {
  const fn = 'convertKubeBuildRunToUiBuildRun ';
  logger.trace(`${fn}> kubeBuildRun: '${JSON.stringify(kubeBuildRun)}', regionId: ${regionId}`);

  if (!kubeBuildRun || !kubeBuildRun.metadata || !kubeBuildRun.metadata.name) {
    logger.trace(`${fn}< NULL - given kubeBuildRun is NULL or undefined`);
    return undefined;
  }

  // build the IUIBuildRun
  const uiBuildRun: commonBuildModel.IUIBuildRun = {
    created: getTimeInMillis(kubeBuildRun.metadata.creationTimestamp),
    id: kubeBuildRun.metadata.name,
    kind: UIEntityKinds.BUILDRUN,
    name: kubeBuildRun.metadata.name,
    namespace: kubeBuildRun.metadata.namespace,

    projectId,
    regionId,

    buildRef: kubeBuildRun.spec.buildRef && kubeBuildRun.spec.buildRef.name,
    completionTime: kubeBuildRun.status && getTimeInMillis(kubeBuildRun.status.completionTime),
    latestTaskRunRef: kubeBuildRun.status && kubeBuildRun.status.latestTaskRunRef,
    reason: kubeBuildRun.status && kubeBuildRun.status.reason,
    startTime: kubeBuildRun.status && getTimeInMillis(kubeBuildRun.status.startTime),
    status: getBuildRunStatus(kubeBuildRun),
    succeeded: kubeBuildRun.status && kubeBuildRun.status.succeeded,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiBuildRun)}'`);
  return uiBuildRun;
}

export function convertKubeBuildRunsToUiBuildRuns(kubeBuildRuns: buildModel.IBuildRun[], regionId: string, projectId: string): commonBuildModel.IUIBuildRun[] {
  const fn = 'convertKubeBuildRunsToUiBuildRuns ';
  logger.trace(`${fn}> ${kubeBuildRuns && kubeBuildRuns.length} kubeBuildRuns`);

  if (!kubeBuildRuns || !Array.isArray(kubeBuildRuns)) {
    logger.trace(`${fn}< NULL - given kubeBuildRuns is NULL or undefined`);
    return undefined;
  }

  const uiBuildRuns: commonBuildModel.IUIBuildRun[] = kubeBuildRuns.map((kubeBuildRun: buildModel.IBuildRun) => (
    convertKubeBuildRunToUiBuildRun(kubeBuildRun, regionId, projectId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiBuildRuns)}'`);
  return uiBuildRuns;
}

export function getBuildRunStatus(buildRun: buildModel.IBuildRun): commonBuildModel.UIBuildRunStatus {
  if (!buildRun || !buildRun.status) {
    return commonBuildModel.UIBuildRunStatus.UNKNOWN;
  }

  // unknown indicates that the build run has not been completed yet
  if (buildRun.status.succeeded === 'Unknown') {
    if (buildRun.status.reason === 'Running') {
      return commonBuildModel.UIBuildRunStatus.RUNNING;
    }
    if (buildRun.status.reason === 'Pending') {
      return commonBuildModel.UIBuildRunStatus.PENDING;
    }
    return commonBuildModel.UIBuildRunStatus.UNKNOWN;
  }

  if (buildRun.status.succeeded === 'False') {
    return commonBuildModel.UIBuildRunStatus.FAILED;
  }

  if (buildRun.status.succeeded === 'True') {
    return commonBuildModel.UIBuildRunStatus.SUCCEEDED;
  }

  return commonBuildModel.UIBuildRunStatus.UNKNOWN;
}

import * as appModel from '../../../common/model/application-model';
import * as commonModel from '../../../common/model/common-model';
import * as commonErrors from './../../../common/Errors';

import * as k8sMapper from './../mapper/k8s-mapper';
import * as knativeMapper from './../mapper/knative-mapper';

import { IAccessDetails } from './../model/access-details-model';
import * as k8sModel from './../model/k8s-model';
import * as knativeModel from './../model/knative-model';

import * as blueProm from 'bluebird';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:application');

import * as k8sKnativeService from '../services/k8s-knative-service';
import * as k8sService from '../services/k8s-service';
import * as helpers from './common-middleware';

import * as middlewareUtils from '../utils/middleware-utils';

export function getApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<appModel.IUIApplication> {
  const fn = 'getApplication ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}'`);

  return new Promise<appModel.IUIApplication>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const knServiceProm = kubeApiAccessDetailsProm.then((kubeAccessDetails: IAccessDetails) => (
      // retrieve the kn service
      k8sKnativeService.getKnService(ctx, kubeAccessDetails, applicationId)
    ));

    // use bluebird join function to wait for the results of both calls
    blueProm.join(kubeApiAccessDetailsProm, knServiceProm, (kubeAccessDetails: IAccessDetails, knService: knativeModel.IKnativeService) => {

      // map the IKnativeService to an IUIApplication
      const application: appModel.IUIApplication = knativeMapper.serviceToApplication(knService, regionId, projectId);

      // add resources such as routes, revisions and configurations
      logger.debug(ctx, `${fn}- fetching additional information (route, revisions, ...) of service ${applicationId}`);

      // in case there is has no revision created yet, return the application as-it-is
      if (!application.latestCreatedRevisionName) {
        // finally, send the whole kn service object back to the client
        logger.debug(ctx, `${fn}< app: ${application.name}`);
        resolve(application);
        return;
      }

      // fetch the latest revision
      const revisionProm = k8sKnativeService.getKnServiceRevision(ctx, kubeAccessDetails, application.latestCreatedRevisionName);

      // wait for all requests to finish, then assign the values
      Promise.all([revisionProm])
        .then((additionalInformation) => {
          logger.trace(ctx, `${fn}- latest revision: ${JSON.stringify(additionalInformation[0])}`);

          // map the IKnativeServiceRevision to an IUIApplicationRevision
          const revision: appModel.IUIApplicationRevision = knativeMapper.revisionToAppRevision(additionalInformation[0] as knativeModel.IKnativeRevision);
          // attach the latest revision to the application
          application.revision = revision;

          // finally, send the whole kn service object back to the client
          logger.debug(ctx, `${fn}< app: ${application.name}`);
          resolve(application);
        }).catch((err) => {
          let error = err;
          if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Could not retrieve knative service '${applicationId}' in namespace '${kubeAccessDetails.name}' of region '${regionId}'`, err);
            // wrap the error object in a specifc coligo error object
            error = new commonErrors.FailedToGetApplicationError(err);
          }

          logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
          reject(error);
        });
    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetApplicationError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listApplications(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string): Promise<appModel.IUIApplication[]> {
  const fn = 'listApplications ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

  return new Promise<appModel.IUIApplication[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the all kn services of the given namespace
        k8sKnativeService.getKnServicesOfNamespace(ctx, kubeAccessDetails)
      ))
      .then((resources) => {
        const services: knativeModel.IKnativeService[] = resources.items;
        // map the IKnativeService to an IUIApplication
        const applications: appModel.IUIApplication[] = knativeMapper.servicesToApplications(services, regionId, projectId);

        logger.debug(ctx, `${fn}< ${applications ? applications.length : 'NULL'} applications`);
        resolve(applications);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the applications in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetApplicationsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function listApplicationRevisions(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<appModel.IUIApplicationRevision[]> {
  const fn = 'listApplicationRevisions ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}'`);

  return new Promise<appModel.IUIApplicationRevision[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the all kn revisions of the given service
        k8sKnativeService.getKnServiceRevisions(ctx, kubeAccessDetails, applicationId)
      ))
      .then((revisions: knativeModel.IKnativeRevision[]) => {
        // map the IKnativeService to an IUIApplication
        const appRevisions: appModel.IUIApplicationRevision[] = knativeMapper.revisionsToAppRevisions(revisions);

        logger.debug(ctx, `${fn}< ${appRevisions ? appRevisions.length : 'NULL'} revisions`);
        resolve(appRevisions);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the revisions of application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetApplicationRevisionsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function listApplicationInstances(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<appModel.IUIApplicationInstance[]> {
  const fn = 'listApplicationInstances ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}'`);

  return new Promise<appModel.IUIApplicationInstance[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the all kube pods of the given service
        k8sService.getKubernetesPodsOfNamespace(ctx, kubeAccessDetails, `serving.knative.dev/service=${applicationId}`)
      ))
      .then((pods: k8sModel.IKubernetesPod[]) => {

        // filter only running pods
        pods = pods.filter((pod: k8sModel.IKubernetesPod) => (pod.status && pod.status.phase === 'Running'));

        // map each IKubernetesPod to an IUIApplicationInstance
        const appInstances: appModel.IUIApplicationInstance[] = k8sMapper.podsToAppInstances(pods);

        logger.debug(ctx, `${fn}< ${appInstances ? appInstances.length : 'NULL'} instances`);
        resolve(appInstances);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the instances of application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetApplicationInstancesError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function getApplicationRoute(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<appModel.IUIApplicationRoute> {
  const fn = 'getApplicationRoute ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}'`);

  return new Promise<appModel.IUIApplicationRoute>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => (
        // retrieve the kn service
        k8sKnativeService.getKnServiceRoute(ctx, kubeAccessDetails, applicationId)
      ))
      .then((route: knativeModel.IKnativeRoute) => {
        // map the IKnativeRoute to an IUIApplicationRoute
        const appRoute: appModel.IUIApplicationRoute = knativeMapper.routeToAppRoute(route);

        logger.debug(ctx, `${fn}<`);
        resolve(appRoute);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the route of application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetApplicationError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * This method is responsible for creating a new application in the given project
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectId - the project guid of a coligo project
 * @param applicatonToCreate - the application that should be created
 * @param ctx - the request context
 */
export function createApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicatonToCreate: appModel.IUIApplication): Promise<appModel.IUIApplication> {
  const fn = 'createApplication ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicatonToCreate: '${JSON.stringify(applicatonToCreate)}'`);

  // convert the UI application to an knative service
  const serviceToCreate: knativeModel.IKnativeService = knativeMapper.applicationToService(applicatonToCreate);

  return new Promise<appModel.IUIApplication>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // create the knative service
        return k8sKnativeService.createKnService(ctx, kubeAccessDetails, serviceToCreate);
      })
      .then((createdKnService: knativeModel.IKnativeService) => {
        logger.debug(ctx, `${fn}- created KN service: '${JSON.stringify(createdKnService)}'`);

        // map the knative service to an UIApplication
        const createdApplication: appModel.IUIApplication = knativeMapper.serviceToApplication(createdKnService, regionId, projectId);

        logger.debug(ctx, `${fn}< '${JSON.stringify(createdApplication)}'`);
        resolve(createdApplication);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the application in region '${regionId}' and project '${projectId}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateApplicationError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function createApplicationRevision(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string, appRevisionToCreate: appModel.IUIApplicationRevision): Promise<appModel.IUIApplication> {
  const fn = 'createApplicationRevision ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}', appRevisionToCreate: '${JSON.stringify(appRevisionToCreate)}'`);

  // convert the UI application revision to an knative service revision
  const revisionToCreate: knativeModel.IKnativeRevision = knativeMapper.appRevisionToRevision(appRevisionToCreate);

  return new Promise<appModel.IUIApplication>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // retrieve the service
        return k8sKnativeService.getKnService(ctx, kubeAccessDetails, applicationId)
          .then((knService) => {

            // in case the revision name does not start with the service name, we need to prepend it
            if (!revisionToCreate.metadata.name.startsWith(`${knService.metadata.name}-`)) {
              revisionToCreate.metadata.name = `${knService.metadata.name}-${revisionToCreate.metadata.name}`;
            }

            // put the revision that should be created into the spec.template object of the service
            knService.spec.template = revisionToCreate;

            // create the knative revision
            return k8sKnativeService.createKnServiceRevision(ctx, kubeAccessDetails, applicationId, knService);
          });
      })
      .then((updatedKnService: knativeModel.IKnativeService) => {
        logger.debug(ctx, `${fn}- updated KN service: '${JSON.stringify(updatedKnService)}'`);

        // map the knative service to an IUIApplication
        const updatedApplication: appModel.IUIApplication = knativeMapper.serviceToApplication(updatedKnService, regionId, projectId);

        logger.debug(ctx, `${fn}< '${JSON.stringify(updatedApplication)}'`);
        resolve(updatedApplication);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the revision of application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateApplicationRevisionError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function invokeApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string, invocationPayload: appModel.IUIApplicationInvocation): Promise<appModel.IUIApplicationInvocationResult> {
  const fn = 'invokeApplication ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}', invocationPayload: '${invocationPayload && JSON.stringify(invocationPayload)}'`);

  // Url
  const url = invocationPayload.url;
  const verb = invocationPayload.verb || 'GET';
  const headers = invocationPayload.headers || {};
  const payload = invocationPayload.data || {};

  return new Promise<appModel.IUIApplicationInvocationResult>((resolve, reject) => {
    k8sKnativeService.executeHttpCall(ctx, url, verb, headers, payload)
      .then((invocationResult: appModel.IUIApplicationInvocationResult) => {
        logger.debug(ctx, `${fn}<`);
        resolve(invocationResult);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to invoke the application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToInvokeApplicationError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}
export function deleteApplicationRevision(ctx: commonModel.IUIRequestContext, revision: appModel.IUIApplicationRevision): Promise<commonModel.IUIOperationResult> {
  return Promise.resolve({ status: commonModel.UIOperationStatus.OK, });
}

export function deleteApplication(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, applicationId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteApplication ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', applicationId: '${applicationId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // delete the service
        return k8sKnativeService.deleteKnService(ctx, kubeAccessDetails, applicationId)
          .then((deletionResult: knativeModel.IKnativeStatus) => {

            // evaluate the deletion status
            const status = deletionResult.status === 'Success' ? commonModel.UIOperationStatus.OK : commonModel.UIOperationStatus.FAILED;

            // craft a UIOperationResult
            const operationResult: commonModel.IUIOperationResult = middlewareUtils.createUIOperationResult(status);

            logger.debug(ctx, `${fn}< '${JSON.stringify(operationResult)}'`);
            return resolve(operationResult);
          });
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to delete application '${applicationId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteApplicationError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

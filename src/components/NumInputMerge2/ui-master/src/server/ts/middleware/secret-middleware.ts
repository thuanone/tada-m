
import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as configModel from '../../../common/model/config-model';

import * as secretsMapper from '../mapper/secrets-mapper';

import { IAccessDetails } from '../model/access-details-model';
import * as k8sModel from '../model/k8s-model';

import * as blueProm from 'bluebird';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:secret');

import * as k8sSecretService from '../services/k8s-secrets-service';
import * as helpers from './common-middleware';

import * as middlewareUtils from '../utils/middleware-utils';

export function getSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string, includeCredentials?: boolean): Promise<configModel.IUISecret> {
  const fn = 'getSecret ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', secretId: '${secretId}'`);

  return new Promise<configModel.IUISecret>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    const kubeApiAccessDetailsProm = helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx);

    const k8sSecretProm = kubeApiAccessDetailsProm.then((kubeAccessDetails: IAccessDetails) => (
      // retrieve the secret
      k8sSecretService.getKubeSecret(ctx, kubeAccessDetails, secretId)
    ));

    // use bluebird join function to wait for the results of both calls
    blueProm.join(kubeApiAccessDetailsProm, k8sSecretProm, (kubeAccessDetails: IAccessDetails, kubeSecret: k8sModel.IKubernetesSecret) => {

      // map the IKubernetesSecret to an IUISecret
      const uiSecret: configModel.IUISecret = secretsMapper.convertKubeSecretToUiSecret(kubeSecret, regionId, projectId, includeCredentials);

      // send the secret object back to the client
      logger.debug(ctx, `${fn}< ${configModel.stringify(uiSecret)}`);
      resolve(uiSecret);
      return;

    }).catch((err) => {
      let error = err;
      if (!(err instanceof commonErrors.GenericUIError)) {
        logger.error(ctx, `${fn}- Failed to get the secret '${secretId}' in region '${regionId}' and project '${projectId}'`, err);
        // wrap the error object in a specifc coligo error object
        error = new commonErrors.FailedToGetSecretError(err);
      }

      logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
      reject(error);
    });
  });
}

export function listSecrets(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretType?: string): Promise<configModel.IUISecret[]> {
  const fn = 'listSecrets ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', secretType: '${secretType}'`);

  return new Promise<configModel.IUISecret[]>((resolve, reject) => {

    // retrieve the access details to enter a specific cluster / namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // check whether a field selector should be set
        const fieldSelector = k8sSecretService.getFieldSelectorForFilteringSecrets(secretType);

        // retrieve the all kn services of the given namespace
        return k8sSecretService.getKubeSecretsOfNamespace(ctx, kubeAccessDetails, {fieldSelector});
      })
      .then((resources) => {
        const kubeSecrets: k8sModel.IKubernetesSecret[] = resources.items;
        // map the IKubernetesSecret to an IUISecret
        const uiSecrets: configModel.IUISecret[] = secretsMapper.convertKubeSecretsToUiSecrets(kubeSecrets, regionId, projectId);

        logger.debug(ctx, `${fn}< ${uiSecrets ? uiSecrets.length : 'NULL'} secrets`);
        resolve(uiSecrets);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to get the applications in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToGetSecretsError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

/**
 * This method is responsible for creating a new secret in the given project
 * @param regionId - the id of the region (e.g. us-south)
 * @param projectId - the project guid of a coligo project
 * @param secretToCreate - the secret that should be created
 * @param ctx - the request context
 */
export function createSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretToCreate: configModel.IUISecret): Promise<configModel.IUISecret> {
  const fn = 'createSecret ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', secretToCreate: '${configModel.stringify(secretToCreate)}'`);

  // convert the UI secret to an kube secret
  const kubeSecretToCreate: k8sModel.IKubernetesSecret = secretsMapper.convertUiRegistrySecretToKubeSecret(secretToCreate);

  return new Promise<configModel.IUISecret>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // create the kube secret
        return k8sSecretService.createKubeSecret(ctx, kubeAccessDetails, kubeSecretToCreate);
      })
      .then((createdService: k8sModel.IKubernetesSecret) => {
        logger.debug(ctx, `${fn}- created kubernetes secret: '${JSON.stringify(createdService)}'`);

        // map the kube secret to an UISecret
        const createdSecret: configModel.IUISecret = secretsMapper.convertKubeSecretToUiSecret(createdService, regionId, projectId);

        logger.debug(ctx, `${fn}< '${configModel.stringify(createdSecret)}'`);
        resolve(createdSecret);
      })
      .catch((err) => {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
          logger.error(ctx, `${fn}- Failed to create the secret in region '${regionId}' and project '${projectId}'`, error);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToCreateSecretError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

export function deleteSecret(ctx: commonModel.IUIRequestContext, regionId: string, projectId: string, secretId: string): Promise<commonModel.IUIOperationResult> {
  const fn = 'deleteSecret ';
  logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}', secretId: '${secretId}'`);

  return new Promise<commonModel.IUIOperationResult>((resolve, reject) => {

    // retrieve the access details to enter a specific namespace
    helpers.retrieveKubeApiAccessDetails(logger, regionId, projectId, ctx)
      .then((kubeAccessDetails: IAccessDetails) => {

        // delete the service
        return k8sSecretService.deleteKubeSecret(ctx, kubeAccessDetails, secretId)
          .then((deletionResult: any) => {

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
          logger.error(ctx, `${fn}- Failed to delete kube secret '${secretId}' in region '${regionId}' and project '${projectId}'`, err);
          // wrap the error object in a specifc coligo error object
          error = new commonErrors.FailedToDeleteSecretError(err);
        }

        logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
        reject(error);
      });
  });
}

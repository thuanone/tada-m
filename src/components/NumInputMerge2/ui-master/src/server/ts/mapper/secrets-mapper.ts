import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:secrets');

import { UIEntityKinds } from '../../../common/model/common-model';
import * as configModel from '../../../common/model/config-model';
import * as k8sModel from '../model/k8s-model';
import { getTimeInMillis } from './common-mapper';
import { IUIGenericSecret, IUIKeyValue } from '../../../common/model/config-model';

/**
 * This method converts a IUIRegistrySecret to an IKubernetesSecret
 * @param {configModel.IUIRegistrySecret} uiSecret - a coligo ui resource
 */
export function convertUiRegistrySecretToKubeSecret(uiSecret: configModel.IUISecret): k8sModel.IKubernetesSecret {
  const fn = 'convertUiRegistrySecretToKubeSecret ';
  logger.trace(`${fn}>`);

  if (!uiSecret) {
    logger.trace(`${fn}< NULL - given uiSecret is NULL or undefined`);
    return undefined;
  }

  let kubeSecret;
  if (isGenericSecret(uiSecret)) {
    kubeSecret = convertGenericSecretToKubeSecret(uiSecret as configModel.IUIGenericSecret);
  } else if (isRegistrySecret(uiSecret)) {
    kubeSecret = convertRegistrySecretToKubeSecret(uiSecret as configModel.IUIRegistrySecret);
  }

  logger.trace(`${fn}<`);
  return kubeSecret;
}

function isGenericSecret(uiSecret: configModel.IUISecret): boolean {
  return uiSecret && uiSecret.type === 'Generic';
}

function isRegistrySecret(uiSecret: configModel.IUISecret): boolean {
  return uiSecret && uiSecret.type === 'Registry';
}

function convertGenericSecretToKubeSecret(uiSecret: configModel.IUIGenericSecret): k8sModel.IKubernetesSecret {

  // build the Kube Secret
  const kubeSecret: k8sModel.IKubernetesSecret = {
    apiVersion: 'v1',
    data: {},
    kind: 'Secret',
    metadata: {
      creationTimestamp: null,
      name: uiSecret.name,
    },
    type: 'Opaque'
  };

  // add all key value pairs. Note: the values are gonna be handed over as base64 encoded strings
  for (const keyValuePair of uiSecret.data) {
    kubeSecret.data[keyValuePair.key] = keyValuePair.value && Buffer.from(`${keyValuePair.value}`).toString('base64');
  }

  return kubeSecret;
}

function convertRegistrySecretToKubeSecret(uiSecret: configModel.IUIRegistrySecret): k8sModel.IKubernetesSecret {

  // base64 encode the username and the password
  const authValueEncoded = Buffer.from(`${uiSecret.username}:${uiSecret.password}`).toString('base64');

  // base64 encode the .dockerconfigjson property
  const dockerConfigJsonEncoded = Buffer.from(`{"auths":{"${uiSecret.server}":{"username":"${uiSecret.username}","password":"${uiSecret.password}","auth":"${authValueEncoded}","email":"${uiSecret.email || ''}"}}}`).toString('base64'); // pragma: allowlist secret

  // build the Kube Secret
  const kubeSecret: k8sModel.IKubernetesSecret = {
    apiVersion: 'v1',
    data: {
      '.dockerconfigjson': dockerConfigJsonEncoded,
    },
    kind: 'Secret',
    metadata: {
      creationTimestamp: null,
      name: uiSecret.name,
    },
    type: 'kubernetes.io/dockerconfigjson'
  };

  return kubeSecret;
}

function convertKubeSecretToUiGenericSecret(kubeSecret: k8sModel.IKubernetesSecret, uiSecret: configModel.IUISecret, includeCredentials?: boolean) {
  try {
    const uiGenericSecret = uiSecret as configModel.IUIGenericSecret;

    uiGenericSecret.data = [];
    if (kubeSecret.data) {
      for (const key of Object.keys(kubeSecret.data)) {
        const newSecret: IUIKeyValue = { key };
        if (includeCredentials) {
          newSecret.value = kubeSecret.data[key];
        }
        uiGenericSecret.data.push(newSecret);
      }
    }

    return uiGenericSecret;
  } catch (err) {
    logger.error(`convertKubeSecretToUiGenericSecret - error while converting the secret ${uiSecret.name}`, err);
  }
}

function convertKubeSecretToUiRegistrySecret(kubeSecret: k8sModel.IKubernetesSecret, uiSecret: configModel.IUISecret, includeCredentials?: boolean) {
  try {
    if (kubeSecret.data && kubeSecret.data['.dockerconfigjson']) {
      const uiRegistrySecret = uiSecret as configModel.IUIRegistrySecret;
      const registryData = JSON.parse(Buffer.from(kubeSecret.data['.dockerconfigjson'], 'base64').toString('ascii'));
      if (registryData && registryData.auths) {
        for (const server of Object.keys(registryData.auths)) {
          uiRegistrySecret.server = server;
          uiRegistrySecret.username = registryData.auths[server].username;
          if (includeCredentials) {
            uiRegistrySecret.password = registryData.auths[server].password; // pragma: allowlist secret
          }
        }
      }
      return uiRegistrySecret;
    }
  } catch (err) {
    logger.error(`convertKubeSecretToUiRegistrySecret - error while converting the secret ${uiSecret.name}`, err);
  }
}

/**
 * This method converts an IKubernetesSecret to an IUISecret
 * @param {k8sModel.IKubernetesSecret} secret - a k8s secret resource
 */
export function convertKubeSecretToUiSecret(kubeSecret: k8sModel.IKubernetesSecret, regionId: string, projectId: string, includeCredentials?: boolean): configModel.IUISecret | configModel.IUIRegistrySecret | configModel.IUIGenericSecret {
  const fn = 'convertKubeSecretToUiSecret ';
  logger.trace(`${fn}> kubeSecret: '${JSON.stringify(kubeSecret)}', regionId: ${regionId}`);

  if (!kubeSecret || !kubeSecret.metadata || !kubeSecret.metadata.name) {
    logger.trace(`${fn}< NULL - given kubeSecret is NULL or undefined`);
    return undefined;
  }

  // build the IUISecret
  let uiSecret: configModel.IUISecret = {
    created: getTimeInMillis(kubeSecret.metadata.creationTimestamp),
    id: kubeSecret.metadata.name,
    kind: UIEntityKinds.SECRET,
    name: kubeSecret.metadata.name,
    namespace: kubeSecret.metadata.namespace,
    projectId,
    regionId,
    type: getSecretType(kubeSecret),
  };

  if (isGenericSecret(uiSecret)) {
    uiSecret = convertKubeSecretToUiGenericSecret(kubeSecret, uiSecret, includeCredentials) || uiSecret;
  } else if (isRegistrySecret(uiSecret)) {
    uiSecret = convertKubeSecretToUiRegistrySecret(kubeSecret, uiSecret, includeCredentials) || uiSecret;
  }

  logger.trace(`${fn}< '${configModel.stringify(uiSecret)}'`);
  return uiSecret;
}

export function convertKubeSecretsToUiSecrets(kubeSecrets: k8sModel.IKubernetesSecret[], regionId: string, projectId: string): configModel.IUISecret[] {
  const fn = 'convertKubeSecretsToUiSecrets ';
  logger.trace(`${fn}> ${kubeSecrets && kubeSecrets.length}kubeSecrets`);

  if (!kubeSecrets || !Array.isArray(kubeSecrets)) {
    logger.trace(`${fn}< NULL - given kubeSecrets is NULL or undefined`);
    return undefined;
  }

  const uiSecrets: configModel.IUISecret[] = kubeSecrets.map((kubeSecret: k8sModel.IKubernetesSecret) => (
    convertKubeSecretToUiSecret(kubeSecret, regionId, projectId)
  ));

  logger.trace(`${fn}< '${uiSecrets && uiSecrets.length}' secrets`);
  return uiSecrets;
}

function getSecretType(kubeSecret: k8sModel.IKubernetesSecret) {
  if (kubeSecret && kubeSecret.type === 'kubernetes.io/dockerconfigjson') {
    return 'Registry';
  } else if (kubeSecret && kubeSecret.type === 'Opaque') {
    return 'Generic';
  } else if (kubeSecret && kubeSecret.type === 'kubernetes.io/service-account-token') {
    return 'ServiceAccountToken';
  } else if (kubeSecret && kubeSecret.type === 'kubernetes.io/basic-auth') {
    return 'BasicAuth';
  } else if (kubeSecret && kubeSecret.type === 'kubernetes.io/ssh-auth') {
    return 'SSHAuth';
  } else if (kubeSecret && kubeSecret.type === 'istio.io/tls') {
    return 'TLS';
  } else if (kubeSecret && kubeSecret.type === 'istio.io/key-and-cert') {
    return 'KeyAndCert';
  } else {
    return 'Other';
  }
}

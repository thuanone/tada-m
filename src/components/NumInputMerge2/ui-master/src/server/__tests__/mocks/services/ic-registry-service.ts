import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as registryModel from '../../../ts/model/ic-registry-model';

export const ACCESSTOKEN: string = 'valid-accessToken';
export const ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR: string = 'valid-accessToken_backendfails';
export const ACCESSTOKEN_THAT_CAUSES_ERROR: string = 'valid-accessToken_backenderrors';

export const NAMESPACE_ID: string = 'foobar';

export const REPOSITORY_ID: string = 'foobarrepository';
export const IMAGE_ID: string = 'foobarimage';

export const DUMMY_NAMESPACE: string = NAMESPACE_ID;
export const DUMMY_IMAGE: registryModel.IContainerImage = {
  Id: IMAGE_ID,
  DigestTags: {
    'sha256:d7984fd198d83c98fc3f36937975a5ee6274f55e4b52bd2ee5b65c3a9c06831d': [
      `stg.icr.io/${NAMESPACE_ID}/${REPOSITORY_ID}:v2`
    ]
  },
  RepoTags: [
    `stg.icr.io/${NAMESPACE_ID}/${REPOSITORY_ID}:v2`
  ],
  Created: 1594239369,
  Size: 58830994,
  VulnerabilityCount: 0,
  IssueCount: 0,
  ExemptIssueCount: 0,
};

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

export function listNamespaces(ctx: commonModel.IUIRequestContext, registryServer: string, accessToken: string, accountId: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (ACCESSTOKEN === accessToken) {
      const dummyNamespace = cloneObject(DUMMY_NAMESPACE);
      return resolve([dummyNamespace]);
    }

    if (accessToken === ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export async function listImages(ctx: commonModel.IUIRequestContext, registryServer: string, accessToken: string, accountId: string, namespace?: string, repository?: string): Promise<registryModel.IContainerImage[]> {
  return new Promise((resolve, reject) => {
    if (ACCESSTOKEN === accessToken) {
      return resolve([DUMMY_IMAGE]);
    }

    if (accessToken === ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.FailedToListIcrImagesError(new Error('something stupid'));
    }

    throw new Error('some exception');
  });
}

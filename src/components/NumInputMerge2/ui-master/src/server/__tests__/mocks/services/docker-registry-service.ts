import * as commonErrors from '../../../../common/Errors';
import * as commonModel from '../../../../common/model/common-model';
import * as containerRegistryModel from '../../../ts/model/container-registry-model';
import * as registryModel from '../../../ts/model/dockerhub-registry-model';

export const USERNAME: string = 'valid-username';
export const USERNAME_THAT_PROVIDES_INVALID_ACCESSTOKEN: string = 'valid-username_invalid-accesstoken';
export const USERNAME_THAT_CAUSES_BACKEND_ERROR: string = 'username_backendfails';
export const USERNAME_THAT_CAUSES_ERROR: string = 'username_backenderrors';

export const ACCESSTOKEN: string = 'valid-accessToken';
export const ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR: string = 'valid-accessToken_backendfails';
export const ACCESSTOKEN_THAT_CAUSES_ERROR: string = 'valid-accessToken_backenderrors';

export const NAMESPACE_ID: string = 'dockerhub_foobarnamespace';

export const REPOSITORY_ID: string = 'dockerhub_foobarrepo';

export const IMAGE_ID: string = 'dockerhub_foobarimage';

export const DUMMY_NAMESPACE: string = NAMESPACE_ID;

export const DUMMY_REPOSITORY: registryModel.IContainerImage = {
  name: REPOSITORY_ID,
};
export const DUMMY_IMAGE: registryModel.IContainerImage = {
  name: IMAGE_ID,
};

export const DUMMY_ACCESS_TOKEN: containerRegistryModel.IDockerAccess = {
  token: ACCESSTOKEN,
};

function cloneObject(a) {
  return JSON.parse(JSON.stringify(a));
}

export function getAccessToken(ctx: commonModel.IUIRequestContext, username: string, password: string): Promise<containerRegistryModel.IDockerAccess> { // pragma: allowlist secret
  return new Promise((resolve, reject) => {
    if (USERNAME === username) {
      return resolve(DUMMY_ACCESS_TOKEN);
    } else if (USERNAME_THAT_PROVIDES_INVALID_ACCESSTOKEN === username) {
      return resolve({ token: ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR });
    }

    if (username === ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export function listNamespaces(ctx: commonModel.IUIRequestContext, accessToken: string, accountId: string): Promise<string[]> {
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

export function listRepositories(ctx: commonModel.IUIRequestContext, accessToken: string, namespace: string, page: number = 1, list?: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (ACCESSTOKEN === accessToken) {
      const dummyRepository = cloneObject(DUMMY_REPOSITORY);
      return resolve([dummyRepository]);
    }

    if (accessToken === ACCESSTOKEN_THAT_CAUSES_BACKEND_ERROR) {
      throw new commonErrors.UnknownError();
    }

    throw new Error('some exception');
  });
}

export async function listImages(ctx: commonModel.IUIRequestContext, accessToken: string, namespace: string, repository: string, page: number = 1, list?: any[]): Promise<registryModel.IContainerImage[]> {
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

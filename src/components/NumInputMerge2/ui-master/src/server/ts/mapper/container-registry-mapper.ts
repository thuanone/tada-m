
import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:container-registry');
import { UIEntityKinds } from '../../../common/model/common-model';
import * as containerRegistryModel from '../../../common/model/container-registry-model';
import * as icRegistryModel from '../model/ic-registry-model';

/**
 * This method converts an IContainerNamespace to an IUIContainerRegistryNamespace
 * @param {String} containerNamespace - am IBM Container Registry API namespace
 */
export function convertIcrNamespaceToUiNamespace(containerNamespace: string, regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryNamespace {
  const fn = 'convertIcrNamespaceToUiNamespace ';
  logger.debug(`${fn}> containerNamespace: '${JSON.stringify(containerNamespace)}', regionId: ${regionId}, projectId: ${projectId}, registryId: ${registryId}`);

  if (!containerNamespace) {
    logger.trace(`${fn}< NULL - given containerNamespace is NULL or undefined`);
    return undefined;
  }

  // build the IUIContainerRegistryNamespace
  const uiRegistryNamespace: containerRegistryModel.IUIContainerRegistryNamespace = {
    id: containerNamespace,
    kind: UIEntityKinds.CONTAINERREGISTRYNAMESPACE,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiRegistryNamespace)}'`);
  return uiRegistryNamespace;
}

export function convertIcrNamespacesToUiNamespaces(containerNamespaces: string[], regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryNamespace[] {
  const fn = 'convertIcrNamespacesToUiNamespaces ';
  logger.debug(`${fn}> ${containerNamespaces && containerNamespaces.length} namespaces`);

  if (!containerNamespaces || !Array.isArray(containerNamespaces)) {
    logger.trace(`${fn}< NULL - given containerNamespaces is NULL or undefined`);
    return undefined;
  }

  const uiNamespaces: containerRegistryModel.IUIContainerRegistryNamespace[] = containerNamespaces.map((containerNamespace: string) => (
    convertIcrNamespaceToUiNamespace(containerNamespace, regionId, projectId, registryId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiNamespaces)}'`);
  return uiNamespaces;
}

/**
 * This method converts an IContainerImage to an IUIContainerRegistryImage
 * @param {String} containerImage - am IBM Container Registry API image
 */
export function convertIcrImageToUiImage(containerImage: icRegistryModel.IContainerImage, regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryImage {
  const fn = 'convertIcrImageToUiImage ';
  logger.trace(`${fn}> containerImage: '${icRegistryModel.stringify(containerImage)}', regionId: ${regionId}, projectId: ${projectId}, registryId: ${registryId}`);

  if (!containerImage) {
    logger.trace(`${fn}< NULL - given containerImage is NULL or undefined`);
    return undefined;
  }

  const imageTag = containerImage.RepoTags && containerImage.RepoTags.length > 0 && containerImage.RepoTags[0];

  // build the IUIContainerRegistryImage
  const uiRegistryImage: containerRegistryModel.IUIContainerRegistryImage = {
    id: containerImage.Id,
    kind: UIEntityKinds.CONTAINERREGISTRYIMAGE,
    tag: imageTag,
    created: containerImage.Created,
    size: containerImage.Size,
    projectId,
    regionId,
    registryId,
    registryKind: containerRegistryModel.RegistryKind.IBM,

    namespace: getNamespaceFromImageTag(imageTag),
    repository: getRepositoryFromImageTag(imageTag),
    image: getImageFromImageTag(imageTag),
  };

  logger.trace(`${fn}< '${JSON.stringify(uiRegistryImage)}'`);
  return uiRegistryImage;
}

/**
 * This method converts an IContainerImage to an IUIContainerRegistryRepository
 * @param {String} containerImage - a IBM Container Registry API image
 */
export function convertIcrImageToUiRepository(containerImage: icRegistryModel.IContainerImage, regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryRepository {
  const fn = 'convertIcrImageToUiRepository ';
  logger.trace(`${fn}> containerImage: '${icRegistryModel.stringify(containerImage)}', regionId: ${regionId}, projectId: ${projectId}, registryId: ${registryId}`);

  if (!containerImage) {
    logger.trace(`${fn}< NULL - given containerImage is NULL or undefined`);
    return undefined;
  }

  const imageTag = containerImage.RepoTags && containerImage.RepoTags.length > 0 && containerImage.RepoTags[0];
  const namespace = getNamespaceFromImageTag(imageTag);
  const name = getRepositoryFromImageTag(imageTag);

  // build the IUIContainerRegistryRepository
  const uiRegistryRepository: containerRegistryModel.IUIContainerRegistryRepository = {
    id: `${namespace}:${name}`,
    kind: UIEntityKinds.CONTAINERREGISTRYREPOSITORY,

    namespace,
    repository: name,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiRegistryRepository)}'`);
  return uiRegistryRepository;
}

export function convertIcrImagesToUiImages(containerImages: icRegistryModel.IContainerImage[], regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryImage[] {
  const fn = 'convertIcrImagesToUiImages ';
  logger.trace(`${fn}> ${containerImages && containerImages.length} images`);

  if (!containerImages || !Array.isArray(containerImages)) {
    logger.trace(`${fn}< NULL - given containerImages is NULL or undefined`);
    return undefined;
  }

  const uiImages: containerRegistryModel.IUIContainerRegistryImage[] = containerImages.map((containerImage: icRegistryModel.IContainerImage) => (
    convertIcrImageToUiImage(containerImage, regionId, projectId, registryId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiImages)}'`);
  return uiImages;
}

export function convertIcrImagesToUiRepositories(containerImages: icRegistryModel.IContainerImage[], regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryRepository[] {
  const fn = 'convertIcrImagesToUiImages ';
  logger.trace(`${fn}> ${containerImages && containerImages.length} images`);

  if (!containerImages || !Array.isArray(containerImages)) {
    logger.trace(`${fn}< NULL - given containerImages is NULL or undefined`);
    return undefined;
  }

  const uiRepositories: containerRegistryModel.IUIContainerRegistryRepository[] = [];
  const repositoryId: { [key: string]: string } = {};

  containerImages.forEach((containerImage: icRegistryModel.IContainerImage) => {

    const repositoryCandidate: containerRegistryModel.IUIContainerRegistryRepository = convertIcrImageToUiRepository(containerImage, regionId, projectId, registryId);

    // prevent duplicates
    if (repositoryId[repositoryCandidate.id]) {
      return;
    }
    repositoryId[repositoryCandidate.id] = repositoryCandidate.id;
    uiRepositories.push(repositoryCandidate);
  });

  logger.trace(`${fn}< '${JSON.stringify(uiRepositories)}'`);
  return uiRepositories;
}

function getNamespaceFromImageTag(imageTag: string) {
  if (!imageTag) {
    return undefined;
  }
  if (imageTag.indexOf('/') === -1) {
    return undefined;
  }

  const imageUriParts = imageTag.split('/');
  if (imageUriParts.length < 2) {
    return undefined;
  }

  return imageUriParts[1];
}

function getRepositoryFromImageTag(imageTag: string) {
  if (!imageTag) {
    return undefined;
  }
  if (imageTag.indexOf('/') === -1) {
    return undefined;
  }

  const imageUriParts = imageTag.split('/');
  if (imageUriParts.length < 3) {
    return undefined;
  }

  const repositoryAndImage = imageUriParts[2];
  if (imageTag.indexOf(':') === -1) {
    return repositoryAndImage;
  }

  return repositoryAndImage.split(':')[0];
}

/**
 * parses the given image tag and returns just the image (aka tag) portion of the image reference
 * @param imageTag stg.icr.io/foobar/my-taxi:v2
 */
function getImageFromImageTag(imageTag: string) {
  if (!imageTag) {
    return undefined;
  }
  if (imageTag.indexOf('/') === -1) {
    return undefined;
  }

  const imageUriParts = imageTag.split('/');
  if (imageUriParts.length < 3) {
    return undefined;
  }

  const repositoryAndImage = imageUriParts[2];
  if (imageTag.indexOf(':') === -1) {
    return repositoryAndImage;
  }

  return repositoryAndImage.split(':')[1];
}

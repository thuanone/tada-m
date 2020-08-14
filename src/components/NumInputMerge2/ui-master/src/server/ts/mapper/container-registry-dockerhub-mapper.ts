
import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:container-registry');
import { UIEntityKinds } from '../../../common/model/common-model';
import * as containerRegistryModel from '../../../common/model/container-registry-model';
import * as dockerhubRegistryModel from '../model/dockerhub-registry-model';

/**
 * This method converts an IContainerNamespace to an IUIContainerRegistryNamespace
 * @param {String} containerNamespace - an DockerHub Registry API namespace
 */
export function convertDockerHubNamespaceToUiNamespace(containerNamespace: string, regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryNamespace {
  const fn = 'convertDockerHubNamespaceToUiNamespace ';
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

export function convertDockerHubNamespacesToUiNamespaces(containerNamespaces: string[], regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryNamespace[] {
  const fn = 'convertDockerHubNamespacesToUiNamespaces ';
  logger.debug(`${fn}> ${containerNamespaces && containerNamespaces.length} namespaces`);

  if (!containerNamespaces || !Array.isArray(containerNamespaces)) {
    logger.trace(`${fn}< NULL - given containerNamespaces is NULL or undefined`);
    return undefined;
  }

  const uiNamespaces: containerRegistryModel.IUIContainerRegistryNamespace[] = containerNamespaces.map((containerNamespace: string) => (
    convertDockerHubNamespaceToUiNamespace(containerNamespace, regionId, projectId, registryId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiNamespaces)}'`);
  return uiNamespaces;
}

/**
 * This method converts an IContainerRepository to an IUIContainerRegistryRepository
 * @param {String} containerRepository - a DockerHub respository
 */
export function convertDockerHubRepositoryToUiRepository(containerRepository: dockerhubRegistryModel.IContainerRepository, regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryRepository {
  const fn = 'convertDockerHubRepositoryToUiRepository ';
  logger.trace(`${fn}> containerRepository: '${dockerhubRegistryModel.stringifyRepository(containerRepository)}', regionId: ${regionId}, projectId: ${projectId}, registryId: ${registryId}`);

  if (!containerRepository) {
    logger.trace(`${fn}< NULL - given containerRepository is NULL or undefined`);
    return undefined;
  }

  // build the IUIContainerRegistryRepository
  const uiRegistryRepository: containerRegistryModel.IUIContainerRegistryRepository = {
    id: `${containerRepository.namespace}/${containerRepository.name}`,
    kind: UIEntityKinds.CONTAINERREGISTRYREPOSITORY,

    namespace: containerRepository.namespace,
    repository: containerRepository.name,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiRegistryRepository)}'`);
  return uiRegistryRepository;
}

export function convertDockerHubRepositoriesToUiRepositories(containerRepositories: dockerhubRegistryModel.IContainerRepository[], regionId: string, projectId: string, registryId: string): containerRegistryModel.IUIContainerRegistryRepository[] {
  const fn = 'convertDockerHubRepositoriesToUiRepositories ';
  logger.trace(`${fn}> ${containerRepositories && containerRepositories.length} repositories`);

  if (!containerRepositories || !Array.isArray(containerRepositories)) {
    logger.trace(`${fn}< NULL - given containerRepositories is NULL or undefined`);
    return undefined;
  }

  const uiRepositories: containerRegistryModel.IUIContainerRegistryRepository[] = containerRepositories.map((containerRepository: dockerhubRegistryModel.IContainerRepository) => (
    convertDockerHubRepositoryToUiRepository(containerRepository, regionId, projectId, registryId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiRepositories)}'`);
  return uiRepositories;
}

/**
 * This method converts an IContainerImage to an IUIContainerRegistryImage
 * @param {String} containerImage - am IBM Container Registry API image
 */
export function convertDockerHubImageToUiImage(containerImage: dockerhubRegistryModel.IContainerImage, regionId: string, projectId: string, registryId: string, namespaceId: string, repositoryId: string): containerRegistryModel.IUIContainerRegistryImage {
  const fn = 'convertDockerHubImageToUiImage ';
  logger.trace(`${fn}> containerImage: '${dockerhubRegistryModel.stringifyImage(containerImage)}', regionId: ${regionId}, projectId: ${projectId}, registryId: ${registryId}`);

  if (!containerImage) {
    logger.trace(`${fn}< NULL - given containerImage is NULL or undefined`);
    return undefined;
  }

  const imageTag = `${namespaceId}/${repositoryId}:${containerImage.name}`;

  // build the IUIContainerRegistryImage
  const uiRegistryImage: containerRegistryModel.IUIContainerRegistryImage = {
    id: containerImage.name,
    kind: UIEntityKinds.CONTAINERREGISTRYIMAGE,
    tag: imageTag,
    created: -1,
    size: -1,
    projectId,
    regionId,
    registryId,
    registryKind: containerRegistryModel.RegistryKind.DOCKERHUB,

    namespace: namespaceId,
    repository: repositoryId,
    image: containerImage.name,
  };

  logger.trace(`${fn}< '${JSON.stringify(uiRegistryImage)}'`);
  return uiRegistryImage;
}

export function convertDockerHubImagesToUiImages(containerImages: dockerhubRegistryModel.IContainerImage[], regionId: string, projectId: string, registryId: string, namespaceId: string, repositoryId: string): containerRegistryModel.IUIContainerRegistryImage[] {
  const fn = 'convertDockerHubImagesToUiImages ';
  logger.trace(`${fn}> ${containerImages && containerImages.length} images`);

  if (!containerImages || !Array.isArray(containerImages)) {
    logger.trace(`${fn}< NULL - given containerImages is NULL or undefined`);
    return undefined;
  }

  const uiImages: containerRegistryModel.IUIContainerRegistryImage[] = containerImages.map((containerImage: dockerhubRegistryModel.IContainerImage) => (
    convertDockerHubImageToUiImage(containerImage, regionId, projectId, registryId, namespaceId, repositoryId)
  ));

  logger.trace(`${fn}< '${JSON.stringify(uiImages)}'`);
  return uiImages;
}

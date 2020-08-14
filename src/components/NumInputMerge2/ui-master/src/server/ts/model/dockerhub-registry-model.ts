export function stringifyImage(image: IContainerImage): string {
  return image ? `IContainerImage[${image.name}]` : 'IContainerImage[UNDEFINED]';
}

export function stringifyRepository(repo: IContainerRepository): string {
  return repo ? `IContainerRepository[${repo.name}@${repo.namespace}]` : 'IContainerRepository[UNDEFINED]';
}

export interface IContainerImage {
  name: string;
}

export interface IContainerRepository {
  user: string;
  name: string;
  namespace: string;
  repository_type: string;
  description: string;
  last_updated: string;
}

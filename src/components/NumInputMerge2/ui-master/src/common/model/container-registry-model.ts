import { UIEntityKinds } from './common-model';

export enum RegistryKind {
  ALIBABA = 'alibaba',
  AWS = 'ecr',
  AZURE = 'azure',
  DOCKERHUB = 'dockerhub',
  GOOGLE = 'gcr',
  ECR = 'BuildRun',
  IBM = 'icr',
  RHQUAY = 'redhat',
  UNKNOWN = 'unknown',
  VMHARBOR = 'vmharbor',
}

export function stringify(entity: IUIContainerRegistryNamespace | IUIContainerRegistryImage): string {
  if (!entity) { return 'NULL'; }

  let str = `${entity.kind || '???'}[`;
  if (entity.id) {
    str += `id: ${entity.id}`;
  }
  str += ']';
  return str;

}

export interface IUIContainerRegistryNamespace {
  id: string;
  kind: UIEntityKinds.CONTAINERREGISTRYNAMESPACE;
}

export interface IUIContainerRegistryRepository {
  id: string;
  kind: UIEntityKinds.CONTAINERREGISTRYREPOSITORY;

  namespace: string;
  repository: string;
}

export interface IUIContainerRegistryImage {
  id: string;
  kind: UIEntityKinds.CONTAINERREGISTRYIMAGE;
  tag: string;
  created: number;
  size: number;

  regionId?: string;
  projectId?: string;
  registryId?: string;
  registryKind: RegistryKind;

  namespace: string;
  repository: string;
  image: string;
}

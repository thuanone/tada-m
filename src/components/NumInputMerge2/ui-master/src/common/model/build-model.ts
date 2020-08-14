import {IClgTextField} from '../validator/common-validator';
import { UIEntityKinds } from './common-model';
import * as configModel from './config-model';

export function stringify(entity: IUIBuild | IUIBuildRun): string {
  if (!entity) { return 'NULL'; }

  let str = `${entity.kind || '???'}[`;
  if (entity.name) {
    str += `name: ${entity.name}`;
  } else if (entity.id) {
    str += `id: ${entity.id}`;
  }
  str += ']';
  return str;

}

export enum UIBuildRunStatus {
  UNKNOWN = 'UNKNOWN',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export interface IUIBuild {
  id: string;
  kind: UIEntityKinds.BUILD;
  name?: string;
  created?: number | undefined;
  isDeleting?: boolean;

  regionId?: string;
  namespace?: string;
  projectId?: string;

  sourceUrl: string;
  sourceRev?: string;

  strategyName: string;
  strategyKind: string;

  outputImage: string;
  outputCredentials: string;
}

export interface IUIEditBuild {
  name?: IClgTextField;
  sourceUrl: IClgTextField;
  sourceRev?: IClgTextField;
  strategyName: IClgTextField;
  outputImage: IClgTextField;
  outputRegistry: configModel.IUIRegistrySecret;
}

export interface IUIBuildRun {
  id: string;
  key?: string;  // for use in a REACT table only
  kind: UIEntityKinds.BUILDRUN;
  name?: string;
  created?: number | undefined;
  isDeleting?: boolean;

  regionId?: string;
  namespace?: string;
  projectId?: string;

  buildRef: string;

  completionTime?: number;
  latestTaskRunRef?: string;
  reason?: string;
  startTime?: number;
  succeeded?: string;
  status?: UIBuildRunStatus;
}

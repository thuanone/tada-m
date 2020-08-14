import { UIEntityKinds } from './common-model';

export function stringify(entity: IUISecret | IUIConfigMap): string {
  if (!entity) { return 'NULL'; }

  let str = `${entity.kind || '???'}[`;
  if (entity.name) {
    str += `name: ${entity.name}`;
  } else if (entity.id) {
    str += `id: ${entity.id}`;
  }
  if (entity.kind === UIEntityKinds.SECRET) {
    if (entity.type) {
      str += ` type: ${entity.type}`;
    }
  }
  str += ']';
  return str;

}

export interface IUISecret {
  id: string;
  kind: 'Secret';
  type: 'Registry' | 'Generic' | 'ServiceAccountToken' | 'KeyAndCert' | 'BasicAuth' | 'SSHAuth' | 'TLS' | 'Other';
  name?: string;
  created?: number | undefined;

  isDeleting?: boolean;

  regionId: string;
  namespace?: string;
  projectId?: string;
}

export interface IUIRegistrySecret extends IUISecret {
  server: string;
  username: string;
  password: string; // pragma: allowlist secret
  email?: string;
}

export interface IUIGenericSecret extends IUISecret {
  data?: IUIKeyValue[];
}

export interface IUIConfigMap {
  id: string;
  kind: 'ConfigMap';
  name: string;
  created?: number | undefined;
  data?: IUIKeyValue[];

  isDeleting?: boolean;

  regionId: string;
  namespace?: string;
  projectId?: string;
}

export interface IUIKeyValue {
  key: string;
  value?: any;
}

import {
  IUIEnvItemKeyRef,
  IUIEnvItemKind,
  IUIEnvItemLiteral,
  IUIEnvItemMapRef, IUIEnvItemPredefined,
  IUIEnvItemUnsupported,
  IUIEnvRefKind
} from '../../../../common/model/common-model';
import { IEnvVarFromList, IEnvVarList } from '../../../ts/model/k8s-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

describe('common mapper', () => {
  let commonMapper: any;

  beforeEach(() => {
    commonMapper = proxyquire('../../../ts/mapper/common-mapper', {
    });
  });

  // map IUIEnvItems to env + envFrom backend environment spec
  describe('mapEnvItemsToEnvVarResult', () => {
    it('properly handles null/undefined/empty array input', () => {
      let result = commonMapper.mapEnvItemsToEnvVarResult();
      expect(result).toBeDefined();
      expect(result.env).toEqual([]);
      expect(result.envFrom).toEqual([]);

      result = commonMapper.mapEnvItemsToEnvVarResult(null);
      expect(result).toBeDefined();
      expect(result.env).toEqual([]);
      expect(result.envFrom).toEqual([]);

      result = commonMapper.mapEnvItemsToEnvVarResult([]);
      expect(result).toBeDefined();
      expect(result.env).toEqual([]);
      expect(result.envFrom).toEqual([]);
    });

    it('properly converts literal variables', () => {
      const envItems: IUIEnvItemLiteral[] = [
        {
          kind: IUIEnvItemKind.LITERAL,
          name: 'First',
          value: 'Variable',
        },
        {
          kind: IUIEnvItemKind.LITERAL,
          name: 'Second',
          value: 'Param',
        }
      ];

      const result = commonMapper.mapEnvItemsToEnvVarResult(envItems);
      expect(result).toBeDefined();
      expect(result.env).toBeDefined();
      expect(result.env.length).toBe(2);
      expect(result.env[0].name).toEqual('First');
      expect(result.env[0].value).toEqual('Variable');
      expect(result.env[1].name).toEqual('Second');
      expect(result.env[1].value).toEqual('Param');
      expect(result.envFrom).toEqual([]);
    });

    it('properly converts keyRef items', () => {
      const envItems: IUIEnvItemKeyRef[] = [
        {
          kind: IUIEnvItemKind.KEYREF,
          name: 'ConfigMapKeyRef',
          keyRefKind: IUIEnvRefKind.CONFIGMAP,
          valueFrom: {
            key: 'key-one',
            name: 'my-configMap',
          },
        },
        {
          kind: IUIEnvItemKind.KEYREF,
          name: 'SecretKeyRef',
          keyRefKind: IUIEnvRefKind.SECRET,
          valueFrom: {
            key: 'secret-key',
            name: 'my-secret',
          }
        },
      ];

      const result = commonMapper.mapEnvItemsToEnvVarResult(envItems);
      expect(result).toBeDefined();
      expect(result.env).toBeDefined();
      expect(result.env.length).toBe(2);
      expect(result.env).toEqual([{
        valueFrom: {
           configMapKeyRef: {
               key: 'key-one',
               name: 'my-configMap'
           }
        },
        name: 'ConfigMapKeyRef'
        }, {
        valueFrom: {
           secretKeyRef: {
               key: 'secret-key',
               name: 'my-secret'
           }
        },
        name: 'SecretKeyRef'
        }]);
      expect(result.envFrom).toEqual([]);
    });

    it('properly converts mapRef items', () => {
      const envItems: IUIEnvItemMapRef[] = [
        {
          kind: IUIEnvItemKind.MAPREF,
          prefix: 'config-map-prefix-',
          mapRefKind: IUIEnvRefKind.CONFIGMAP,
          valuesFrom: {
            name: 'my-config-map',
          },
        },
        {
          kind: IUIEnvItemKind.MAPREF,
          mapRefKind: IUIEnvRefKind.SECRET,
          valuesFrom: {
            name: 'my-secret',
          }
        },
      ];

      const result = commonMapper.mapEnvItemsToEnvVarResult(envItems);
      expect(result).toBeDefined();
      expect(result.env).toEqual([]);
      expect(result.envFrom).toBeDefined();
      expect(result.envFrom.length).toBe(2);
      expect(result.envFrom).toEqual([
        {
          configMapRef: {
            name: 'my-config-map',
          },
          prefix: 'config-map-prefix-',
        },
        {
          secretRef: {
            name: 'my-secret',
          },
          prefix: undefined,
        }
      ]);
    });

    it('properly handles Container image variables', () => {
      const envItems: IUIEnvItemPredefined[] = [
        {
          kind: IUIEnvItemKind.PREDEFINED,
          name: 'ContainerEnvName',
          value: 'ContainerEnvVariable',
        },
      ];

      const result = commonMapper.mapEnvItemsToEnvVarResult(envItems);
      expect(result).toBeDefined();
      expect(result.env).toEqual([]);
      expect(result.envFrom).toEqual([]);
    });

    it('properly handles unsupported environment variables', () => {
      const envItems: IUIEnvItemUnsupported[] = [
        {
          kind: IUIEnvItemKind.UNSUPPORTED,
          name: 'Unsupported Env',
          originalValue: {
            unsupportedRef: {
              name: 'fieldRef',
              value: 'location.url',
            }
          },
        },
        {
          kind: IUIEnvItemKind.UNSUPPORTED_FROM,
          name: 'Unsupported EnvFrom',
          originalValue: {
            unsupportedRef: {
              name: 'unsupportedMapRef',
              value: 'map-name',
            },
            prefix: 'my-prefix-',
          },
        }
      ];

      const result = commonMapper.mapEnvItemsToEnvVarResult(envItems);
      expect(result).toBeDefined();
      expect(result.env).toBeDefined();
      expect(result.env.length).toBe(1);
      expect(result.envFrom).toBeDefined();
      expect(result.envFrom.length).toBe(1);

      expect(result.env[0]).toEqual({
        name: 'Unsupported Env',
        valueFrom: {
          unsupportedRef: {
            name: 'fieldRef',
            value: 'location.url',
          } ,
        },
      });

      expect(result.envFrom[0]).toEqual({
        unsupportedRef: {
          name: 'unsupportedMapRef',
          value: 'map-name',
        },
        prefix: 'my-prefix-',
      });
    });
  });

  // map backend envVars (single + multiple) to IUIEnvItems
  describe('mapEnvVarsToEnvItems', () => {
    it('properly handles null/undefined/empty array input', () => {
      let result = commonMapper.mapEnvVarsToEnvItems();
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems(null, null);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems([], []);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems(undefined, null);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems(null);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems(undefined, []);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems([]);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems(null, []);
      expect(result).toBeUndefined();

      result = commonMapper.mapEnvVarsToEnvItems([], null);
      expect(result).toBeUndefined();
    });

    it('properly converts literal variables', () => {
      const envVarList: IEnvVarList = [
        {
          name: 'First',
          value: 'Variable',
        },
        {
          name: 'Second',
          value: 'Param',
        },
      ];

      const result = commonMapper.mapEnvVarsToEnvItems(envVarList, undefined);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        kind: IUIEnvItemKind.LITERAL,
        name: 'First',
        value: 'Variable',
      });
      expect(result[1]).toEqual({
        kind: IUIEnvItemKind.LITERAL,
        name: 'Second',
        value: 'Param',
      });
    });

    it('properly converts keyRef items', () => {
      const envVarList: IEnvVarList = [{
        valueFrom: {
          configMapKeyRef: {
            key: 'key-one',
            name: 'my-configMap'
          }
        },
        name: 'ConfigMapKeyRef'
      }, {
        valueFrom: {
          secretKeyRef: {
            key: 'secret-key',
            name: 'my-secret'
          }
        },
        name: 'SecretKeyRef'
      }];

      const result = commonMapper.mapEnvVarsToEnvItems(envVarList, undefined);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(
        {
          kind: IUIEnvItemKind.KEYREF,
          name: 'ConfigMapKeyRef',
          keyRefKind: IUIEnvRefKind.CONFIGMAP,
          valueFrom: {
            key: 'key-one',
            name: 'my-configMap',
          },
        });

      expect(result[1]).toEqual(
        {
          kind: IUIEnvItemKind.KEYREF,
          name: 'SecretKeyRef',
          keyRefKind: IUIEnvRefKind.SECRET,
          valueFrom: {
            key: 'secret-key',
            name: 'my-secret',
          }
        });
    });

    it('properly converts mapRef items', () => {
      const envVarFromList: IEnvVarFromList = [
        {
          configMapRef: {
            name: 'my-config-map',
          },
          prefix: 'config-map-prefix-',
        },
        {
          secretRef: {
            name: 'my-secret',
          },
        }
      ];

      const result = commonMapper.mapEnvVarsToEnvItems(undefined, envVarFromList);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        kind: IUIEnvItemKind.MAPREF,
        prefix: 'config-map-prefix-',
        mapRefKind: IUIEnvRefKind.CONFIGMAP,
        valuesFrom: {
          name: 'my-config-map',
        },
      });
      expect(result[1]).toEqual({
        kind: IUIEnvItemKind.MAPREF,
        prefix: undefined,
        mapRefKind: IUIEnvRefKind.SECRET,
        valuesFrom: {
          name: 'my-secret',
        }
      });
    });

    it('properly converts unsupported items', () => {
      const envVarList = [{
          valueFrom: {
            unsupportedRef: {
              key: 'secret-key',
              name: 'my-secret'
            },
          },
          name: 'SecretKeyRef'
        },
      ];

      const envVarFromList = [{
          unsupportedRef: {
            name: 'my-config-map',
          },
          arbitraryValue: 'my-value',
          prefix: 'config-map-prefix-',
        },
      ];

      const result = commonMapper.mapEnvVarsToEnvItems(envVarList, envVarFromList);
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        kind: IUIEnvItemKind.UNSUPPORTED,
        originalValue: {
          unsupportedRef: {
            key: 'secret-key',
            name: 'my-secret'
          },
        },
        name: 'SecretKeyRef'
      });
      expect(result[1]).toEqual({
        kind: IUIEnvItemKind.UNSUPPORTED_FROM,
        originalValue: {
          unsupportedRef: {
            name: 'my-config-map',
          },
          arbitraryValue: 'my-value',
          prefix: 'config-map-prefix-',
        },
      });
    });

  });
});

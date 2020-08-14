// tslint:disable-next-line:no-var-requires
const cloneDeep = require('lodash/cloneDeep');

// console
import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:mapper:common');

// code-engine
import {
    IUIEnvItemKeyRef,
    IUIEnvItemKind,
    IUIEnvItemLiteral,
    IUIEnvItemMapRef,
    IUIEnvItems,
    IUIEnvItemUnsupported,
    IUIEnvRefKind
} from '../../../common/model/common-model';
import { IEnvVar, IEnvVarFrom, IEnvVarFromList, IEnvVarList, IEnvVarResult } from '../model/k8s-model';

export function getTimeInMillis(dateString: string): number | undefined {
  if (!dateString) {
    return undefined;
  }
  try {
    const date = new Date(dateString);
    return date.getTime();
  } catch (err) {
    logger.warn(`getTimeInMillis - Failed to convert '${dateString}' to milliseconds - error: ${err.message}`);
    return undefined;
  }
}

export function mapEnvItemsToEnvVarResult(envItems: IUIEnvItems): IEnvVarResult {
    const result = {
        env: [] as IEnvVarList,
        envFrom: [] as IEnvVarFromList,
    };

    // controls where in each loop iteration the current item will be added (env or envFrom array)
    let addToEnv = true;
    let ignoreItem = false;

    if (envItems && Array.isArray(envItems)) {
        for (const envItem of envItems) {
            if (envItem) {
                const envVar = {} as IEnvVar;
                let envVarFrom = {} as IEnvVarFrom;
                addToEnv = true;
                ignoreItem = false;

                switch (envItem.kind) {
                    case IUIEnvItemKind.UNSUPPORTED:
                        envVar.name = (envItem as IUIEnvItemLiteral).name;
                        if ((envItem as IUIEnvItemUnsupported).originalValue) {
                            envVar.valueFrom = cloneDeep((envItem as IUIEnvItemUnsupported).originalValue);
                        }
                        break;
                    case IUIEnvItemKind.UNSUPPORTED_FROM:
                        if ((envItem as IUIEnvItemUnsupported).originalValue) {
                            envVarFrom = cloneDeep((envItem as IUIEnvItemUnsupported).originalValue);
                            addToEnv = false;  // use envVarFrom instead
                        } else {
                            ignoreItem = false;
                        }
                        break;
                    case IUIEnvItemKind.PREDEFINED:
                        // ignore predefined values, as they are read-only (coming from the container)
                        ignoreItem = true;
                        break;
                    case IUIEnvItemKind.KEYREF:
                        envVar.valueFrom = {};
                        const keyRef = (envItem as IUIEnvItemKeyRef);
                        if (keyRef.keyRefKind === IUIEnvRefKind.CONFIGMAP) {
                            if (keyRef.name || keyRef.valueFrom) {
                                envVar.name = keyRef.name;
                                if (keyRef.valueFrom) {
                                    envVar.valueFrom.configMapKeyRef = { ...keyRef.valueFrom };
                                }
                            } else {
                                ignoreItem = true;
                            }
                        } else if (keyRef.keyRefKind === IUIEnvRefKind.SECRET) {
                            if (keyRef.name || keyRef.valueFrom) {
                                envVar.name = keyRef.name;
                                if (keyRef.valueFrom) {
                                    envVar.valueFrom.secretKeyRef = { ...keyRef.valueFrom };
                                }
                            } else {
                                ignoreItem = true;
                            }
                        } else {
                            ignoreItem = true;
                        }
                        break;
                    case IUIEnvItemKind.MAPREF:
                        const mapRef = (envItem as IUIEnvItemMapRef);
                        if (mapRef.mapRefKind === IUIEnvRefKind.CONFIGMAP) {
                            if (mapRef.valuesFrom) {
                                envVarFrom.configMapRef = { ...mapRef.valuesFrom };
                                envVarFrom.prefix = mapRef.prefix;
                            } else {
                                ignoreItem = true;
                            }
                        } else if (mapRef.mapRefKind === IUIEnvRefKind.SECRET) {
                            if (mapRef.valuesFrom) {
                                envVarFrom.secretRef = { ...mapRef.valuesFrom };
                                envVarFrom.prefix = mapRef.prefix;
                            } else {
                                ignoreItem = true;
                            }
                        }
                        addToEnv = false;  // use envVarFrom instead
                        break;
                    case IUIEnvItemKind.LITERAL:
                    default:
                        const literal = (envItem as IUIEnvItemLiteral);
                        if (literal.name) {
                            envVar.name = literal.name;
                            envVar.value = literal.value;
                        } else {
                            ignoreItem = true;
                        }
                        break;
                }

                if (!ignoreItem) {
                    if (addToEnv) {
                        result.env.push(envVar);
                    } else {
                        result.envFrom.push(envVarFrom);
                    }
                }
            }
        }
    }

    return result;
}

export function mapEnvVarsToEnvItems(envVarList: IEnvVarList, envVarFromList: IEnvVarFromList): IUIEnvItems {
    const result = [] as IUIEnvItems;

    let ignoreItem = false;

    // single-values first...
    if (envVarList && Array.isArray(envVarList)) {
        for (const envVar of envVarList) {
            if (envVar) {
                let envItem;
                ignoreItem = false;

                if (envVar.valueFrom && !envVar.value) {
                    const valueFrom = envVar.valueFrom;

                    if (valueFrom.configMapKeyRef || valueFrom.secretKeyRef) {
                        const envItemKeyRef = {
                            kind: IUIEnvItemKind.KEYREF,
                            name: envVar.name,
                        } as IUIEnvItemKeyRef;

                        if (envVar.valueFrom.configMapKeyRef) {
                            envItemKeyRef.keyRefKind = IUIEnvRefKind.CONFIGMAP;
                            envItemKeyRef.valueFrom = { ...envVar.valueFrom.configMapKeyRef };
                        } else {
                            envItemKeyRef.keyRefKind = IUIEnvRefKind.SECRET;
                            envItemKeyRef.valueFrom = { ...envVar.valueFrom.secretKeyRef };
                        }
                        envItem = envItemKeyRef;
                    } else {
                        envItem = {
                            kind: IUIEnvItemKind.UNSUPPORTED,
                            name: envVar.name,
                        } as IUIEnvItemUnsupported;

                        if (envVar.valueFrom) {
                            (envItem as IUIEnvItemUnsupported).originalValue = cloneDeep(envVar.valueFrom);
                        }
                    }
                } else {
                    // Literal env variable (Name/Value pair)
                    envItem = {
                        kind: IUIEnvItemKind.LITERAL,
                        name: envVar.name,
                        value: envVar.value,
                    } as IUIEnvItemLiteral;
                }

                result.push(envItem);
            }
        }
    }

    // ...then multi-values
    if (envVarFromList && Array.isArray(envVarFromList)) {
        for (const envVarFrom of envVarFromList) {
            if (envVarFrom) {
                let envItem;
                ignoreItem = false;

                if (envVarFrom.configMapRef || envVarFrom.secretRef) {
                    const envItemMapRef = {
                        kind: IUIEnvItemKind.MAPREF,
                        prefix: envVarFrom.prefix,
                    } as IUIEnvItemMapRef;

                    if (envVarFrom.configMapRef) {
                        envItemMapRef.mapRefKind = IUIEnvRefKind.CONFIGMAP;
                        envItemMapRef.valuesFrom = { ...envVarFrom.configMapRef };
                    } else {
                        envItemMapRef.mapRefKind = IUIEnvRefKind.SECRET;
                        envItemMapRef.valuesFrom = { ...envVarFrom.secretRef };
                    }
                    envItem = envItemMapRef;
                } else {
                    envItem = {
                        kind: IUIEnvItemKind.UNSUPPORTED_FROM,
                    } as IUIEnvItemUnsupported;

                    if (envVarFrom) {
                        (envItem as IUIEnvItemUnsupported).originalValue = cloneDeep(envVarFrom);
                    }
                }

                result.push(envItem);
            }
        }
    }

    // to stay compatible with existing code, we return undefined here, in case there are no variables
    // defined
    if (result.length === 0) {
        return undefined;
    } else {
        return result;
    }
}

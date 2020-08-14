import { IUIEnvItem, IUIEnvItemKind, IUIEnvItemLiteral } from '../model/common-model';
import { IKeyValue } from '../../client/view/model/common-view-model';
import clgEnvValue from '../../client/utils/formatter/clgEnvValue';
import clgEnvName from '../../client/utils/formatter/clgEnvName';
import { TextValidator } from '../validator/text-validator';
import { getValidatedTextField } from '../validator/common-validator';
import coligoValidatorConfig from '../../common/validator/coligo-validator-config';

const GlobalTextValidator = new TextValidator();

export function uiEnvItemToKeyValue(item: IUIEnvItem): IKeyValue {
    if (!item) {
        return;
    }

    const result = {
        kind: item.kind || IUIEnvItemKind.UNSUPPORTED,
    } as IKeyValue;

    switch (item.kind) {
        case IUIEnvItemKind.PREDEFINED:
        case IUIEnvItemKind.LITERAL:
            const itemLiteral = (item as IUIEnvItemLiteral);

            result.name = getValidatedTextField(itemLiteral.name, GlobalTextValidator, coligoValidatorConfig.common.envVarName, true);
            result.value = getValidatedTextField(itemLiteral.value, GlobalTextValidator, coligoValidatorConfig.common.envVarValue, true);
            break;
        case IUIEnvItemKind.KEYREF:
        case IUIEnvItemKind.MAPREF:
            result.name = {
                val: clgEnvName.value(item),
            };
            result.value = {
                val: clgEnvValue.value(item),
            };
            // IUIEnvItem is the original item reference, as we do not have native display/edit support for this type
            // of environment variable yet
            result.originalValue = item;
            break;
        case IUIEnvItemKind.UNSUPPORTED:
        case IUIEnvItemKind.UNSUPPORTED_FROM:
        default:
            result.name = {
                val: clgEnvName.value(item),
            };
            // IUIEnvItem is the original item reference, as we do not have native display/edit support for this type
            // of environment variable
            result.originalValue = item;
            break;
    }

    return result;
}

export function keyValueToUIEnvItem(keyVal: IKeyValue): IUIEnvItem {
    if (!keyVal) {
        return;
    }

    let result = {
        kind: keyVal.kind || IUIEnvItemKind.PREDEFINED,  // unidentified variables are treated as PREDEFINED, which means the mapper will ignore them
    } as IUIEnvItem;

    switch (keyVal.kind) {
        case IUIEnvItemKind.LITERAL:
        case IUIEnvItemKind.PREDEFINED:
            const resultLiteral = (result as IUIEnvItemLiteral);

            resultLiteral.name = keyVal.name.val;
            resultLiteral.value = keyVal.value.val;
            break;
        case IUIEnvItemKind.UNSUPPORTED_FROM:
        case IUIEnvItemKind.KEYREF:
        case IUIEnvItemKind.UNSUPPORTED:
        case IUIEnvItemKind.MAPREF:
        default:
            // for all kinds that we do not support in terms of editing (yet), we simply put back the original
            // value to allow seamless read/write operations
            result = keyVal.originalValue;
            break;
    }

    return result;
}

export function createLiteralKeyValue(key: string, value: string): IKeyValue {
    return {
        kind: IUIEnvItemKind.LITERAL,
        name: getValidatedTextField(key, GlobalTextValidator, coligoValidatorConfig.common.envVarName, true),
        value: getValidatedTextField(value, GlobalTextValidator, coligoValidatorConfig.common.envVarValue, true),
    } as IKeyValue;
}

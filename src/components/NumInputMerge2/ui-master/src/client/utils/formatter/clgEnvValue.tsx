import React from 'react';
// coligo
import {
    IUIEnvItem,
    IUIEnvItemKeyRef,
    IUIEnvItemKind,
    IUIEnvItemLiteral,
    IUIEnvItemMapRef
} from '../../../common/model/common-model';
import t from '../i18n';

const getDisplayValue = (item: IUIEnvItem): string => {
    let result: string;

    switch (item.kind) {
        case IUIEnvItemKind.PREDEFINED:
        case IUIEnvItemKind.LITERAL:
            result = (item as IUIEnvItemLiteral).value;
            break;
        case IUIEnvItemKind.KEYREF:
            const keyRefItem = (item as IUIEnvItemKeyRef);
            result = keyRefItem.valueFrom.name + ' / ' + keyRefItem.valueFrom.key;
            break;
        case IUIEnvItemKind.MAPREF:
            const mapRefItem = (item as IUIEnvItemMapRef);
            result = t('clg.formatter.label.env.value.allfrom', { mapName: mapRefItem.valuesFrom.name });
            break;
        case IUIEnvItemKind.UNSUPPORTED_FROM:
        case IUIEnvItemKind.UNSUPPORTED:
        default:
            result = t('clg.formatter.label.env.value.unsupported');
            break;
    }

    return result;
};

const render = (item: IUIEnvItem) => {
    const name = getDisplayValue(item);

    return <div><span className='bx--type-caption clg-item--caption' key={`label_${name}`}>{name}</span></div>;
};

const value = (item: IUIEnvItem) => {
    return getDisplayValue(item);
};

export default { render, value };

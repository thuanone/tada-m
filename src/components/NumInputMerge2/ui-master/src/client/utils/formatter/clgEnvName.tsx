import React from 'react';

// coligo
import {
    IUIEnvItem,
    IUIEnvItemKind, IUIEnvItemMapRef,
    IUIEnvItemUnsupported
} from '../../../common/model/common-model';
import t from '../i18n';

const getDisplayName = (item: IUIEnvItem): string => {
    let result: string;

    switch (item.kind) {
        case IUIEnvItemKind.KEYREF:
        case IUIEnvItemKind.LITERAL:
        case IUIEnvItemKind.PREDEFINED:
        case IUIEnvItemKind.UNSUPPORTED:
            result = (item as IUIEnvItemUnsupported).name;
            break;
        case IUIEnvItemKind.MAPREF:
        case IUIEnvItemKind.UNSUPPORTED_FROM:
            result = (item as IUIEnvItemMapRef).prefix || t('clg.formatter.label.env.name.mapref');
            break;
        default:
            result = t('clg.formatter.label.env.name.none');
            break;
    }

    return result;
};

const render = (item: IUIEnvItem) => {
    const name = getDisplayName(item);

    return <div><span className='bx--type-caption clg-item--caption' key={`label_${name}`}>{name}</span></div>;
};

const value = (item: IUIEnvItem) => {
    return getDisplayName(item);
};

export default { render, value };

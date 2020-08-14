import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import t from '../i18n';

function itemToTypeString(item) {
    const isSecret = (item.kind === UIEntityKinds.SECRET);
    return t(isSecret ? 'clg.components.type.secret' : 'clg.components.type.confmap');
}

export function render(item) {
    return <span className='bx--type-caption'>{itemToTypeString(item)}</span>;
}

export function value(item) {
    return itemToTypeString(item);
}

export default { render, value };

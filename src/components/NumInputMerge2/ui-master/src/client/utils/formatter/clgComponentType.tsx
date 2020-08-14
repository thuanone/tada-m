import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import t from '../i18n';

function itemToTypeString(item) {
    const isJobDefinition = (item.kind === UIEntityKinds.JOBDEFINITION);
    return t(isJobDefinition ? 'clg.components.type.jobdefinition' : 'clg.components.type.application');
}

const render = (item) => {
    return <span className='bx--type-caption'>{itemToTypeString(item)}</span>;
};

const value = (item) => {
    return itemToTypeString(item);
};

export default { render, value };

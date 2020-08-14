import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import * as memUtils from '../../../common/utils/memory-utils';
import t from '../i18n';

function getJobMemory(item) {
    return (item && item.spec && (typeof item.spec.memory !== 'undefined')) ? item.spec.memory : -1;
}

function getApplicationMemory(item) {
    return (item && item.template && (typeof item.template.memory !== 'undefined')) ? item.template.memory : -1;
}

const render = (item) => {
    const kind = item && item.kind;
    const isJobDefinition = ((kind === UIEntityKinds.JOBDEFINITION) ||
        (kind === UIEntityKinds.JOBRUN));
    const mem = isJobDefinition ? getJobMemory(item) : getApplicationMemory(item);
    const memStr = (mem < 0) ? t('clg.components.memory.notavailable') : memUtils.convertNumberToDisplayValueAndUnit(mem, false, 'B');
    return <span>{memStr}</span>;
};

const value = (item) => {
    const kind = item && item.kind;
    const isJobDefinition = ((kind === UIEntityKinds.JOBDEFINITION) ||
        (kind === UIEntityKinds.JOBRUN));
    return `${isJobDefinition ? getJobMemory(item) : getApplicationMemory(item)}`;
};

export default { render, value };

import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import t from '../i18n';

function getJobCpu(item) {
    return (item && item.spec && (typeof item.spec.cpus !== 'undefined')) ? item.spec.cpus : -1;
}

function getApplicationCpu(item) {
    return (item && item.template && (typeof item.template.cpus !== 'undefined')) ? item.template.cpus : -1;
}

const render = (item) => {
    const kind = item && item.kind;
    const isJobDefinition = ((kind === UIEntityKinds.JOBDEFINITION) ||
        (kind === UIEntityKinds.JOBRUN));

    const cpu = isJobDefinition ? getJobCpu(item) : getApplicationCpu(item);
    const cpuStr = (cpu < 0) ? t('clg.components.cpu.notavailable') : t('clg.components.label.cpu', {
        vCpu: cpu,
    });
    return <span>{cpuStr}</span>;
};

const value = (item) => {
    const kind = item && item.kind;
    const isJobDefinition = ((kind === UIEntityKinds.JOBDEFINITION) ||
        (kind === UIEntityKinds.JOBRUN));
    return `${isJobDefinition ? getJobCpu(item) : getApplicationCpu(item)}`;
};

export default { render, value };

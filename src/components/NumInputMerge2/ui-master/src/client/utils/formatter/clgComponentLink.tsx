import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import appLink from './clgAppLink';
import jobLink from './clgJobLink';

const render = (item) => {
    if (item.kind === UIEntityKinds.APPLICATION) {
        return appLink.render(item);
    } else if (item.kind === UIEntityKinds.JOBRUN) {
        return jobLink.render(item);
    } else {
        return <span className='bx--type-caption'>-</span>;
    }
};

const value = (item) => {
    if (item.kind === UIEntityKinds.APPLICATION) {
        return appLink.value(item);
    } else if (item.kind === UIEntityKinds.JOBRUN) {
        return jobLink.value(item);
    } else {
        return '-';
    }
};

export default { render, value };

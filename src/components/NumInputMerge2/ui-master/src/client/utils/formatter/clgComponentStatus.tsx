import React from 'react';
import { UIEntityKinds } from '../../../common/model/common-model';
import { Loading } from '../../view/common/carbon';
import t from '../i18n';
import appStatus from './clgAppStatus';

const render = (item) => {
    const isJobDefinition = (item.kind === UIEntityKinds.JOBDEFINITION);

    if (item.isDeleting) {
        return <div><Loading active={true} className='clg-item--status-loading-small' small={true} withOverlay={false} /><span>{t('clg.common.label.deleting')}</span></div>;
    } else {
        if (isJobDefinition) {
            return <span>-</span>;
        } else {
            return appStatus.render(item);
        }
    }
};  // TODO: Add status 'Deleting...' with progress animation for item.isDeleting and ALL entity kinds!

const value = (item) => {
    const isJobDefinition = (item.kind === UIEntityKinds.JOBDEFINITION);
    return isJobDefinition ? '-' : appStatus.value(item);
};

export default { render, value };

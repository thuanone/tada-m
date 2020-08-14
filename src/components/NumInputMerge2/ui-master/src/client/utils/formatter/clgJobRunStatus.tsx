import { CheckmarkFilled24, ErrorFilled24, InProgress24, Time24 } from '@carbon/icons-react';
import React from 'react';
import * as jobModel from '../../../common/model/job-model';
import { IUIJobRun } from '../../../common/model/job-model';
import { Loading } from '../../view/common/carbon';
import { countInstances } from '../../view/model/job-view-model';
import t from '../i18n';

function convertUIJobStatusToString(item): string {
    let label: string = t('clg.formatter.label.unknown');
    const jobRun: IUIJobRun = item;
    if (jobRun.isDeleting) {
        label = t('clg.page.jobs.status.deleting');
    } else {
        const status: jobModel.UIJobStatus = jobRun.status;
        if (status) {
            switch (status) {
                case jobModel.UIJobStatus.FAILED:
                    label = t('clg.page.jobs.status.failed');
                    break;
                case jobModel.UIJobStatus.SUCCEEDED:
                    label = t('clg.page.jobs.status.succeeded');
                    break;
                case jobModel.UIJobStatus.WAITING:
                    label = t('clg.page.jobs.status.waiting');
                    break;
                case jobModel.UIJobStatus.RUNNING:
                    label = t('clg.page.jobs.status.running', {
                        current: jobRun.instanceStatus.numRunning,
                        total: countInstances(jobRun.arraySpec),
                    });
                    break;
            }
        }
    }

    return label;
}

const render = (item) => {
    const iconType = (item && item.status);

    const labelElem = <span className='bx--type-caption clg-item--caption' key='status-label'>{convertUIJobStatusToString(item)}</span>;

    let iconElem;
    if (item.isDeleting) {
        iconElem = <Loading active={true} className='clg-item--status-loading-small' key='status-icon' small={true} withOverlay={false} />;
    } else {
        // build iconElem based on type
        switch (iconType) {
            case jobModel.UIJobStatus.FAILED:
                iconElem = <ErrorFilled24 className='clg-item--status-icon fill-failed' key='status-icon' />;
                break;
            case jobModel.UIJobStatus.SUCCEEDED:
                iconElem = <CheckmarkFilled24 className='clg-item--status-icon fill-success' key='status-icon' />;
                break;
            case jobModel.UIJobStatus.WAITING:
                iconElem = <Time24 className='clg-item--status-icon fill-waiting' key='status-icon' />;
                break;
            case jobModel.UIJobStatus.RUNNING:
                iconElem = <InProgress24 className='clg-item--status-icon fill-running' key='status-icon' />;
                break;
            default:
                iconElem = <Time24 className='clg-item--status-icon fill-waiting' key='status-icon' />;
                break;
        }
    }

    return (
        <div>
            {iconElem}
            {labelElem}
        </div>
    );
};

const value = (item) => {
    return convertUIJobStatusToString(item);
};

export default { render, value };

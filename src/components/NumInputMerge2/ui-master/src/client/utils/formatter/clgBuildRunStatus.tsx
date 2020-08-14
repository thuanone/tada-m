import { CheckmarkFilled24, ErrorFilled24, InProgress24, Time24 } from '@carbon/icons-react';
import React from 'react';
import * as buildModel from '../../../common/model/build-model';
import { Loading } from '../../view/common/carbon';
import t from '../i18n';

function convertUIBuildRunStatusToString(item): string {
    let label: string = t('clg.formatter.label.unknown');
    const buildRun: buildModel.IUIBuildRun = item;
    if (buildRun.isDeleting) {
        label = t('clg.buildrun.status.deleting');
    } else {
        const status: string = buildRun.status;
        if (status) {
            switch (status) {
                case buildModel.UIBuildRunStatus.FAILED:
                    label = t('clg.buildrun.status.failed');
                    break;
                case buildModel.UIBuildRunStatus.SUCCEEDED:
                    label = t('clg.buildrun.status.succeeded');
                    break;
                case buildModel.UIBuildRunStatus.PENDING:
                    label = t('clg.buildrun.status.pending');
                    break;
                case buildModel.UIBuildRunStatus.RUNNING:
                    label = t('clg.buildrun.status.running');
                    break;
            }
        }
    }

    return label;
}

const render = (item) => {
    const iconType = (item && item.status);

    const labelElem = <span className='bx--type-caption clg-item--caption' key='status-label'>{convertUIBuildRunStatusToString(item)}</span>;

    let iconElem;
    if (item.isDeleting) {
        iconElem = <Loading active={true} className='clg-item--status-loading-small' key='status-icon' small={true} withOverlay={false} />;
    } else {
        // build iconElem based on type
        switch (iconType) {
            case buildModel.UIBuildRunStatus.FAILED:
                iconElem = <ErrorFilled24 className='clg-item--status-icon fill-failed' key='status-icon' />;
                break;
            case buildModel.UIBuildRunStatus.SUCCEEDED:
                iconElem = <CheckmarkFilled24 className='clg-item--status-icon fill-success' key='status-icon' />;
                break;
            case buildModel.UIBuildRunStatus.PENDING:
                iconElem = <Time24 className='clg-item--status-icon fill-waiting' key='status-icon' />;
                break;
            case buildModel.UIBuildRunStatus.RUNNING:
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
    return convertUIBuildRunStatusToString(item);
};

export default { render, value };

import PropTypes from 'prop-types';
import React from 'react';
import {
    Link,
    withRouter,
} from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
    CheckmarkFilled16,
    ErrorFilled16,
    InProgress16,
    Launch16,
    Time16,
    TrashCan16,
    WarningFilled16
} from '@carbon/icons-react';
import { getLocale } from '@console/pal/Utilities';

import {IUIJobRun} from '../../../../common/model/job-model';
import * as dateUtils from '../../../utils/date';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';

interface IProps {
    history: any[];
    item: IUIJobRun;
}

class ClgJobRunDetailsRow extends React.Component<IProps, {}> {

    constructor(props) {
        super(props);

        this.state = {
            error: undefined,
            isDeleting: false,
            isDeletionModalOpen: false,
            items: undefined,
        };

        this.viewDetailsHandler = this.viewDetailsHandler.bind(this);
    }

    public render() {

        const localeToUse = getLocale(window.navigator.language);

        const createdDate = dateUtils.format(this.props.item.created, localeToUse, true);
        const completedDate = dateUtils.format(this.props.item.completed, localeToUse, true);

        return (
            <div className='jobrun-details--table__row'>
                <div className='bx--row' onClick={this.viewDetailsHandler}>
                    <div className='bx--col-lg-8 bx--col-md-4 bx--col-sm-2'>
                        <div className='bx--label clg-field-label'>{t('clg.page.jobdetails.instances.status.title')}</div>
                        <div className='jobrun-status--instance-details clg-item--status'>
                            <Time16 className='clg-item--status-icon' />
                            <span className='bx--label clg-item--caption jobrun-status--instance-details__caption'>{t('clg.jobrun.details.instances.pending.label', {numberOf: this.props.item.instanceStatus.numWaiting})}</span>
                        </div>
                        <div className='jobrun-status--instance-details clg-item--status'>
                            <InProgress16 className='fill-running clg-item--status-icon' />
                            <span className='bx--label clg-item--caption jobrun-status--instance-details__caption'>{t('clg.jobrun.details.instances.running.label', {numberOf: this.props.item.instanceStatus.numRunning})}</span>
                        </div>
                        <div className='jobrun-status--instance-details clg-item--status'>
                            <CheckmarkFilled16 className='fill-success clg-item--status-icon' />
                            <span className='bx--label clg-item--caption jobrun-status--instance-details__caption'>{t('clg.jobrun.details.instances.completed.label', {numberOf: this.props.item.instanceStatus.numSucceeded})}</span>
                        </div>
                        <div className='jobrun-status--instance-details clg-item--status'>
                            <ErrorFilled16 className='fill-failed clg-item--status-icon' />
                            <span className='bx--label clg-item--caption jobrun-status--instance-details__caption'>{t('clg.jobrun.details.instances.failed.label', {numberOf: this.props.item.instanceStatus.numFailed})}</span>
                        </div>
                    </div>
                    <div className='bx--col-lg-8 bx--col-md-4 bx--col-sm-2'>
                        <div className='jobrun-status--startdate'>
                            <div className='bx--label clg-field-label'>{t('clg.page.jobdetails.started.title')}</div>
                            <div className='jobrun-date-value'>{createdDate}</div>
                        </div>
                        <div className='clg-status--enddate'>
                            <div className='bx--label clg-field-label'>{t('clg.page.jobdetails.completed.title')}</div>
                            <div className='jobrun-date-value'>{completedDate ? completedDate : '\u2014'}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private viewDetailsHandler(event: any): any {
        this.props.history.push(nav.toJobRunDetail(this.props.item.regionId, this.props.item.projectId, this.props.item.id));
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgJobRunDetailsRow.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    item: PropTypes.object.isRequired,
};

export {ClgJobRunDetailsRow};
export default withRouter(ClgJobRunDetailsRow);

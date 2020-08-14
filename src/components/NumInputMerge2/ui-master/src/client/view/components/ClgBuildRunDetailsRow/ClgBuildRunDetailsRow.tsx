import PropTypes from 'prop-types';
import React from 'react';
import {
    Link,
    withRouter,
} from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { getLocale } from '@console/pal/Utilities';

import {IUIBuildRun, UIBuildRunStatus} from '../../../../common/model/build-model';
import * as dateUtils from '../../../utils/date';
import t from '../../../utils/i18n';

interface IProps {
    history: any[];
    item: IUIBuildRun;
}

class ClgBuildRunDetailsRow extends React.Component<IProps, {}> {
    private readonly COMPONENT = 'ClgBuildRunDetailsRow';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

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
        const completedDate = dateUtils.format(this.props.item.completionTime, localeToUse, true);

        return (
            <div className='buildrun-details--table__row'>
                <div className='bx--row' onClick={this.viewDetailsHandler}>
                    <div className='bx--col-lg-8 bx--col-md-4 bx--col-sm-2'>
                        {this.props.item.status === UIBuildRunStatus.FAILED && (
                            <div className='buildrun-status--instance-details'>
                                <div className='bx--label clg-field-label'>{t('clg.page.buildrun.reason.title')}</div>
                                <div className='buildrun-status--instance-details__caption'>{this.props.item.reason}</div>
                            </div>
                        )}
                    </div>
                    <div className='bx--col-lg-8 bx--col-md-4 bx--col-sm-2'>
                        <div className='buildrun-status--startdate'>
                            <div className='bx--label clg-field-label'>{t('clg.page.buildrun.started.title')}</div>
                            <div className='buildrun-date-value'>{createdDate}</div>
                        </div>
                        <div className='clg-status--enddate'>
                            <div className='bx--label clg-field-label'>{t('clg.page.buildrun.completed.title')}</div>
                            <div className='buildrun-date-value'>{completedDate ? completedDate : '\u2014'}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private viewDetailsHandler(event: any): any {
        // do nothing
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgBuildRunDetailsRow.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    item: PropTypes.object.isRequired,
};

export {ClgBuildRunDetailsRow};
export default withRouter(ClgBuildRunDetailsRow);

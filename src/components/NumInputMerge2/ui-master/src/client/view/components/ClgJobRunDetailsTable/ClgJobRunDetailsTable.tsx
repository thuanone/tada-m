// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { TrashCan16 } from '@carbon/icons-react';
import { Link } from '@console/pal/carbon-components-react';
import { SectionHeading } from '@console/pal/Components';

// coligo
import * as commonModel from '../../../../common/model/common-model';
import {IUIJobRun, UIJobStatus} from '../../../../common/model/job-model';
import {promiseEach} from '../../../../common/utils/promise-utils';
import {deleteJobRun} from '../../../api/job-api';
import cache from '../../../utils/cache';
import clgJobRunStatus from '../../../utils/formatter/clgJobRunStatus';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import modal from '../../../utils/modal';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import * as viewCommonModels from '../../model/common-view-model';
import {IJobRunInfo} from '../../model/job-view-model';
import ClgConfirmationModal from '../ClgConfirmationModal/ClgConfirmationModal';
import ClgJobRunDetailsRow from '../ClgJobRunDetailsRow/ClgJobRunDetailsRow';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../ClgTableWrapper/ClgTableWrapper';

const cacheName = 'coligo-job-runs-for-job-def';

interface IProps {
    getUpdateCacheFnRef: (fn) => void;  // the passed in function will be called with a reference to the updateCache() function
    history: any[];
    jobDefinitionName: string;
    regionId: string;
    projectId: string;
    errorHandler: (error) => void;
    onGetJobRunInfo?: (jobInfo: IJobRunInfo) => void;
}

interface IState {
    error: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    keysToDelete?: string[];
}

class ClgJobRunDetailsTable extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly columns: any[];
    private removeCacheListener: () => any;
    private batchActions: any[];
    private itemsAccessMap: {
        [key: string]: IUIJobRun;
    };
    private clearSelectionFn;

    private readonly COMPONENT = 'ClgJobRunDetailsTable';

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

        this.id = `region/${props.regionId}/project/${props.projectId}/jobs?jobDefinitionName=${props.jobDefinitionName}`;
        this.clickHandler = this.clickHandler.bind(this);
        this.getRowActions = this.getRowActions.bind(this);

        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.updateCache = this.updateCache.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

        this.columns = [
            {
                field: 'name',
                label: t('clg.page.jobs.th.name'),
            },
            {
                field: 'status',
                formatter: (item) => clgJobRunStatus.render(item),
                label: t('clg.page.jobs.th.status'),
                stringValue: (item) => clgJobRunStatus.value(item),
            },
        ];

        this.batchActions = [{
            handler: this.batchActionDeleteHandler,
            icon: TrashCan16,
            iconDescription: t('clg.common.label.delete'),
            id: 'delete-rows-button',
            label: t('clg.common.label.delete'),
            validate: this.validateDeleteBatchAction,
        }];
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.removeCacheListener = cache.listen(cacheName, (items: IUIJobRun[]) => {

            // only allow item updates from the backend, when there is no current Deleting action ongoing!
            if (!this.state.isDeleting) {
                this.itemsAccessMap = {};

                // rebuild the componentAccess map each time the cache gets updated
                for (const item of items) {
                    this.itemsAccessMap[item.id] = item;
                }

                // scan items for running/failed/succeeded jobruns and trigger callback if given
                if (this.props.onGetJobRunInfo) {
                    let running = 0;
                    let succeeded = 0;
                    let failed = 0;

                    for (const item of items) {
                        if (item.status === UIJobStatus.WAITING || item.status === UIJobStatus.RUNNING) {
                            running += 1;
                        } else if (item.status === UIJobStatus.FAILED) {
                            failed += 1;
                        } else if (item.status === UIJobStatus.SUCCEEDED) {
                            succeeded += 1;
                        }

                        item.key = item.id;
                    }

                    this.props.onGetJobRunInfo({
                       numFailedJobs: failed,
                       numRunningJobs: running,
                       numSucceededJobs: succeeded,
                    });
                }

                this.setState({ error: null, items });
            }
        }, (err: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- FAILURE - jobruns of '${this.id}' could not be loaded from '${cacheName}' - ${err.toString()}`);
            if (!this.state.items) { this.setState({ items: [], error: err }); }
            if (this.props.errorHandler) {
                this.props.errorHandler(err);
            }
            // TODO handle this error. Do we want to blow up the whole page or just set the table msg?
        });

        cache.update(this.id, cacheName);

        if (this.props.getUpdateCacheFnRef) {
            this.props.getUpdateCacheFnRef(this.updateCache);
        }
    }

    public componentWillUnmount() {
        // remove the cache listener in order to avoid background syncs with the backend
        this.removeCacheListener();
    }

    public getRowActions() {
        return [];
    }

    public clickHandler(item) {
        this.props.history.push(nav.toJobRunDetail(this.props.regionId, this.props.projectId, item.id));
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}>`);
        this.setState((currentState) => {

            // start deleting all selected jobrus here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} jobruns now...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- key = ${key} with array idx = ${idx}`);
                return deleteJobRun(this.props.regionId, this.props.projectId, key)
                    .then();
            }, (numInFlight, numResolved, numRejected) => {
                this.logger.debug(`${fn}- Delete JobRun status: ${numInFlight} numInFlight, ${numResolved} numResolved, ${numRejected} numRejected`);
            })
                .then(() => {
                    this.logger.debug(`${fn}- SUCCESS - deleted ${keys.length} jobruns`);

                    this.clearSelection();

                    // show success inline toast message
                    const successNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'success',
                        subtitle: t('clg.page.jobs.tab.jobrun.success.delete.subtitle', { number: this.state.keysToDelete.length }),
                        title: t('clg.page.jobs.tab.jobrun.success.delete.title'),
                    };
                    toastNotification.add(successNotification);

                    // hide the loading animation
                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
                            // Otherwise it would not have any effect
                            cache.update(this.id, cacheName);
                        });
                })
                .catch((err: commonModel.UIRequestError) => {
                    this.resetIsDeletingFlags();

                    // show failure inline toast message
                    this.logger.error(`${fn}- FAILURE - could not delete ${keys.length} jobruns - ${err.toString()}`);

                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.jobs.tab.jobrun.error.delete.subtitle', { code: (err && err.error && err.error._code) || '-1' }),
                        title: t('clg.page.jobs.tab.jobrun.error.delete.title'),
                    };
                    toastNotification.add(errorNotification);

                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            cache.update(this.id, cacheName);
                        });
                });

            return {
                isDeleting: true,
                isDeletionModalOpen: false,
            };
        });
    }

    public resetIsDeletingFlags() {
        for (const key of this.state.keysToDelete) {
            const job = this.itemsAccessMap[key];
            delete job.isDeleting;
        }

        this.setState({
            isDeleting: false,
            isDeletionModalOpen: false,
        });
    }

    public validateDeleteBatchAction(): IClgTableWrapperValidationResult {
        return {
            valid: !this.state.isDeleting,
        };
    }

    public cancelDeletionHandler() {
        this.logger.debug('cancelDeletionHandler');
        this.setState(() => {
            return {
                isDeletionModalOpen: false,
            };
        });
    }

    public batchActionDeleteHandler(keys) {
        for (const key of keys) {
            const jobrun = this.itemsAccessMap[key];
            jobrun.isDeleting = true; // allow table row to be displayed in disabled mode
        }

        this.setState(() => {
            return {
                isDeletionModalOpen: true,
                keysToDelete: keys,
            };
        });
    }

    public deleteItemHandler(item) {
        this.batchActionDeleteHandler([item.id]);
    }

    public render() {
        return (
            <div className='jobrun-details--table'>
                {this.state.items && this.state.items.length === 0 ?
                (
                    <div className='jobdef--no-jobruns'>
                        <div className='jobdef--no-jobruns__icon'>
                            <img src={img.get('clg-jobs-empty')} alt='no jobruns' />
                        </div>
                        <div className='empty-state-card--title'>
                            <SectionHeading title={t('clg.page.jobs.section.invocations.noinvocationstitle')} headingElement='h4'/>
                        </div>
                        <div className='jobdef--no-jobruns__description'>{t('clg.page.jobs.section.invocations.noinvocationsdescription')}</div>
                        <div className='jobdef--no-jobruns__morelink'>
                            <Link href={nav.getDocsLink('jobs')} target='_blank' rel='noopener noreferrer'>{t('clg.page.jobs.section.invocations.noinvocationsmorelink')}</Link>
                        </div>
                    </div>
                ) : (
                    <div className='clg-grid-nested'>
                        <ClgTableWrapper
                            title={''}
                            className='clg-datatable-sortable'
                            columns={this.columns}
                            deleteItemHandler={this.deleteItemHandler}
                            disableSelection={this.state.isDeleting}
                            hidePaging={true}
                            items={this.state.items}
                            id='jobrun-table'
                            key='jobrun-table'
                            rowDetail={ClgJobRunDetailsRow}
                            sortField='creationtimeInt'
                            sortDir={-1}
                            batchActions={this.batchActions}
                            rowClickHandler={this.clickHandler}
                            isDisabledKey={'isDeleting'}
                            onGetClearSelectionFn={this.getClearSelectionFn}
                        />
                        <ClgConfirmationModal
                            id={'job-delete-modal'}
                            key={'jobrun-table-modal'}
                            isDanger={true}
                            onSubmitHandler={this.confirmDeletionHandler}
                            onCancelHandler={this.cancelDeletionHandler}
                            heading={t('clg.page.jobs.tab.jobrun.delete.modal.title')}
                            isOpen={this.state.isDeletionModalOpen}
                            primaryBtnText={t('clg.modal.jobrun.delete.ok')}
                            secondaryBtnText={t('clg.modal.button.cancel')}
                            messages={[modal.formatBatchDeleteMessage(t('clg.components.type.jobrun'), this.state.keysToDelete)]}
                        />
                    </div>
                )}
            </div>
        );
    }

    public updateCache() {
        cache.update(this.id, cacheName);
    }

    private clearSelection() {
        if (this.clearSelectionFn) {
            this.clearSelectionFn();
        }
    }

    private getClearSelectionFn(clearFn) {
        this.clearSelectionFn = clearFn;
    }
}

ClgJobRunDetailsTable.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgJobRunDetailsTable.propTypes = {
    errorHandler: PropTypes.func,
    getUpdateCacheFnRef: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    jobDefinitionName: PropTypes.string,
    onGetJobRunInfo: PropTypes.func,
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default ClgJobRunDetailsTable;

// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// carbon + pal
import { TrashCan16 } from '@carbon/icons-react';
import { Link } from '@console/pal/carbon-components-react';
import { SectionHeading } from '@console/pal/Components';

// coligo
import { IUIBuildRun } from '../../../../common/model/build-model';
import * as commonModel from '../../../../common/model/common-model';
import { promiseEach } from '../../../../common/utils/promise-utils';
import { deleteBuildRun } from '../../../api/build-api';
import cache from '../../../utils/cache';
import clgBuildRunStatus from '../../../utils/formatter/clgBuildRunStatus';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import modal from '../../../utils/modal';
import nav from '../../../utils/nav';
import toastNotification from '../../../utils/toastNotification';
import GlobalStateContext from '../../common/GlobalStateContext';
import * as viewCommonModels from '../../model/common-view-model';
import ClgBuildRunDetailsRow from '../ClgBuildRunDetailsRow/ClgBuildRunDetailsRow';
import ClgConfirmationModal from '../ClgConfirmationModal/ClgConfirmationModal';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../ClgTableWrapper/ClgTableWrapper';

const cacheName = 'coligo-buildruns';

interface IProps {
    getUpdateCacheFnRef: (fn) => void;  // the passed in function will be called with a reference to the updateCache() function
    history: any[];
    buildName: string;
    regionId: string;
    projectId: string;
    errorHandler: (error) => void;
}

interface IState {
    error: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    keysToDelete?: string[];
}

class ClgBuildRunDetailsTable extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly columns: any[];
    private removeCacheListener: () => any;
    private batchActions: any[];
    private itemsAccessMap: {
        [key: string]: IUIBuildRun;
    };
    private clearSelectionFn;

    private readonly COMPONENT = 'ClgBuildRunDetailsTable';

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

        this.id = `region/${props.regionId}/project/${props.projectId}/buildruns/${props.buildName}`;

        this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);
        this.getRowActions = this.getRowActions.bind(this);
        this.loadBuildRuns = this.loadBuildRuns.bind(this);
        this.onBuildRunsLoaded = this.onBuildRunsLoaded.bind(this);
        this.onBuildRunsLoadingFailed = this.onBuildRunsLoadingFailed.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);

        this.columns = [
            {
                canSort: false,
                field: 'name',
                label: t('clg.page.buildrun.th.name'),
            },
            {
                canSort: false,
                field: 'status',
                formatter: (item) => clgBuildRunStatus.render(item),
                label: t('clg.page.buildrun.th.status'),
                stringValue: (item) => clgBuildRunStatus.value(item),
            },
            {
                canSort: false,
                field: 'created',
                formatter: (item: IUIBuildRun) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.buildrun.th.created'),
                stringValue: (item: IUIBuildRun) => `${item.created}`,
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

        // load all build runs that are part of the build
        this.loadBuildRuns();

        if (this.props.getUpdateCacheFnRef) {
            this.props.getUpdateCacheFnRef(this.loadBuildRuns);
        }
    }

    public onBuildRunsLoaded(items: IUIBuildRun[]) {
        const fn = 'onBuildRunsLoaded ';
        this.logger.debug(`${fn}>`);

        // only allow item updates from the backend, when there is no current Deleting action ongoing!
        if (!this.state.isDeleting) {
            this.itemsAccessMap = {};

            // rebuild the componentAccess map each time the cache gets updated
            for (const item of items) {
                this.itemsAccessMap[item.id] = item;
            }

            this.setState({ error: null, items });
        }

        this.logger.debug(`${fn}<`);
    }

    public onBuildRunsLoadingFailed(err: commonModel.UIRequestError) {
        const fn = 'onBuildRunsLoadingFailed ';
        this.logger.debug(`${fn}>`);

        this.logger.error(`${fn}- FAILURE - buildruns of '${this.id}' could not be loaded from '${cacheName}' - ${commonModel.stringifyUIRequestError(err)}`);
        if (!this.state.items) { this.setState({ items: [], error: err }); }
        if (this.props.errorHandler) {
            this.props.errorHandler(err);
        }
        // TODO handle this error. Do we want to blow up the whole page or just set the table msg?

        this.logger.debug(`${fn}<`);
    }

    public loadBuildRuns() {
        const fn = 'loadBuildRuns ';
        this.logger.debug(`${fn}>`);

        if (this.removeCacheListener) {
            this.removeCacheListener();
        }

        this.removeCacheListener = cache.listen(cacheName, this.onBuildRunsLoaded, this.onBuildRunsLoadingFailed);
        cache.update(this.id, cacheName);

        this.logger.debug(`${fn}<`);
    }

    public componentWillUnmount() {
        // remove the cache listener in order to avoid background syncs with the backend
        this.removeCacheListener();
    }

    public getRowActions() {
        return [];
    }

    public clickHandler(item) {
        // do nothing
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}>`);
        this.setState((currentState) => {

            // start deleting all selected buildRuns here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} buildRuns now...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- key = ${key} with array idx = ${idx}`);
                return deleteBuildRun(this.props.regionId, this.props.projectId, key)
                    .then();
            }, (numInFlight, numResolved, numRejected) => {
                this.logger.debug(`${fn}- Delete BuildRun status: ${numInFlight} numInFlight, ${numResolved} numResolved, ${numRejected} numRejected`);
            })
                .then(() => {
                    this.logger.debug(`${fn}- SUCCESS - deleted ${keys.length} buildRuns`);

                    this.clearSelection();

                    // show success inline toast message
                    const successNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'success',
                        subtitle: t('clg.page.buildrun.success.deleteBuildRuns.subtitle', { number: this.state.keysToDelete.length }),
                        title: t('clg.page.buildrun.success.deleteBuildRuns.title'),
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
                    this.logger.error(`${fn}- FAILURE - could not delete ${keys.length} buildRuns - ${err.toString()}`);

                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.buildrun.error.deleteBuildRuns.subtitle', { code: (err && err.error && err.error._code) || '-1' }),
                        title: t('clg.page.buildrun.error.deleteBuildRuns.title'),
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
            const buildRun = this.itemsAccessMap[key];
            buildRun.isDeleting = true; // allow table row to be displayed in disabled mode
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
            <div className='buildrun-details--table'>
                {this.state.items && this.state.items.length === 0 ?
                    (
                        <div className='build--no-buildruns'>
                            <div className='build--no-buildruns__icon'>
                                <img src={img.get('clg-items-buildrun')} alt='no buildruns' />
                            </div>
                            <div className='empty-state-card--title'>
                                <SectionHeading title={t('clg.page.buildrun.section.noruns.title')} headingElement='h4' />
                            </div>
                            <div className='build--no-buildruns__description'>{t('clg.page.buildrun.section.noruns.description')}</div>
                            <div className='build--no-buildruns__morelink'>
                                <Link href={nav.getDocsLink('buildruns')} target='_blank' rel='noopener noreferrer'>{t('clg.page.buildrun.section.noruns.morelink')}</Link>
                            </div>
                        </div>
                    ) : (
                        <div className='clg-grid-nested'>
                            <ClgTableWrapper
                                title={''}
                                className=''
                                columns={this.columns}
                                deleteItemHandler={this.deleteItemHandler}
                                disableSelection={this.state.isDeleting}
                                hidePaging={true}
                                items={this.state.items}
                                id='buildRun-table'
                                key='buildRun-table'
                                rowDetail={ClgBuildRunDetailsRow}
                                sortField='created'
                                sortDir={-1}
                                batchActions={this.batchActions}
                                rowClickHandler={this.clickHandler}
                                isDisabledKey={'isDeleting'}
                                onGetClearSelectionFn={this.getClearSelectionFn}
                            />
                            <ClgConfirmationModal
                                id={'buildrun-delete-modal'}
                                key={'buildRun-table-modal'}
                                isDanger={true}
                                onSubmitHandler={this.confirmDeletionHandler}
                                onCancelHandler={this.cancelDeletionHandler}
                                heading={t('clg.page.buildrun.delete.modal.title')}
                                isOpen={this.state.isDeletionModalOpen}
                                primaryBtnText={t('clg.common.label.delete')}
                                secondaryBtnText={t('clg.modal.button.cancel')}
                                messages={[modal.formatBatchDeleteMessage(t('clg.components.type.buildrun'), this.state.keysToDelete)]}
                            />
                        </div>
                    )}
            </div>
        );
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

ClgBuildRunDetailsTable.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgBuildRunDetailsTable.propTypes = {
    buildName: PropTypes.string,
    errorHandler: PropTypes.func,
    getUpdateCacheFnRef: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default ClgBuildRunDetailsTable;

import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Add16, Launch16, TrashCan16 } from '@carbon/icons-react';

// coligo
import * as commonModel from '../../../../../common/model/common-model';
import { promiseEach } from '../../../../../common/utils/promise-utils';
import cache from '../../../../utils/cache';
import t from '../../../../utils/i18n';
import img from '../../../../utils/img';
import modal from '../../../../utils/modal';
import nav from '../../../../utils/nav';
import toastNotification from '../../../../utils/toastNotification';
import ClgConfirmationModal from '../../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../../../components/ClgTableWrapper/ClgTableWrapper';
import ClgTeaser from '../../../components/ClgTeaser/ClgTeaser';
import * as viewCommonModels from '../../../model/common-view-model';

interface IProps {
    cacheName: string;
    columns: any[];
    docsLinkRef: string;
    hasTitle?: boolean;
    iconName: string;
    idPrefix: string;
    nlsKeyPrefix: string;
    regionId: string;
    projectId: string;
    errorHandler?: (error) => void;
    rowClickHandler: (item: any) => void;
    createActionHandler?: () => void;
    deleteActionHandler: (id: string) => Promise<any>;
    onGetLoadFn?: (fn) => void;
}

interface IState {
    error: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    keysToDelete?: string[];
}

class ClgProjectSubpageList extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly columns: any[];
    private removeCacheListener: () => any;
    private actions: any[];  // TODO: never set, only read -> either a bug, or for future use
    private batchActions: any[];
    private itemsAccessMap: {
        [key: string]: any;
    };
    private clearSelectionFn;

    private readonly COMPONENT = 'ClgProjectSubpageList';

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

        this.id = `region/${props.regionId}/project/${props.projectId}`;
        this.clickHandler = this.clickHandler.bind(this);
        this.getRowActions = this.getRowActions.bind(this);

        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

        this.itemsLoaded = this.itemsLoaded.bind(this);
        this.itemsLoadingFailed = this.itemsLoadingFailed.bind(this);
        this.loadItems = this.loadItems.bind(this);

        if (this.props.createActionHandler) {
            this.actions = [{
                handler: () => {
                    this.props.createActionHandler();
                },
                icon: Add16,
                iconDescription: t(`${this.props.nlsKeyPrefix}.action.create`),
                id: 'create',
                label: t(`${this.props.nlsKeyPrefix}.action.create`),
            }];
        } else {
            this.actions = [];
        }

        this.batchActions = [{
            handler: this.batchActionDeleteHandler,
            icon: TrashCan16,
            iconDescription: t('clg.common.label.delete'),
            id: 'delete-rows-button',
            label: t('clg.common.label.delete'),
            validate: this.validateDeleteBatchAction,
        }];
    }

    public itemsLoaded(items) {
        const fn = `itemsLoaded - ${this.props.cacheName} `;
        this.logger.debug(`${fn}- loaded ${items && items.length} items`);

        // only allow item updates from the backend, when there is no current Deleting action ongoing!
        if (!this.state.isDeleting) {
            this.itemsAccessMap = {};

            if (items && Array.isArray(items)) {
                // rebuild the componentAccess map each time the cache gets updated
                for (const item of items) {
                    this.itemsAccessMap[item.id] = item;
                }
            }

            this.setState({ error: null, items });
        }
    }

    public itemsLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = `itemsLoadingFailed - ${this.props.cacheName} `;
        this.logger.error(`${fn}- failed to load ${this.props.cacheName} of '${this.id}' - ${commonModel.stringifyUIRequestError(requestError)}`);

        if (!this.state.items) { this.setState({ items: [], error: requestError }); }
        if (this.props.errorHandler) {
            this.props.errorHandler(requestError);
        }
        // TODO handle this error. Do we want to blow up the whole page or just set the table msg?
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';

        // load all items
        this.loadItems();

        // populate the loading function to the parent;
        if (this.props.onGetLoadFn) {
            this.props.onGetLoadFn(this.loadItems);
        }
    }

    public componentWillUnmount() {
        // remove the cache listener in order to avoid background syncs with the backend
        if (this.removeCacheListener) {
            this.removeCacheListener();
        }
    }

    public getRowActions() {
        return [];
    }

    public clickHandler(item) {
        this.props.rowClickHandler(item);
    }

    public confirmDeletionHandler() {
        const fn = `confirmDeletionHandler - ${this.props.cacheName} `;
        this.logger.debug(`${fn}- OK to delete items`);
        this.setState((currentState) => {

            // start deleting all selected items here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} items now...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- Deleting key = ${key} with array idx = ${idx}`);
                return this.props.deleteActionHandler(key)
                    .then();
            }, (numInFlight, numResolved, numRejected) => {
                this.logger.debug(`${fn}- Delete status: ${numInFlight} numInFlight, ${numResolved} numResolved, ${numRejected} numRejected`);
            })
                .then(() => {
                    this.logger.debug(`${fn}- SUCCESS - deleted ${keys.length} items`);

                    this.clearSelection();

                    // show success inline toast message
                    const successNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'success',
                        subtitle: t(`${this.props.nlsKeyPrefix}.success.delete.subtitle`, { number: this.state.keysToDelete.length }),
                        title: t(`${this.props.nlsKeyPrefix}.success.delete.title`),
                    };
                    toastNotification.add(successNotification);

                    // show a toast notification and hide the loading animation
                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
                            // Otherwise it would not have any effect
                            cache.update(this.id, this.props.cacheName);
                        });
                })
                .catch((requestError: commonModel.UIRequestError) => {
                    this.resetIsDeletingFlags();

                    // show failure inline toast message
                    this.logger.warn(`${fn}- FAILURE - could not delete ${keys.length} items`);
                    this.logger.error(`${fn}- failed to delete ${keys.length} items - ${commonModel.stringifyUIRequestError(requestError)}`);

                    // in case the response could not be mapped to a specific error, we should use a generic one
                    const errorNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'error',
                        subtitle: t(`${this.props.nlsKeyPrefix}.error.delete.subtitle`, { code: (requestError && requestError.error && requestError.error._code) || '-1' }),
                        title: t(`${this.props.nlsKeyPrefix}.error.delete.title`),
                    };
                    toastNotification.add(errorNotification);

                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            cache.update(this.id, this.props.cacheName);
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
            const item = this.itemsAccessMap[key];
            delete item.isDeleting;
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
        const fn = `cancelDeletionHandler - ${this.props.cacheName} `;
        this.logger.debug(`${fn} - Deletion of items CANCELLED.`);

        this.resetIsDeletingFlags();

        this.setState(() => {
            return {
                keysToDelete: undefined,
            };
        });
    }

    public deleteItemHandler(item) {
        this.batchActionDeleteHandler([item.id]);
    }

    public batchActionDeleteHandler(keys) {
        for (const key of keys) {
            const item = this.itemsAccessMap[key];
            item.isDeleting = true; // allow table row to be displayed in disabled mode
        }

        this.setState({
            isDeletionModalOpen: true,
            keysToDelete: keys,
        });
    }

    public render() {
        return (
            <div className='project-subpage-tab'>
                <ClgTableWrapper
                    title={!!this.props.hasTitle ? t(`${this.props.nlsKeyPrefix}.title`) : ''}
                    description={!!this.props.hasTitle ? t(`${this.props.nlsKeyPrefix}.subtitle`) : ''}
                    className='clg-datatable-sortable'
                    columns={this.props.columns}
                    deleteItemHandler={this.deleteItemHandler}
                    disableSelection={this.state.isDeleting}
                    emptyStateComponent={this.renderEmptyState()}
                    items={this.state.items}
                    id={`${this.props.idPrefix}-table`}
                    key={`${this.props.idPrefix}-table`}
                    sortField='created'
                    sortDir={-1}
                    actions={this.actions}
                    batchActions={this.batchActions}
                    rowClickHandler={this.clickHandler}
                    isDisabledKey={'isDeleting'}
                    onGetClearSelectionFn={this.getClearSelectionFn}
                />
                <ClgConfirmationModal
                    addConfirmationCheck={true}
                    id={`${this.props.idPrefix}-delete-modal`}
                    isDanger={true}
                    itemsToConfirm={this.state.keysToDelete}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t(`${this.props.nlsKeyPrefix}.delete.modal.title`)}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.common.label.delete')}
                    secondaryBtnText={t('clg.common.label.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t(`${this.props.nlsKeyPrefix}.type`), this.state.keysToDelete)]}
                />
            </div>
        );
    }

    private renderEmptyState() {
        return (
            <div>
                <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
                    <ClgTeaser
                        icon={<img src={img.get(this.props.iconName)} alt={`codeengine_${this.props.iconName}`} />}
                        title={`${this.props.nlsKeyPrefix}.noitems.title`}
                        description={`${this.props.nlsKeyPrefix}.noitems.desc`}
                        moreLabel={`${this.props.nlsKeyPrefix}.noitems.more`}
                        moreLink={nav.getDocsLink(this.props.docsLinkRef)}
                        moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                    />
                </div>
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

    private loadItems() {
        this.removeCacheListener = cache.listen(this.props.cacheName, this.itemsLoaded, this.itemsLoadingFailed);
        cache.update(this.id, this.props.cacheName);
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgProjectSubpageList.propTypes = {
    cacheName: PropTypes.string.isRequired,
    columns: PropTypes.array.isRequired,
    createActionHandler: PropTypes.func.isRequired,
    deleteActionHandler: PropTypes.func.isRequired,
    docsLinkRef: PropTypes.string.isRequired,
    errorHandler: PropTypes.func,
    hasTitle: PropTypes.bool,
    iconName: PropTypes.string.isRequired,
    idPrefix: PropTypes.string.isRequired,
    nlsKeyPrefix: PropTypes.string.isRequired,
    onGetLoadFn: PropTypes.func,
    projectId: PropTypes.string.isRequired,
    regionId: PropTypes.string.isRequired,
    rowClickHandler: PropTypes.func.isRequired,
};

export default ClgProjectSubpageList;

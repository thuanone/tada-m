// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// react specific
import { Add16, Launch16, TrashCan16 } from '@carbon/icons-react';

// coligo specific
import { IUIApplication } from '../../../../../../common/model/application-model';
import * as commonModel from '../../../../../../common/model/common-model';
import {  IUISecret } from '../../../../../../common/model/config-model';
import { promiseEach } from '../../../../../../common/utils/promise-utils';
import { deleteConfigMap } from '../../../../../api/confmap-api';
import { deleteSecret } from '../../../../../api/secret-api';
import cache from '../../../../../utils/cache';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import * as clgConfigKeys from '../../../../../utils/formatter/clgConfigKeys';
import * as clgConfigType from '../../../../../utils/formatter/clgConfigType';
import t from '../../../../../utils/i18n';
import img from '../../../../../utils/img';
import modal from '../../../../../utils/modal';
import nav from '../../../../../utils/nav';
import toastNotification from '../../../../../utils/toastNotification';
import ClgConfirmationModal from '../../../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../../../../components/ClgTableWrapper/ClgTableWrapper';
import ClgTeaser from '../../../../components/ClgTeaser/ClgTeaser';
import * as viewCommonModels from '../../../../model/common-view-model';

interface IProps {
    errorHandler: (error) => void;
    history: any[];
    filterString?: string;
    projectId: string;
    regionId: string;
}

interface IState {
    confmapKeysToDelete?: string[];
    confmapsToDelete?: IUIApplication[];
    error?: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    secretKeysToDelete?: string[];
    secretsToDelete?: IUISecret[];
    keysToDelete: string[];
}

class ConfigListSubpage extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly configColumns: any[];
    private readonly actions: any[];
    private removeComponentsCacheListener: () => any;
    private batchActions: any[];
    private itemsAccessMap: {};
    private clearSelectionFn;

    // TODO: move well-known cache-identifiers to common interface/const
    private readonly CACHE_KEY_CONFIGS = 'coligo-project-configs';

    private readonly COMPONENT = 'ConfigListSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.state = {
            confmapsToDelete: [],
            error: undefined,
            isDeleting: false,
            isDeletionModalOpen: false,
            items: undefined,
            keysToDelete: [],
            secretsToDelete: [],
        };

        this.id = `region/${props.regionId}/project/${props.projectId}`;

        // preparing the table
        this.configItemClickHandler = this.configItemClickHandler.bind(this);
        this.createComponent = this.createComponent.bind(this);
        this.getRowActions = this.getRowActions.bind(this);
        this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
        this.loadConfigs = this.loadConfigs.bind(this);
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.navigateToCreateConfig = this.navigateToCreateConfig.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

        this.configColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.config.th.name'),
                stringValue: clgCompFormatterName.value,
            },
            {
                field: 'type',
                formatter: (item) => clgConfigType.render(item),
                label: t('clg.page.config.th.type'),
                stringValue: (item) => clgConfigType.value(item),
            },
            {
                field: 'keys',
                formatter: (item: IUISecret) => clgConfigKeys.render(item),
                label: t('clg.page.config.th.keys'),
                stringValue: (item) => clgConfigKeys.value(item),
            },
            {
                field: 'created',
                formatter: (item: IUISecret) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.registries.th.created'),
                stringValue: (item: IUISecret) => `${item.created}`,
            },
        ];

        this.actions = [{
            handler: () => this.navigateToCreateConfig(),
            icon: Add16,
            iconDescription: t('clg.page.config.action.create-config'),
            id: 'create-config',
            kind: 'primary',
            label: t('clg.page.config.action.create-config'),
        }];

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
        this.loadConfigs();
    }

    public componentWillUnmount() {
        // remove the cache listener in order to avoid background syncs with the backend
        this.removeComponentsCacheListener();
    }

    public getRowActions() {
        return [];
    }

    public createComponent() {
        const fn = 'createComponent ';
        this.logger.debug(`${fn}- clicked!`);
        this.props.history.push(nav.toCreateComponentInProject(this.props.regionId, this.props.projectId));
    }

    public configItemClickHandler(item) {
        const fn = 'configItemClickHandler ';
        this.logger.debug(`${fn}- item.id '${item.id}'`);
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}> OK to delete configs`);
        this.setState((currentState) => {

            // start deleting all selected configs here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} configs now ...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- Deleting key = ${key} with array idx = ${idx}`);

                let prom;

                // determine, whether we're about to delete a secret or confmap
                const configItem = this.itemsAccessMap[key];
                if (configItem.kind === commonModel.UIEntityKinds.SECRET) {
                    prom = deleteSecret(this.props.regionId, this.props.projectId, configItem.name);
                } else {
                    prom = deleteConfigMap(this.props.regionId, this.props.projectId, configItem.name);
                }

                return prom;
            }, (numInFlight, numResolved, numRejected) => {
                this.logger.debug(`${fn}- Delete Configs status: ${numInFlight} numInFlight; ${numResolved} numResolved; ${numRejected} numRejected`);
            })
                .then(() => {
                    // show success inline toast message
                    this.logger.debug(`${fn}- SUCCESS - deleted ${keys.length} configs`);

                    this.clearSelection();

                    const successNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'success',
                        subtitle: t('clg.page.config.success.deleteConfig.subtitle', { number: this.state.keysToDelete.length }),
                        title: t('clg.page.config.success.deleteConfig.title'),
                    };
                    toastNotification.add(successNotification);

                    // show a toast notification and hide the loading animation
                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
                            // Otherwise it would not have any effect
                            cache.update(this.id, this.CACHE_KEY_CONFIGS);
                        });
                })
                .catch((requestError: commonModel.UIRequestError) => {
                    this.resetIsDeletingFlags();

                    // show failure inline toast message
                    this.logger.error(`${fn}- failed to delete ${keys.length} configs - ${commonModel.stringifyUIRequestError(requestError)}`);

                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.config.error.deleteConfig.subtitle', { code: (requestError && requestError.error && requestError.error._code) || '-1' }),
                        title: t('clg.page.config.error.deleteConfig.title'),
                    };
                    toastNotification.add(errorNotification);

                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            cache.update(this.id, this.CACHE_KEY_CONFIGS);
                        });
                });

            return {
                isDeleting: true,
                isDeletionModalOpen: false,
            };
        });
    }

    public resetIsDeletingFlags() {
        // revert 'disabled' value on all secrets and confmaps that were marked for deletion before
        for (const secret of this.state.secretsToDelete) {
            if (secret) {
                delete secret.isDeleting;
            }
        }

        for (const confmap of this.state.confmapsToDelete) {
            if (confmap) {
                delete confmap.isDeleting;
            }
        }
    }

    public validateDeleteBatchAction(): IClgTableWrapperValidationResult {
        return {
            valid: !this.state.isDeleting,
        };
    }

    public cancelDeletionHandler() {
        const fn = 'cancelDeletionHandler ';
        this.logger.debug(`${fn}- Deletion of config items CANCELLED.`);

        this.resetIsDeletingFlags();

        this.setState(() => {
            return {
                confmapKeysToDelete: undefined,
                confmapsToDelete: undefined,
                isDeleting: false,
                isDeletionModalOpen: false,
                secretKeysToDelete: undefined,
                secretsToDelete: undefined,
            };
        });
    }

    public deleteItemHandler(item) {
        this.batchActionDeleteHandler([item.id]);
    }

    public batchActionDeleteHandler(keys) {
        const fn = 'batchActionDeleteHandler ';
        this.logger.debug(`${fn}>`);

        const confmaps = [];
        const secrets = [];
        const confmapKeys = [];
        const secretKeys = [];

        // split all selected rows into confmaps and secrets that should get deleted for easier consumption
        // later and to be able to separately display the names in the modal dialog!
        for (const key of keys) {
            const configItem = this.itemsAccessMap[key];
            configItem.isDeleting = true; // allow table row to be displayed in disabled mode
            if (configItem.kind === commonModel.UIEntityKinds.SECRET) {
                secrets.push(configItem);
                secretKeys.push(key);
            } else {
                confmaps.push(configItem);
                confmapKeys.push(key);
            }
        }

        for (const confmap of confmaps) {
            this.logger.debug(`${fn}- ConfigMap marked for deletion: '${confmap.name}'`);
        }

        for (const secret of secrets) {
            this.logger.debug(`${fn}- Secret marked for deletion: '${secret.name}'`);
        }

        this.setState(() => {
            return {
                confmapKeysToDelete: confmapKeys,
                confmapsToDelete: confmaps,
                isDeleting: false,
                isDeletionModalOpen: true,
                keysToDelete: keys,
                secretKeysToDelete: secretKeys,
                secretsToDelete: secrets,
            };
        });

        this.logger.debug(`${fn}<`);
    }

    public render() {
        // in order to show a proper confirm text we need to concat the two arrays
        const itemsToConfirm = (this.state.confmapKeysToDelete || []).concat(this.state.secretKeysToDelete || []);

        return (
            <div className='config-list-subpage'>
                <ClgTableWrapper
                    // eslint-disable-next-line no-underscore-dangle
                    title={t('clg.page.config.title')}
                    description={t('clg.page.config.subtitle')}
                    className='clg-datatable-sortable'
                    columns={this.configColumns}
                    deleteItemHandler={this.deleteItemHandler}
                    disableSelection={this.state.isDeleting}
                    emptyStateComponent={this.renderEmptyState()}
                    items={this.state.items}
                    id='config-table'
                    sortField='metadata.name'
                    sortDir={-1}
                    actions={this.actions}
                    batchActions={this.batchActions}
                    rowClickHandler={this.configItemClickHandler}
                    isDisabledKey={'isDeleting'}
                    onGetClearSelectionFn={this.getClearSelectionFn}
                    filterString={this.props.filterString}
                />
                <ClgConfirmationModal
                    addConfirmationCheck={true}
                    id={'config-delete-modal'}
                    itemsToConfirm={itemsToConfirm}
                    isDanger={true}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.modal.component.delete.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.component.delete.ok')}
                    secondaryBtnText={t('clg.common.label.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.confmap'), this.state.confmapKeysToDelete),
                    modal.formatBatchDeleteMessage(t('clg.components.type.secret'), this.state.secretKeysToDelete)]}
                />
            </div>
        );
    }

    private renderEmptyState() {
        return (
            <div className='emptystate-teasers'>
                <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
                    <ClgTeaser
                        icon={<img src={img.get('clg-configMap-empty')} alt='coligo config maps' />}
                        title='clg.page.config.empty.card.confmap.title'
                        description='clg.page.config.empty.card.confmap.desc'
                        moreLabel='clg.page.config.empty.card.confmap.more'
                        moreLink={nav.getDocsLink('config-maps')}
                        moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                    />
                </div>
                <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
                    <ClgTeaser
                        icon={<img src={img.get('clg-secret-empty')} alt='coligo secrets' />}
                        title='clg.page.config.empty.card.secrets.title'
                        description='clg.page.config.empty.card.secrets.desc'
                        moreLabel='clg.page.config.empty.card.secrets.more'
                        moreLink={nav.getDocsLink('secrets')}
                        moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                    />
                </div>
            </div>
        );
    }

    private loadConfigs() {
        const fn = 'loadConfigs ';
        this.removeComponentsCacheListener = cache.listen(this.CACHE_KEY_CONFIGS, (items) => {
            // only allow item updates from the backend, when there is no current Deleting action ongoing!
            if (!this.state.isDeleting) {

                this.itemsAccessMap = {};

                // rebuild the componentAccess map each time the cache gets updated
                for (const item of items) {
                    this.itemsAccessMap[item.id] = item;
                }

                this.setState(() => {
                    return { error: null, items };
                });
            }
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load configs of project '${this.id}' from '${this.CACHE_KEY_CONFIGS}' - ${commonModel.stringifyUIRequestError(requestError)}`);

            if (!this.state.items) { this.setState(() => ({ items: [], error: requestError })); }
            if (this.props.errorHandler) {
                this.props.errorHandler(requestError);
            }
            // TODO handle this error. Do we want to blow up the whole page or just set the table msg?
        });
        cache.update(this.id, this.CACHE_KEY_CONFIGS);
    }

    private navigateToCreateConfig() {
        this.props.history.push(nav.toCreateConfigInProject(this.props.regionId, this.props.projectId));
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

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ConfigListSubpage.propTypes = {
    errorHandler: PropTypes.func,
    filterString: PropTypes.string,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default ConfigListSubpage;

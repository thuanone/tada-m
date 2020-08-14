// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// react specific
import { Add16, Launch16, TrashCan16 } from '@carbon/icons-react';

// coligo specific
import { IUIApplication } from '../../../../../../common/model/application-model';
import * as commonModel from '../../../../../../common/model/common-model';
import { IUIJobDefinition } from '../../../../../../common/model/job-model';
import { promiseEach } from '../../../../../../common/utils/promise-utils';
import { deleteApplication } from '../../../../../api/application-api';
import { deleteJobDefinition } from '../../../../../api/job-api';
import cache from '../../../../../utils/cache';
import clgCompFormatterCpu from '../../../../../utils/formatter/clgComponentCpu';
import clgCompFormatterLink from '../../../../../utils/formatter/clgComponentLink';
import clgCompFormatterMemory from '../../../../../utils/formatter/clgComponentMemory';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import clgCompFormatterStatus from '../../../../../utils/formatter/clgComponentStatus';
import clgCompFormatterType from '../../../../../utils/formatter/clgComponentType';
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
    appKeysToDelete?: string[];
    appsToDelete?: IUIApplication[];
    error?: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    jobDefKeysToDelete?: string[];
    jobDefsToDelete?: IUIJobDefinition[];
    keysToDelete: string[];
}

class ComponentListSubpage extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly componentColumns: any[];
    private readonly actions: any[];
    private removeComponentsCacheListener: () => any;
    private batchActions: any[];
    private itemsAccessMap: {};
    private clearSelectionFn;

    // TODO: move well-known cache-identifiers to common interface/const
    private readonly CACHE_KEY_COMPONENTS = 'coligo-components';

    private readonly COMPONENT = 'ComponentListSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.state = {
            appsToDelete: [],
            error: undefined,
            isDeleting: false,
            isDeletionModalOpen: false,
            items: undefined,
            jobDefsToDelete: [],
            keysToDelete: [],
        };

        this.id = `region/${props.regionId}/project/${props.projectId}`;

        // preparing the table
        this.componentClickHandler = this.componentClickHandler.bind(this);
        this.createComponent = this.createComponent.bind(this);
        this.getRowActions = this.getRowActions.bind(this);
        this.batchActionDeleteHandler = this.batchActionDeleteHandler.bind(this);
        this.loadComponents = this.loadComponents.bind(this);
        this.confirmDeletionHandler = this.confirmDeletionHandler.bind(this);
        this.cancelDeletionHandler = this.cancelDeletionHandler.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.navigateToCreateApplication = this.navigateToCreateApplication.bind(this);
        this.navigateToCreateJobDefinition = this.navigateToCreateJobDefinition.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

        this.componentColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.components.th.name'),
                stringValue: clgCompFormatterName.value,
            },
            {
                field: 'type',
                formatter: clgCompFormatterType.render,
                label: t('clg.page.components.th.type'),
                stringValue: clgCompFormatterType.value,
            },
            {
                field: 'status',
                formatter: clgCompFormatterStatus.render,
                label: t('clg.page.components.th.status'),
                stringValue: clgCompFormatterStatus.value,
            },
            {
                field: 'memory',
                formatter: clgCompFormatterMemory.render,
                label: t('clg.page.components.th.memory'),
                stringValue: clgCompFormatterMemory.value,
            },
            {
                field: 'cpu',
                formatter: clgCompFormatterCpu.render,
                label: t('clg.page.components.th.cpu'),
                stringValue: clgCompFormatterCpu.value,
            },
            {
                field: 'link',
                formatter: clgCompFormatterLink.render,
                label: t('clg.page.components.th.link'),
                stringValue: clgCompFormatterLink.value,
            },
        ];

        this.actions = [{
            handler: () => this.navigateToCreateJobDefinition(),
            icon: Add16,
            iconDescription: t('clg.page.project.action.create-jobdef'),
            id: 'create-job-definition',
            kind: 'secondary',
            label: t('clg.page.project.action.create-jobdef'),
        }, {
            handler: () => this.navigateToCreateApplication(),
            icon: Add16,
            iconDescription: t('clg.page.project.action.create-app'),
            id: 'create-application',
            label: t('clg.page.project.action.create-app'),
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
        this.loadComponents();
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

    public componentClickHandler(item) {
        const fn = 'componentClickHandler ';
        this.logger.debug(`${fn}- item.id '${item.id}'`);

        if (item.kind === commonModel.UIEntityKinds.JOBDEFINITION) {
            this.props.history.push(nav.toJobDefinitionDetail(this.props.regionId, this.props.projectId, item.name));
        } else {
            this.props.history.push(nav.toApplicationDetail(item.regionId, item.projectId, item.name));
        }
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}> OK to delete components`);
        this.setState((currentState) => {

            // start deleting all selected components here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} components now ...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- Deleting key = ${key} with array idx = ${idx}`);

                let prom;

                // determine, whether we're about to delete a jobdef or app
                const component = this.itemsAccessMap[key];
                if (component.kind === commonModel.UIEntityKinds.JOBDEFINITION) {
                    prom = deleteJobDefinition(this.props.regionId, this.props.projectId, component);
                } else {
                    prom = deleteApplication(component);
                }

                return prom;
            }, (numInFlight, numResolved, numRejected) => {
                this.logger.debug(`${fn}- Delete Component status: ${numInFlight} numInFlight; ${numResolved} numResolved; ${numRejected} numRejected`);
            })
                .then(() => {
                    // show success inline toast message
                    this.logger.debug(`${fn}- SUCCESS - deleted ${keys.length} components`);

                    this.clearSelection();

                    const successNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'success',
                        subtitle: t('clg.page.components.success.deleteComponent.subtitle', { number: this.state.keysToDelete.length }),
                        title: t('clg.page.components.success.deleteComponent.title'),
                    };
                    toastNotification.add(successNotification);

                    // show a toast notification and hide the loading animation
                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
                            // Otherwise it would not have any effect
                            cache.update(this.id, this.CACHE_KEY_COMPONENTS);
                        });
                })
                .catch((requestError: commonModel.UIRequestError) => {
                    this.resetIsDeletingFlags();

                    // show failure inline toast message
                    this.logger.error(`${fn}- failed to delete ${keys.length} components - ${commonModel.stringifyUIRequestError(requestError)}`);

                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModels.IClgToastNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.components.error.deleteComponent.subtitle', { code: (requestError && requestError.error && requestError.error._code) || '-1' }),
                        title: t('clg.page.components.error.deleteComponent.title'),
                    };
                    toastNotification.add(errorNotification);

                    this.setState({ isDeleting: false, isDeletionModalOpen: false },
                        () => {
                            cache.update(this.id, this.CACHE_KEY_COMPONENTS);
                        });
                });

            return {
                isDeleting: true,
                isDeletionModalOpen: false,
            };
        });
    }

    public resetIsDeletingFlags() {
        // revert 'disabled' value on all jobs and apps that were marked for deletion before
        for (const jobdef of this.state.jobDefsToDelete) {
            if (jobdef) {
                delete jobdef.isDeleting;
            }
        }

        for (const app of this.state.appsToDelete) {
            if (app) {
                delete app.isDeleting;
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
        this.logger.debug(`${fn}- Deletion of jobruns CANCELLED.`);

        this.resetIsDeletingFlags();

        this.setState(() => {
            return {
                appKeysToDelete: undefined,
                appsToDelete: undefined,
                isDeleting: false,
                isDeletionModalOpen: false,
                jobDefKeysToDelete: undefined,
                jobDefsToDelete: undefined,
            };
        });
    }

    public deleteItemHandler(item) {
        this.batchActionDeleteHandler([item.id]);
    }

    public batchActionDeleteHandler(keys) {
        const fn = 'batchActionDeleteHandler ';
        this.logger.debug(`${fn}>`);

        const apps = [];
        const jobDefs = [];
        const appKeys = [];
        const jobDefKeys = [];

        // split all selected rows into apps and jobdefs that should get deleted for easier consumption
        // later and to be able to separately display the names in the modal dialog!
        for (const key of keys) {
            const component = this.itemsAccessMap[key];
            component.isDeleting = true; // allow table row to be displayed in disabled mode
            if (component.kind === commonModel.UIEntityKinds.JOBDEFINITION) {
                jobDefs.push(component);
                jobDefKeys.push(key);
            } else {
                apps.push(component);
                appKeys.push(key);
            }
        }

        for (const app of apps) {
            this.logger.debug(`${fn}- App marked for deletion: '${app.name}'`);
        }

        for (const jobdef of jobDefs) {
            this.logger.debug(`${fn}- JobDef marked for deletion: '${jobdef.name}'`);
        }

        this.setState(() => {
            return {
                appKeysToDelete: appKeys,
                appsToDelete: apps,
                isDeleting: false,
                isDeletionModalOpen: true,
                jobDefKeysToDelete: jobDefKeys,
                jobDefsToDelete: jobDefs,
                keysToDelete: keys,
            };
        });

        this.logger.debug(`${fn}<`);
    }

    public render() {
        // in order to show a proper confirm text we need to concat the two arrays
        const itemsToConfirm = (this.state.appKeysToDelete || []).concat(this.state.jobDefKeysToDelete || []);

        return (
            <div className='component-list-subpage'>
                <ClgTableWrapper
                    // eslint-disable-next-line no-underscore-dangle
                    title={t('clg.page.components.title')}
                    description={t('clg.page.components.subtitle')}
                    className='clg-datatable-sortable'
                    columns={this.componentColumns}
                    deleteItemHandler={this.deleteItemHandler}
                    disableSelection={this.state.isDeleting}
                    emptyStateComponent={this.renderEmptyState()}
                    items={this.state.items}
                    id='components-table'
                    sortField='metadata.name'
                    sortDir={-1}
                    actions={this.actions}
                    batchActions={this.batchActions}
                    rowClickHandler={this.componentClickHandler}
                    isDisabledKey={'isDeleting'}
                    onGetClearSelectionFn={this.getClearSelectionFn}
                    filterString={this.props.filterString}
                />
                <ClgConfirmationModal
                    addConfirmationCheck={true}
                    id={'components-delete-modal'}
                    itemsToConfirm={itemsToConfirm}
                    isDanger={true}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.modal.component.delete.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.component.delete.ok')}
                    secondaryBtnText={t('clg.common.label.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.application'), this.state.appKeysToDelete),
                    modal.formatBatchDeleteMessage(t('clg.components.type.jobdefinition'), this.state.jobDefKeysToDelete)]}
                />
            </div>
        );
    }

    private renderEmptyState() {
        return (
            <div className='emptystate-teasers'>
                <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
                    <ClgTeaser
                        icon={<img src={img.get('clg-items_apps')} alt='coligo application components' />}
                        title='clg.page.components.empty.card.application.title'
                        description='clg.page.components.empty.card.application.desc'
                        moreLabel='clg.page.components.empty.card.application.more'
                        moreLink={nav.getDocsLink('apps')}
                        moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                    />
                </div>
                <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
                    <ClgTeaser
                        icon={<img src={img.get('clg-items_jobdefs')} alt='coligo projects' />}
                        title='clg.page.components.empty.card.jobdefinition.title'
                        description='clg.page.components.empty.card.jobdefinition.desc'
                        moreLabel='clg.page.components.empty.card.jobdefinition.more'
                        moreLink={nav.getDocsLink('jobs')}
                        moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                    />
                </div>
            </div>
        );
    }

    private loadComponents() {
        const fn = 'loadComponents ';
        this.removeComponentsCacheListener = cache.listen(this.CACHE_KEY_COMPONENTS, (items) => {
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
            this.logger.error(`${fn}- failed to load components of project '${this.id}' from '${this.CACHE_KEY_COMPONENTS}' - ${commonModel.stringifyUIRequestError(requestError)}`);

            if (!this.state.items) { this.setState(() => ({ items: [], error: requestError })); }
            if (this.props.errorHandler) {
                this.props.errorHandler(requestError);
            }
            // TODO handle this error. Do we want to blow up the whole page or just set the table msg?
        });
        cache.update(this.id, this.CACHE_KEY_COMPONENTS);
    }

    private navigateToCreateApplication() {
        this.props.history.push(nav.toCreateApplicationInProject(this.props.regionId, this.props.projectId));
    }

    private navigateToCreateJobDefinition() {
        this.props.history.push(nav.toCreateJobDefinitionInProject(this.props.regionId, this.props.projectId));
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
ComponentListSubpage.propTypes = {
    errorHandler: PropTypes.func,
    filterString: PropTypes.string,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default ComponentListSubpage;

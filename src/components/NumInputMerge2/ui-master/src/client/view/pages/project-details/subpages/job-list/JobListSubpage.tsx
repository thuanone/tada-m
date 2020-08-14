import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Add16, Launch16, TrashCan16 } from '@carbon/icons-react';

// coligo
import * as commonModel from '../../../../../../common/model/common-model';
import { IUIJobRun } from '../../../../../../common/model/job-model';
import { promiseEach } from '../../../../../../common/utils/promise-utils';
import { deleteJobRun } from '../../../../../api/job-api';
import cache from '../../../../../utils/cache';
import clgComponentCpu from '../../../../../utils/formatter/clgComponentCpu';
import clgComponentLink from '../../../../../utils/formatter/clgComponentLink';
import clgComponentMemory from '../../../../../utils/formatter/clgComponentMemory';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import clgDuration from '../../../../../utils/formatter/clgDuration';
import clgJobRunStatus from '../../../../../utils/formatter/clgJobRunStatus';
import t from '../../../../../utils/i18n';
import img from '../../../../../utils/img';
import modal from '../../../../../utils/modal';
import nav from '../../../../../utils/nav';
import toastNotification from '../../../../../utils/toastNotification';
import ClgConfirmationModal from '../../../../components/ClgConfirmationModal/ClgConfirmationModal';
import ClgTableWrapper, { IClgTableWrapperValidationResult } from '../../../../components/ClgTableWrapper/ClgTableWrapper';
import ClgTeaser from '../../../../components/ClgTeaser/ClgTeaser';
import * as viewCommonModels from '../../../../model/common-view-model';

// TODO: move well-known cache-identifiers to common interface/const
const cacheName = 'coligo-job-runs';

interface IProps {
  history: any[];
  regionId: string;
  projectId: string;
  errorHandler: (error) => void;
}

interface IState {
    error: any;
    isDeleting: boolean;
    isDeletionModalOpen: boolean;
    items?: any[];
    jobsToDelete?: IUIJobRun[];
    keysToDelete?: string[];
}

class JobListSubpage extends React.Component<IProps, IState> {
    private readonly id: string;
    private readonly columns: any[];
    private removeCacheListener: () => any;
    private actions: any[];  // TODO: never set, only read -> either a bug, or for future use
    private batchActions: any[];
    private itemsAccessMap: {
        [key: string]: IUIJobRun;
    };
    private clearSelectionFn;

    private readonly COMPONENT = 'JobListSubpage';

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
        this.gotoCreateJobDefinitionPage = this.gotoCreateJobDefinitionPage.bind(this);
        this.gotoComponentListPageFilteredForJobDefs = this.gotoComponentListPageFilteredForJobDefs.bind(this);
        this.deleteItemHandler = this.deleteItemHandler.bind(this);
        this.resetIsDeletingFlags = this.resetIsDeletingFlags.bind(this);
        this.validateDeleteBatchAction = this.validateDeleteBatchAction.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.getClearSelectionFn = this.getClearSelectionFn.bind(this);

        this.columns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.jobs.th.name'),
                stringValue: clgCompFormatterName.value,
            },
            {
                field: 'status',
                formatter: (item) => clgJobRunStatus.render(item),
                label: t('clg.page.jobs.th.status'),
                stringValue: (item) => clgJobRunStatus.value(item),
            },
            {
                field: 'duration',
                formatter: (item) => clgDuration.render(item),
                label: t('clg.page.jobs.th.duration'),
                stringValue: (item) => clgDuration.value(item),
            },
            {
                field: 'memory',
                formatter: (item) => clgComponentMemory.render(item),
                label: t('clg.page.jobs.th.memory'),
                stringValue: (item) => clgComponentMemory.value(item),
            },
            {
                field: 'cpu',
                formatter: (item) => clgComponentCpu.render(item),
                label: t('clg.page.jobs.th.cpu'),
                stringValue: (item) => clgComponentCpu.value(item),
            },
            {
                field: 'jobdefinition',
                formatter: (item) => clgComponentLink.render(item),
                label: t('clg.page.jobs.th.definition'),
                stringValue: (item) => clgComponentLink.value(item),
            },
        ];

        this.actions = [{
            handler: () => {
                this.props.history.push(nav.toCreateJobDefinitionInProject(this.props.regionId, this.props.projectId));
            },
            icon: Add16,
            iconDescription: t('clg.page.project.action.create-jobdef'),
            id: 'create-job-definition',
            label: t('clg.page.jobs.action.create-jobdefinition'),
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
        const fn = 'componentDidMount ';
        this.removeCacheListener = cache.listen(cacheName, (items) => {

            // only allow item updates from the backend, when there is no current Deleting action ongoing!
            if (!this.state.isDeleting) {
                this.itemsAccessMap = {};

                // rebuild the componentAccess map each time the cache gets updated
                for (const item of items) {
                    this.itemsAccessMap[item.id] = item;
                }

                this.setState({ error: null, items });
            }
        }, (requestError) => {
            this.logger.error(`${fn}- failed to load jobs of project '${this.id}' from '${cacheName}' - ${commonModel.stringifyUIRequestError(requestError)}`);

            if (!this.state.items) { this.setState({ items: [], error: requestError }); }
            if (this.props.errorHandler) {
                this.props.errorHandler(requestError);
            }
            // TODO handle this error. Do we want to blow up the whole page or just set the table msg?
        });
        cache.update(this.id, cacheName);
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

    public gotoCreateJobDefinitionPage() {
        this.props.history.push(nav.toCreateJobDefinitionInProject(this.props.regionId, this.props.projectId));
    }

    public gotoComponentListPageFilteredForJobDefs() {
        this.props.history.push(nav.toProjectDetailComponents(this.props.regionId, this.props.projectId, t('clg.components.type.jobdefinition')));
    }

    public confirmDeletionHandler() {
        const fn = 'confirmDeletionHandler ';
        this.logger.debug(`${fn}- OK to delete jobruns`);
        this.setState((currentState) => {

            // start deleting all selected jobrus here
            const keys = currentState.keysToDelete;

            this.logger.debug(`${fn}- Deleting ${keys.length} jobruns now...`);

            promiseEach(keys, 2, (key, idx) => {
                this.logger.debug(`${fn}- Deleting key = ${key} with array idx = ${idx}`);
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

                // show a toast notification and hide the loading animation
                this.setState({ isDeleting: false, isDeletionModalOpen: false },
                    () => {
                        // we MUST NOT try to update the items list using the cache -before- isDeleting was set back to false.
                        // Otherwise it would not have any effect
                        cache.update(this.id, cacheName);
                });
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.resetIsDeletingFlags();

                // show failure inline toast message
                this.logger.warn(`${fn}- FAILURE - could not delete ${keys.length} jobruns`);
                this.logger.error(`${fn}- failed to delete ${keys.length} jobruns - ${commonModel.stringifyUIRequestError(requestError)}`);

                // in case the response could not be mapped to a specific creation error, we should use a generic one
                const errorNotification: viewCommonModels.IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.jobs.tab.jobrun.error.delete.subtitle', { code: (requestError && requestError.error && requestError.error._code) || '-1' }),
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
        this.logger.debug('cancelDeletionHandler - Deletion of jobruns CANCELLED.');

        this.resetIsDeletingFlags();

        this.setState(() => {
           return {
               isDeletionModalOpen: false,
               keysToDelete: undefined,
           };
        });
    }

    public deleteItemHandler(item) {
        this.batchActionDeleteHandler([item.id]);
    }

    public batchActionDeleteHandler(keys) {
        for (const key of keys) {
            const jobrun = this.itemsAccessMap[key];
            jobrun.isDeleting = true; // allow table row to be displayed in disabled mode
        }

        this.setState({
            isDeletionModalOpen: true,
            keysToDelete: keys,
        });
    }

    public render() {
        return (
            <div className='job-list-subpage'>
                <ClgTableWrapper
                    title={t('clg.page.jobs.title')}
                    description={t('clg.page.jobs.subtitle')}
                    className='clg-datatable-sortable'
                    columns={this.columns}
                    deleteItemHandler={this.deleteItemHandler}
                    disableSelection={this.state.isDeleting}
                    emptyStateComponent={this.renderEmptyState()}
                    items={this.state.items}
                    id='jobruns-table'
                    key='jobruns-table'
                    sortField='creationtimeInt'
                    sortDir={-1}
                    actions={this.actions}
                    batchActions={this.batchActions}
                    rowClickHandler={this.clickHandler}
                    isDisabledKey={'isDeleting'}
                    onGetClearSelectionFn={this.getClearSelectionFn}
                />
                <ClgConfirmationModal
                    id={'jobs-delete-modal'}
                    isDanger={true}
                    onSubmitHandler={this.confirmDeletionHandler}
                    onCancelHandler={this.cancelDeletionHandler}
                    heading={t('clg.page.jobs.tab.jobrun.delete.modal.title')}
                    isOpen={this.state.isDeletionModalOpen}
                    primaryBtnText={t('clg.modal.jobrun.delete.ok')}
                    secondaryBtnText={t('clg.common.label.cancel')}
                    messages={[modal.formatBatchDeleteMessage(t('clg.components.type.jobrun'), this.state.keysToDelete)]}
                />
            </div>
        );
    }

    private renderEmptyState() {
        return (
          <div>
            <div className='bx--col-max-4 bx--col-xlg-4 bx--col-lg-5 bx--col-md-4 bx--col-sm-2'>
              <ClgTeaser
                icon={<img src={img.get('clg-comp-jobrun')} alt='coligo jobruns' />}
                title='clg.page.jobs.tab.jobrun.noitems.title'
                description='clg.page.jobs.tab.jobrun.noitems.desc'
                moreLabel='clg.page.jobs.tab.jobrun.noitems.more'
                moreLink={nav.getDocsLink('jobruns')}
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
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobListSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default JobListSubpage;

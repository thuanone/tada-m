import PropTypes from 'prop-types';
import React from 'react';
import {Link, withRouter} from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

import { Button, InlineLoading, InlineNotification, NotificationActionButton} from '@console/pal/carbon-components-react';
import {PageHeader} from '@console/pal/Components';

import * as commonModel from '../../../../common/model/common-model';
import * as projectModel from '../../../../common/model/project-model';
import { IUIProject } from '../../../../common/model/project-model';
import app from '../../../utils/app';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';
import {IComponentTypes} from '../../common/types';
import ClgComponentTypeSelector from '../../components/ClgComponentTypeSelector/ClgComponentTypeSelector';
import ClgProjectSelector from '../../components/ClgProjectSelector/ClgProjectSelector';
import CustomOrderSummary from '../../components/CustomOrderSummary/CustomOrderSummary';
import {IClgInlineNotification} from '../../model/common-view-model';
import {CreateApplicationSubpage} from './application/CreateApplicationSubpage';
import {CreateJobSubpage} from './job/CreateJobSubpage';

interface IProps {
    history: {
        goBack: () => void;
        length: number;
        push: (item) => void;
    };
    match: {
        params: {
            projectId: string,
            regionId: string,
            type: string
        }
    };
    type?: IComponentTypes;
}

interface IState {
    componentType: IComponentTypes;
    createFn?: () => void;
    error?: IClgInlineNotification;
    isCreating: boolean;
    isCreateDisabled: boolean;
    isLoadingProject: boolean;
    requestError?: any;
    selectedProject: IUIProject;
    showComponentSelector: boolean; // show component selector only, if type was not provided on page-entry
    showProjectSelector: boolean;
}

function getOnlyValidComponentTypes(compType: string): IComponentTypes | undefined {
    let result;
    if (typeof compType === 'string') {
        switch (compType.toLowerCase()) {
            case IComponentTypes.APP:
                result = IComponentTypes.APP;
                break;
            case IComponentTypes.JOBDEF:
                result = IComponentTypes.JOBDEF;
                break;
            default:
                // if none matched until here, return undefined intentionally
                break;
        }
    }

    return result;
}

class CreateComponentPage extends React.Component<IProps, IState> {
    private readonly COMPONENT: string = 'CreateComponentPage';
    private removeProjectCacheListener: () => any;
    private readonly regionId: string;
    private readonly projectId: string;
    private cacheIdProject: string;
    private readonly CACHE_KEY_PROJECT = 'coligo-project';

    private selectAppModeFn;  // callback methods from the two subpages for APP and JOB component type, being called whenever the component type is switched
    private selectJobModeFn;

      // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        const providedComponentType = props.type || getOnlyValidComponentTypes(props.match.params.type);
        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;

        this.state = {
            componentType: providedComponentType || IComponentTypes.APP,
            isCreateDisabled: true,
            isCreating: false,
            isLoadingProject: true,
            selectedProject: null,
            showComponentSelector: !providedComponentType,
            showProjectSelector: !(this.regionId && this.projectId),
        };

        this.closeNotification = this.closeNotification.bind(this);
        this.loadProject = this.loadProject.bind(this);
        this.onComponentTypeChanged = this.onComponentTypeChanged.bind(this);
        this.onProjectError = this.onProjectError.bind(this);
        this.onProjectSelection = this.onProjectSelection.bind(this);
        this.onOrderSummaryCancel = this.onOrderSummaryCancel.bind(this);
        this.onOrderSummaryCreate = this.onOrderSummaryCreate.bind(this);
        this.onIsCreatingChanged = this.onIsCreatingChanged.bind(this);
        this.onCreateDisabledChanged = this.onCreateDisabledChanged.bind(this);
        this.onGetCreateFunction = this.onGetCreateFunction.bind(this);
        this.onGetSelectAppTypeFunction = this.onGetSelectAppTypeFunction.bind(this);
        this.onGetSelectJobTypeFunction = this.onGetSelectJobTypeFunction.bind(this);
    }

    public componentDidMount() {
        app.arrivedOnPage('clg.pages.create.component');

        if (!this.state.showProjectSelector) {
            this.loadProject();
        }
    }

    public closeNotification() {
        this.setState(() => ({ error: undefined }));
    }

    public getBreadcrumbs() {
        const breadcrumbs = [];

        breadcrumbs.push({
            to: nav.toGettingStartedOverview(),
            value: t('clg.breadcrumb.home'),
        });

        if (!this.state.showProjectSelector) {
            breadcrumbs.push({
                to: nav.toProjectList(),
                value: t('clg.breadcrumb.projects'),
            }, {
                to: nav.toProjectDetail(this.regionId, this.projectId),
                value: this.state.selectedProject ? this.state.selectedProject.name : '...',
            });
        }

        return breadcrumbs;
    }

    public getTitle() {
        let result;

        if (this.state.showComponentSelector) {
            result = t('clg.breadcrumb.createComponent');
        } else {
            if (this.state.componentType === IComponentTypes.APP) {
                result = t('clg.breadcrumb.createApplication');
            } else if (this.state.componentType === IComponentTypes.JOBDEF) {
                result = t('clg.breadcrumb.createJobDefinition');
            }
        }

        return result;
    }

    public loadProject(): void {
        const fn = 'loadProject ';
        this.logger.debug(`${fn}>`);

        // reset the error state
        this.setState({ error: null, isLoadingProject: true });

        this.cacheIdProject = `region/${this.regionId}/project/${this.projectId}`;

        this.removeProjectCacheListener = cache.listen(this.CACHE_KEY_PROJECT, (project: projectModel.IUIProject) => {
            this.logger.debug(`${fn}- project: '${projectModel.stringify(project)}'`);

            this.onProjectSelection(project);

            // once we loaded the project, we can de-register from the cache listener
            this.removeProjectCacheListener();
        }, (requestError: commonModel.UIRequestError) => {
            this.logger.error(`${fn}- failed to load project`, requestError);
            this.setState({
                isLoadingProject: false,
                requestError: requestError.error,
                selectedProject: undefined,
            });

            this.onProjectError({
                actionFn: this.loadProject,
                actionTitle: t('clg.component.projectSelector.error.action'),
                kind: 'error',
                title: t('clg.page.create.component.project.error.title'),
            } as IClgInlineNotification);
        });
        cache.update(this.cacheIdProject, this.CACHE_KEY_PROJECT);
    }

    public onCreateDisabledChanged(compType: IComponentTypes, isCreateDisabled) {
        const fn = 'onCreateDisabledChanged ';
        this.logger.debug(`${fn}> compType: '${compType}' state.componentType: '${this.state.componentType}'`);
        if (compType === this.state.componentType) {
            this.logger.debug(`${fn}- isCreateDisabled? ${isCreateDisabled}`);
            this.setState((oldState) => ({
                        isCreateDisabled: isCreateDisabled ||
                        !oldState.createFn ||
                        oldState.isLoadingProject
            }));
        }
    }

    public onComponentTypeChanged(selected) {
        switch (selected) {
            case IComponentTypes.APP:
                this.logger.debug('onComponentTypeChanged - APP component type selected');
                this.setState({ componentType: IComponentTypes.APP },
                    () => {
                    if (this.selectAppModeFn) {
                        this.selectAppModeFn();
                    }
                });
                break;
            case IComponentTypes.JOBDEF:
                this.logger.debug('onComponentTypeChanged - JOBDEF component type selected');
                this.setState({ componentType: IComponentTypes.JOBDEF },
                    () => {
                    if (this.selectJobModeFn) {
                        this.selectJobModeFn();
                    }
                });
                break;
        }
    }

    public onGetCreateFunction(createFn) {
        this.setState(() => ({ createFn }));
    }

    public onGetSelectAppTypeFunction(appFn) {
        this.selectAppModeFn = appFn;
    }

    public onGetSelectJobTypeFunction(jobFn) {
        this.selectJobModeFn = jobFn;
    }

    public onIsCreatingChanged(compType: IComponentTypes, isCreating: boolean) {
        if (compType === this.state.componentType) {
            this.logger.debug(`onIsCreatingChanged - isCreating? ${isCreating}`);
            this.setState(() => ({ isCreating }));
        }
    }

    public onOrderSummaryCancel() {
        this.logger.debug('onOrderSummaryCancel');
        // TODO: navigate back here
        if (this.props.history.length > 0) {
            this.props.history.goBack();
        } else {
            this.props.history.push(nav.toGettingStartedOverview());
        }
    }

    public onOrderSummaryCreate() {
        this.logger.debug('onOrderSummaryCreate');
        if (this.state.createFn) {
            this.state.createFn();
        }
    }

    public onProjectError(error) {
        this.logger.debug('onProjectError');
        this.setState({
            error
        });
    }

    public onProjectSelection(proj: projectModel.IUIProject) {
        this.logger.debug(`onProjectSelection - Selected project with id: ${(proj && proj.id)}`);
        this.setState(() => ({
            isLoadingProject: false,
            selectedProject: proj
        }));
    }

    public render() {
        return (
            <div className='page create-pages'>
                <div className={(this.state.componentType === IComponentTypes.JOBDEF ? 'coligo-create--content no-ordersummary' : 'coligo-create--content')}>
                    <PageHeader
                        breadcrumbs={this.getBreadcrumbs()}
                        className={'coligo-create--header'}
                        linkComponent={Link}
                        title={this.getTitle()}
                    />
                    <div className='page-content bx--grid coligo-form'>
                        <div>
                            {this.state.error &&
                            (
                                <InlineNotification
                                    kind={this.state.error.kind}
                                    lowContrast={true}
                                    title={this.state.error.title}
                                    subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                                    onCloseButtonClick={this.closeNotification}
                                    actions={this.state.error.actionFn &&
                                    (
                                        <NotificationActionButton
                                            onClick={this.state.error.actionFn}
                                        >
                                            {this.state.error.actionTitle}
                                        </NotificationActionButton>
                                    )
                                    }
                                />
                            )
                            }

                        {(this.state.showComponentSelector) && (
                            <ClgComponentTypeSelector selectedType={this.state.componentType} onChange={this.onComponentTypeChanged}/>
                        )}

                        {(this.state.showProjectSelector) && (
                            <ClgProjectSelector onError={this.onProjectError} onSelectProject={this.onProjectSelection}/>
                        )}

                            {(this.state.componentType === IComponentTypes.APP) && (
                                <CreateApplicationSubpage
                                    history={this.props.history}
                                    onCreateDisabledChanged={this.onCreateDisabledChanged}
                                    onGetCreateFunction={this.onGetCreateFunction}
                                    onGetSelectFunction={this.onGetSelectAppTypeFunction}
                                    onIsCreatingChanged={this.onIsCreatingChanged}
                                    selectedProject={this.state.selectedProject}
                                />
                            )}
                        {(this.state.componentType === IComponentTypes.JOBDEF) && (
                                <CreateJobSubpage
                                    history={this.props.history}
                                    onCreateDisabledChanged={this.onCreateDisabledChanged}
                                    onGetCreateFunction={this.onGetCreateFunction}
                                    onGetSelectFunction={this.onGetSelectJobTypeFunction}
                                    onIsCreatingChanged={this.onIsCreatingChanged}
                                    selectedProject={this.state.selectedProject}
                                />
                            )}
                        </div>
                        {(this.state.componentType === IComponentTypes.APP) && (
                            <CustomOrderSummary
                                componentType={IComponentTypes.APP}
                                onCancelHandler={this.onOrderSummaryCancel}
                                onCreateHandler={this.onOrderSummaryCreate}
                                isCreateDisabled={this.state.isCreateDisabled}
                                isCreating={this.state.isCreating}
                            />
                        )}
                        {(this.state.componentType === IComponentTypes.JOBDEF) && (
                            <div className='bx--btn-set action-btns'>
                                <Button kind='secondary' onClick={this.onOrderSummaryCancel}>
                                    {t('clg.common.label.cancel')}
                                </Button>
                                {this.state.isCreating ?
                                (
                                    <InlineLoading status='active' description={t('clg.page.create.jobdefinition.summary.loadingText')} />
                                ) : (
                                    <Button kind='primary' id='create-btn-jobdef' disabled={this.state.isCreating || this.state.isCreateDisabled} onClick={this.onOrderSummaryCreate}>{t('clg.common.label.create')}</Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateComponentPage.propTypes = {
    history: PropTypes.shape({
        goBack: PropTypes.func,
        length: PropTypes.number,
        push: PropTypes.func,
    }),
    match: PropTypes.shape({
        params: PropTypes.shape({
            type: PropTypes.string,
        }),
    }),
    type: PropTypes.string,
};

export { CreateComponentPage };
export default withRouter(CreateComponentPage);

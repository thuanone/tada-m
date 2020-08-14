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
import {IConfigTypes} from '../../common/types';
import ClgConfigTypeSelector from '../../components/ClgConfigTypeSelector/ClgConfigTypeSelector';
import ClgProjectSelector from '../../components/ClgProjectSelector/ClgProjectSelector';
import {IClgInlineNotification} from '../../model/common-view-model';
import {CreateConfMapSubpage} from './confmap/CreateConfMapSubpage';
import {CreateGenericSecretSubpage} from './secret/CreateGenericSecretSubpage';

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
    type?: IConfigTypes;
}

interface IState {
    configType: IConfigTypes;
    createFn?: () => void;
    error?: IClgInlineNotification;
    isCreating: boolean;
    isCreateDisabled: boolean;
    isLoadingProject: boolean;
    requestError?: any;
    selectedProject: IUIProject;
    showSecretSelector: boolean; // show component selector only, if type was not provided on page-entry
    showProjectSelector: boolean;
}

function getOnlyValidComponentTypes(configType: string): IConfigTypes | undefined {
    let result;
    if (typeof configType === 'string') {
        switch (configType.toLowerCase()) {
            case IConfigTypes.SECRET:
                result = IConfigTypes.SECRET;
                break;
            case IConfigTypes.CONFMAP:
                result = IConfigTypes.CONFMAP;
                break;
            default:
                // if none matched until here, return undefined intentionally
                break;
        }
    }

    return result;
}

class CreateSecretPage extends React.Component<IProps, IState> {
    private readonly COMPONENT: string = 'CreateSecretPage';
    private removeProjectCacheListener: () => any;
    private readonly regionId: string;
    private readonly projectId: string;
    private cacheIdProject: string;
    private readonly CACHE_KEY_PROJECT = 'coligo-project';

    private selectSecretModeFn;  // callback methods from the two subpages for APP and JOB component type, being called whenever the component type is switched
    private selectConfmapModeFn;

      // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        const providedComponentType = props.type || getOnlyValidComponentTypes(props.match.params.type);
        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;

        this.state = {
            configType: providedComponentType || IConfigTypes.CONFMAP,
            isCreateDisabled: true,
            isCreating: false,
            isLoadingProject: true,
            selectedProject: null,
            showProjectSelector: !(this.regionId && this.projectId),
            showSecretSelector: !providedComponentType,
        };

        this.closeNotification = this.closeNotification.bind(this);
        this.loadProject = this.loadProject.bind(this);
        this.onConfigTypeChanged = this.onConfigTypeChanged.bind(this);
        this.onProjectError = this.onProjectError.bind(this);
        this.onProjectSelection = this.onProjectSelection.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onIsCreatingChanged = this.onIsCreatingChanged.bind(this);
        this.onCreateDisabledChanged = this.onCreateDisabledChanged.bind(this);
        this.onGetCreateFunction = this.onGetCreateFunction.bind(this);
        this.onGetSelectSecretTypeFunction = this.onGetSelectSecretTypeFunction.bind(this);
        this.onGetSelectConfmapTypeFunction = this.onGetSelectConfmapTypeFunction.bind(this);
    }

    public componentDidMount() {
        app.arrivedOnPage('clg.pages.create.config');

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
        return t('clg.breadcrumb.createConfig');
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

    public onCreateDisabledChanged(configType: IConfigTypes, isCreateDisabled) {
        const fn = 'onCreateDisabledChanged ';
        this.logger.debug(`${fn}> configType: '${configType}' state.configType: '${this.state.configType}'`);
        if (configType === this.state.configType) {
            this.logger.debug(`${fn}- isCreateDisabled? ${isCreateDisabled}`);
            this.setState((oldState) => ({
                        isCreateDisabled: isCreateDisabled ||
                        !oldState.createFn ||
                        oldState.isLoadingProject
            }));
        }
    }

    public onConfigTypeChanged(selected) {
        switch (selected) {
            case IConfigTypes.SECRET:
                this.logger.debug('onConfigTypeChanged - SECRET config type selected');
                this.setState({ configType: IConfigTypes.SECRET },
                    () => {
                    if (this.selectSecretModeFn) {
                        this.selectSecretModeFn();
                    }
                });
                break;
            case IConfigTypes.CONFMAP:
                this.logger.debug('onConfigTypeChanged - CONFMAP config type selected');
                this.setState({ configType: IConfigTypes.CONFMAP },
                    () => {
                    if (this.selectConfmapModeFn) {
                        this.selectConfmapModeFn();
                    }
                });
                break;
        }
    }

    public onGetCreateFunction(createFn) {
        this.setState(() => ({ createFn }));
    }

    public onGetSelectSecretTypeFunction(secretFn) {
        this.selectSecretModeFn = secretFn;
    }

    public onGetSelectConfmapTypeFunction(confMapFn) {
        this.selectConfmapModeFn = confMapFn;
    }

    public onIsCreatingChanged(configType: IConfigTypes, isCreating: boolean) {
        if (configType === this.state.configType) {
            this.logger.debug(`onIsCreatingChanged - isCreating? ${isCreating}`);
            this.setState(() => ({ isCreating }));
        }
    }

    public onCancel() {
        this.logger.debug('onCancel');
        // TODO: navigate back here
        if (this.props.history.length > 0) {
            this.props.history.goBack();
        } else {
            this.props.history.push(nav.toGettingStartedOverview());
        }
    }

    public onCreate() {
        this.logger.debug('onCreate');
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
                <div className={'coligo-create--content no-ordersummary'}>
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

                        {(this.state.showSecretSelector) && (
                            <ClgConfigTypeSelector selectedType={this.state.configType} onChange={this.onConfigTypeChanged}/>
                        )}

                        {(this.state.showProjectSelector) && (
                            <ClgProjectSelector onError={this.onProjectError} onSelectProject={this.onProjectSelection}/>
                        )}

                        {(this.state.configType === IConfigTypes.SECRET) && (
                            <CreateGenericSecretSubpage
                                history={this.props.history}
                                onCreateDisabledChanged={this.onCreateDisabledChanged}
                                onGetCreateFunction={this.onGetCreateFunction}
                                onGetSelectFunction={this.onGetSelectSecretTypeFunction}
                                onIsCreatingChanged={this.onIsCreatingChanged}
                                selectedProject={this.state.selectedProject}
                            />
                        )}
                        {(this.state.configType === IConfigTypes.CONFMAP) && (
                            <CreateConfMapSubpage
                                history={this.props.history}
                                onCreateDisabledChanged={this.onCreateDisabledChanged}
                                onGetCreateFunction={this.onGetCreateFunction}
                                onGetSelectFunction={this.onGetSelectConfmapTypeFunction}
                                onIsCreatingChanged={this.onIsCreatingChanged}
                                selectedProject={this.state.selectedProject}
                            />
                        )}
                        </div>
                        <div className='bx--btn-set action-btns'>
                            <Button kind='secondary' onClick={this.onCancel}>
                                {t('clg.common.label.cancel')}
                            </Button>
                            {this.state.isCreating ?
                            (
                                <InlineLoading status='active' description={t('clg.page.create.config.summary.loadingText')} />
                            ) : (
                                <Button kind='primary' id='create-btn-config' disabled={this.state.isCreating || this.state.isCreateDisabled} onClick={this.onCreate}>{t('clg.common.label.create')}</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateSecretPage.propTypes = {
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

export { CreateSecretPage };
export default withRouter(CreateSecretPage);

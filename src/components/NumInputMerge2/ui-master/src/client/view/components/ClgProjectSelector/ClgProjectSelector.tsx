
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

import { Dropdown, DropdownSkeleton, FormItem, FormLabel, InlineNotification, NotificationActionButton } from '@console/pal/carbon-components-react';

import * as commonModel from '../../../../common/model/common-model';
import { IUIProject } from '../../../../common/model/project-model';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';
import GlobalStateContext from '../../common/GlobalStateContext';
import { IClgInlineNotification } from '../../model/common-view-model';

interface IProps {
    history: any;
    onError: (error) => any;
    onSelectProject: (project: IUIProject) => any;
    preselectedProjectId?: string;
    preselectedProjectName?: string;  // if available, select project with the given name
}

interface IState {
    projects?: any[];
    disabled: boolean;
    error?: IClgInlineNotification;
    info?: IClgInlineNotification;
    failedToListProjects?: string;
    selectedProject?: IUIProject;
    isLoading: boolean;
}

const cacheName = 'coligo-projects';

class ClgProjectSelector extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgProjectSelector';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);
    private removeCacheListener: () => any;

    constructor(props) {
        super(props);

        this.closeInfoNotification = this.closeInfoNotification.bind(this);
        this.handleProjectChange = this.handleProjectChange.bind(this);
        this.itemToString = this.itemToString.bind(this);
        this.loadProjects = this.loadProjects.bind(this);
        this.navigateToCreateProjectPage = this.navigateToCreateProjectPage.bind(this);
        this.onProjectsLoaded = this.onProjectsLoaded.bind(this);
        this.onProjectsLoadingFailed = this.onProjectsLoadingFailed.bind(this);

        this.state = {
            disabled: false,
            isLoading: true,
            selectedProject: undefined,
        };
    }

    public componentDidMount() {
        this.loadProjects();
    }

    public componentWillUnmount() {
        if (this.removeCacheListener) {
            // remove the cache listener in order to avoid background syncs with the backend
            this.removeCacheListener();
        }
    }

    public handleProjectChange(event) {
        const newProject = event.selectedItem;

        if (newProject) {
            this.setState(() => {
                if (this.props.onSelectProject) {
                    this.props.onSelectProject(newProject);
                }
                return {
                    isLoading: false,
                    selectedProject: newProject,
                };
            });
        }
    }

    public onProjectsLoaded(projects) {
        const fn = 'onProjectsLoaded ';
        this.logger.debug(`${fn}>`);

        let selectedProject;
        if (projects && projects.length > 0) {
            this.logger.debug(`${fn}- loaded ${projects.length} projects`);

            // first, check whether a preselection was made and whether we can find it in the list of loaded projects
            // if not, we simply select the first of the loaded projects as the selected project
            if (this.props.preselectedProjectId || this.props.preselectedProjectName) {
                for (const project of projects) {
                    if ((project.id === this.props.preselectedProjectId) ||
                        (project.name === this.props.preselectedProjectName)) {
                        selectedProject = project;
                        break;
                    }
                }
            }

            if (!selectedProject) {
                selectedProject = projects[0];
            }

            if (selectedProject && selectedProject.id && this.props.onSelectProject) {
                this.props.onSelectProject(selectedProject);
            }

            this.setState(() => ({ projects, selectedProject, error: null, isLoading: false, failedToListProjects: null }));

            // once we loaded the projects, we can de-register from the cache listener
            this.removeCacheListener();
        } else {
            this.logger.debug(`${fn}- no projects found`);

            // in case the user has no projects, we'll show an info notification

            const infoNotification: IClgInlineNotification = {
                actionFn: this.navigateToCreateProjectPage,
                actionTitle: t('clg.component.projectSelector.info.noprojects.action'),
                kind: 'info',
                subtitle: t('clg.component.projectSelector.info.noprojects.subtitle'),
                title: t('clg.component.projectSelector.info.noprojects.title'),
            };
            this.setState(() => {
                return {
                    info: infoNotification,
                    isLoading: false,
                    projects: [],
                    selectedProject: undefined,
                };
            });
        }
        this.logger.debug(`${fn}<`);
    }

    public onProjectsLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onProjectsLoadingFailed ';
        this.logger.debug(`${fn}> failed to load projects - error: ${commonModel.stringifyUIRequestError(requestError)}`);

        const errorNotification: IClgInlineNotification = {
            actionFn: this.loadProjects,
            actionTitle: t('clg.component.projectSelector.error.action'),
            // clgId: requestError.clgId,
            kind: 'error',
            title: t('clg.component.projectSelector.error.title'),
        };

        this.setState(() => {
            if (this.props.onError) {
                this.props.onError(errorNotification);
            }

            return {
                disabled: true,
                error: errorNotification,
                failedToListProjects: t('clg.component.projectSelector.error.title'),
                isLoading: false,
                projects: [],
            };
        });
    }

    public render() {
        return (
            <div className='bx--row'>
                <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                    <FormItem className='clg-project-selector'>
                        {this.state.isLoading ? (
                            <React.Fragment>
                                <FormLabel>{t('clg.common.label.project')}</FormLabel>
                                <DropdownSkeleton />
                            </React.Fragment>
                        ) : (
                                <React.Fragment>
                                    {this.state.info ? (
                                        <React.Fragment>
                                            <FormLabel>{t('clg.common.label.project')}</FormLabel>
                                            <InlineNotification
                                                className=''
                                                kind={this.state.info.kind}
                                                statusIconDescription={this.state.info.title}
                                                lowContrast={true}
                                                title={this.state.info.title}
                                                subtitle={(<span>{t(this.state.info.subtitle)}</span>)}
                                                onCloseButtonClick={this.closeInfoNotification}
                                                actions={this.state.info.actionFn &&
                                                    (
                                                        <NotificationActionButton onClick={this.state.info.actionFn}>
                                                            {this.state.info.actionTitle}
                                                        </NotificationActionButton>
                                                    )
                                                }
                                            />
                                        </React.Fragment>
                                    ) : (
                                            <Dropdown
                                                disabled={this.state.disabled}
                                                id={'project_selector'}
                                                type={'default'}
                                                titleText={t('clg.common.label.project')}
                                                label={t('clg.common.label.project')}
                                                items={this.state.projects}
                                                itemToString={this.itemToString}
                                                selectedItem={this.state.selectedProject}
                                                onChange={this.handleProjectChange}
                                                invalid={(this.state.failedToListProjects !== null)}
                                                invalidText={this.state.failedToListProjects}
                                            />
                                        )}
                                </React.Fragment>
                            )}
                    </FormItem>
                </div>
            </div>
        );
    }

    private loadProjects() {
        if (this.removeCacheListener) {
            // remove the cache listener in order to avoid background syncs with the backend
            this.removeCacheListener();
        }

        // reset the error state
        this.setState(() => ({ disabled: false, error: null, isLoading: true, failedToListProjects: null }));

        this.removeCacheListener = cache.listen(cacheName, this.onProjectsLoaded, this.onProjectsLoadingFailed);
        cache.update(null, cacheName);
    }

    private itemToString(item) {
        return (item ? `${item.name} (${item.region})` : '???');
    }

    private closeInfoNotification() {
        this.setState({ info: undefined });
    }

    private navigateToCreateProjectPage() {
        this.props.history.push(nav.toCreateProject());
    }
}

ClgProjectSelector.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgProjectSelector.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    onError: PropTypes.func.isRequired,
    onSelectProject: PropTypes.func.isRequired,
    preselectedProjectId: PropTypes.string,
    preselectedProjectName: PropTypes.string,
};

export { ClgProjectSelector };
export default withRouter(ClgProjectSelector);

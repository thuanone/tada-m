import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// carbon + pal
import { Tabs, Tab } from '@console/pal/carbon-components-react';

// codeengine
import * as commonModel from '../../../../../../common/model/common-model';
import { IUIBuild, IUIBuildRun } from '../../../../../../common/model/build-model';
import { deleteBuild, deleteBuildRun } from '../../../../../api/build-api';
import t from '../../../../../utils/i18n';
import nav from '../../../../../utils/nav';
import clgBuildRunStatus from '../../../../../utils/formatter/clgBuildRunStatus';
import ClgProjectSubpageList from '../ClgProjectSubpageList';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import BuildSidePanel from './BuildSidePanel/BuildSidePanel';

interface IProps {
    history: any[];
    regionId: string;
    projectId: string;
    errorHandler?: (error) => void;
}

interface IState {
    isBuildSidePanelOpen: boolean;
    reloadBuildsFn?: () => void;
}

class BuildsSubpage extends React.Component<IProps, IState> {
    private readonly buildsColumns: any[];
    private readonly buildRunsColumns: any[];

    private readonly COMPONENT = 'BuildsSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        this.state = {
            isBuildSidePanelOpen: false,
        };

        this.buildsColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.builds.tab.build.th.name'),
                stringValue: clgCompFormatterName.value,
            },
            {
                field: 'sourceUrl',
                label: t('clg.page.builds.tab.build.th.sourceUrl'),
            },
            {
                field: 'strategyName',
                label: t('clg.page.builds.tab.build.th.strategyName'),
            },
            {
                field: 'outputImage',
                label: t('clg.page.builds.tab.build.th.outputImage'),
            },
            {
                field: 'created',
                formatter: (item: IUIBuild) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.builds.tab.build.th.created'),
                stringValue: (item: IUIBuild) => `${item.created}`,
            },
        ];

        this.buildRunsColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.buildrun.th.name'),
                stringValue: clgCompFormatterName.value,
            }, {
                field: 'status',
                formatter: (item) => clgBuildRunStatus.render(item),
                label: t('clg.page.buildrun.th.status'),
                stringValue: (item) => clgBuildRunStatus.value(item),
            }, {
                field: 'created',
                formatter: (item: IUIBuildRun) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.buildrun.th.created'),
                stringValue: (item: IUIBuildRun) => `${item.created}`,
            },
        ];

        // build specific handlers
        this.buildRowClickHandler = this.buildRowClickHandler.bind(this);
        this.buildDeleteHandler = this.buildDeleteHandler.bind(this);
        this.buildCreateHandler = this.buildCreateHandler.bind(this);

        // build sidepanel specific handlers
        this.receiveReloadBuildsFunction = this.receiveReloadBuildsFunction.bind(this);
        this.loadBuilds = this.loadBuilds.bind(this);
        this.closeCreateBuildPanel = this.closeCreateBuildPanel.bind(this);

        // buildrun specific handlers
        this.buildRunRowClickHandler = this.buildRunRowClickHandler.bind(this);
        this.buildRunDeleteHandler = this.buildRunDeleteHandler.bind(this);
        this.buildRunCreateHandler = this.buildRunCreateHandler.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <div className='builds-subpage'>
                <div className='bx--data-table-header'>
                    <h4 className='bx--data-table-header__title'>{t('clg.page.builds.title')}</h4>
                    <p className='bx--data-table-header__description'>{t('clg.page.builds.subtitle')}</p>
                </div>
                <Tabs type='container' className={'builds-tabs'} tabContentClassName={'project-subpage-tabs--content'} aria-label={t('clg.page.builds.title')}>
                    <Tab id={'build-tab'} tabIndex={0} label={t('clg.components.type.builds')} className={'build-tab-content'} aria-label={t('clg.components.type.builds')} >
                        <ClgProjectSubpageList
                            cacheName='coligo-builds'
                            columns={this.buildsColumns}
                            docsLinkRef='builds'
                            iconName='clg-items-build'
                            idPrefix='build'
                            nlsKeyPrefix='clg.page.builds.tab.build'
                            regionId={this.props.regionId}
                            projectId={this.props.projectId}
                            rowClickHandler={this.buildRowClickHandler}
                            createActionHandler={this.buildCreateHandler}
                            deleteActionHandler={this.buildDeleteHandler}
                            onGetLoadFn={this.receiveReloadBuildsFunction}
                        />
                    </Tab>
                    <Tab id={'buildrun-tab'} tabIndex={0} label={t('clg.components.type.buildruns')} className={'buildrun-tab-content'} aria-label={t('clg.components.type.buildruns')} >
                        <ClgProjectSubpageList
                            cacheName='coligo-buildruns'
                            columns={this.buildRunsColumns}
                            docsLinkRef='buildruns'
                            iconName='clg-items-buildrun'
                            idPrefix='buildrun'
                            nlsKeyPrefix='clg.page.builds.tab.buildrun'
                            regionId={this.props.regionId}
                            projectId={this.props.projectId}
                            rowClickHandler={this.buildRunRowClickHandler}
                            deleteActionHandler={this.buildRunDeleteHandler}
                        />
                    </Tab>
                </Tabs>
                {this.state.isBuildSidePanelOpen && (
                    <BuildSidePanel
                        open={this.state.isBuildSidePanelOpen}
                        onClose={this.closeCreateBuildPanel}
                        onUpdate={this.loadBuilds}
                        project={{
                            id: this.props.projectId,
                            kind: commonModel.UIEntityKinds.PROJECT,
                            name: this.props.projectId,
                            region: this.props.regionId,
                            crn: this.props.projectId
                        }}
                    />
                )}
            </div>
        );
    }

    public closeCreateBuildPanel() {
        const fn = 'closeCreateBuildPanel ';
        this.logger.debug(`${fn}>`);
        this.setState({ isBuildSidePanelOpen: false, });
    }

    public loadBuilds(createdBuild: IUIBuild) {
        const fn = 'loadBuilds ';
        this.logger.debug(`${fn}>`);

        // call the load function that is populated by the subpage
        if (this.state.reloadBuildsFn) {
            this.state.reloadBuildsFn();
        }

        // close the sidepanel
        this.closeCreateBuildPanel();

        // navigate to the appropriate detail page
        this.props.history.push(nav.toBuildDetail(this.props.regionId, this.props.projectId, createdBuild.id));

        this.logger.debug(`${fn}<`);
    }

    public buildRowClickHandler(item) {
        this.logger.debug('buildRowClickHandler');
        this.props.history.push(nav.toBuildDetail(this.props.regionId, this.props.projectId, item.id));
    }

    public buildCreateHandler() {
        this.logger.debug('buildCreateHandler');
        this.setState({ isBuildSidePanelOpen: true });
    }

    public buildDeleteHandler(id: string) {
        this.logger.debug('buildDeleteHandler');
        return deleteBuild(this.props.regionId, this.props.projectId, id);
    }

    public receiveReloadBuildsFunction(fn) {
        this.setState({ reloadBuildsFn: fn });
    }

    public buildRunRowClickHandler(item) {
        this.logger.debug('buildRunRowClickHandler');
        // TODO
    }

    public buildRunDeleteHandler(id: string) {
        this.logger.debug('buildRunDeleteHandler');
        return deleteBuildRun(this.props.regionId, this.props.projectId, id);
    }

    public buildRunCreateHandler() {
        this.logger.debug('buildRunCreateHandler');
        // TODO
    }

}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildsSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default BuildsSubpage;

import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// carbon + pal
import { Tabs, Tab } from '@console/pal/carbon-components-react';

// codeengine
import t from '../../../../../utils/i18n';
import nav from '../../../../../utils/nav';
import clgBuildRunStatus from '../../../../../utils/formatter/clgBuildRunStatus';
import ClgProjectSubpageList from '../ClgProjectSubpageList';
import clgCompFormatterCpu from '../../../../../utils/formatter/clgComponentCpu';
import clgCompFormatterMemory from '../../../../../utils/formatter/clgComponentMemory';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import { deleteJobDefinition, deleteJobRun } from '../../../../../api/job-api';
import { UIEntityKinds } from '../../../../../../common/model/common-model';
import { IUIJobRun } from '../../../../../../common/model/job-model';

interface IProps {
    history: any[];
    regionId: string;
    projectId: string;
    errorHandler?: (error) => void;
}

class JobsSubpage extends React.Component<IProps, {}> {
    private readonly jobColumns: any[];
    private readonly jobRunColumns: any[];

    private readonly COMPONENT = 'JobsSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        this.jobColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.components.th.name'),
                stringValue: clgCompFormatterName.value,
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
        ];

        this.jobRunColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.jobs.th.name'),
                stringValue: clgCompFormatterName.value,
            }, {
                field: 'status',
                formatter: (item) => clgBuildRunStatus.render(item),
                label: t('clg.page.jobs.th.status'),
                stringValue: (item) => clgBuildRunStatus.value(item),
            }, {
                field: 'created',
                formatter: (item: IUIJobRun) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.jobs.th.created'),
                stringValue: (item: IUIJobRun) => `${item.created}`,
            },
        ];

        // jobDef specific handlers
        this.jobDefRowClickHandler = this.jobDefRowClickHandler.bind(this);
        this.jobDefDeleteHandler = this.jobDefDeleteHandler.bind(this);
        this.jobDefCreateHandler = this.jobDefCreateHandler.bind(this);

        // jobRun specific handlers
        this.jobRunRowClickHandler = this.jobRunRowClickHandler.bind(this);
        this.jobRunDeleteHandler = this.jobRunDeleteHandler.bind(this);
        this.jobRunCreateHandler = this.jobRunCreateHandler.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <div className='jobs-subpage'>
                <div className='bx--data-table-header'>
                    <h4 className='bx--data-table-header__title'>{t('clg.page.jobs.title')}</h4>
                    <p className='bx--data-table-header__description'>{t('clg.page.jobs.subtitle')}</p>
                </div>
                <Tabs type='container' className={'job-tabs'} tabContentClassName={'project-subpage-tabs--content'} aria-label={t('clg.page.jobs.title')}>
                    <Tab id={'jobdef-tab'} tabIndex={0} label={t('clg.components.type.jobdefinitions')} className={'jobdef-tab-content'} aria-label={t('clg.components.type.jobdefinitions')} >
                        <ClgProjectSubpageList
                            cacheName='coligo-jobdefinitions'
                            columns={this.jobColumns}
                            docsLinkRef='jobs'
                            iconName='clg-items_jobdefs'
                            idPrefix='jobdef'
                            nlsKeyPrefix='clg.page.jobs.tab.jobdef'
                            regionId={this.props.regionId}
                            projectId={this.props.projectId}
                            rowClickHandler={this.jobDefRowClickHandler}
                            createActionHandler={this.jobDefCreateHandler}
                            deleteActionHandler={this.jobDefDeleteHandler}
                        />
                    </Tab>
                    <Tab id={'jobrun-tab'} tabIndex={0} label={t('clg.components.type.jobruns')} className={'jobrun-tab-content'} aria-label={t('clg.components.type.jobruns')} >
                        <ClgProjectSubpageList
                            cacheName='coligo-job-runs'
                            columns={this.jobRunColumns}
                            docsLinkRef='jobruns'
                            iconName='clg-comp-jobrun'
                            idPrefix='jobrun'
                            nlsKeyPrefix='clg.page.jobs.tab.jobrun'
                            regionId={this.props.regionId}
                            projectId={this.props.projectId}
                            rowClickHandler={this.jobRunRowClickHandler}
                            deleteActionHandler={this.jobRunDeleteHandler}
                        />
                    </Tab>
                </Tabs>
            </div>
        );
    }

    public jobDefRowClickHandler(item) {
        this.logger.debug('jobDefRowClickHandler');
        this.props.history.push(nav.toJobDefinitionDetail(this.props.regionId, this.props.projectId, item.id));
    }

    public jobDefCreateHandler() {
        this.logger.debug('jobDefCreateHandler');
        this.props.history.push(nav.toCreateJobDefinitionInProject(this.props.regionId, this.props.projectId));
    }

    public jobDefDeleteHandler(id: string) {
        this.logger.debug('jobDefDeleteHandler');
        return deleteJobDefinition(this.props.regionId, this.props.projectId, { id, kind: UIEntityKinds.JOBDEFINITION, spec: undefined });
    }

    public jobRunRowClickHandler(item) {
        this.logger.debug('jobRunRowClickHandler');
        this.props.history.push(nav.toJobRunDetail(this.props.regionId, this.props.projectId, item.id));
    }

    public jobRunDeleteHandler(id: string) {
        this.logger.debug('jobRunDeleteHandler');
        return deleteJobRun(this.props.regionId, this.props.projectId, id);
    }

    public jobRunCreateHandler() {
        this.logger.debug('jobRunCreateHandler');
        // TODO
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
JobsSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default JobsSubpage;

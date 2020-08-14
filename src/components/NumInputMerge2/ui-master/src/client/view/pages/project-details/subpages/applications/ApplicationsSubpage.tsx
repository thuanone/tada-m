import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// codeengine
import { deleteApp } from '../../../../../api/application-api';
import clgCompFormatterCpu from '../../../../../utils/formatter/clgComponentCpu';
import clgCompFormatterLink from '../../../../../utils/formatter/clgComponentLink';
import clgCompFormatterMemory from '../../../../../utils/formatter/clgComponentMemory';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import clgCompFormatterStatus from '../../../../../utils/formatter/clgComponentStatus';
import t from '../../../../../utils/i18n';
import nav from '../../../../../utils/nav';
import ClgProjectSubpageList from '../ClgProjectSubpageList';

interface IProps {
    history: any[];
    regionId: string;
    projectId: string;
    errorHandler?: (error) => void;
}

class ApplicationsSubpage extends React.Component<IProps, {}> {
    private readonly applicationColumns: any[];

    private readonly COMPONENT = 'ApplicationsSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        this.applicationColumns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.components.th.name'),
                stringValue: clgCompFormatterName.value,
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

        // application specific handlers
        this.rowClickHandler = this.rowClickHandler.bind(this);
        this.deleteHandler = this.deleteHandler.bind(this);
        this.createHandler = this.createHandler.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <div className='applications-subpage'>
                <ClgProjectSubpageList
                    cacheName='coligo-applications'
                    columns={this.applicationColumns}
                    docsLinkRef='apps'
                    hasTitle={true}
                    iconName='clg-items_apps'
                    idPrefix='application'
                    nlsKeyPrefix='clg.page.applications'
                    regionId={this.props.regionId}
                    projectId={this.props.projectId}
                    rowClickHandler={this.rowClickHandler}
                    createActionHandler={this.createHandler}
                    deleteActionHandler={this.deleteHandler}
                />
            </div>
        );
    }

    public rowClickHandler(item) {
        this.logger.debug('rowClickHandler');
        this.props.history.push(nav.toApplicationDetail(this.props.regionId, this.props.projectId, item.id));
    }

    public createHandler() {
        this.logger.debug('createHandler');
        this.props.history.push(nav.toCreateApplicationInProject(this.props.regionId, this.props.projectId));
    }

    public deleteHandler(id: string) {
        this.logger.debug('deleteHandler');
        return deleteApp(this.props.regionId, this.props.projectId, id);
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationsSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default ApplicationsSubpage;

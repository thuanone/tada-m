import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// codeengine
import * as commonModel from '../../../../../../common/model/common-model';
import { IUIRegistrySecret } from '../../../../../../common/model/config-model';
import { deleteSecret } from '../../../../../api/secret-api';
import clgCompFormatterName from '../../../../../utils/formatter/clgComponentName';
import t from '../../../../../utils/i18n';
import nav from '../../../../../utils/nav';
import ClgProjectSubpageList from '../ClgProjectSubpageList';
import ClgRegistrySidePanel from '../../../../components/ClgRegistrySidePanel/ClgRegistrySidePanel';

interface IProps {
    history: any[];
    regionId: string;
    projectId: string;
    errorHandler?: (error) => void;
}

interface IState {
    isRegistrySidePanelOpen: boolean;
    registryToInspect?: IUIRegistrySecret;
    reloadRegistriesFn?: () => void;
}

class RegistriesSubpage extends React.Component<IProps, IState> {
    private readonly columns: any[];

    private readonly COMPONENT = 'RegistriesSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        this.state = {
            isRegistrySidePanelOpen: false,
        };

        this.columns = [
            {
                field: 'name',
                formatter: clgCompFormatterName.render,
                label: t('clg.page.registries.th.name'),
                stringValue: clgCompFormatterName.value,
            },
            {
                field: 'server',
                formatter: (item: IUIRegistrySecret) => item.server,
                label: t('clg.page.registries.th.server'),
                stringValue: (item: IUIRegistrySecret) => item.server,
            },
            {
                field: 'username',
                formatter: (item: IUIRegistrySecret) => item.username,
                label: t('clg.page.registries.th.username'),
                stringValue: (item: IUIRegistrySecret) => item.username,
            },
            {
                field: 'created',
                formatter: (item: IUIRegistrySecret) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
                label: t('clg.page.registries.th.created'),
                stringValue: (item: IUIRegistrySecret) => `${item.created}`,
            },
        ];

        // registry specific handlers
        this.rowClickHandler = this.rowClickHandler.bind(this);
        this.deleteHandler = this.deleteHandler.bind(this);
        this.createHandler = this.createHandler.bind(this);

        // detail view specific actions
        this.closeRegistryDetailPanel = this.closeRegistryDetailPanel.bind(this);
        this.loadRegistries = this.loadRegistries.bind(this);
        this.receiveReloadRegistriesFunction = this.receiveReloadRegistriesFunction.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <div className='registries-subpage'>
                <ClgProjectSubpageList
                    cacheName='coligo-registries'
                    columns={this.columns}
                    docsLinkRef='container-registries'
                    hasTitle={true}
                    iconName='clg-items-registry'
                    idPrefix='registry'
                    nlsKeyPrefix='clg.page.registries'
                    regionId={this.props.regionId}
                    projectId={this.props.projectId}
                    rowClickHandler={this.rowClickHandler}
                    createActionHandler={this.createHandler}
                    deleteActionHandler={this.deleteHandler}
                    onGetLoadFn={this.receiveReloadRegistriesFunction}
                />

                {this.state.isRegistrySidePanelOpen && (
                    <ClgRegistrySidePanel
                        open={this.state.isRegistrySidePanelOpen}
                        onClose={this.closeRegistryDetailPanel}
                        onUpdate={this.loadRegistries}
                        project={{
                            id: this.props.projectId,
                            kind: commonModel.UIEntityKinds.PROJECT,
                            name: this.props.projectId,
                            region: this.props.regionId,
                            crn: this.props.projectId
                        }}
                        registry={this.state.registryToInspect}
                    />
                )}
            </div>
        );
    }

    public rowClickHandler(item) {
        this.logger.debug('rowClickHandler');
        this.setState({ registryToInspect: item, isRegistrySidePanelOpen: true });
    }

    public createHandler() {
        this.logger.debug('createHandler');
        this.setState({ registryToInspect: undefined, isRegistrySidePanelOpen: true });
    }

    public deleteHandler(id: string) {
        this.logger.debug('deleteHandler');
        return deleteSecret(this.props.regionId, this.props.projectId, id);
    }

    private loadRegistries() {
        const fn = 'loadRegistries ';
        this.logger.debug(`${fn}>`);

        // call the load function that is populated by the subpage
        if (this.state.reloadRegistriesFn) {
            this.state.reloadRegistriesFn();
        }

        // close the sidepanel
        this.closeRegistryDetailPanel();

        this.logger.debug(`${fn}<`);
    }

    private closeRegistryDetailPanel() {
        this.setState({ registryToInspect: undefined, isRegistrySidePanelOpen: false, });
    }

    private receiveReloadRegistriesFunction(fn) {
        this.setState({ reloadRegistriesFn: fn });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
RegistriesSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
};

export default RegistriesSubpage;

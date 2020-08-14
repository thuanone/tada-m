import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Card, CardBody, CardHeader } from '@console/pal/Components';

// codeengine
import * as commonModel from '../../../../../../common/model/common-model';
import * as projModel from '../../../../../../common/model/project-model';
import t from '../../../../../utils/i18n';
import clgDeferredValue from '../../../../../utils/formatter/clgDeferredValue';
import ComponentResources from './ComponentResources';

interface IProps {
    history: any[];
    regionId: string;
    projectId: string;
    projectConsumptionInfo: projModel.IUIProjectConsumptionInfo;
    showInstances: boolean;
    errorHandler?: (error) => void;
}

class OverviewSubpage extends React.Component<IProps, {}> {
    private readonly applicationColumns: any[];

    private readonly COMPONENT = 'OverviewSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn}>`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <div className='overview-subpage'>
                <div>
                    <div className='bx--row'>
                        <div className='bx--col-lg-6 bx--col-md-8 bx--col-sm-4 clg-card-container project-entities'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    title={t('clg.page.project.entities')}
                                />
                                <CardBody>
                                    <div className='section entities'>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.applications')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.APPLICATION])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.jobdefinitions')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count '>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.JOBDEFINITION])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.jobruns')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.JOBRUN])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.builds')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count '>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.BUILD])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.buildruns')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.BUILDRUN])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.registries')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.CONTAINERREGISTRY])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.secrets')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.SECRET])}</div>
                                        </div>
                                        <div className='bx--row'>
                                            <div className='bx--col-lg-14 bx--col-md-6 bx--col-sm-3 project-entities__type productive-heading-01'>{t('clg.components.type.confmaps')}</div>
                                            <div className='bx--col-lg-2 bx--col-md-2 bx--col-sm-1 project-entities__count'>{clgDeferredValue.render(this.props.projectConsumptionInfo && this.props.projectConsumptionInfo.entityStats[commonModel.UIEntityKinds.CONFMAP])}</div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        <div className='bx--col-lg-10 bx--col-md-8 bx--col-sm-4 clg-card-container'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    title={t('clg.page.project.resources')}
                                />
                                <CardBody>
                                    <div className='section resources'>
                                        <ComponentResources show={true} projectConsumptionInfo={this.props.projectConsumptionInfo} />
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                    {this.props.showInstances && (
                        <div className='bx--row'>
                            <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4 clg-card-container'>
                                <Card>
                                    <CardHeader
                                        className='clg-card-header'
                                        title={t('clg.page.project.instances')}
                                    />
                                    <CardBody>
                                        <div className='section instances'>
                                            TBD
                                    </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
OverviewSubpage.propTypes = {
    errorHandler: PropTypes.func,
    history: PropTypes.shape({
        push: PropTypes.func,
    }),
    projectId: PropTypes.string,
    regionId: PropTypes.string,
    showInstances: PropTypes.bool.isRequired,
};

export default OverviewSubpage;

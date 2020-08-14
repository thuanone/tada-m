import PropTypes from 'prop-types';
import React from 'react';

import { Add16 } from '@carbon/icons-react';
import { Button, Link } from '@console/pal/carbon-components-react';
import { Card, CardBody, SectionHeading } from '@console/pal/Components';

import t from '../../../utils/i18n';
import GlobalStateContext from '../../common/GlobalStateContext';

interface IProps {
    btnId?: string;
    createLabel: string;
    description: string;
    descriptionExtended?: string;
    handleCreateFn: () => void;
    handleMoreFn?: () => void;
    icon: any;
    moreLabel: string;
    moreLink?: string;
    title: string;
}

// The global banner that is shown on all pages
class ClgEmptyStateCard extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <React.Fragment>
                <Card className='empty-state-card'>
                    <CardBody>
                        <div className='empty-state-card--icon'>
                            {this.props.icon}
                        </div>
                        <div className='empty-state-card--title'>
                            <SectionHeading title={t(this.props.title)} headingElement='h4'/>
                        </div>
                        <div className='empty-state-card--description'>{t(this.props.description)}</div>
                        {this.props.descriptionExtended &&
                            <div className={this.props.description ? '' : 'empty-state-card--description'}>{t(this.props.descriptionExtended)}</div>
                        }
                        <Button id={this.props.btnId} className='empty-state-card--btn' kind='primary' renderIcon={Add16} onClick={this.props.handleCreateFn}>{t(this.props.createLabel)}</Button>
                        <div className='empty-state-card--morelink' >
                            {this.props.moreLink &&
                                <Link href={this.props.moreLink} target='_blank' rel='noopener noreferrer'>{t(this.props.moreLabel)}</Link>
                            }
                            {!this.props.moreLink && this.props.handleMoreFn &&
                                <Link href='#' onClick={this.props.handleMoreFn}>{t(this.props.moreLabel)}</Link>
                            }
                        </div>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

ClgEmptyStateCard.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgEmptyStateCard.propTypes = {
    btnId: PropTypes.string,
    createLabel: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    descriptionExtended: PropTypes.string,
    handleCreateFn: PropTypes.func.isRequired,
    handleMoreFn: PropTypes.func,
    icon: PropTypes.object.isRequired,
    moreLabel: PropTypes.string.isRequired,
    moreLink: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ClgEmptyStateCard;

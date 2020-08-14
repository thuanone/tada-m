import PropTypes from 'prop-types';
import React from 'react';

import { ArrowRight16 } from '@carbon/icons-react';
import {
    ClickableTile,
    Tile,
} from '@console/pal/carbon-components-react';

import t from '../../../utils/i18n';

interface IProps {
    id?: string;
    image: any;
    title: string;
    description: string;
    moreIcon?: any;
    moreLabel?: string;
    moreLink?: string;
}

class ClgFeatureTile extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
        const componentClassName = 'clg--feature-tile';
        if (this.props.moreLink) {
            return (
                <ClickableTile id={this.props.id} className={`${componentClassName} ${componentClassName}_clickable`} href={this.props.moreLink} target='_blank' rel='noopener noreferrer'>
                    <div key='image' className={`${componentClassName}__image`}>{this.props.image}</div>
                    <div key='content' className={`${componentClassName}__content`}>
                        <div key='title' className={`${componentClassName}__title`}>{t(this.props.title)}</div>
                        <div key='text' className={`${componentClassName}__text`}><span>{t(this.props.description)}</span></div>
                        <div key='morelink' className={`${componentClassName}__morelink`} ><ArrowRight16 className='fill-white' /></div>
                    </div>
                </ClickableTile>
            );
        }

        return (
            <Tile className={`${componentClassName}`}>
                <div key='image' className={`${componentClassName}__image`}>{this.props.image}</div>
                <div key='content' className={`${componentClassName}__content`}>
                    <div key='title' className={`${componentClassName}__title`}>{t(this.props.title)}</div>
                    <div key='text' className={`${componentClassName}__text`}><span>{t(this.props.description)}</span></div>
                </div>
            </Tile>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgFeatureTile.propTypes = {
    description: PropTypes.string.isRequired,
    id: PropTypes.string,
    image: PropTypes.any.isRequired,
    moreLink: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ClgFeatureTile;

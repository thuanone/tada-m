import PropTypes from 'prop-types';
import React from 'react';

import { Link, SkeletonPlaceholder, SkeletonText } from '@console/pal/carbon-components-react';

import t from '../../../utils/i18n';

interface IProps {
    icon: any;
    title: string;
    description: string;
    loading?: boolean;
    moreIcon?: any;
    moreLabel?: string;
    moreLink?: string;
}

class ClgTeaser extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
        if (this.props.loading) {
            return (
                <div className='clg--teaser clg--teaser-loading'>
                    <div key='image' className='clg--teaser__image'><SkeletonPlaceholder /></div>
                    <div key='title' className='clg--teaser__title'><SkeletonText heading={true} /></div>
                    <div key='text' className='clg--teaser__text'><span><SkeletonText paragraph={true} lineCount={3} /></span></div>
                </div>
            );
        }
        return (
            <div className='clg--teaser'>
                <div key='image' className='clg--teaser__image'>{this.props.icon}</div>
                <div key='title' className='clg--teaser__title'>{t(this.props.title)}</div>
                <div key='text' className='clg--teaser__text'><span>{t(this.props.description)}</span></div>
                {this.props.moreLink &&
                (
                    <div key='morelink' className='clg--teaser__morelink' >
                        <Link href={this.props.moreLink} target='_blank' rel='noopener noreferrer'>
                            {t(this.props.moreLabel)}
                            {this.props.moreIcon &&
                                <React.Fragment>{this.props.moreIcon}</React.Fragment>
                            }
                        </Link>
                    </div>
                )}
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgTeaser.propTypes = {
    description: PropTypes.string.isRequired,
    icon: PropTypes.any.isRequired,
    loading: PropTypes.bool,
    moreIcon: PropTypes.any,
    moreLabel: PropTypes.string,
    moreLink: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ClgTeaser;

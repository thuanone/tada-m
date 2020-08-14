import PropTypes from 'prop-types';
import React from 'react';

import { Link } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader } from '@console/pal/Components';

import { t, tHtml} from '../../../utils/i18n';

interface IProps {
    className?: string;
    icon: any;
    title: string;
    description: string;
    moreIcon?: any;
    moreLabel?: string;
    moreLink?: string;
}

class ClgBanner extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
    }

    public render() {
      return (
        <Card className={`clg--banner ${this.props.className}`}>
            <div className='clg--banner__card'>
                <section className='clg--banner__image'>{this.props.icon}</section>
                <section className='clg--banner__content'>
                    <CardHeader title={t(this.props.title)} />
                    <CardBody>
                        <div className='clg--banner__text'><span>{tHtml(this.props.description)}</span></div>
                        {this.props.moreLink &&
                        (
                            <div className='clg--banner__morelink' >
                                <Link href={this.props.moreLink} target='_blank' rel='noopener noreferrer'>
                                    {t(this.props.moreLabel)}
                                    {this.props.moreIcon &&
                                        <React.Fragment>{this.props.moreIcon}</React.Fragment>
                                    }
                                </Link>
                            </div>
                        )}
                    </CardBody>
                </section>
            </div>
        </Card>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgBanner.propTypes = {
    className: PropTypes.string,
    description: PropTypes.string.isRequired,
    icon: PropTypes.any.isRequired,
    moreIcon: PropTypes.any,
    moreLabel: PropTypes.string,
    moreLink: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ClgBanner;

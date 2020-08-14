import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

import {
    InlineNotification,
    NotificationActionButton,
    ToastNotification,
} from '@console/pal/carbon-components-react';

import * as projectModel from '../../../../common/model/project-model';
import flags from '../../../api/flags';
import clgProjectName from '../../../utils/formatter/clgProjectName';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';

interface IProps {
    hideWarnings?: boolean;
    projects?: projectModel.IUIProject[];
    type: 'toast' | 'inline';
}

interface IState {
    hideToast: boolean;
    isProjectExpirationEnabled: boolean;
}

class ClgProjectExpirationWarnings extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgProjectExpirationWarnings';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);
    constructor(props) {
        super(props);

        this.state = {
            hideToast: false,
            isProjectExpirationEnabled: false,
        };

        this.closeToast = this.closeToast.bind(this);
        this.renderToastNotification = this.renderToastNotification.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        this.logger.debug(`${fn} >`);

        // check whether we evaluate the project expiry status
        flags.getFlag(flags.flags.FEATURE_PROJECT_EXPIRATION, (flag) => {
            this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
            if (flag && flag.value === true) {
                this.setState({ isProjectExpirationEnabled: true });
            }
        });
    }

    public render() {
        if (!this.props.projects || this.props.projects.length === 0) {
            return <React.Fragment />;
        }

        if (!this.state.isProjectExpirationEnabled) {
            return <React.Fragment />;
        }
        const fn = 'render ';
        this.logger.debug(`${fn}`);

        let numberOfWarnings = 0;
        let lastWarning;
        let numberOfUrgentWarnings = 0;
        let lastUrgentWarning;

        for (const project of this.props.projects) {
            if (!project.projectStatus) {
                continue;
            }
            const expiryState = clgProjectName.getExpiryState(project);
            if (expiryState === clgProjectName.states.STATE_WARN) {
                numberOfWarnings += 1;
                lastWarning = clgProjectName.value(project);
            }

            if (expiryState === clgProjectName.states.STATE_URGENT) {
                numberOfUrgentWarnings += 1;
                lastUrgentWarning = clgProjectName.value(project);
            }
        }

        return (
            <div className='clg--expiration-warning'>
                {numberOfUrgentWarnings > 0 &&
                    (
                        this.renderNotification(this.props.type, 'warning', t('clg.project.expire.urgent.title'), t(`clg.project.expire.subtitle.${numberOfUrgentWarnings === 1 ? 'single' : 'multiple'}`, { numberOf: numberOfUrgentWarnings, timeToDeletion: '24', name: lastUrgentWarning }), false)
                    )
                }
                {!this.props.hideWarnings && numberOfWarnings > 0 &&
                    (
                        this.renderNotification(this.props.type, 'warning', t('clg.project.expire.warn.title'), t(`clg.project.expire.subtitle.${numberOfWarnings === 1 ? 'single' : 'multiple'}`, { numberOf: numberOfWarnings, timeToDeletion: '48', name: lastWarning }), true)
                    )
                }
            </div>
        );
    }

    private renderNotification(type: 'inline' | 'toast', kind: string, title: string, subtitle: string, lowContrast: boolean) {
        if (type === 'inline') {
            return this.renderInlineNotification(kind, title, subtitle, lowContrast);
        } else {
            return this.renderToastNotification(kind, title, subtitle);
        }
    }

    private renderToastNotification(kind: string, title: string, subtitle: string) {
        if (this.state.hideToast) {
            return <React.Fragment />;
        }
        return (
            <ToastNotification
                analytics-category='Limitations'
                analytics-name='Project Expiration'
                kind={kind}
                lowContrast={false}
                title={title}
                subtitle={subtitle}
                caption={''}
                onCloseButtonClick={this.closeToast}
            />
        );
    }

    private renderInlineNotification(kind: string, title: string, subtitle: string, lowContrast: boolean) {
        return (
            <InlineNotification
                analytics-category='Limitations'
                analytics-name='Project Expiration'
                kind={kind}
                lowContrast={lowContrast}
                title={title}
                subtitle={subtitle}
                hideCloseButton={true}
                actions={
                    (
                        <NotificationActionButton
                            href={nav.getDocsLink('limits-experimental')}
                            rel='noopener noreferrer'
                            target='_blank'
                        >
                            {t('clg.project.expire.learnmore')}
                        </NotificationActionButton>
                    )
                }
            />
        );
    }

    private closeToast() {
        this.setState({ hideToast: true });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgProjectExpirationWarnings.propTypes = {
    hideWarnings: PropTypes.bool,
    projects: PropTypes.any,
    type: PropTypes.string.isRequired,
};

export default ClgProjectExpirationWarnings;

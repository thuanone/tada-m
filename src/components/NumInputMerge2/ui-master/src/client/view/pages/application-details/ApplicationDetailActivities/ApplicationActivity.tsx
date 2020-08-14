// react
import PropTypes from 'prop-types';
import React from 'react';
import TimeAgo from 'react-timeago';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
    CheckmarkFilled16,
    ChevronDown16,
    ChevronRight16,
    ErrorFilled16,
} from '@carbon/icons-react';
import { InlineLoading } from '@console/pal/carbon-components-react';

// coligo
import t from '../../../../utils/i18n';
import GlobalStateContext from '../../../common/GlobalStateContext';

interface IActivity {
    collapsed: boolean;
    durationInMillis?: number;
    endDate?: string;
    endTime?: number;
    id: number;
    resolved: boolean;
    responseBody?: string;
    success?: boolean;
    startDate?: string;
    startTime?: number;
    title: string;
    type: string;
    updateUrl?: string;
}

interface IProps {
    activity: IActivity;
}

interface IState {
    activity: IActivity;
}

class ApplicationActivity extends React.Component<IProps, IState> {
    public toggleActivitiy;
    private readonly COMPONENT = 'ApplicationActivity';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.logger.debug('constructor');
        this.toggleActivitiy = this._toggleActivitiy.bind(this);

        this.state = {
            activity: props.activity,
        };
    }

    public render() {
        const toggleActivitiy = this.toggleActivitiy.bind(null, this.props.activity);
        let status: string = 'pending';
        if (this.props.activity.resolved && this.props.activity.success === true) {
            status = 'success';
        } else if (this.props.activity.resolved === true && this.props.activity.success === false) {
            status = 'failure';
        }
        return (
            <div key={this.props.activity.id}>
                <div className={'application-invoke--invocations__result invocation-result invocation-result__' + status}>
                    <div className='invocation-result__header bx--row'>
                        <div className='bx--col-lg-16 header-row'>
                            {this.props.activity.collapsed === true &&
                                <a onClick={toggleActivitiy}><ChevronRight16 alt={t('clg.common.label.expand')} /></a>
                            }
                            {this.props.activity.collapsed === false &&
                                <a onClick={toggleActivitiy}><ChevronDown16 alt={t('clg.common.label.collapse')} /></a>
                            }
                            <div>
                                {this.props.activity.resolved === false &&
                                    (
                                        <InlineLoading />
                                    )
                                }
                                {this.props.activity.resolved === true && this.props.activity.success === true &&
                                    (
                                        <CheckmarkFilled16 className='fill-success' />
                                    )
                                }
                                {this.props.activity.resolved === true && this.props.activity.success === false &&
                                    (
                                        <ErrorFilled16 className='fill-failed' />
                                    )
                                }
                            </div>
                            <div className='invocation-result__header-title truncate-text productive-heading-01'><span>{this.props.activity.title}</span></div>
                        </div>
                    </div>
                    {this.props.activity.resolved === false && !this.props.activity.collapsed &&
                        (
                            <div className='invocation-result__details'>
                                <div className='invocation-result__details__section-header'>
                                    <label className='bx--label'>{t('clg.page.application.section.invocations.resultslabel')}</label>
                                </div>
                                <div className='invocation-result__details__section-content content-code'>
                                    {t('clg.page.application.section.invocations.waitForResults')}
                                </div>
                            </div>
                        )
                    }

                    {this.props.activity.resolved === true && !this.props.activity.collapsed &&
                        (
                            <div className={`invocation-result__details ${(this.props.activity.success ? 'success' : 'failed')}`}>
                                <div className='invocation-result__details__section-header'>
                                    <label className='invocation-result__header-timeago bx--label'><TimeAgo date={this.props.activity.startDate} minPeriod={5} /> | {t('clg.page.application.section.invocations.responsetime', { duration: this.props.activity.durationInMillis })}</label>
                                </div>
                                <div className='invocation-result__details__section-header'>
                                    <label className='bx--label'>{t('clg.page.application.section.invocations.resultslabel')}</label>
                                </div>
                                <div className='invocation-result__details__section-content content-code code-01'>{this.renderResponseBody(this.props.activity.responseBody)}</div>
                            </div>
                        )
                    }
                </div>
            </div>
        );
    }

    private renderResponseBody(responseBody: string) {
        // in case the content is empty, we should render a message
        if (!responseBody || responseBody === '') {
            return <span>{t('clg.page.application.section.invocations.noresponsecontent')}</span>;
        }

        // if the response body has no line feeds, render "just the content"
        if (!responseBody || responseBody.indexOf('\n') === -1) {
            return <span>{responseBody}</span>;
        }

        // split the content into lines
        const lines = [];
        const splittedLines = responseBody.split('\n');
        let idx = 0;
        for (const line of splittedLines) {
            idx += 1;
            lines.push(<pre key={`${Date.now()}_${idx}`} className='content-code code-01'>{line}</pre>);
        }
        return <div>{lines}</div>;
    }

    private _toggleActivitiy(activitiy, event) {
        event.stopPropagation();
        this.logger.debug('toggleActivitiy');
        activitiy.collapsed = !activitiy.collapsed;
        this.setState({ activity: this.props.activity });
    }
}

ApplicationActivity.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationActivity.propTypes = {
    activity: PropTypes.object.isRequired,
};

export {
    ApplicationActivity,
    IActivity
};

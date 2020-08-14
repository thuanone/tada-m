// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Link } from '@console/pal/carbon-components-react';
import { SectionHeading } from '@console/pal/Components';

// coligo
import t from '../../../../utils/i18n';
import img from '../../../../utils/img';
import nav from '../../../../utils/nav';
import {ApplicationActivity} from './ApplicationActivity';

interface IProps {
  activities: any[];
  handleInvoke: () => any;
}

interface IState {
  activities: any[];
}

class ApplicationDetailActivities extends React.Component<IProps, IState> {
  private readonly doInvokeFn: (event: any) => void;

  private readonly COMPONENT = 'ApplicationDetailActivities';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.logger.debug('constructor');

    this.doInvokeFn = this._doInvokeFn.bind(this);

    this.state = {
      activities: props.activities,
    };
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    this.logger.debug('componentWillReceiveProps');
    if (newProps.activities) {
      this.setState({ activities: newProps.activities });
    }
  }

  public render() {
    this.logger.debug(`render- ${this.state.activities ? this.state.activities.length : 'ZERO'} activities`);
    return (
      <div className='application-invoke'>
        {(!this.state.activities || this.state.activities.length === 0) &&
          (
            <div className='application-invoke--no-invocations'>
              <div className='application-invoke--no-invocations__icon'>
                <img src={img.get('clg-apps-response-empty')} alt='no activities' />
              </div>
              <div className='empty-state-card--title'>
                <SectionHeading title={t('clg.page.application.section.invocations.noinvocationstitle')} headingElement='h4'/>
              </div>
              <div className='application-invoke--no-invocations__description'>{t('clg.page.application.section.invocations.noinvocationsdescription')}</div>
              <div className='application-invoke--no-invocations__morelink'>
                <Link href={nav.getDocsLink('cli-reference')} target='_blank' rel='noopener noreferrer'>{t('clg.page.application.section.invocations.noinvocationsmore')}</Link>
              </div>
            </div>
          )
        }

        {(this.state.activities && this.state.activities.length > 0) &&
          (
            <div className='application-invoke--invocations'>
              {/* iterate over all activities */}
              {this.state.activities.slice(0).reverse().map((activitiy) => {
                return (
                    <ApplicationActivity activity={activitiy} key={activitiy.id}/>
                );
              })}
            </div>
          )
        }
      </div>
    );
  }

  private _doInvokeFn(event) {
    this.props.handleInvoke();
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailActivities.propTypes = {
  activities: PropTypes.array.isRequired,
};

export default ApplicationDetailActivities;

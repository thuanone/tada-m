// react
import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { PageHeader, ResourceLevelNav } from '@console/pal/Components';

import { setPageTitle } from '../../../utils/app';
import t from '../../../utils/i18n';
import nav from '../../../utils/nav';
import CacheStatisticsPage from './subpages/CacheStatisticsPage';
import PerformanceMonitorListPage from './subpages/PerformanceMonitorListPage';
import StatusPage from './subpages/StatusPage';
import TroubleshootingPage from './subpages/TroubleshootingPage';

interface IProps {
  history: any[];
  location: {
    search: string
  };
  match: any;
}

class HealthStatusPage extends React.Component<IProps, {}> {
  private readonly COMPONENT = 'HealthStatusPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private subpage: string;
  private readonly navItems: any[];

  constructor(props) {
    super(props);

    this.subpage = props.match.params.subpage || 'status';

    // prepare the resource level nav
    this.navItems = [{
      id: nav.toHealthStatus(),
      label: t('clg.nav.health.status'),
      to: nav.toHealthStatus(),
    }, {
      id: nav.toHealthPerformance(),
      label: t('clg.nav.health.performance'),
      to: nav.toHealthPerformance(),
    }, {
      id: nav.toHealthCaches(),
      label: t('clg.nav.health.caches'),
      to: nav.toHealthCaches(),
    }, {
      id: nav.toHealthTroubleshooting(),
      label: t('clg.nav.health.troubleshooting'),
      to: nav.toHealthTroubleshooting(),
    },
    ];
  }

  public render() {
    this.logger.debug('render');
    const pageClassNames = 'page detail-page health-page';

    // if the user clicks in the navigation we need to re-apply the subpage property
    this.subpage = this.props.match.params.subpage || 'status';

    // set the page title
    setPageTitle(`clg.pages.health.${this.subpage}`);

    return (
      <div className={pageClassNames}>
        <PageHeader
          title={t('clg.page.health-status.title')}
          linkComponent={Link}
          breadcrumbs={this.getBreadcrumbs()}
        />
        <ResourceLevelNav
          className={'clg--resource-level-nav'}
          items={this.navItems}
          linkComponent={Link}
        />
        <div className='has-side-nav page-content'>
          <div className='bx--grid'>
            {this.subpage === 'status' &&
              <StatusPage />
            }
            {this.subpage === 'performance' &&
              <PerformanceMonitorListPage />
            }
            {this.subpage === 'caches' &&
              <CacheStatisticsPage />
            }
            {this.subpage === 'troubleshooting' &&
              <TroubleshootingPage />
            }
          </div>
        </div>
      </div>
    );
  }

  public getBreadcrumbs() {
    const breadcrumbs = [];
    breadcrumbs.push({
      to: nav.toGettingStartedOverview(),
      value: t('clg.breadcrumb.home'),
    },
    );
    return breadcrumbs;
  }

}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
HealthStatusPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      subpage: PropTypes.string,
    }),
  }),
};

export default withRouter(HealthStatusPage);

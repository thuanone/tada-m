
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

import { Message } from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';

import * as commonModel from '../../../../../common/model/common-model';
import cache from '../../../../utils/cache';
import * as dateUtils from '../../../../utils/date';
import t from '../../../../utils/i18n';
import ClgTableWrapper from '../../../components/ClgTableWrapper/ClgTableWrapper';

interface IProps {
  history: any[];
}

interface IState {
  error: any;
  monitors?: any[];
  isLoadingMonitors: boolean;
}

class PerformanceMonitorListPage extends React.Component<IProps, IState> {
  private readonly columns: any[];
  private removeMonitorsCacheListener: () => any;
  private actions: any[];  // TODO: never set, only read -> either a bug, or for future use

  private readonly COMPONENT = 'PerformanceMonitorListPage';
  private readonly CACHE_KEY_MONITORS = 'coligo-performance-monitors';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isLoadingMonitors: false,
    };

    this.getRowActions = this.getRowActions.bind(this);
    this.loadMonitors = this.loadMonitors.bind(this);

    this.columns = [
      {
        field: 'id',
        label: 'id',
        type: 'string',
      },
      {
        field: 'hits',
        label: 'hits',
        type: 'number',
      },
      {
        field: 'avg',
        label: 'avg',
        type: 'number',
      },
      {
        field: 'min',
        label: 'min',
        type: 'number',
      },
      {
        field: 'max',
        label: 'max',
        type: 'number',
      },
      {
        field: 'total',
        label: 'total',
        type: 'number',
      },
      {
        field: 'lastValue',
        label: 'lastValue',
        type: 'number',
      },
      {
        field: 'lastAccessed',
        formatter: (item: any) => dateUtils.format(item.lastAccessed, getLocale(window.navigator.language), true),
        label: 'lastAccessed',
      },
    ];
  }

  public componentDidMount() {
    this.loadMonitors();
  }

  public componentWillUnmount() {
    // remove the cache listener in order to avoid background syncs with the backend
    this.removeMonitorsCacheListener();
  }

  public getRowActions() {
    return [];
  }

  public render() {
    this.logger.debug('render');
    const subpageClassNames = 'page list-page clg-monitors-list-page';

    if (this.state.error) {
      return (
        <div className={subpageClassNames}>
          <Message
            caption={this.state.error.clgId || ''}
            text={`${t('clg.page.error.title')} ${t('clg.page.error.subtitle')}`}
            icon='ERROR'
            isTileWrapped={true}
          />
        </div>
      );
    }

    return (
      <div className={subpageClassNames}>
        <ClgTableWrapper
          title={t('clg.page.health-status.performance-monitors.subtitle')}
          description={t('clg.page.health-status.performance-monitors.description')}
          className='clg-datatable-sortable'
          columns={this.columns}
          items={this.state.monitors}
          id='monitors-table'
          sortField='id'
          sortDir={-1}
          actions={this.actions}
        />
      </div>
    );
  }

  private loadMonitors(): void {
    const fn = 'loadMonitors ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ error: null, isLoadingMonitors: true });

    this.removeMonitorsCacheListener = cache.listen(this.CACHE_KEY_MONITORS, (monitors: any[]) => {
      this.logger.debug(`${fn}- ${monitors ? monitors.length : 'NULL'} monitors`);

      this.setState({ monitors, isLoadingMonitors: false });
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load monitors`, requestError);
      // show global error state
      this.setState({ monitors: undefined, error: requestError, isLoadingMonitors: false });
    });
    cache.update(null, this.CACHE_KEY_MONITORS);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
PerformanceMonitorListPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default withRouter(PerformanceMonitorListPage);

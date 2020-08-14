import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carb on + pal
import { Message } from '@console/pal/Components';

import * as commonModel from '../../../../../common/model/common-model';
import cache from '../../../../utils/cache';
import t from '../../../../utils/i18n';
import ClgTableWrapper from '../../../components/ClgTableWrapper/ClgTableWrapper';

interface IProps {
  history: any[];
}

interface IState {
  error: any;
  caches?: any[];
  isLoadingCacheStats: boolean;
}

class CacheStatisticsListPage extends React.Component<IProps, IState> {
  private readonly columns: any[];
  private removeCacheListener: () => any;
  private actions: any[];  // TODO: never set, only read -> either a bug, or for future use

  private readonly COMPONENT = 'CacheStatisticsListPage';
  private readonly CACHE_KEY_STATS = 'coligo-cache-statistics';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isLoadingCacheStats: false,
    };

    this.getRowActions = this.getRowActions.bind(this);
    this.loadCacheStats = this.loadCacheStats.bind(this);

    this.columns = [
      {
        field: 'id',
        label: 'id',
        type: 'string',
      },
      {
        field: 'keys',
        label: 'keys',
        type: 'number',
      },
      {
        field: 'hits',
        label: 'hits',
        type: 'number',
      },
      {
        field: 'misses',
        label: 'misses',
        type: 'number',
      },
      {
        field: 'ksize',
        label: 'ksize',
        type: 'number',
      },
      {
        field: 'vsize',
        label: 'vsize',
        type: 'number',
      },
    ];
  }

  public componentDidMount() {
    this.loadCacheStats();
  }

  public componentWillUnmount() {
    // remove the cache listener in order to avoid background syncs with the backend
    this.removeCacheListener();
  }

  public getRowActions() {
    return [];
  }

  public render() {
    this.logger.debug('render');
    const subpageClassNames = 'page list-page clg-cache-stats-list-page';

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
        <React.Fragment>
          <ClgTableWrapper
            title={t('clg.page.health-status.cache-stats.subtitle')}
            description={t('clg.page.health-status.cache-stats.description')}
            className='clg-datatable-sortable'
            columns={this.columns}
            items={this.state.caches}
            id='caches-table'
            sortField='id'
            sortDir={-1}
            actions={this.actions}
          />
        </React.Fragment>
      </div>
    );
  }

  private loadCacheStats(): void {
    const fn = 'loadCacheStats ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ error: null, isLoadingCacheStats: true });

    this.removeCacheListener = cache.listen(this.CACHE_KEY_STATS, (caches: any[]) => {
      this.logger.debug(`${fn}- ${caches ? caches.length : 'NULL'} cache stats`);

      this.setState({ caches, isLoadingCacheStats: false });
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load cache statistics`, requestError);
      // show global error state
      this.setState({ caches: undefined, error: requestError, isLoadingCacheStats: false });
    });
    cache.update(null, this.CACHE_KEY_STATS);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CacheStatisticsListPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default withRouter(CacheStatisticsListPage);

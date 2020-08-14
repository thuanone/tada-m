// react
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';
import TimeAgo from 'react-timeago';

// carbon + pal
import { InlineNotification, NotificationActionButton, } from '@console/pal/carbon-components-react';
import { SidePanel, SidePanelContainer } from '@console/pal/Components/SidePanel';

// coligo
import * as appModel from '../../../../../common/model/application-model';
import * as commonModel from '../../../../../common/model/common-model';
import cache from '../../../../utils/cache';
import clgAppStatus from '../../../../utils/formatter/clgAppStatus';
import * as clgAppTrafficPercentage from '../../../../utils/formatter/clgAppTrafficPercentage';
import * as clgAppTrafficTags from '../../../../utils/formatter/clgAppTrafficTags';
import t from '../../../../utils/i18n';
import ClgTableWrapper from '../../../components/ClgTableWrapper/ClgTableWrapper';
import { IClgInlineNotification } from '../../../model/common-view-model';
import ApplicationDetailRevisionSidePanel from '../ApplicationDetailRevisionSidePanel/ApplicationDetailRevisionSidePanel';

interface IProps {
  application: appModel.IUIApplication;
  revisions: any[];
  route: any;
}

interface IState {
  isLoadingRevisions: boolean;
  isLoadingRoute: boolean;
  revisionToInspect: appModel.IUIApplicationRevision;
  revisions: appModel.IUIApplicationRevision[];
  route: appModel.IUIApplicationRoute;
  errorLoadingRevisions?: IClgInlineNotification;
  errorLoadingRoute?: IClgInlineNotification;
}

class ApplicationDetailTraffic extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailTraffic';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly CACHE_NAME_REVISIONS = 'coligo-application-revisions';
  private removeRevisionsCacheListener: () => any;

  private readonly CACHE_NAME_ROUTE = 'coligo-application-route';
  private removeRouteCacheListener: () => any;

  private readonly applicationCacheIdentifier: string;

  private readonly regionId: string;
  private readonly projectId: string;
  private readonly applicationId: string;

  private readonly actions: any[];
  private readonly columns: any[];

  constructor(props) {
    super(props);

    this.regionId = props.match.params.regionId;
    this.projectId = props.match.params.projectId;
    this.applicationId = props.match.params.applicationId;

    this.applicationCacheIdentifier = `region/${this.regionId}/project/${this.projectId}/application/${this.applicationId}`;

    this.state = {
      isLoadingRevisions: true,
      isLoadingRoute: true,
      revisionToInspect: undefined,
      revisions: undefined,
      route: undefined,
    };

    this.columns = [
      {
        field: 'name',
        label: t('clg.page.application.trafficrevisions.revisions.th.name'),
      },
      {
        field: 'tags',
        formatter: (item: appModel.IUIApplicationRevision) => clgAppTrafficTags.render(item, this.state.route ? this.state.route.routingTags : undefined),
        label: t('clg.page.application.trafficrevisions.revisions.th.tag'),
        stringValue: (item: appModel.IUIApplicationRevision) => clgAppTrafficTags.value(item, this.state.route ? this.state.route.routingTags : undefined),
      },
      {
        field: 'state',
        formatter: (item: appModel.IUIApplicationRevision) => clgAppStatus.render(item),
        label: t('clg.page.application.trafficrevisions.revisions.th.status'),
        stringValue: (item: appModel.IUIApplicationRevision) => clgAppStatus.value(item),
      },
      {
        field: 'traffic',
        formatter: (item: appModel.IUIApplicationRevision) => clgAppTrafficPercentage.render(item, this.state.route ? this.state.route.trafficTargets : undefined),
        label: t('clg.page.application.trafficrevisions.revisions.th.traffic'),
        stringValue: (item: appModel.IUIApplicationRevision) => clgAppTrafficPercentage.value(item, this.state.route ? this.state.route.trafficTargets : undefined),
      },
      {
        field: 'created',
        formatter: (item: appModel.IUIApplicationRevision) => React.createElement(TimeAgo, { date: item.created, minPeriod: 5 }) || '',
        label: t('clg.page.application.trafficrevisions.revisions.th.created'),
        stringValue: (item: appModel.IUIApplicationRevision) => `${item.created}` || '',
      },
    ];
    this.actions = [];

    // use the bind to enable setState within this function
    this.clickHandler = this.clickHandler.bind(this);
    this.closeRouteErrorNotification = this.closeRouteErrorNotification.bind(this);
    this.closeRevisionsErrorNotification = this.closeRevisionsErrorNotification.bind(this);
    this.closeRevisionDetailPanel = this.closeRevisionDetailPanel.bind(this);
    this.getRowActions = this.getRowActions.bind(this);
    this.loadRevisions = this.loadRevisions.bind(this);
    this.loadRoute = this.loadRoute.bind(this);
    this.renderClgNotification = this.renderClgNotification.bind(this);
  }

  public componentDidMount() {
    this.logger.debug('componentDidMount');

    // load all revisions
    this.loadRevisions();

    // load the route configuration
    this.loadRoute();
  }

  public componentWillUnmount() {
    this.removeRevisionsCacheListener();
    this.removeRouteCacheListener();
  }

  public getRowActions() {
    return [];
  }

  public clickHandler(item) {
    this.logger.debug(`clickHandler - ${appModel.stringify(item)}`);
    this.setState({ revisionToInspect: item });
  }

  public render() {
    this.logger.debug('render');

    return (
      <div className='clg-application-detail-page--traffic'>
        <div className='bx--row'>
          <div className='bx--col-lg-16 bx--col-md-8'>
            <div className='section'>
              <div className='application-section--content'>
                {this.renderClgNotification(this.state.errorLoadingRoute)}
                {this.renderClgNotification(this.state.errorLoadingRevisions)}
                <ClgTableWrapper
                  title={t('clg.page.application.trafficrevisions.title')}
                  description={t('clg.page.application.trafficrevisions.description')}
                  className='clg-datatable-sortable'
                  columns={this.columns}
                  items={this.state.revisions}
                  id='revisions-table'
                  sortField='generation'
                  sortDir={-1}
                  actions={this.actions}
                  rowClickHandler={this.clickHandler}
                />
              </div>
            </div>
          </div>
        </div>
        <SidePanelContainer
          closePanelText={t('clg.common.label.close')}
          hasOverlay={false}
          hideBottomNav={true}
          isOpen={typeof this.state.revisionToInspect !== 'undefined'}
          onCloseClick={this.closeRevisionDetailPanel}
          panelSize={'large'}
        >
          <SidePanel id='revision-detail-panel' title={this.state.revisionToInspect ? this.state.revisionToInspect.name : ''} children={<ApplicationDetailRevisionSidePanel revision={this.state.revisionToInspect} />} />
        </SidePanelContainer>
      </div>
    );
  }

  private renderClgNotification(error: IClgInlineNotification) {
    if (!error) {
      return;
    }
    return (
      <InlineNotification
        kind={error.kind}
        lowContrast={true}
        title={error.title}
        subtitle={(<span>{t(error.subtitle)}</span>)}
        onCloseButtonClick={error.closeFn}
        actions={error.actionFn &&
          (
            <NotificationActionButton
              onClick={error.actionFn}
            >
              {error.actionTitle}
            </NotificationActionButton>
          )
        }
      />
    );
  }

  private loadRevisions() {
    const fn = 'loadRevisions ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ errorLoadingRevisions: null, isLoadingRevisions: true });

    this.removeRevisionsCacheListener = cache.listen(this.CACHE_NAME_REVISIONS, (revisions: appModel.IUIApplicationRevision[]) => {
      this.logger.debug(`${fn}- revisions: '${JSON.stringify(revisions)}'`);

      this.setState({ revisions, errorLoadingRevisions: null, isLoadingRevisions: false });

      // once we loaded the revisions and the latest is in state ready, we can de-register from the cache listener
      if (revisions && Array.isArray(revisions) && revisions.length > 0 && revisions[0].status === 'READY') {
        this.removeRevisionsCacheListener();
      }
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load application revisions`, requestError);
      const errorNotification: IClgInlineNotification = {
        actionFn: this.loadRevisions,
        actionTitle: t('clg.page.application.error.loadingRevisions.action'),
        closeFn: this.closeRevisionsErrorNotification,
        kind: 'error',
        title: t('clg.page.application.error.loadingRevisions.title'),
      };
      this.setState({ revisions: undefined, errorLoadingRevisions: errorNotification, isLoadingRevisions: false });
    });
    cache.update(this.applicationCacheIdentifier, this.CACHE_NAME_REVISIONS);
  }

  private loadRoute() {
    const fn = 'loadRoute ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ errorLoadingRoute: null, isLoadingRoute: true });

    this.removeRouteCacheListener = cache.listen(this.CACHE_NAME_ROUTE, (route: appModel.IUIApplicationRoute) => {
      this.logger.debug(`${fn}- route: '${JSON.stringify(route)}'`);

      this.setState({ route, errorLoadingRoute: null, isLoadingRoute: false });
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load application route`, requestError);
      const errorNotification: IClgInlineNotification = {
        actionFn: this.loadRoute,
        actionTitle: t('clg.page.application.error.loadingRoute.action'),
        closeFn: this.closeRouteErrorNotification,
        kind: 'error',
        title: t('clg.page.application.error.loadingRoute.title'),
      };
      this.setState({ route: undefined, errorLoadingRoute: errorNotification, isLoadingRoute: false });
    });
    cache.update(this.applicationCacheIdentifier, this.CACHE_NAME_ROUTE);
  }

  private closeRevisionDetailPanel() {
    this.setState({ revisionToInspect: undefined });
  }

  private closeRevisionsErrorNotification() {
    this.setState({ errorLoadingRevisions: undefined });
  }

  private closeRouteErrorNotification() {
    this.setState({ errorLoadingRoute: undefined });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailTraffic.propTypes = {
  application: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      applicationId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      regionId: PropTypes.string.isRequired,
    }),
  }),
};

const withRouterApplicationDetailTraffic = withRouter(ApplicationDetailTraffic);
export { ApplicationDetailTraffic };
export default withRouterApplicationDetailTraffic;

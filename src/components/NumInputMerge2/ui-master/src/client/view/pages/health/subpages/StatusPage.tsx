import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { CheckmarkFilled16, ErrorFilled16, } from '@carbon/icons-react';
import { SkeletonText } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader, Message } from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';

import JSONPretty from 'react-json-pretty';

import * as commonModel from '../../../../../common/model/common-model';
import * as healthApi from '../../../../api/health-api';
import cache from '../../../../utils/cache';
import * as dateUtils from '../../../../utils/date';
import t from '../../../../utils/i18n';

interface IProps {
  history: any[];
}

interface IState {
  error: any;
  status?: any;
  appConfiguration?: any[];
  isLoadingAppConfiguration: boolean;
  isLoadingHealthStatus: boolean;
  isLoadingPluginVersion: boolean;
  pluginVersion: string;
}

class StatusPage extends React.Component<IProps, IState> {
  private removeStatusCacheListener: () => any;
  private removeConfigurationCacheListener: () => any;

  private readonly COMPONENT = 'StatusPage';
  private readonly CACHE_HEALTH_STATUS = 'coligo-health-status';
  private readonly CACHE_APP_CONFIGURATION = 'coligo-app-configuration';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.state = {
      error: undefined,
      isLoadingAppConfiguration: false,
      isLoadingHealthStatus: false,
      isLoadingPluginVersion: false,
      pluginVersion: undefined,
    };

    this.loadHealthStatus = this.loadHealthStatus.bind(this);
    this.loadAppConfiguration = this.loadAppConfiguration.bind(this);
    this.loadInstalledPluginVersion = this.loadInstalledPluginVersion.bind(this);
  }

  public componentDidMount() {
    this.loadHealthStatus();
    this.loadAppConfiguration();
    this.loadInstalledPluginVersion();
  }

  public componentWillUnmount() {
    // remove the cache listener in order to avoid background syncs with the backend
    this.removeStatusCacheListener();
    this.removeConfigurationCacheListener();
  }

  public render() {
    this.logger.debug('render');
    const subpageClassNames = 'page';

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
          <div className='bx--row health-status'>
            <div className='bx--col-lg-8'>
              <Card className=''>
                <CardHeader title={t('clg.page.health-status.status.subtitle')} />
                <CardBody>
                  {this.state.isLoadingHealthStatus &&
                    <div><span><SkeletonText paragraph={true} lineCount={5} /></span></div>
                  }
                  {!this.state.isLoadingHealthStatus && this.state.status &&
                    (
                    <div className='pal--card__labeled-rows'>
                      <p>{t('clg.page.health-status.troubleshooting.result.date')}</p>
                      <p>{dateUtils.format(this.state.status.time, getLocale(window.navigator.language), true)}</p>
                      <p>{t('clg.page.health-status.status.pluginVersion')}</p>
                      <p>{this.state.pluginVersion}</p>
                      <p>{t('clg.page.health-status.status.ldConfigVersion')}</p>
                      <p>{this.state.status.details.launchdarkly || 'N/A'}</p>
                      {this.listServices(this.state.status.services, this.state.status.details)}
                    </div>
                    )
                  }
                </CardBody>
              </Card>
            </div>
            <div className='bx--col-lg-8 health-configuration'>
              <Card className=''>
                <CardHeader title={t('clg.page.health-status.config.subtitle')} />
                <CardBody>
                  {this.state.isLoadingAppConfiguration &&
                    <div><span><SkeletonText paragraph={true} lineCount={6} /></span></div>
                  }
                  {!this.state.isLoadingAppConfiguration && this.state.appConfiguration &&
                    (
                    <div className='pal--card__labeled-rows'>
                      {this.listConfigProperties(this.state.appConfiguration)}
                    </div>
                    )
                  }
                </CardBody>
              </Card>
            </div>
          </div>
        </React.Fragment>
      </div>
    );
  }

  private listConfigProperties(appConfig) {
    const propsToRender = [];
    for (const propKey of Object.keys(appConfig)) {
      propsToRender.push(
        (
        <React.Fragment key={propKey}>
          <p>{propKey}</p>
          <div>{<JSONPretty id='json-pretty' data={appConfig[propKey]} />}</div>
        </React.Fragment>
        )
      );
    }
    return propsToRender;
  }

  private listServices(services, details) {
    const servicesToRender = [];
    for (const serviceId of Object.keys(services)) {
      servicesToRender.push(
        (
        <React.Fragment key={serviceId}>
          <p>{serviceId}</p>
          <div>{services[serviceId] === 'OK' ? <CheckmarkFilled16 className='fill-success' /> : <ErrorFilled16 className='fill-failed' />}{(serviceId !== 'launchdarkly' && details && details[serviceId]) ? ` - ${details[serviceId]}` : ''}</div>
        </React.Fragment>
        )
      );
    }
    return servicesToRender;
  }

  private loadHealthStatus(): void {
    const fn = 'loadHealthStatus ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ error: null, isLoadingHealthStatus: true });

    this.removeStatusCacheListener = cache.listen(this.CACHE_HEALTH_STATUS, (status: any[]) => {
      this.logger.debug(`${fn}- ${status ? status.length : 'NULL'} health status`);

      this.setState({ status, isLoadingHealthStatus: false });
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load health status`, requestError);
      // TODO show global error state
      this.setState({ status: undefined, error: requestError, isLoadingHealthStatus: false });
    });
    cache.update(null, this.CACHE_HEALTH_STATUS);
  }

  private loadAppConfiguration(): void {
    const fn = 'loadAppConfiguration ';
    this.logger.debug(`${fn}>`);

    // reset the error state
    this.setState({ error: null, isLoadingAppConfiguration: true });

    this.removeConfigurationCacheListener = cache.listen(this.CACHE_APP_CONFIGURATION, (appConfiguration: any[]) => {
      this.logger.debug(`${fn}- ${appConfiguration ? appConfiguration.length : 'NULL'} properties`);

      this.setState({ appConfiguration, isLoadingAppConfiguration: false });
      this.removeConfigurationCacheListener();
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load app configuration`, requestError);
      // TODO show global error state
      this.setState({ appConfiguration: undefined, error: requestError, isLoadingAppConfiguration: false });
    });
    cache.update(null, this.CACHE_APP_CONFIGURATION);
  }

  private loadInstalledPluginVersion() {
    const fn = 'loadInstalledPluginVersion ';
    this.logger.debug(`${fn}>`);

    this.setState({ isLoadingPluginVersion: true, pluginVersion: undefined });

    // retrieve the plugin version that is installed trough the ACE pipeline
    healthApi.doGetPluginVersion().then((pluginList: {[key: string]: string}) => {
      this.logger.debug(`${fn}- result: '${JSON.stringify(pluginList)}'`);

      // update the state of the page
      this.setState({ isLoadingPluginVersion: false, pluginVersion: pluginList.codeengine});
    }).catch((err) => {
      this.logger.warn(`${fn}- An error occurred while fetching all plugins: '${JSON.stringify(err)}'`);
    });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
StatusPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default withRouter(StatusPage);

import ToastManager from '@console/pal/Components/ToastManager';
import React from 'react';
import Loadable from 'react-loadable';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// 3rd-party
import * as logger from 'loglevel';

import flagsApi from '../../api/flags';
import { updateObjectWithKeyValue, updateObjectWithObject } from '../../utils/objects';
import ComponentLoading from '../../view/common/ComponentLoading';
import LeftNavContainer from '../../view/common/LeftNavContainer';
import Page from '../../view/common/Page';
import LandingPage from '../../view/pages/LandingPage';
import ClgLoggingManager from '../common/ClgLoggingManager';
import ClgOfferingAnnouncement from '../common/ClgOfferingAnnouncement';
import GlobalStateContext from '../common/GlobalStateContext';

const env = window.armada;
const config = env.config;

/**
 * This method is used to determine which page should be loaded
 * @param {*} loadDefault - the callback function that loads the page
 * @param {*} requiredFeatureFlag - an optional parameter that defines a feature-flag, that must evaluate to true to get this page loaded
 * @param {*} loadAlternative - an optional callback function that loads the alternate page in case the feature-flag evaluates to false. Default: 'view/pages/common/ErrorPage'
 */
const loadPage = (loadDefault: () => NodeRequire, requiredFeatureFlag?: string, loadAlternative?: () => NodeRequire): Promise<NodeRequire> => (
  new Promise((resolve) => {
    if (!requiredFeatureFlag) {
      // load the given page, without evaluating any flag
      logger.debug('App.loadPage - loading default');
      resolve(loadDefault());
    } else {
      // evaluate the feature flag
      flagsApi.getFlag(requiredFeatureFlag, (flag) => {
        if (flag && flag.value === true) {
          // feature flag evaluated to true
          logger.debug('App.loadPage - loading default - after feature-flag evaluation');
          resolve(loadDefault());
        } else {
          // feature flag evaluated to false
          if (loadAlternative && typeof loadAlternative === 'function') {
            logger.debug('App.loadPage - loading alternative');
            resolve(loadAlternative());
          } else {
            // load the default error page
            logger.debug('App.loadPage - loading error page');
            resolve(require('../pages/common/ErrorPage'));
          }
          resolve();
        }
      });
    }
  })
);

const OverviewPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/OverviewPage'))
  ),
  loading: ComponentLoading,
});

const CreateProjectPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/create/CreateProjectPage'))
  ),
  loading: ComponentLoading,
});

const CreateComponentPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/create/CreateComponentPage'))
  ),
  loading: ComponentLoading,
});

const CreateConfigPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/create/CreateConfigPage'), flagsApi.flags.FEATURE_ENVVAR_V2, () => require('../../view/pages/common/ColigoForbiddenPage'))
  ),
  loading: ComponentLoading,
});

const CliPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/CliPage'))
  ),
  loading: ComponentLoading,
});

const ProjectListPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/project-list/ProjectListPage'))
  ),
  loading: ComponentLoading,
});

const ProjectDetailsPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/project-details/ProjectDetailsPage'))
  ),
  loading: ComponentLoading,
});

const ApplicationDetailsPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/application-details/ApplicationDetailsPage'))
  ),
  loading: ComponentLoading,
});

const JobDefinitionDetailsPage = new Loadable({
  loader: () => (
      loadPage(() => require('../../view/pages/jobdef-details/JobDefinitionDetailsPage'))
  ),
  loading: ComponentLoading,
});

const JobRunDetailsPage = new Loadable({
  loader: () => (
      loadPage(() => require('../../view//pages/jobrun-details/JobRunDetailsPage'))
  ),
  loading: ComponentLoading,
});

const BuildDetailsPage = new Loadable({
  loader: () => (
      loadPage(() => require('../../view/pages/build-details/BuildDetailsPage'), flagsApi.flags.FEATURE_SOURCE_TO_IMAGE, () => require('../../view/pages/common/ColigoForbiddenPage'))
  ),
  loading: ComponentLoading,
});

const HealthStatusPage = new Loadable({
  loader: () => (
    loadPage(() => require('../../view/pages/health/HealthStatusPage'), flagsApi.flags.UI_DEVOPS, () => require('../../view/pages/common/ColigoForbiddenPage'))
  ),
  loading: ComponentLoading,
});

const AvailabilityStatusPage = new Loadable({
  loader: () => (
      loadPage(() => require('../../view/pages/AvailabilityStatusPage'))
  ),
  loading: ComponentLoading,
});

interface IState {
  currentPage: {
    title: string
  };
  liftedProjectLimitations?: boolean | undefined;
  onUpdateState: (key, value?) => any;
}

class App extends React.Component<{}, IState> {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: {
        title: 'App',
      },

      liftedProjectLimitations: undefined,

      onUpdateState: (/* Object|String */ key, /* String|Number? */ value) => {
        this.setState((state) => {
          if (value) {
            // use single-value update version
            updateObjectWithKeyValue(state, key, value);
          } else {
            // use object merge update version
            updateObjectWithObject(state, key);
          }

          return state;
        });
      },
    };
  }

  public render() {
    return (
      <BrowserRouter>
        <React.Fragment>
          <ClgLoggingManager />
          <GlobalStateContext.Provider value={this.state}>
            <ToastManager timeout={5000} />
            <ClgOfferingAnnouncement />
            <LeftNavContainer>
              <Page id={'coligoMain'} errors={true} confirmations={true} infos={true} messages={true}>
                {/* "Switch" defines that the router should only render the first route that could be matched. This is very helpful for ambigous routes (see: see create) */}
                <Switch>
                  <Route exact={true} path={`${config.proxyRoot}landing`} component={LandingPage} />
                  <Route exact={true} path={`${config.proxyRoot}overview`} component={OverviewPage} />
                  <Route exact={true} path={`${config.proxyRoot}cli`} component={CliPage} />
                  <Route exact={true} path={`${config.proxyRoot}health`} component={HealthStatusPage} />
                  <Route exact={true} path={`${config.proxyRoot}health/:subpage`} component={HealthStatusPage} />
                  <Route exact={true} path={`${config.proxyRoot}availability/view`} component={AvailabilityStatusPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/component`} component={CreateComponentPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/component/:type`} component={CreateComponentPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/config`} component={CreateConfigPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/config/:type`} component={CreateConfigPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/project`} component={CreateProjectPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/project/:regionId/:projectId/config`} component={CreateConfigPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/project/:regionId/:projectId/config/:type`} component={CreateConfigPage} />
                  <Route exact={true} path={`${config.proxyRoot}create/project/:regionId/:projectId/:type`} component={CreateComponentPage} />
                  <Route exact={true} path={`${config.proxyRoot}projects`} component={ProjectListPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId`} component={ProjectDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/application/:applicationId`} component={ApplicationDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/application/:applicationId/:subpage`} component={ApplicationDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/:subpage`} component={ProjectDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/jobdefinition/:jobDefinitionId`} component={JobDefinitionDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/jobdefinition/:jobDefinitionId/:subpage`} component={JobDefinitionDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/job/:jobRunId`} component={JobRunDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/build/:buildId`} component={BuildDetailsPage} />
                  <Route exact={true} path={`${config.proxyRoot}project/:regionId/:projectId/build/:buildId/:subpage`} component={BuildDetailsPage} />
                </Switch>
              </Page>
            </LeftNavContainer>
          </GlobalStateContext.Provider>
        </React.Fragment>
      </BrowserRouter>
    );
  }
}

export default App;

import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

import { Add16 } from '@carbon/icons-react';
import { Button, ButtonSkeleton, InlineNotification, Link, NotificationActionButton, Tag } from '@console/pal/carbon-components-react';

import * as commonModel from '../../../common/model/common-model';
import * as projectModel from '../../../common/model/project-model';
import app from '../../utils/app';
import cache from '../../utils/cache';
import context from '../../utils/context';
import t from '../../utils/i18n';
import img from '../../utils/img';
import nav from '../../utils/nav';
import GlobalStateContext from '../common/GlobalStateContext';
import ClgFeatureTile from '../components/ClgFeatureTile/ClgFeatureTile';
import ClgTeaser from '../components/ClgTeaser/ClgTeaser';

interface IProps {
  history: any[];
  location: {
    state: {},
  };
}
interface IState {
  userHasAtLeastOneProjects: boolean;
  isLoadingProjects: boolean;
}

class OverviewPage extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'OverviewPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly CACHE_KEY_PROJECTS = 'coligo-projects';

  private removeProjectsCacheListener: () => any;

  private readonly hideTutorials: boolean = true;

  constructor(props) {
    super(props);

    // init the state
    this.state = {
      isLoadingProjects: false,
      userHasAtLeastOneProjects: false,
    };

    // bind functions here and store them for later use as onClick handlers
    this.loadProjects = this.loadProjects.bind(this);
    this.navigateToCreateApplicationPage = this.navigateToCreateApplicationPage.bind(this);
    this.navigateToCreateJobDefinitionPage = this.navigateToCreateJobDefinitionPage.bind(this);
    this.navigateToCreateProjectPage = this.navigateToCreateProjectPage.bind(this);
    this.navigateToDocsExperimentalLimitsPage = this.navigateToDocsExperimentalLimitsPage.bind(this);
  }

  public componentDidMount() {
    app.arrivedOnPage('clg.pages.overview');

    if (context.isAuthenticated()) {
      // load the projects to see, whether we should create buttons for applications and jobs
      this.loadProjects();
    }
  }

  public navigateToCreateProjectPage() {
    this.props.history.push(nav.toCreateProject());
  }

  public navigateToCreateApplicationPage() {
    this.props.history.push(nav.toCreateApplication());
  }

  public navigateToCreateJobDefinitionPage() {
    this.props.history.push(nav.toCreateJobDefinition());
  }

  public navigateToDocsExperimentalLimitsPage() {
    this.props.history.push(nav.getDocsLink('limits-experimental'));
  }

  public componentWillUnmount() {
    this.removeProjectsCacheListener();
  }

  public render() {
    return (
      <div className='page overview-page clg-overview-page'>
        <div className='page-content'>
          <div className='clg-experimental-banner'>
            <InlineNotification
                kind='warning'
                statusIconDescription={t('clg.banner.experimental.title')}
                lowContrast={true}
                title={t('clg.banner.experimental.title')}
                subtitle={(<span>{t('clg.banner.experimental.subtitle')}</span>)}
                hideCloseButton={true}
                actions={
                  (
                    <NotificationActionButton
                      href={nav.getDocsLink('limits-experimental')}
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      {t('clg.banner.experimental.more')}
                    </NotificationActionButton>
                  )
                }
            />
          </div>
          <div className='bx--grid bx--grid--bleed hero-teaser'>
            <div className='bx--row'>
              <div className='bx--col-lg-6 bx--col-md-8 hero-teaser__text'>
                <h2 className='productive-heading-04 hero-teaser__text-title'>
                  {t('clg.page.overview.title')}
                </h2>
                <div className='productive-heading-03 hero-teaser__text-subtitle'>{t('clg.page.overview.subtitle')}</div>
              </div>
              <div className='bx--offset-lg-1 bx--col-lg-9 bx--col-md-0 hero-teaser__image'>
                <img src={img.get('clg-hero')} alt={t('clg.page.overview.title')}/>
              </div>
            </div>
          </div>
          <div className='overview-content coligo-concepts'>
            <div className='bx--grid'>
              <div>
                {/** Explore our capabilities SECTION */}
                <div className='bx--row overview-section'>
                  <div className='bx--col-lg-3 bx--col-md-8 bx--col-xs-4 section--headline'>
                    <h3 className='productive-heading-03 section--headline__heading'>{t('clg.page.overview.section.getstarted.title')}</h3>
                  </div>
                  <div className='bx--col-xl-3 bx--col-lg-3 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-concepts_projects')} alt='coligo projects' />} title={t('clg.page.overview.section.concepts.teaser.projects.title')} description={t('clg.page.overview.section.concepts.teaser.projects.desc')} />
                  </div>
                  <div className='bx--col-xl-3 bx--col-lg-3 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-concepts_apps')} alt='coligo application components' />} title={t('clg.page.overview.section.concepts.teaser.apps.title')} description={t('clg.page.overview.section.concepts.teaser.apps.desc')} />
                  </div>
                  <div className='bx--col-xl-3 bx--col-lg-3 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-concepts_jobdefs')} alt='coligo job definition components' />} title={t('clg.page.overview.section.concepts.teaser.jobdefs.title')} description={t('clg.page.overview.section.concepts.teaser.jobdefs.desc')} />
                  </div>
                  <div className='bx--col-xl-3 bx--col-lg-3 bx--col-md-4 section--content'>
                    {this.state.isLoadingProjects &&
                      (
                      <React.Fragment>
                        <ButtonSkeleton size='small'/>
                        <ButtonSkeleton size='small' />
                      </React.Fragment>
                      )
                    }
                    {!this.state.isLoadingProjects &&
                    (
                      <React.Fragment>
                        {this.state.userHasAtLeastOneProjects ? (
                          <React.Fragment>
                            <div className='project-teaser'>
                              <Button id={'create-project'} kind='primary' renderIcon={Add16} onClick={this.navigateToCreateProjectPage}>{t('clg.page.overview.section.concepts.teaser.projects.action')}</Button>
                            </div>
                            <div className='apps-teaser'>
                              <Button id={'create-application'} kind='tertiary' renderIcon={Add16} onClick={this.navigateToCreateApplicationPage}>{t('clg.page.overview.section.concepts.teaser.apps.action')}</Button>
                            </div>
                            <div className='jobs-teaser'>
                              <Button id={'create-jobdefinition'} kind='tertiary' renderIcon={Add16} onClick={this.navigateToCreateJobDefinitionPage}>{t('clg.page.overview.section.concepts.teaser.jobdefs.action')}</Button>
                            </div>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <Button id={'create-project'} kind='primary' renderIcon={Add16} onClick={this.navigateToCreateProjectPage}>{t('clg.page.overview.action.create')}</Button>
                            <Link id={'view-tutorials'} href={nav.getDocsLink('get-started')} className='bx--btn bx--btn--tertiary' target='_blank' rel='noopener noreferrer'>{t('clg.page.overview.action.learn')}</Link>
                          </React.Fragment>
                        )}
                      </React.Fragment>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='overview-content explore-capabilties'>
            <div className='bx--grid'>
            <div>
                {/** Explore our capabilities SECTION */}
                <div className='bx--row overview-section'>
                  <div className='bx--col-lg-3 bx--col-md-8 bx--col-xs-4 section--headline'>
                    <h3 className='productive-heading-03 section--headline__heading'>{t('clg.page.overview.section.explore.title')}</h3>
                  </div>
                  <div className='bx--col-lg-6 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-capabilities_timetomarket')} alt='timetomarket' />} title={t('clg.page.overview.section.explore.teaser.timetomarket.title')} description={t('clg.page.overview.section.explore.teaser.timetomarket.desc')} />
                  </div>
                  <div className='bx--col-lg-6 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-capabilities_serverless')} alt='serverless' />} title={t('clg.page.overview.section.explore.teaser.serverless.title')} description={t('clg.page.overview.section.explore.teaser.serverless.desc')} />
                  </div>
                  <div className='bx--offset-lg-3 bx--col-lg-6 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-capabilities_batch')} alt='batch' />} title={t('clg.page.overview.section.explore.teaser.batch.title')} description={t('clg.page.overview.section.explore.teaser.batch.desc')} />
                  </div>
                  <div className='bx--col-lg-6 bx--col-md-4 section--content'>
                    <ClgTeaser icon={<img src={img.get('clg-capabilities_kubernetes')} alt='kubernetes' />} title={t('clg.page.overview.section.explore.teaser.kubernetes.title')} description={t('clg.page.overview.section.explore.teaser.kubernetes.desc')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!this.hideTutorials &&
          (
            <div className='overview-content tutorials'>
              <div className='bx--grid'>
              <div>
                  {/** Tutorials SECTION */}
                  <div className='bx--row overview-section'>
                    <div className='bx--col-lg-3 bx--col-md-8 bx--col-xs-4 section--headline'>
                      <h3 className='productive-heading-03 section--headline__heading'>{t('clg.page.overview.section.tutorials.title')}</h3>
                    </div>
                    <div className='bx--col-lg-6 bx--col-md-4 section--content'>
                      <ClgFeatureTile
                        id={'view-tutorials'}
                        image={<img src={img.get('clg-tutorials_objectdetection')} alt='tutorial object detection' />}
                        title={t('clg.page.overview.section.tutorials.feature.objectdetection.title')}
                        description={t('clg.page.overview.section.tutorials.feature.objectdetection.desc')}
                        moreLink={nav.getDocsLink('tutorials')}
                      />
                    </div>
                    <div className='bx--col-lg-6 bx--col-md-4 section--content'>
                      <ClgFeatureTile
                        image={<img src={img.get('clg-tutorials_more')} alt='more' />}
                        title={t('clg.page.overview.section.tutorials.feature.staytuned.title')}
                        description={t('clg.page.overview.section.tutorials.feature.staytuned.desc')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  private loadProjects(): void {
    const fn = 'loadProjects ';
    this.logger.debug(`${fn}>`);

    // de-register the cache listener, otherwise we would end up in having another one
    if (this.removeProjectsCacheListener) {
      this.removeProjectsCacheListener();
    }

    // reset the error state
    this.setState({ isLoadingProjects: true });

    this.removeProjectsCacheListener = cache.listen(this.CACHE_KEY_PROJECTS, (projects: projectModel.IUIProject[]) => {
      this.logger.debug(`${fn}- ${projects ? projects.length : 'NULL'} projects`);

      // if the user has at least one project, we will unlock create buttons for applications and job definitions
      let userHasAtLeastOneProjects = false;
      if (projects && projects.length > 0) {
        userHasAtLeastOneProjects = true;
      }

      this.setState({ userHasAtLeastOneProjects, isLoadingProjects: false });

      // unregister the cache listener
      this.removeProjectsCacheListener();
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load projects - ${commonModel.stringifyUIRequestError(requestError)}`);
      this.setState({ isLoadingProjects: false });

      // unregister the cache listener
      this.removeProjectsCacheListener();
    });
    cache.update(null, this.CACHE_KEY_PROJECTS);
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
OverviewPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  location: PropTypes.object,
};

OverviewPage.contextType = GlobalStateContext;

export default OverviewPage;

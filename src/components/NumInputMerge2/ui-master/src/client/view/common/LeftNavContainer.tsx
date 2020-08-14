import PropTypes from 'prop-types';
import React, { ReactElement } from 'react';
import {hot} from 'react-hot-loader/root';
import {Link, withRouter} from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Launch16 } from '@carbon/icons-react';
import WorldLevelNav from '@console/pal/Components/WorldLevelNav';

import flags from '../../api/flags';
import t from '../../utils/i18n';
import img from '../../utils/img';
import nav from '../../utils/nav';

interface IProps {
  navItems: any[];
  location: {
    pathname: string,
  };
  children: any[];
}

interface IState {
  navItems: any[];
  open: boolean;
  page: any;
}

class LeftNavContainer extends React.Component<IProps, IState> {
  public readonly initIsLoading;
  public isNavItemActive;
  public onToggle;
  public getPage;
  public getNavItemProps;
  public initNav;
  public filterNavItemBasedOnFeatureFlags;
  public checkForFeatureFlag;
  public filterAsync;
  public keyAsId;

  private readonly COMPONENT = 'LeftNavContainer';
  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.logger.debug('constructor');

    this.onToggle = this._onToggle.bind(this);
    this.getPage = this._getPage.bind(this);
    this.getNavItemProps = this._getNavItemProps.bind(this);
    this.isNavItemActive = this._isNavItemActive.bind(this);
    this.initNav = this._initNav.bind(this);
    this.filterNavItemBasedOnFeatureFlags = this._filterNavItemBasedOnFeatureFlags.bind(this);
    this.checkForFeatureFlag = this._checkForFeatureFlag.bind(this);
    this.filterAsync = this._filterAsync.bind(this);
    this.keyAsId = this._keyAsId.bind(this);

    // this internal flag is used to optimize loading behavior.
    // Due to several changes in upstream components, the left nav is updated frequently
    this.initIsLoading = {};

    this.state = {
      navItems: props.navItems || [], // we need this props.navItems assignment for test cases
      open: true,
      page: this.getPage(), // calculate the current page
    };

  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug(`${fn}`);

    // init the nav, if the page is set
    const currentPage = this.state.page;
    if (currentPage) {
      return this.initNav(currentPage);
    }
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.debug(`${fn}- this.state.page: '${this.state.page}', newPath: '${newProps && newProps.location && newProps.location.pathname}'`);

    if (!newProps || !newProps.location || !newProps.location.pathname) {
      return;
    }

    // check whether the page has changed
    const currentPage = this.getPage(newProps);
    if (currentPage && this.state.page !== currentPage) {
      return this.initNav(currentPage);
    }
  }

  public retrieveNavItems(currentPage) {
    return new Promise((resolve) => {
      let navItems;

      // we need to set an empty nav for detail pages
      if (currentPage.indexOf('project/') !== -1) {
        navItems = [];
      } else if (currentPage.indexOf('create') !== -1) {
        navItems = [];
      } else if (currentPage.indexOf('health') !== -1) {
        navItems = [];
      } else if (currentPage.indexOf('availability') !== -1) {
        navItems = [];
      } else {
        navItems = [
          {
            id: 'nav-item-projects',
            label: t('clg.nav.projects'),
            to: `${nav.toProjectList()}`,
          },
          {
            id: 'nav-item-cli',
            label: t('clg.nav.cli'),
            to: `${nav.toCli()}`,
          },
          {
            href: nav.getDocsLink('home'),
            id: 'nav-item-documentation',
            label: <>{t('clg.nav.documentation')} <Launch16 className='clg-filled-navlink' /></>,
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        ];
      }

      // filter the items for feature flags
      this.filterAsync(navItems, this.filterNavItemBasedOnFeatureFlags)
        .then((filteredNavItems) => resolve(filteredNavItems))
        .catch((e) => this.logger.error(e));
    });
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}> page '${this.state.page}'`);

    if (!this.state.page || !this.state.navItems || this.state.navItems.length === 0) {
      this.logger.debug(`${fn}- no page set`);
      return <React.Fragment><div>{this.props.children}</div></React.Fragment>;
    }

    const extraLeftNavClasses = '';
    const childrenProps = {
      className: '',
    };

    // this class must only be set in case of rendering the default navigation
    if (this.state.open) {
      childrenProps.className += ' has-side-nav';
    } else {
      childrenProps.className += ' custom-left-nav-collapsed';
    }

    const offeringLogo = (<React.Fragment><img className='clg-nav__header__icon' src={img.get('Coligo-icon-24__white')} alt={`${t('offering.title')} logo`} /></React.Fragment>);

    return (
      <React.Fragment>
        <WorldLevelNav
          locale={window.armada.lng}
          icon={offeringLogo}
          title={t('offering.title')}
          titleHref={nav.toGettingStartedOverview()}
          linkComponent={Link}
          items={this.state.navItems}
          className={extraLeftNavClasses}
        />
        <div {...childrenProps}>{this.props.children}</div>
      </React.Fragment>
    );
  }

  /**
   * This event handler toogles the left nav
   * @param {*} open - the state of the nav (either open, or closed)
   */
  private _onToggle(open) {
    const fn = '_onToggle ';
    this.logger.debug(`${fn}`);
    this.setState({ open });
  }

  private _getPage(props?) {
    return (props || this.props).location.pathname.replace(/\/$/, '').replace(/^\/[^\/]+\//, '');
  }

  private _getNavItemProps(href, isExternalLink, id) {
    return {
      className: this.isNavItemActive(href) && !isExternalLink ? 'left-nav-list__item--active' : '',
      href
    };
  }

  private _initNav(currentPage) {
    const fn = '_initNav ';
    this.logger.debug(`${fn}> page: '${currentPage}'`);
    return new Promise((resolve, reject) => {
      if (this.initIsLoading[currentPage] === true) {
        this.logger.debug(`${fn}< page: '${currentPage}' - aborted!`);
        return;
      }
      this.initIsLoading[currentPage] = true;

      // retrieve the navigation items that should be rendered
      this.retrieveNavItems(currentPage).then((navItems: any[]) => {
        this.setState({ page: currentPage, navItems });
        this.initIsLoading[currentPage] = false;
        this.logger.debug(`${fn}< page: '${currentPage}' - done!`);
        resolve();
      }).catch((err) => {
        this.initIsLoading[currentPage] = false;
        this.logger.error(`${fn}- failed to load nav items for page '${currentPage}'`, err);
        this.logger.debug(`${fn}< page: '${currentPage}' - error!`);
        reject(err);
      });
    });
  }

  private _checkForFeatureFlag(navItem) {
    const fn = '_checkForFeatureFlag ';
    return new Promise((resolve) => {
      if (!navItem.featureflag || navItem.featureflag === '') {
        resolve(true);
        return;
      }
      flags.getFlag(navItem.featureflag, (flag) => {
        this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
        if (flag && flag.value === true) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  private _filterNavItemBasedOnFeatureFlags(navItem) {
    return this.checkForFeatureFlag(navItem).then((result) => result);
  }

  private _filterAsync(array, filter) {
    return Promise.all(array.map((entry) => filter(entry)))
      .then((bits) => array.filter(() => bits.shift()));
  }

  private _isNavItemActive(href) {
    const activeHref = this.props.location.pathname;
    const hrefToCompare = href.startsWith('/') ? href : `/${href}`;
    return activeHref.endsWith(hrefToCompare);
  }

  private _keyAsId(key) {
    this.logger.trace(`_keyAsId > key: '${key}'`);
    const result = (key || '').replace(/\./g, '-');
    this.logger.trace(`_keyAsId < '${result}' `);
    return result;
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
LeftNavContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  location: PropTypes.object,
  navItems: PropTypes.array,
};

const withRouterLeftNavContainer = withRouter(LeftNavContainer);
export { LeftNavContainer };
export default hot(withRouterLeftNavContainer);

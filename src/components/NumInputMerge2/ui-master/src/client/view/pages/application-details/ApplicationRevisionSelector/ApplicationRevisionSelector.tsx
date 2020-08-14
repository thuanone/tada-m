// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Dropdown, DropdownSkeleton, InlineNotification, NotificationActionButton, } from '@console/pal/carbon-components-react';

import * as appModel from '../../../../../common/model/application-model';
import * as commonModel from '../../../../../common/model/common-model';
import cache from '../../../../utils/cache';
import t from '../../../../utils/i18n';
import { IClgInlineNotification } from '../../../model/common-view-model';

interface IProps {
  application: appModel.IUIApplication;
  handleChange: (event) => any;
  revision: appModel.IUIApplicationRevision;
}

interface IState {
  error?: IClgInlineNotification;
  isLoadingRevisions: boolean;
  revisionLoadingAttempts: number;
  revisions: appModel.IUIApplicationRevision[];
  selectedRevisionName: string;
}

class ApplicationRevisionSelector extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationRevisionSelector';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly CACHE_NAME = 'coligo-application-revisions';
  private readonly applicationId: string;
  private readonly loadRevisions: () => void;
  private removeCacheListener: () => any;
  private readonly closeNotification: () => void;

  constructor(props: IProps) {
    super(props);
    this.logger.debug('constructor');

    this.applicationId = `region/${props.application.regionId}/project/${props.application.projectId}/application/${props.application.name}`;

    this.state = {
      isLoadingRevisions: true,
      revisionLoadingAttempts: undefined,
      revisions: undefined,
      selectedRevisionName: this.getRevisionNameFromProps(props),
    };

    // use the bind to enable setState within this function
    this.loadRevisions = this._loadRevisions.bind(this);
    this.closeNotification = this._closeNotification.bind(this);
    this.itemToString = this.itemToString.bind(this);
  }

  public componentDidMount() {
    this.logger.debug('componentDidMount');

    // load all revisions
    this.loadRevisions();
  }

  public componentWillUnmount() {
    this.removeCacheListener();
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.debug(`${fn}`);
    const propsRevName = this.getRevisionNameFromProps(newProps);
    if (propsRevName !== this.state.selectedRevisionName) {
      this.logger.debug(`${fn}- state update necessary -> new revision name: ${propsRevName}, old revisionName: '${this.state.selectedRevisionName}'`);

      let loadedRevisions = this.state.revisions;

      // check whether the list of revisions must be updated
      if (!this.getRevisionFromList(this.state.revisions, propsRevName)) {
        this.loadRevisions();
        loadedRevisions = undefined;
      }

      this.setState({ selectedRevisionName: propsRevName, revisions: loadedRevisions });
    }
  }

  public render() {
    this.logger.debug(`render - revisions: ${appModel.stringifyList(this.state.revisions)}`);
    if (!this.state.revisions && !this.state.error) { return <div className='application-revision-loading'><DropdownSkeleton /></div>; }
    if (this.state.error) {
      return (
        <InlineNotification
          kind={this.state.error.kind}
          lowContrast={true}
          title={this.state.error.title}
          subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
          onCloseButtonClick={this.closeNotification}
          actions={this.state.error.actionFn &&
            (
              <NotificationActionButton
                onClick={this.state.error.actionFn}
              >
                {this.state.error.actionTitle}
              </NotificationActionButton>
            )
          }
        />
      );
    }

    const selectedRevision = this.getRevisionFromList(this.state.revisions, this.state.selectedRevisionName);

    return (
      <div className='application-revision-selector'>
        <Dropdown
          id={'application-revision_selector'}
          type={'default'}
          titleText={t('clg.application.currentRevision')}
          label={t('clg.application.currentRevision')}
          items={this.state.revisions}
          itemToString={this.itemToString}
          light={true}
          onChange={this.props.handleChange}
          selectedItem={selectedRevision}
        />
      </div>
    );
  }

  private getRevisionNameFromProps(props) {
    return (props.revision && props.revision.name) || (props.application && props.application.latestCreatedRevisionName);
  }

  private getRevisionFromList(revisions: appModel.IUIApplicationRevision[], revName: string) {
    if (revisions && Array.isArray(revisions) && revisions[0]) {
      for (const rev of revisions) {
        if (revName === rev.name) {
          return rev;
        }
      }
      return revisions && Array.isArray(revisions) && revisions[0];
    }
    return undefined;
  }

  private itemToString(item: appModel.IUIApplicationRevision) {
    return item && item.name;
  }

  private _loadRevisions() {
    const fn = '_loadRevisions ';
    let loadingAttempts = 3;  // maximum number of revision loading attempts
    this.logger.debug(`${fn}>`);

    if (typeof this.state.revisionLoadingAttempts === 'number') {
        loadingAttempts = this.state.revisionLoadingAttempts - 1;
    }

    // reset the error state
    this.setState({ error: null, isLoadingRevisions: true, revisionLoadingAttempts: loadingAttempts });

    if (this.removeCacheListener) {
      this.removeCacheListener();
    }

    this.removeCacheListener = cache.listen(this.CACHE_NAME, (revisions: appModel.IUIApplicationRevision[]) => {
      let success = false;
      let found = false;
      const selectedRevisionName = this.state.selectedRevisionName;

      this.logger.debug(`${fn}- revisions: '${appModel.stringifyList(revisions)}'`);

      if (selectedRevisionName && selectedRevisionName.length > 0) {
        this.logger.debug(`${fn}- Checking for revision with name '${selectedRevisionName}'`);
        // check whether the revision we are looking for in terms of selection is part of the revisions list
        for (const revision of revisions) {
          if (revision.name === selectedRevisionName) {
            found = true;
            break;
          }
        }

        // if not, try again (at most 3 times) by calling _loadRevisions again
        if (!found && (this.state.revisionLoadingAttempts > 0)) {
          this.logger.debug(`${fn}- Could not find revisionName ${selectedRevisionName} in the list of loaded Revisions. Trying again...`);
          setImmediate(this._loadRevisions.bind(this));
        } else {
          // give up and keep the UI working (yet knowingly without the revision we wanted to select)
          success = true;
        }
      } else {
        success = true;  // no selectedRevisionName set, so we always have a successful result
      }

      if (success) {
        this.setState({ revisions, error: null, isLoadingRevisions: false, revisionLoadingAttempts: undefined });

        // once we loaded the application revisions, we can de-register from the cache listener
        this.removeCacheListener();
      }
    }, (requestError: commonModel.UIRequestError) => {
      this.logger.error(`${fn}- failed to load application revisions - ${commonModel.stringifyUIRequestError(requestError)}`);
      const errorNotification: IClgInlineNotification = {
        actionFn: this.loadRevisions,
        actionTitle: t('clg.page.application.error.loadingRevisions.action'),
        kind: 'error',
        title: t('clg.page.application.error.loadingRevisions.title'),
      };
      this.setState({ revisions: undefined, error: errorNotification, isLoadingRevisions: false });
    });
    cache.update(this.applicationId, this.CACHE_NAME);
  }

  private _closeNotification() {
    this.setState({ error: undefined });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationRevisionSelector.propTypes = {
  application: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  revision: PropTypes.object.isRequired,
};

export default ApplicationRevisionSelector;

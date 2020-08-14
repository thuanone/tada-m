import React from 'react';

// 3rd-party
import * as log from 'loglevel';

import flagsApi from '../../api/flags';
import t from '../../utils/i18n';
import toastNotification from '../../utils/toastNotification';

class ClgOfferingAnnouncement extends React.Component<{}, {}> {
  private readonly COMPONENT = 'ClgOfferingAnnouncement';
  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  public componentDidMount() {
    this.showOfferingAnnouncement();
  }

  public render() {
    return <React.Fragment />;
  }

  private showOfferingAnnouncement() {
    const fn = 'showOfferingAnnouncement ';
    this.logger.debug(`${fn}>`);

    // check whether the feature is enabled
    flagsApi.getFlag(flagsApi.flags.OFFERING_ANNOUNCEMENT, (flag) => {
      // check whether the toast notification should be rendered
      if (!flag || !flag.value) {
        this.logger.debug(`${fn}< false`);
        return;
      }

      // evaluate the kind of the notification
      let kind = t('offering.announcement.kind');
      if (['info', 'warning', 'error', 'success'].indexOf(kind) === -1) {
        kind = 'info'; // use info as a default
      }

      // craft the notification message
      const description = t('offering.announcement.description');
      const link = t('offering.announcement.link');
      let message: string | any = description;
      if (link && link !== '') {
        message = <span>{description} <a href={link} rel='noopener noreferrer' target='_blank'>{t('offering.announcement.linktext')}</a></span>;
      }

      // render the toast notification
      toastNotification.add({
        'analytics-category': 'Offering',
        'analytics-name': 'Announcement',
        'kind': t('offering.announcement.kind'),
        'subtitle': message,
        'timeout': 0,
        'title': t('offering.announcement.title'),
      });

      this.logger.debug(`${fn}< true`);
    });
  }
}

// @ts-ignore
ClgOfferingAnnouncement.propTypes = {};

export default ClgOfferingAnnouncement;

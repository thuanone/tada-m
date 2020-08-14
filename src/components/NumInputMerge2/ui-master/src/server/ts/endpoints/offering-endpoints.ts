import * as commonModel from '../../../common/model/common-model';
import * as launchdarkly from '../services/launchdarkly-service';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'offering';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

interface IAnnouncement {
    title: string;
    description: string;
    kind: string;
}

export function listAnnouncements(req, res): void {
    const fn = 'listAnnouncements ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const announcements = [];

    launchdarkly.getFlag(req, 'coligo-ui-offering-announcement', (value) => {

        // check whether the feature flag evaluated true
        if (value === true) {

            // load the default bundle
            const defaultBundleContent = req.i18n.getResourceBundle('en');

            announcements.push({
                description: defaultBundleContent['offering.announcement.description'],
                kind: defaultBundleContent['offering.announcement.kind'],
                link: defaultBundleContent['offering.announcement.link'],
                title: defaultBundleContent['offering.announcement.title'],
            } as IAnnouncement);
        }

        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, announcements);
        logger.debug(ctx, `${fn}< 200 - ${announcements.length} announcements - duration: ${result.duration}ms`);
        res.status(200).send(result);
      });
}

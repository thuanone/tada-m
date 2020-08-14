import * as express from 'express';
import * as offering from '../endpoints/offering-endpoints';
import { setClgContext } from '../utils/request-context-utils';

const router = express.Router();
const basePath = '/v1';

/* **** --------------- **** */
/* **** Announcements   **** */
/* **** =============== **** */
router.get(`${basePath}/announcements`, setClgContext('offering::list-announcements'), offering.listAnnouncements);

module.exports = router;

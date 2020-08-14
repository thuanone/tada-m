// Router definitions for api calls to knative
import * as express from 'express';
import * as health from '../endpoints/health-endpoints';
import { verifyCsrfToken } from '../utils/csrf-utils';
import { setClgContext } from '../utils/request-context-utils';
import {
  getClientLogsValidationRules,
  validate,
} from '../utils/validation-utils';

const router = express.Router();
const basePath = '/v1';

/* **** --------------- **** */
/* **** Status           **** */
/* **** =============== **** */
router.get(`${basePath}/status`, setClgContext('health::get-monitoring-status'), health.getMonitoringStatus);

/* **** --------------- **** */
/* **** LOGS            **** */
/* **** =============== **** */
router.post(`${basePath}/logger`, setClgContext('health::receive-client-logs'), verifyCsrfToken, getClientLogsValidationRules(), validate, health.receiveClientLogs);

module.exports = router;

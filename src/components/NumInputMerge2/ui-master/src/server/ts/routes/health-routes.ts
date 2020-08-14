// Router definitions for api calls to knative
import * as express from 'express';
import * as health from '../endpoints/health-endpoints';
import { verifyCsrfToken } from '../utils/csrf-utils';
import { setClgContext } from '../utils/request-context-utils';

const router = express.Router();
const basePath = '/v1';

/* **** --------------- **** */
/* **** PERFORMANCE     **** */
/* **** =============== **** */
router.get(`${basePath}/performance/monitors`, setClgContext('health::get-performance-monitors'), health.getPerformanceMonitors);

/* **** --------------- **** */
/* **** CACHE           **** */
/* **** =============== **** */
router.get(`${basePath}/cache/stats`, setClgContext('health::get-cache-stats'), health.getCacheStats);

/* **** --------------- **** */
/* **** STATUS          **** */
/* **** =============== **** */
router.get(`${basePath}/status`, setClgContext('health::get-health-status'), health.getHealthStatus);

/* **** --------------- **** */
/* **** CONFIG          **** */
/* **** =============== **** */
router.get(`${basePath}/configuration`, setClgContext('health::get-app-configuration'), health.getAppConfiguration);

/* **** --------------- **** */
/* **** ANALYZE         **** */
/* **** =============== **** */
router.get(`${basePath}/context/:clgId`, setClgContext('health::get-coligo-context'), health.getColigoContext);

module.exports = router;

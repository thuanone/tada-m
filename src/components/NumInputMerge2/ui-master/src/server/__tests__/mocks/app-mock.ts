
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

import * as nconf from './lib/nconf';

// tslint:disable-next-line: no-var-requires
const apiRouter = require('../../ts/routes/api-routes');

const PORT = 3010;

const app = express();

// parse cookies
// we need this because "cookie" is true in csrfProtection
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Setup /api routes
app.use(`${nconf.get('contextRoot')}api/core`, apiRouter);

const appServer = app.listen(PORT, () => console.log(`Listening at port ${PORT}`));

module.exports = appServer;

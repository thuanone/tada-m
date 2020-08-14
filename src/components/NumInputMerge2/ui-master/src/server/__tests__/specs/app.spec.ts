// tslint:disable:no-string-literal
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as aceUtils from '../mocks/lib/bluemix-utils';
import * as expressSetup from '../mocks/lib/console-platform-express-setup';
import * as loggerUtil from '../mocks/lib/console-platform-log4js-utils';
import * as express from '../mocks/lib/express';
import expressRequest from '../mocks/lib/express-request';
import expressResponse from '../mocks/lib/express-response';
import * as fsExtra from '../mocks/lib/fs-extra';
import * as launchdarkly from '../mocks/lib/launchdarkly';
import * as nconf from '../mocks/lib/nconf';
import * as statics from '../mocks/lib/statics';
import * as auth from '../mocks/routes/auth';
import * as flags from '../mocks/routes/flags';
import * as knative from '../mocks/routes/knative';
import * as utils from '../mocks/routes/utils';
import * as viewUtils from '../mocks/routes/view/utils';
import * as monitoringUtilsMock from '../mocks/utils/monitoring-utils';
const config = nconf.get();

describe('app', () => {
  let expressSpy;
  let expressSetupSpy;

  const loadApp = () => {
    proxyquire('../../ts/app', {
      './endpoints/auth-endpoints': auth,
      './endpoints/flags-endpoints': flags,
      './endpoints/i18n-endpoints': proxyquire('../../ts/endpoints/i18n-endpoints', {
        '../utils/middleware-utils': proxyquire('../../ts/utils/middleware-utils', {
          './monitoring-utils': monitoringUtilsMock,
        }),
      }),
      './endpoints/knative-endpoints': knative,
      './lib/launchdarkly': launchdarkly,
      './utils/routes-utils': utils,
      './utils/statics-utils': statics,
      './utils/view-utils': viewUtils,
      '@console/console-platform-bluemix-utils': aceUtils,
      '@console/console-platform-express-setup': expressSetup,
      '@console/console-platform-log4js-utils': loggerUtil,
      '@console/console-platform-nconf': nconf,
      'express': expressSpy,
      'fs-extra': fsExtra,
    });
  };

  beforeEach(() => {
    expressSpy = jasmine.createSpy().and.returnValue(express);
    spyOn(process, 'on');
  });

  it('init', () => {
    expressSetupSpy = spyOn(expressSetup, 'setup');
    expressSetupSpy.and.callThrough();
    spyOn(loggerUtil, 'configure');
    spyOn(loggerUtil, 'getLogger').and.callThrough();
    spyOn(express, 'get');
    spyOn(express, 'use');
    loadApp();
    expect(loggerUtil.configure).toHaveBeenCalled();
    expect(loggerUtil.getLogger).toHaveBeenCalledWith('clg-ui');
    expect(expressSetup.setup).toHaveBeenCalledWith(
      express, jasmine.objectContaining({ baseDir: jasmine.any(String) }));
    expect(expressSpy).toHaveBeenCalledTimes(1);
    expect(express.get).toHaveBeenCalled();
    expect(express.use).toHaveBeenCalled();
    expect(process.on).toHaveBeenCalled();
    const errorHandler = process.on['calls'].argsFor(0);
    expect(errorHandler[0]).toBe('uncaughtException');
    spyOn(process, 'exit');
    errorHandler[1]();
    expect(process.exit).toHaveBeenCalled();
  });

  it('verifies logged in user', () => {
    spyOn(express, 'get');
    loadApp();
    const verifyAuth = express.get['calls'].argsFor(1)[3];
    let req = expressRequest();
    let res = expressResponse();
    let next = jasmine.createSpy();
    spyOn(res, 'sendStatus');
    verifyAuth(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

    // req.user should be null here, but req.headers should be set
    req = expressRequest();
    const headers = { authorization: 'bearer token' };
    req.setHeaders(headers);
    res = expressResponse();
    next = jasmine.createSpy();
    verifyAuth(req, res, next);
    expect(next).toHaveBeenCalled();

    req = expressRequest();
    req.setUser({});
    res = expressResponse();
    next = jasmine.createSpy();
    verifyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('provides auth info', () => {
    spyOn(express, 'get');
    loadApp();

    const getIndex = 2;

    expect(express.get['calls'].argsFor(getIndex)[0]).toEqual(`${nconf.get('contextRoot')}api/authinfo`);
    const authInfo = express.get['calls'].argsFor(getIndex)[2];
    const req = expressRequest();
    const res = expressResponse();
    req['session'] = {
      passport: {
        user: {
          iamToken: 'iam-token',
          refreshToken: 'refresh-token',
        },
      },
    };
    spyOn(res, 'send');
    authInfo(req, res);
    expect(res.send).toHaveBeenCalledWith(jasmine.stringMatching(/.*iamToken.*/));
  });

  it('redirects from context root', () => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(express, 'get');
    spyOn(res, 'redirect');
    loadApp();

    const getIndex = 3;

    expect(express.get['calls'].argsFor(getIndex)[0]).toEqual(`${nconf.get('contextRoot')}`);

    const rootRedirect = express.get['calls'].argsFor(getIndex)[1];
    rootRedirect(req, res);
    expect(res.redirect).toHaveBeenCalledWith(301, `${config.proxyRoot}landing`);
  });

  it('sets cache tag headers on static files', () => {
    const setHeaders = expressSetupSpy['calls'].argsFor(0)[1].serveStaticOptions.setHeaders;
    const res = expressResponse();
    spyOn(res, 'setHeader');
    setHeaders(res);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
  });

  it('returns a 400 when JSON body is invalid', () => {
    const req = expressRequest();
    const res = expressResponse();
    const validJson = Buffer.from('{"foo":"bar"}', 'utf-8');
    const invalidJson = Buffer.from('foo', 'utf-8');
    const emptyJson = Buffer.from('', 'utf-8');
    let buffer = validJson;
    const verify = expressSetupSpy['calls'].argsFor(0)[1].bodyParserOptions.verify;
    const bodyParser = () => {
      verify(req, res, buffer, 'utf-8');
    };
    spyOn(res, 'sendStatus');
    spyOn(JSON, 'parse').and.callThrough();
    bodyParser();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(JSON.parse).toHaveBeenCalled();
    JSON.parse['calls'].reset();
    buffer = emptyJson;
    bodyParser();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(JSON.parse).not.toHaveBeenCalled();
    buffer = invalidJson;
    expect(bodyParser).toThrow();
    expect(res.sendStatus).toHaveBeenCalledWith(400);
  });

  it('adds current bss and ims accounts to user session', () => {
    spyOn(express, 'use');
    loadApp();
    const callback = express.use['calls'].argsFor(7)[0];
    const req = expressRequest({ headers: {} });
    const res = expressResponse();
    const next = jasmine.createSpy();
    callback(req, res, next);

    req['session'] = { passport: { user: {} } };
    callback(req, res, next);
    expect(req['session'].passport.user.bss_account).toBeUndefined();
    expect(req['session'].passport.user.ims_account).toBeUndefined();

    req.headers = { 'x-auth-account-id': 'bssAccountId', 'x-auth-ims-account-id': 'imsAccountId' };
    callback(req, res, next);
    expect(req['session'].passport.user.bss_account).toBe('bssAccountId');
    expect(req['session'].passport.user.ims_account).toBe('imsAccountId');
  });

  it('serves static assets', () => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'json');
    spyOn(express, 'get');
    loadApp();
    expect(express.get['calls'].argsFor(5)[0]).toEqual(`${nconf.get('contextRoot')}statics`);
    express.get['calls'].argsFor(5)[1](req, res);
    expect(res.json).toHaveBeenCalledWith(statics.getColigoStatics());

    expect(express.get['calls'].argsFor(6)[0]).toEqual(`${nconf.get('contextRoot')}files`);
    express.get['calls'].argsFor(6)[1](req, res);
    expect(res.json).toHaveBeenCalledWith(statics.getConsoleStatics());
  });

  it('serves locale bundles', () => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'send');
    spyOn(express, 'get');
    loadApp();

    expect(express.get['calls'].argsFor(7)[0]).toEqual(`${nconf.get('contextRoot')}locale`);
    express.get['calls'].argsFor(7)[1](req, res);
    expect(res.send).toHaveBeenCalledWith(jasmine.objectContaining({payload: {
      bundle: undefined,
      lng: req.i18n.language,
    }}));
  });

  it('checks for invalid bss_account query parameter', () => {
    spyOn(express, 'use');
    loadApp();
    const callback = express.use['calls'].argsFor(1)[0];
    const req = expressRequest({ query: {}, headers: {} });
    const res = expressResponse();
    spyOn(res, 'sendStatus');
    const next = jasmine.createSpy();
    callback(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.query.accountId).toBeUndefined();
    req.setQuery({ bss_account: 'foo' });
    callback(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.query.bss_account).toBe('foo');
    next['calls'].reset();
    req.setQuery({ bss_account: 'undefined' });
    callback(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(400);
  });

  it('serves endpoints for readiness and liveness probes', () => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(express, 'get');
    spyOn(res, 'status').and.callThrough();
    spyOn(res, 'send');
    loadApp();
    expect(express.get['calls'].argsFor(8)[0]).toBe('/readiness');
    express.get['calls'].argsFor(8)[1](req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
    res.status['calls'].reset();
    res.send['calls'].reset();
    expect(express.get['calls'].argsFor(9)[0]).toBe('/liveness');
    express.get['calls'].argsFor(9)[1](req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it('handles arrays or null byte query params', () => {
    spyOn(express, 'use');
    loadApp();
    const callback = express.use['calls'].argsFor(2)[0];
    const req = expressRequest({ query: { foo: ['bar'] } });
    const res = expressResponse();
    spyOn(res, 'sendStatus');
    const next = jasmine.createSpy();
    callback(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    res.sendStatus['calls'].reset();

    req.query.foo = '\u0000';
    callback(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    res.sendStatus['calls'].reset();

    req.query.foo = 'bar';
    callback(req, res, next);
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();

    delete req.query;
    callback(req, res, next);
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

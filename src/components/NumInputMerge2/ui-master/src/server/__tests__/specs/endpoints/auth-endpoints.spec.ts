// tslint:disable: no-string-literal
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import expressRequest from '../../mocks/lib/express-request';
import expressResponse from '../../mocks/lib/express-response';
import * as nconf from '../../mocks/lib/nconf';
import * as utils from '../../mocks/routes/utils';

describe('auth middleware', () => {
  let auth;
  let request;
  const func = jasmine.any(Function);
  const description = 'Authorization failed.';

  beforeEach(() => {
    request = jasmine.createSpy();
    auth = proxyquire('../../../ts/endpoints/auth-endpoints', {
      '../utils/request-utils': request,
      './utils/routes-utils': utils,
      '@console/console-platform-log4js-utils': loggerUtil,
    });
  });

  afterEach(() => {
    process.env.cfDomain = null;
  });

  it('has expected exports', () => {
    expect(Object.keys(auth))
      .toEqual(['bx', 'session']);
  });

  it('session auth', () => {
    const req = expressRequest({ query: {} });
    const res = expressResponse();
    const user = {
      iam_token: 'iam_token',
      refreshToken: 'refreshToken',
      token: 'uaa_token',
    };
    req.setUser(user);
    req.headers = { 'x-auth-resource-group': 'group-2', 'x-auth-metro': 'dal' };
    auth.session(req, res);
    expect(res.locals.auth.iamToken).toBe('iam_token');
    expect(res.locals.auth.refreshToken).toBe('refreshToken');
    expect(res.locals.auth['resourceGroup']).toBe('group-2');
    expect(res.locals.auth['metro']).toBe('dal');

    req.setUser(null);
    req.setHeaders({ iam_token: 'iamTokenFromHeader' });
    req.setQuery({ 'bss_account': 'accountFromQuery', 'q.env_id': 'envFromQuery' });
    auth.session(req, res);
    const expectedResult: any = {
      account: 'accountFromQuery',
      iamToken: 'iamTokenFromHeader',
      metro: '',
      refreshToken: '',
      region: 'envFromQuery',
      resourceGroup: undefined,
    };
    expect(res.locals.auth).toEqual(expectedResult);
  });

  it('bx client auth', () => {
    const req = expressRequest({ query: {} });
    const user = {
      iam_token: 'iamToken',
      refreshToken: 'refreshToken',
    };
    const requestId = '123456789';
    let errorCode = 'BXNIM0108E';
    req.setUser(user);
    req.headers = { 'x-auth-account-id': 'account-1' };
    req['session'] = { passport: { user: {} } };
    req.cookies = { 'com.ibm.cloud.iam.token.yp': 'my-browser-cookie' };
    const res = expressResponse();
    const callback = jasmine.createSpy();
    spyOn(res, 'sendStatus');
    spyOn(res, 'status').and.callThrough();
    spyOn(res, 'json');

    // Just to make sure we cover the cookie name already being set in the session
    req['session'].passport.user.iamCookieName = 'iam-cookie';
    auth.bx(req, res, callback);
    request.calls.reset();
    delete req['session'].passport.user.iamCookieName;

    // Get cookie name
    auth.bx(req, res, callback);
    expect(request).toHaveBeenCalledWith(jasmine.objectContaining({
      url: `${nconf.get('iamGlobalUrl')}/v1/info`,
    }), func);
    let cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb('error');
    expect(res.sendStatus).toHaveBeenCalledWith(500);
    res.sendStatus['calls'].reset();
    cb(null, { statusCode: 400 }, {});
    expect(res.sendStatus).toHaveBeenCalledWith(400);
    res.sendStatus['calls'].reset();
    cb(null, { statusCode: 200 }, { iamCookieName: 'com.ibm.cloud.iam.token.yp' });

    // exchange cookie
    expect(request).toHaveBeenCalledWith(jasmine.objectContaining({
      form: jasmine.objectContaining({
        cookie: 'my-browser-cookie',
        receiver_client_ids: 'bx',
        response_type: 'iam_cookie',
      }),
    }), func);
    cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb('error');
    expect(res.status).toHaveBeenCalledWith(500);
    res.status['calls'].reset();
    res.json['calls'].reset();
    cb(null, { statusCode: 400 }, { errorCode, context: { requestId } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ requestId, errorCode, description });
    res.status['calls'].reset();
    res.json['calls'].reset();
    errorCode = 'BXNIM0421E';
    cb(null, { statusCode: 400 }, { errorCode, context: { requestId } });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalled();
    request.calls.reset();
    errorCode = 'BXNIM0141E';
    cb(null, { statusCode: 400 }, { errorCode, context: { requestId } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      description: 'The current user is not a member of the selected account. Choose another account or ask the account owner to add you to the account.',
      errorCode,
      requestId,
    });
    res.status['calls'].reset();
    res.json['calls'].reset();
    errorCode = 'BXNIM0139E';
    cb(null, { statusCode: 400 }, { errorCode, context: { requestId } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ requestId, errorCode, description });
    res.status['calls'].reset();
    res.json['calls'].reset();

    // Get auth from browser cookie
    const cookie = {};
    cb(null, { statusCode: 200 }, { iam_cookie: cookie });
    expect(request).toHaveBeenCalledWith(jasmine.objectContaining({
      form: jasmine.objectContaining({
        cookie,
      }),
    }), func);
    cb = request.calls.argsFor(0)[1];
    cb('error');
    expect(res.status).toHaveBeenCalledWith(500);
    res.status['calls'].reset();
    res.json['calls'].reset();
    errorCode = 'BXNIM0108E';
    cb(null, { statusCode: 401 }, { errorCode, context: { requestId } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ requestId, errorCode, description });
    res.json['calls'].reset();
    request['calls'].reset();

    cb(null, { statusCode: 200 }, {
      access_token: 'cookieIamToken', refresh_token: 'cookieRefreshToken',
    });
    expect(res.locals.auth).toEqual({
      account: 'account',
      iamToken: 'cookieIamToken',
      refreshToken: 'cookieRefreshToken',
      region: 'region',
    });
    expect(req['session'].passport.user.bxClientAuth).toEqual({
      access_token: 'cookieIamToken',
      bss_account: res.locals.auth.account,
      refresh_token: 'cookieRefreshToken',
    });
    callback.calls.reset();

    // Has bx client auth and does not need refresh
    req['session'].passport.user.bxClientAuth = {
      access_token: 'access_token',
      bss_account: 'account',
      expiration: Math.floor((new Date()).getTime() / 1000) + (60 * 10),
      refresh_token: 'initialRefreshToken',
    };
    auth.bx(req, res, callback);
    expect(request).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
    request.calls.reset();
    callback.calls.reset();

    // Has bx client auth but needs token refresh
    req['session'].passport.user.bxClientAuth = {
      access_token: 'access_token',
      bss_account: 'account',
      expiration: Math.floor((new Date()).getTime() / 1000),
      refresh_token: 'initialRefreshToken',
    };
    auth.bx(req, res, callback);
    expect(request).toHaveBeenCalledWith(jasmine.objectContaining({
      form: jasmine.objectContaining({
        grant_type: 'refresh_token',
        refresh_token: 'initialRefreshToken',
      }),
    }), func);
    cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb(null, { statusCode: 200 }, { access_token: 'cookieIamToken1', refresh_token: 'cookieRefreshToken1' });
    expect(res.locals.auth).toEqual({
      account: 'account',
      iamToken: 'cookieIamToken1',
      refreshToken: 'cookieRefreshToken1',
      region: 'region',
    });
    expect(req['session'].passport.user.bxClientAuth).toEqual({
      access_token: 'cookieIamToken1',
      bss_account: res.locals.auth.account,
      refresh_token: 'cookieRefreshToken1',
    });
    callback.calls.reset();

    // No user so doesn't save the bx client auth in the session
    req['session'].passport.user = null;
    req.cookies = { 'com.ibm.cloud.iam.token.yp': 'foo' };
    auth.bx(req, res, callback);
    expect(request).toHaveBeenCalledWith(jasmine.objectContaining({
      url: `${nconf.get('iamGlobalUrl')}/v1/info`,
    }), func);
    cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb(null, { statusCode: 200 }, { iamCookieName: 'com.ibm.cloud.iam.token.yp' });
    cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb(null, { statusCode: 200 }, { iam_cookie: cookie });
    cb = request.calls.argsFor(0)[1];
    request.calls.reset();
    cb(null, { statusCode: 200 }, { access_token: 'cookieIamToken', refresh_token: 'cookieRefreshToken' });
    callback.calls.reset();

  });
});

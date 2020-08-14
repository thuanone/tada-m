// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import expressRequest from '../../mocks/lib/express-request';
import expressResponse from '../../mocks/lib/express-response';
import * as launchdarkly from '../../mocks/lib/launchdarkly';
import * as nconf from '../../mocks/lib/nconf';

describe('route utils', () => {
  let utils;
  let request;
  let nodeRequest;

  beforeEach(() => {
    process.env.cfDomain = 'stage32.ng.bluemix.net';
    request = jasmine.createSpy();
    nodeRequest = jasmine.createSpy();
    utils = proxyquire('../../../ts/utils/routes-utils', {
      '../services/launchdarkly-service': launchdarkly,
      './request-utils': request,
      '@console/console-platform-log4js-utils': loggerUtil,
      '@console/console-platform-nconf': nconf,
      'request': nodeRequest,
    });
  });

  afterEach(() => {
    process.env.cfDomain = null;
  });

  it('has expected exports', () => {
    expect(Object.keys(utils))
      .toEqual(['_',
        'apiProxy',
        'getApi',
        'getClusterApiHeaders',
        'getCommonHeaders',
        'getGlobalApi',
        'getIamAuthHeaders',
        'getUserId',
        'logRequest',
        'pageCheck',
        'request',
        'send',
        'verifyFeatureFlag',
      ]);
  });

  it('getClusterApiHeaders', () => {
    const req = { i18n: { language: 'fr' } };
    const auth = {
      account: 'account',
      iamToken: 'iamToken',
      refreshToken: 'refreshToken',
      region: 'region',
      resourceGroup: 'group-2',
    };
    const headers = utils.getClusterApiHeaders(req, { locals: { auth } });
    expect(headers).toEqual({
      'Authorization': auth.iamToken,
      'Connection': 'keep-alive',
      'X-Auth-Refresh-Token': auth.refreshToken,
      'X-Auth-Resource-Group': auth.resourceGroup,
      'X-Origin': undefined,
      'X-Region': auth.region,
      'accept-language': req.i18n.language,
      'user-agent': 'cloud-functions',
    });
  });

  it('logs request errors', () => {
    const logger = loggerUtil.getLogger();
    const options = {
      body: undefined,
      headers: {
        'Authorization': 'Authorization header',
        'X-Auth-Refresh-Token': 'Refresh token header',
      },
      method: 'PUT',
      url: 'some-url',

    };
    const loggerErrorSpy = spyOn(logger, 'error');
    spyOn(utils._, 'getServiceName').and.returnValue(null);
    utils.logRequest({}, options, 500);
    expect(logger.error).toHaveBeenCalledWith('5XX_SERVICE_DOWN [no user session] >>> PUT some-url <<< 500');
    loggerErrorSpy.calls.reset();

    utils._.getServiceName.and.returnValue('foo');
    options.headers['X-Region'] = 'us-south';
    options.body = {};
    utils.logRequest({}, options, 500, 'error', 'body');
    expect(logger.error).toHaveBeenCalledWith('5XX_SERVICE_DOWN (foo) [no user session] >>> PUT some-url {"X-Region":"us-south"} {} <<< 500 error body');
    loggerErrorSpy.calls.reset();
  });

  it('prints response body', () => {
    expect(utils._.printResponseBody()).toBe('null');
    expect(utils._.printResponseBody('')).toBe('null');
    expect(utils._.printResponseBody({ requestId: '123' })).toBe('{"requestId":"123"}');
  });

  it('gets service name for a request', () => {
    expect(utils._.getServiceName()).toBeNull();
    expect(utils._.getServiceName('https://ibm.com')).toBeNull();
    expect(utils._.getServiceName('https://containers.cloud.ibm.com/v1/clusters/123456789')).toBe('armada-api');
    expect(utils._.getServiceName('https://cloud.ibm.com/datalayer/resource_list')).toBe('datalayer');
    expect(utils._.getServiceName('https://uk.icr.io/api/v1')).toBe('registry');
    expect(utils._.getServiceName('https://resource-catalog.bluemix.net/api/v1/containers-kubernetes?include=*&languages=*&depth=1')).toBe('resource-catalog');
    expect(utils._.getServiceName('https://iam.cloud.ibm.com/v1/info')).toBe('iam');
    expect(utils._.getServiceName('https://pricing-catalog.ng.bluemix.net/bmx/pricing/v1/countries/get_pricing_country')).toBe('bss-pricing');
    expect(utils._.getServiceName('https://billing.cloud.ibm.com/v1/pricing/countries')).toBe('bss-billing');
    expect(utils._.getServiceName('https://us-east.kms.cloud.ibm.com')).toBe('key-protect');
    expect(utils._.getServiceName('https://razeedash.oneibmcloud.com/api/v2')).toBe('razee');
  });

  it('gets api url ', () => {
    const armadaApi = `${process.env.containersUrl}/v1`;
    expect(utils.getApi()).toBe(armadaApi);
  });

  it('gets global api url ', () => {
    const armadaApi = `${process.env.containersUrl}/global/v1`;
    expect(utils.getGlobalApi()).toBe(armadaApi);
  });

  it('getUserId', () => {
    const email = 'asdf@ibm.com';
    const req = {
      user: {
        emails: [{ value: email }],
        iam_id: 'iamId',
        id: 'userId',
        username: email,
      },
    };
    expect(utils.getUserId(req)).toBe(email);
    expect(utils.getUserId(req, true)).toBe('iamId');
    delete req.user.username;
    expect(utils.getUserId(req)).toBe(email);
    delete req.user.emails;
    expect(utils.getUserId(req)).toBe('iamId');
    delete req.user.iam_id;
    expect(utils.getUserId(req)).toBe('userId');
    expect(utils.getUserId(req, true)).toBe('[no iam id]');
    delete req.user.id;
    expect(utils.getUserId(req)).toBe('[no user id]');
  });

  it('send', () => {
    const req = expressRequest();
    const res = expressResponse();
    const cb = jasmine.createSpy();
    utils.send(req, res, { url: '/foo' }, cb);
    const callback = request.calls.argsFor(0)[1];
    callback('error');
    expect(cb).toHaveBeenCalledWith(new Error('Request failed'));
    callback(null, { statusCode: 200 }, 'result');
    expect(cb).toHaveBeenCalledWith(null, 'result');
  });

  it('handles api proxy requests', () => {
    const req = expressRequest({ query: {} });
    req['method'] = 'GET';
    const res = expressResponse();
    const resSendStatusSpy = spyOn(res, 'sendStatus');
    const resStatusSpy = spyOn(res, 'status').and.callThrough();
    const resJsonSpy = spyOn(res, 'json');
    utils.apiProxy(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
    resSendStatusSpy.calls.reset();
    req.setQuery({ url: 'http://www.google.com' });
    utils.apiProxy(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(400);
    resSendStatusSpy.calls.reset();
    const url = 'https://console.bluemix.net/datalayer';
    req.setQuery({ url });
    utils.apiProxy(req, res);
    expect(request.calls.argsFor(0)[0].method).toBe('GET');
    expect(request.calls.argsFor(0)[0].url).toBe(url);
    expect(request.calls.argsFor(0)[0].headers.Authorization).toBeUndefined();
    expect(request.calls.argsFor(0)[0].body).toBeUndefined();
    request.calls.reset();
    req.setQuery({ url, method: 'POST', auth: 'armada' });
    utils.apiProxy(req, res);
    expect(request.calls.argsFor(0)[0].method).toBe('POST');
    expect(request.calls.argsFor(0)[0].url).toBe(url);
    expect(request.calls.argsFor(0)[0].headers.Authorization).toBeDefined();
    expect(request.calls.argsFor(0)[0].headers['X-Auth-Refresh-Token']).toBeDefined();
    expect(request.calls.argsFor(0)[0].headers['X-Region']).toBeDefined();
    expect(request.calls.argsFor(0)[0].body).toBeUndefined();
    request.calls.reset();
    req.setQuery({ url, auth: 'iam', method: 'POST' });
    req['body'] = { foo: 'bar' };
    utils.apiProxy(req, res);
    expect(request.calls.argsFor(0)[0].method).toBe('POST');
    expect(request.calls.argsFor(0)[0].url).toBe(url);
    expect(request.calls.argsFor(0)[0].headers.Authorization).toBeDefined();
    expect(request.calls.argsFor(0)[0].body).toBe(req['body']);
    request.calls.reset();
  });

  it('pageCheck', () => {
    const req = expressRequest({ query: {} });
    const res = expressResponse();
    const resJsonSpy = spyOn(res, 'json');
    utils.pageCheck(req, res);
    const callback = nodeRequest.calls.argsFor(0)[1];
    callback();
    expect(res.json).toHaveBeenCalledWith({ status: 500 });
    resJsonSpy.calls.reset();
    callback(null, { statusCode: 404, headers: { 'x-request-id': '12345' } });
    expect(res.json).toHaveBeenCalledWith({ status: 404, requestId: '12345' });
    resJsonSpy.calls.reset();
    callback(null, { statusCode: 200, headers: {} }, 'foo');
    expect(res.json).toHaveBeenCalledWith({ status: 200 });
    resJsonSpy.calls.reset();
    callback(null, { statusCode: 200, headers: {} }, '{"code":503}');
    expect(res.json).toHaveBeenCalledWith({ status: 503 });
    resJsonSpy.calls.reset();
    callback(null, { statusCode: 200, headers: {} }, '{"foo":503}');
    expect(res.json).toHaveBeenCalledWith({ status: 200 });
  });

  it('sendRequest', () => {
    const req = expressRequest();
    const res = expressResponse();
    const resSendStatusSpy = spyOn(res, 'sendStatus');
    const resJsonSpy = spyOn(res, 'json');
    const resStatusSpy = spyOn(res, 'status').and.callThrough();
    utils.request(req, res);
    expect(request).toHaveBeenCalledWith({
      json: true,
      method: 'GET',
      timeout: 60000,
    }, jasmine.any(Function));
    let callback = request.calls.mostRecent().args[1];
    request.calls.reset();
    callback();
    expect(res.sendStatus).toHaveBeenCalledWith(500);
    resSendStatusSpy.calls.reset();
    callback('error', null, {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({});
    resStatusSpy.calls.reset();
    resJsonSpy.calls.reset();
    callback(null, { statusCode: 200 }, {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
    resStatusSpy.calls.reset();
    resJsonSpy.calls.reset();

    // With formatter
    const formatter = jasmine.createSpy().and.returnValue({ foo: 'bar' });
    utils.request(req, res, { timeout: 1000, method: 'PUT', foo: 'bar' }, formatter);
    expect(request).toHaveBeenCalledWith({
      foo: 'bar',
      json: true,
      method: 'PUT',
      timeout: 1000,
    }, jasmine.any(Function));
    callback = request.calls.mostRecent().args[1];
    request.calls.reset();
    callback(null, { statusCode: 200 }, {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ foo: 'bar' });
  });
});

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as aceUtils from '../../mocks/lib/bluemix-utils';
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import expressRequest from '../../mocks/lib/express-request';
import expressResponse from '../../mocks/lib/express-response';
import * as launchdarkly from '../../mocks/lib/launchdarkly';
import * as nconf from '../../mocks/lib/nconf';
import * as statics from '../../mocks/lib/statics';
import * as utils from '../../mocks/routes/utils';

describe('view route utils', () => {
  let viewUtils;
  let config;
  let aceDomainFromEnv;
  const crequest = {
    get: (urls, reqq, callback) => { callback(null, ['[]']); },
    getAndPost: (urls, reqq, callback) => {
      callback(null, ['[]', '<div></div>']);
    }
  };

  const aceCommonSuccess = (urls, reqq, callback) => {
    callback(null, ['[]', '<div></div>']);
  };
  const aceAnalyticsSuccess = (urls, reqq, callback) => {
    callback(null, ['[]']);
  };

  const launchDarklyCallback = (_, names, cb) => {
    const flags = {};
    names.forEach(n => (flags[n] = true));
    cb(flags);
  };

  beforeEach(() => {
    config = nconf.get();
    aceDomainFromEnv = process.env.cfDomain;
  });

  afterEach(() => {
    process.env.cfDomain = aceDomainFromEnv;
  });

  const load = () => {
    viewUtils = proxyquire('../../../ts/utils/view-utils', {
      '../services/launchdarkly-service': launchdarkly,
      './routes-utils': utils,
      './statics-utils': statics,
      '@console/console-platform-bluemix-utils': aceUtils,
      '@console/console-platform-cached-request': crequest,
      '@console/console-platform-log4js-utils': loggerUtil,
      '@console/console-platform-nconf': nconf,
    });
  };

  it('init', () => {
    spyOn(loggerUtil, 'getLogger').and.callThrough();
    load();
    expect(loggerUtil.getLogger).toHaveBeenCalledWith('clg-ui');
  });

  it('has expected exports', () => {
    load();
    expect(Object.keys(viewUtils)).toEqual(['renderView', 'getFlags', 'basicView']);
  });

  it('renders view', (done) => {
    load();
    const req = expressRequest();
    req.cookies = { armada_ui_integration_tests: true };
    const res = expressResponse();
    spyOn(res, 'render')
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    spyOn(launchdarkly, 'getFlag').and.callFake(launchDarklyCallback);
    process.env.cfDomain = 'stage27.ng.bluemix.net';
    process.env.containersUrl = 'https://containers.test.cloud.ibm.com';
    viewUtils.renderView(req, res, 'template');
    const flags = {};
    viewUtils.getFlags().forEach(k => (flags[k] = true));
    setTimeout(() => {
      expect(Object.keys(res.render['calls'].argsFor(0)[1])).not.toContain('nav');
      expect(launchdarkly.getFlag).toHaveBeenCalledWith(req, jasmine.any(Array), jasmine.any(Function));
      done();
    }, 10);
  });

  it('renders view on windows', (done) => {
    load();
    const req = expressRequest();
    const res = expressResponse();
    req.useragent.isWindows = true;
    const resRenderSpy = spyOn(res, 'render');
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    viewUtils.renderView(req, res, 'template', {});
    setTimeout(() => {
      const vars = res.render['calls'].argsFor(0)[1];
      expect(vars.os).toBe('windows');
      done();
    }, 10);
  });

  it('error requesting external content, without message', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    const timeout = global.setTimeout;

    let acfUrls;
    spyOn(res, 'send');
    // spyOn(global, 'setTimeout').and.callFake((cb) => cb());
    spyOn(crequest, 'getAndPost').and.callFake((urls, reqq, callback) => {
      acfUrls = urls;
      callback('error');
    });
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    viewUtils.renderView(req, res, 'template');
    timeout(() => {
      expect(res.send).toHaveBeenCalledWith(`One of the URL requests cannot complete.\n\n${JSON.stringify(acfUrls)}`);
      done();
    }, 10);
  });

  it('error requesting external content, with message', done => {
    const req = expressRequest();
    const res = expressResponse();
    const timeout = global.setTimeout;
    spyOn(res, 'send');
    // spyOn(global, 'setTimeout').and.callFake((cb, 2000) => {});
    spyOn(crequest, 'getAndPost').and.callFake((urls, reqq, callback) => {
      callback({ message: 'Something bad happened.' });
    });
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    viewUtils.renderView(req, res, 'template');
    timeout(() => {
      expect(res.send).toHaveBeenCalledWith('Error: Something bad happened.');
      done();
    }, 10);
  });

  it('error parsing common files', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'render').and.callThrough();
    spyOn(crequest, 'getAndPost').and.callFake((urls, reqq, callback) => {
      callback(null, ['foo', '<div></div>']);
    });
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    viewUtils.renderView(req, res, 'template');
    setTimeout(() => {
      expect(res.render).toHaveBeenCalled();
      expect(Object.keys(res.render['calls'].argsFor(0)[1])).not.toContain('aceCommonFiles');
      done();
    }, 10);
  });

  it('bad response from analytics', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'render');
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake((urls, reqq, callback) => {
      callback(null, ['foo']);
    });
    viewUtils.renderView(req, res, 'template');
    setTimeout(() => {
      expect(res.render).toHaveBeenCalled();
      expect(Object.keys(res.render['calls'].argsFor(0)[1])).not.toContain('aceAnalyticsFiles');
      done();
    }, 10);
  });

  it('error requesting analytics files, without message', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'render');
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake((urls, reqq, callback) => {
      callback('error');
    });
    viewUtils.renderView(req, res, 'template');
    setTimeout(() => {
      expect(res.render).toHaveBeenCalled();
      expect(Object.keys(res.render['calls'].argsFor(0)[1])).not.toContain('aceAnalyticsFiles');
      done();
    }, 10);
  });

  it('error requesting analytics files, with message', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'render');
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake((urls, reqq, callback) => {
      callback(new Error('something bad happened'));
    });
    viewUtils.renderView(req, res, 'template');
    setTimeout(() => {
      expect(res.render).toHaveBeenCalled();
      expect(Object.keys(res.render['calls'].argsFor(0)[1])).not.toContain('aceAnalyticsFiles');
      done();
    }, 10);
  });

  it('renders basic view with all docs URLs', (done) => {
    const req = expressRequest();
    const res = expressResponse();
    spyOn(res, 'render');
    spyOn(crequest, 'getAndPost').and.callFake(aceCommonSuccess);
    spyOn(crequest, 'get').and.callFake(aceAnalyticsSuccess);
    spyOn(launchdarkly, 'getFlag').and.callFake(launchDarklyCallback);
    viewUtils.basicView(req, res);
    const flags = {};
    viewUtils.getFlags().forEach(k => (flags[k] = true));
    setTimeout(() => {
      expect(res.render['calls'].argsFor(0)[0]).toBe('basic.dust');
      const vars = res.render['calls'].argsFor(0)[1];
      expect(vars.flags).toBe(encodeURIComponent(JSON.stringify(flags)));
      expect(JSON.parse(decodeURIComponent(vars.config)).docs.foo).toBe('bar');
      done();
    }, 10);
  });

});

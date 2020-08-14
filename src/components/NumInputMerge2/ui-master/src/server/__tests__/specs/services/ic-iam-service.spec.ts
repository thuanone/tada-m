// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as nconf from '../../mocks/lib/nconf';

import * as commonErrors from '../../../../common/Errors';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error: any = undefined;
    let response;
    let body;

    // IAM Token request
    if (options.method === 'POST' && options.path === '/identity/token' && options.qs && options.qs.response_type === 'delegated_refresh_token') {
      if (options.qs.refresh_token === 'something-stupid') {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.qs.refresh_token === 'something-stupid-to-return') {
        response = {
          statusCode: 200
        };
        body = '{ \"delegated_refresh_token\" : \"something-stupid\" }';
      } else if (options.qs.refresh_token === 'something-broken') {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else {
        response = {
          statusCode: 200
        };
        body = '{ \"delegated_refresh_token\" : \"some-delegated-refresh-token\" }';
      }
    }

    // IAM Token request
    if (options.method === 'POST' && options.path === '/identity/token' && options.qs && options.qs.grant_type === 'urn:ibm:params:oauth:grant-type:delegated-refresh-token') {
      if (options.qs.refresh_token === 'something-stupid') {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.qs.refresh_token === 'something-broken') {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else {
        response = {
          statusCode: 200
        };
        body = '{ \"refresh_token\" : \"some-refresh-token\", \"access_token\" : \"some-access-token\", \"scope\" : \"some-scope\" }';
      }
    }
    callbackFn(error, response, body);
  }
};

const cacheUtilsMock = {
  // tslint:disable-next-line:no-empty
  getDecryptedJson: () => { },
  // tslint:disable-next-line:no-empty
  putEncryptedJson: () => { },
};

const monitoringUtilsMock = {
  createPerfLogEntry: (...args) => {
    // relax and take it easy
  },
  storePerfMonitorEntry: (...args) => {
    // relax and take it easy
  }
};

describe('iamService', () => {
  let iamService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = OLD_ENV;

    // deleting the env properties that are necessary to test locally
    delete process.env.WORKAROUND_IAM_ACCESS_TOKEN;
    delete process.env.WORKAROUND_IAM_REFRESH_TOKEN;

    iamService = proxyquire('../../../ts/services/ic-iam-service', {
      '../utils/cache-utils': cacheUtilsMock,
      '../utils/http-utils': proxyquire('../../../ts/utils/http-utils', {
        './logger-utils': loggerUtil,
        '@console/console-platform-resiliency': resiliencyMock,
        './monitoring-utils': monitoringUtilsMock,
      }),
      '../utils/logger-utils': loggerUtil,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-log4js-utils': loggerUtil,
      'nconf': nconf,
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('will retrieve refresh token from request', () => {

    // request object is null
    let req;
    expect(iamService.getIAMRefreshToken(req)).toEqual('');

    // request object is empty
    req = {};
    expect(iamService.getIAMRefreshToken(req)).toEqual('');

    // req.user object is empty
    req = {
      user: {}
    };
    expect(iamService.getIAMRefreshToken(req)).toEqual('');

    // req.user.refreshToken object is null
    req = {
      user: {
        refreshToken: null
      }
    };
    expect(iamService.getIAMRefreshToken(req)).toEqual('');

    // req.user.refreshToken object is null
    req = {
      user: {
        refreshToken: 'foo'
      }
    };
    expect(iamService.getIAMRefreshToken(req)).toEqual('foo');
  });

  it('will retrieve access token from request', () => {

    // request object is null
    let req;
    expect(iamService.getIAMAccessToken(req)).toEqual('');

    // request object is empty
    req = {};
    expect(iamService.getIAMAccessToken(req)).toEqual('');

    // req.user object is empty
    req = {
      user: {}
    };
    expect(iamService.getIAMAccessToken(req)).toEqual('');

    // req.user.iam_token object is null
    req = {
      user: {
        iam_token: null
      }
    };
    expect(iamService.getIAMAccessToken(req)).toEqual('');

    // req.user.iam_token object is set
    req = {
      user: {
        iam_token: 'bar'
      }
    };
    expect(iamService.getIAMAccessToken(req)).toEqual('bar');
  });

  it('failed to retrieve delegated refresh token due to missing input', () => {
    const refreshToken: string = undefined;
    const receiverClientId: string = undefined;
    const encodedAuthValue: string = undefined;

    const ctx = {
      tid: 'some-tid',
    };

    return iamService.retrieveIAMDelegatedRefreshToken(ctx, refreshToken, receiverClientId, encodedAuthValue).catch((e) =>
      expect(e).toEqual(new Error('refreshToken, receiverClientId and encodedAuthValue must be set properly'))
    ).catch((e) =>
      fail(e)
    );
  });

  it('failed to retrieve delegated refresh token due to broken api', (done) => {
    const refreshToken = 'something-broken';
    const receiverClientId = 'functionsClientId';
    const encodedAuthValue = 'some_encoded_auth_value';

    const ctx = {
      tid: 'some-tid',
    };

    return iamService.retrieveIAMDelegatedRefreshToken(ctx, refreshToken, receiverClientId, encodedAuthValue)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToGetDelegatedRefreshTokenError');
        done();
      }).catch((e) =>
        fail(e)
      );
  });

  it('retrieve IAM delegated refresh token', () => {
    const refreshToken = 'the-given-refresh-token';
    const receiverClientId = 'functionsClientId';
    const encodedAuthValue = 'some_encoded_auth_value';

    const ctx = {
      tid: 'some-tid',
    };

    return iamService.retrieveIAMDelegatedRefreshToken(ctx, refreshToken, receiverClientId, encodedAuthValue).then((data) => {
      expect(data).toBe('some-delegated-refresh-token');
    }).catch((e) =>
      fail(e)
    );
  });

  it('failed to retrieve IAM tokens token due to missing input', () => {
    const delegatedRefreshToken: string = undefined;
    const encodedAuthValue: string = undefined;
    return iamService.retrieveIAMTokens(delegatedRefreshToken, encodedAuthValue).catch((e) =>
      expect(e).toEqual(new Error('delegatedRefreshToken and encodedAuthValue must be set properly'))
    ).catch((e) =>
      fail(e)
    );
  });

  it('failed to retrieve IAM tokens due to broken response', (done) => {
    const delegatedRefreshToken = 'something-broken';
    const encodedAuthValue = 'some_encoded_auth_value';

    return iamService.retrieveIAMTokens({}, delegatedRefreshToken, encodedAuthValue)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToGetIAMTokensError');
        done();
      }).catch((e) =>
        fail(e)
      );
  });

  it('failed to retrieve IAM tokens', (done) => {
    const delegatedRefreshToken = 'something-stupid';
    const encodedAuthValue = 'some_encoded_auth_value';

    return iamService.retrieveIAMTokens({}, delegatedRefreshToken, encodedAuthValue)
      .catch((e) => {
        expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
        expect(e.name).toEqual('FailedToGetIAMTokensError');
        done();
      }).catch((e) =>
        fail(e)
      );
  });

  it('retrieve IAM tokens', () => {
    const delegatedRefreshToken = 'the-given-refresh-token';
    const encodedAuthValue = 'some_encoded_auth_value';

    return iamService.retrieveIAMTokens({}, delegatedRefreshToken, encodedAuthValue).then((data) => {
      expect(data).toEqual({ refresh_token: 'some-refresh-token', access_token: 'some-access-token', scope: 'some-scope' });
    }).catch((e) =>
      fail(e)
    );
  });
});

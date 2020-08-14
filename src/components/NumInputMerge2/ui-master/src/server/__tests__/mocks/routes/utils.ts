export function getClusterApiHeaders(req, res) {
  const headers = {
    'Authorization': res.locals.auth.iamToken,
    'X-Auth-Refresh-Token': res.locals.auth.refreshToken,
  };
  return headers;
}

export function getRegistryApiHeaders(req, res) {
  const headers = {
    Account: res.locals.auth.account,
    Authorization: res.locals.auth.iamToken,
  };
  return headers;
}

export function getVAApiHeaders(req, res) {
  const headers = {
    Account: res.locals.auth.account,
    Authorization: res.locals.auth.iamToken,
  };
  return headers;
}

export function getIamAuthHeaders(req, res) {
  const headers = {
    Authorization: res.locals.auth.iamToken,
  };
  return headers;
}

export function getCommonHeaders() {
  const headers = {};
  return headers;
}

export function getRazeeApiHeaders(req, res) {
  const headers = {
    'account-id': res.locals.auth.account,
    'iam-token': `Bearer ${res.locals.auth.iamToken}`,
  };
  return headers;
}

export function logRequest(options) { return options; }

export function getUserId(req) { return req && req.user && req.user.username; }

export function getApi() { return `${process.env.containersUrl}/v1`; }

export function getGlobalApi() { return `${process.env.containersUrl}/global/v1`; }

export function getSchematicsApi() { return `${process.env.schematicsUrl}/v1`; }

export function getRegistryApi() { return 'https://stg.icr.io/api/v1'; }

export function getVaApi() { return 'https://stg.icr.io/va/api/v3'; }

// tslint:disable-next-line:no-empty
export function send() { }

// tslint:disable-next-line:no-empty
export function request() { }

export default function(args?) {
  let user = args ? args.user : null;
  let headers = args ? args.headers : null;
  let query = args ? args.query : null;
  let cookies = args ? args.cookies : null;
  const req = {
    // tslint:disable-next-line:no-empty
    accepts: () => { },
    clgCtx: args && args.clgCtx || {},
    clgMonitor: args && args.clgMonitor || {},
    clgRoute: args && args.clgRoute || {},
    connection: {},
    cookies,
    headers,
    i18n: {
      // tslint:disable-next-line:no-empty
      getResourceBundle: () => { },
      language: args && args.lng || 'en',
    },
    isAuthenticated: () => !!user,
    params: args && args.params || {},
    query,
    setCookies: (newCookies) => {
      cookies = newCookies;
      req.cookies = newCookies;
    },
    setHeaders: (newHeader) => {
      headers = newHeader;
      req.headers = newHeader;
    },
    setQuery: (newQuery) => {
      query = newQuery;
      req.query = newQuery;
    },
    setUser: (newUser) => {
      user = newUser;
      req.user = newUser;
    },
    t: (key) => key,
    url: args && args.url || 'http://ibm.com/cloud',
    user,
    useragent: {
      isWindows: false,
    },
  };
  return req;
}

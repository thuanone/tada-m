export function session(req, res) {
  const authObj = {
    account: 'account',
    iamToken: 'iamToken',
    refreshToken: 'refreshToken',
  };
  res.locals.auth = authObj;
}

export function bx(req, res, next) {
  return next();
}

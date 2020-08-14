export default function() {
  const res = {
    end: () => res,
    json: () => res,
    locals: {
      auth: {
        account: 'account',
        iamToken: 'iamToken',
        refreshToken: 'refreshToken',
        region: 'region',
      },
    },
    redirect: () => res,
    render: () => res,
    send: () => res,
    sendStatus: () => res,
    // tslint:disable-next-line:no-empty
    setHeader: () => {},
    status: () => res,
  };
  return res;
}

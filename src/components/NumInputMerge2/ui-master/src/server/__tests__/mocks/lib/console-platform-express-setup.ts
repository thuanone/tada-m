import * as nconf from './nconf';

export function setup(app, options) {
    // tslint:disable-next-line:no-empty
    options.configRoutesFn(app, nconf.get('contextRoot'), () => {}, () => {});
}

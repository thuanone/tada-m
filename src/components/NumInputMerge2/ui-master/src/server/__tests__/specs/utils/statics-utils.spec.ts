// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as fs from '../../mocks/lib/fs-extra';
import * as nconf from '../../mocks/lib/nconf';
// const URI = require('urijs');

describe('statics', () => {
  let statics;

  const load = () => {
    statics = proxyquire('../../../ts/utils/statics-utils', {
      '@console/console-platform-nconf': nconf,
      'fs-extra': fs,
    });
  };

  beforeEach(() => {
    process.env.containersUrl = 'https://containers.test.cloud.ibm.com';
  });

  it('has expected exports', () => {
    load();
    expect(Object.keys(statics)).toEqual(['getColigoStatics', 'getConsoleStatics']);
  });

  it('generates IKS statics', () => {
    load();
    spyOn(fs, 'readdirSync').and.callThrough();
    const coligoStatics = statics.getColigoStatics();
    expect(fs.readdirSync).toHaveBeenCalledTimes(4);
    fs.readdirSync['calls'].reset();
    // expect(JSON.stringify(coligoStatics)).toEqual('some');
    expect(coligoStatics['js/react'].path).toMatch(new RegExp(`^${nconf.get('proxyRoot')}js/react.bundle`));
    expect(statics.getColigoStatics()).toBe(coligoStatics);
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  it('generates console statics', () => {
    load();
    spyOn(fs, 'readdirSync').and.callThrough();
    expect(statics.getConsoleStatics()).toEqual(jasmine.any(Object));
    expect(fs.readdirSync).toHaveBeenCalledTimes(4);
    fs.readdirSync['calls'].reset();
    statics.getConsoleStatics();
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });
});

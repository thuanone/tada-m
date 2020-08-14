// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import * as nconf from '../../mocks/lib/nconf';

describe('encryption utils', () => {
  let encryptionUtils;

  beforeEach(() => {
    encryptionUtils = proxyquire('../../../ts/utils/encryption-utils', {
      '@console/console-platform-log4js-utils': loggerUtil,
      '@console/console-platform-nconf': nconf,
    });
  });

  it('encrypts and decrypts text', () => {
    const text = 'text 2 be encrypted';
    const encrypted = encryptionUtils.encrypt(text);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(text);
    const decrypted = encryptionUtils.decrypt(encrypted);
    expect(decrypted).toBeDefined();
    expect(decrypted).not.toEqual(encrypted);
    expect(decrypted).toEqual(text);
  });

  it('returns null if an invalid string is passed over for decryption', () => {
    const invalid = 'somethingbroken';
    const decrypted = encryptionUtils.decrypt(invalid);
    expect(decrypted).toBeNull();
  });

  it('encrypts and decrypts JSON', () => {
    const json = { foo: 'bar'};
    const encrypted = encryptionUtils.encryptJson(json);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(JSON.stringify(json));
    const decrypted = encryptionUtils.decryptJson(encrypted);
    expect(decrypted).toBeDefined();
    expect(decrypted).toEqual(json);
  });

  it('encrypts invalid JSON (even if it is invalid)', () => {
    const invalidJson = '{ foo: bar}}';
    const encrypted = encryptionUtils.encryptJson(invalidJson);
    expect(encrypted).toBeDefined();
    const decrypted = encryptionUtils.decryptJson(encrypted);
    expect(decrypted).toBeDefined();
    expect(decrypted).toEqual(invalidJson);
  });

  it('returns null if an invalid string is passed over for JSON decryption', () => {
    const invalid = 'somethingbroken';
    const decrypted = encryptionUtils.decryptJson(invalid);
    expect(decrypted).toBeNull();
  });

  it('encrypted strings equal each other on same input', () => {
    const text = 'text 2 be encrypted';
    const encrypted1 = encryptionUtils.encrypt(text);
    const encrypted2 = encryptionUtils.encrypt(text);
    expect(encrypted1).toEqual(encrypted2);
  });

});

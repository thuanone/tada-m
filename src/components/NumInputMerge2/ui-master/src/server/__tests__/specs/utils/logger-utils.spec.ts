import { getLogger } from './../../mocks/lib/console-platform-log4js-utils';
// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();

import * as originalLoggerUtils from '@console/console-platform-log4js-utils';

describe('loggerUtil', () => {
  let loggerUtils;

  beforeEach(() => {
    process.env.coligoLoggerDisabled = 'false';

    loggerUtils = proxyquire('../../../ts/utils/logger-utils', {
      '@console/console-platform-log4js-utils': originalLoggerUtils,
    });
  });

  afterEach(() => {
    process.env.coligoLoggerDisabled = 'false';
  });

  it('logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.log('something stupid');
  });

  it('logs trace level logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.debug('something stupid');
  });

  it('logs debug level logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.debug('something stupid');
  });

  it('logs info level logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.info('something stupid');
  });

  it('logs warn level logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.warn('something stupid');
  });

  it('logs error level logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.error('something stupid', new Error('foo'));
  });

  it('logs structured logs', () => {
    const logger = loggerUtils.getLogger('clgLogger');
    logger.info({ tid: 123 }, 'something stupid');

    const logger2 = loggerUtils.getLogger('clgLogger2');
    logger2.info({ tid: 'abc' }, 'something different');
  });

  it('it can be turned off by using an environment variable', () => {
    process.env.coligoLoggerDisabled = 'true';
    const logger = loggerUtils.getLogger('clgLogger');
    logger.info({ tid: 123 }, 'something stupid that should not be structured');
  });

  it('does not touch the log arguments in case a context is NOT set', () => {
    const logLevel = { level: 20000, levelStr: 'INFO', colour: 'green' };
    const logMessage = 'some log message';

    const result = loggerUtils.convertLogStatement([logLevel, logMessage]);
    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(logLevel);
    expect(result[1]).toEqual(logMessage);
  });

  it('converts the given log arguments in case a context is set', () => {
    const logLevel = { level: 20000, levelStr: 'INFO', colour: 'green' };
    const ctx = { tid: 'abcdefghij'};
    const logMessage = 'some log message';

    const result = loggerUtils.convertLogStatement([logLevel, ctx, logMessage]);
    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(logLevel);
    expect(result[1]).toEqual('{ "tid": "abcdefghij", "message": "some log message" }');
  });

  it('does not touch the log line in case there are more than three arguments set', () => {
    const logLevel = { level: 40000, levelStr: 'ERROR', colour: 'red' };
    const logMessage = 'some log message';
    const err = new Error('foo');

    const result = loggerUtils.convertLogStatement([logLevel, logMessage, err]);
    expect(result).toBeDefined();
    expect(result.length).toEqual(3);
    expect(result[0]).toEqual(logLevel);
    expect(result[1]).toEqual('some log message');
    expect(result[2]).toEqual(err);
  });

  it('converts the given log arguments even if there are more than three arguments set', () => {
    const logLevel = { level: 40000, levelStr: 'ERROR', colour: 'red' };
    const ctx = { tid: 'abcdefghij'};
    const logMessage = 'some log message';
    const err = new Error('foo');

    const result = loggerUtils.convertLogStatement([logLevel, ctx, logMessage, err]);
    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(logLevel);
    expect(result[1]).toEqual('{ "tid": "abcdefghij", "message": "some log message Error: foo" }');
  });

  it('takes care of stringified JSON objects', () => {
    const logLevel = { level: 20000, levelStr: 'INFO', colour: 'green' };
    const ctx = { tid: 'abcdefghij'};
    const myObject = { foo: 'bar' };
    const logMessage = `some log message with an object ${JSON.stringify(myObject)}`;

    const result = loggerUtils.convertLogStatement([logLevel, ctx, logMessage]);
    expect(result).toBeDefined();
    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(logLevel);
    expect(result[1]).toEqual(`{ "tid": "abcdefghij", "message": "some log message with an object ('foo':'bar')" }`);
  });
});

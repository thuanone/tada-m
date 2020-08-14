import * as loggerUtil from '@console/console-platform-log4js-utils';

import * as nconf from 'nconf';

let origLog;

function isClgLogWrapperDisabled(): boolean {
  return nconf.get('coligoLoggerDisabled') === 'true';
}

export function convertLogStatement(logArgs: IArguments, logMessagePrefix: string) {

  // check whether the feature flag is turned on.
  // If not, ensure that the log is still readable
  if (isClgLogWrapperDisabled()) {
    if (logArgs && logArgs[1] && logArgs[1].tid) {
      // remove the request context to avoid log polution
      const args = Array.prototype.slice.call(logArgs, 0);
      args.splice(1, 1);
      return args;
    }
    return logArgs;
  }

  if (logArgs.length < 3) {
    return logArgs;
  }

  if (!logArgs[1] || !logArgs[1].tid) {
    return logArgs;
  }

  let logLine = '';
  for (let i = 0; i < logArgs.length; i += 1) {
    if (i === 2) {
      logLine += logArgs[i];
    } else if (i > 2 && logArgs[i]) {
      logLine += ` ${logArgs[i].toString()}`;
    }
  }

  // we need to escape potential stringified JSON objects in order to avoid that LogDNA tries to structure them
  let jsonEscapedLogLine = logLine.toString().replace(/"/g, "'");
  jsonEscapedLogLine = jsonEscapedLogLine.toString().replace(/{/g, '(');
  jsonEscapedLogLine = jsonEscapedLogLine.toString().replace(/}/g, ')');
  jsonEscapedLogLine = jsonEscapedLogLine.toString().replace(/(\r\n|\n|\r|\\n)/gm, '');

  const convertedLogArgs = [];
  convertedLogArgs.push(logArgs[0]); // the first item in the array describes the log level: {"level":20000,"levelStr":"INFO","colour":"green"}
  convertedLogArgs.push(`{ "tid": "${logArgs[1].tid}", "message": "${logMessagePrefix || ''}${jsonEscapedLogLine}" }`); // convert the log message to a stringified JSON object to enable structured logging

  return convertedLogArgs;
}

function wrapLog() {
  if (arguments.length > 1 && this.isLevelEnabled(arguments[0])) {
    const logArgs = convertLogStatement(arguments, this.logMessagePrefix);
    return origLog.apply(this, logArgs || arguments);
  }
  return origLog.apply(this, arguments);
}

function addClgWrapper(LoggerProto) {
  const thisLoggerProto = LoggerProto;
  const log = thisLoggerProto.log;
  if (log && log !== wrapLog) {
    origLog = log;
    thisLoggerProto.log = wrapLog;
  }
}

/**
 * Create a logger for the specified category name.
 *
 * @param {string} categoryName - A name used to describe the type of events being logged.  Defaults to Logger.DEFAULT_CATEGORY.
 */
export function getLogger(categoryName) {
  const logger = loggerUtil.getLogger(categoryName);

  // store the category name in the logger object. We need it for the structured log line message.
  logger.logMessagePrefix = `${categoryName} - `;

  // add a wrapper that converts the log arguments and enables structured logging
  addClgWrapper(logger);
  return logger;
}

export function configure(configPath) {
  loggerUtil.configure(configPath);
}

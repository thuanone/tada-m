const logger = {
  // tslint:disable-next-line: no-empty
  debug: () => {},
  // tslint:disable-next-line: no-empty
  error: () => {},
  // tslint:disable-next-line: no-empty
  info: () => {},
  isLevelEnabled: () => true,
  // tslint:disable-next-line: no-empty
  trace: () => {},
  // tslint:disable-next-line: no-empty
  warn: () => {},
};

export function getLogger() {
  return logger;
}

// tslint:disable-next-line: no-empty
export function configure() {

}

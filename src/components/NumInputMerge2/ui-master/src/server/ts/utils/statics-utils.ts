import nconf = require('@console/console-platform-nconf');
import fs = require('fs-extra');

const getStaticFilePath = (root, prefix, file) => `${root}${prefix}/${file}`;
const publicFilesRoot = 'dist/server/ts/public';

// We need to represent the static assets in two different ways. One for our own purposes
// and one for the console.
// Our static assets structure looks like this:
//   {
//     "js/file": { "path": "/codeengine/js/file.bundle.abcd1234.js" }
//   }
// The console wants it like this:
//   {
//     "file.js": { "path": "/js/file.bundle.abcd1234.js" }
//   }
let coligoStatics = null;
let consoleStatics = null;
const generateStatics = () => {
  coligoStatics = {};
  consoleStatics = {};
  // external libs are named <name>-<version>.js
  fs.readdirSync(`${publicFilesRoot}/lib`).forEach((file) => {
    coligoStatics[`lib/${file.substring(0, file.lastIndexOf('-'))}`] = { path: getStaticFilePath(nconf.get('proxyRoot'), 'lib', file) };
    consoleStatics[`${file.substring(0, file.lastIndexOf('-'))}.js`] = { path: getStaticFilePath('/', 'lib', file) };
  });
  // javascript code bundles are named <name>.bundle.<hash>.js unless running in dev where there is no hash
  fs.readdirSync(`${publicFilesRoot}/js`).filter((f) => f.endsWith('.js')).forEach((file) => {
    coligoStatics[`js/${file.split('.bundle.')[0]}`] = { path: getStaticFilePath(nconf.get('proxyRoot'), 'js', file) };
    consoleStatics[`${file.split('.bundle.')[0]}.js`] = { path: getStaticFilePath('/', 'js', file) };
  });
  // stylesheets are named <name>-<hash>.css unless running in dev where there is no hash
  fs.readdirSync(`${publicFilesRoot}/css`).forEach((file) => {
    // istanbul ignore next
    const end = file.indexOf('-') > -1 ? file.lastIndexOf('-') : file.lastIndexOf('.');
    coligoStatics[`css/${file.substring(0, end)}`] = { path: getStaticFilePath(nconf.get('proxyRoot'), 'css', file) };
    consoleStatics[`${file.substring(0, end)}.css`] = { path: getStaticFilePath('/', 'css', file) };
  });
  // images are named <name>-<hash>.<ext>
  fs.readdirSync(`${publicFilesRoot}/img`).forEach((file) => {
    const end = file.lastIndexOf('-');
    const ext = file.split('.').pop();
    coligoStatics[`img/${file.substring(0, end)}`] = { path: getStaticFilePath(nconf.get('proxyRoot'), 'img', file) };
    consoleStatics[`${file.substring(0, end)}.${ext}`] = { path: getStaticFilePath('/', 'img', file) };
  });
};

export function getColigoStatics() {
  if (coligoStatics) { return coligoStatics; }
  generateStatics();
  return coligoStatics;
}

export function getConsoleStatics() {
  if (consoleStatics) { return consoleStatics; }
  generateStatics();
  return consoleStatics;
}

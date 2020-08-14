import t from './i18n';
import modal from './modal';

// Wrapper around the global window object so that it can be mocked. Allows getting and
// setting attrs on the window 2 levels deep, e.g. window.location.pathname = '/foo'.

const supportedWindowFeatures = ['left', 'screenX', 'top', 'screenY', 'width', 'innerWidth', 'height', 'innerHeight',
  'menubar', 'toolbar', 'location', 'status', 'resizable', 'scrollbars', 'noopener', 'noreferrer'];

const getPath = (path): any => {
  const tokens = path ? path.split('.') : [];
  if (tokens.length === 0) {
    return window;
  }
  if (tokens.length === 1) {
    return window[tokens[0]];
  }
  if (tokens.length === 2) {
    return window[tokens[0]][tokens[1]];
  }
  return null;
};

const setPath = (path, value) => {
  const tokens = path ? path.split('.') : [];
  if (tokens.length === 1) {
    window[tokens[0]] = value;
  } else if (tokens.length === 2) {
    window[tokens[0]][tokens[1]] = value;
  }
};

const isValidHttpUrl = (urlStringToCheck: string) => {
  let url;

  try {
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
    url = new URL(urlStringToCheck);
  } catch (err) {
    return false;
  }

  // we need to check for the protocol, because 'javascript:' is a valid "URL", too
  return ['http:', 'https:'].includes(url.protocol);
};

const open = (url, message, windowFeatures = []) => {
  const finalSetWindowFeatures = ['noopener', 'noreferrer'];
  if (Array.isArray(windowFeatures) && windowFeatures.length > 0) {
    for (const currentFeature of windowFeatures) {
      // make sure the current feature is part of the set of supported features and at the same time not yet in the
      // final set of window features to avoid duplicates
      if (supportedWindowFeatures.indexOf(currentFeature) > -1 && finalSetWindowFeatures.indexOf(currentFeature) === -1) {
        finalSetWindowFeatures.push(currentFeature);
      }
    }
  }

  // in order to prevent XSS, we need to validate the external URL
  if (!isValidHttpUrl(url)) {
    return;
  }
  const newWindow = window.open(url, finalSetWindowFeatures.toString());
  if (newWindow) {
    newWindow.opener = null;
  } else {
    modal.info({
      message,
      title: t('Pop-up blocked?'),
    });
  }
};

const timeout = (callback, ms) => {
  const timer = window.setTimeout(callback, ms);
  return () => window.clearTimeout(timer);
};

const win = {
  get: getPath,
  open,
  set: setPath,
  timeout,
};

export default win;

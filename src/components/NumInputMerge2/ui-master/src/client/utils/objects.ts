const setDeepPropertyValue = (obj, path, value, doCreatePath) => {
  const segments = path.split('.');
  const len = segments.length;

  for (let i = 0; i < len; i++) {
    let propertyFound = false;
    // eslint-disable-next-line no-restricted-syntax
    for (const p in obj) {
      if (p === segments[i]) {
        propertyFound = true;
        if (i === len - 1) {
          obj[p] = value;
          break;
        } else {
          obj = obj[p];
          break;
        }
      }
    }
    if (!propertyFound && doCreatePath) {
      if (i === len - 1) {
        obj[segments[i]] = value;
      } else {
        obj[segments[i]] = {};
        obj = obj[segments[i]];
      }
    }
  }
};

export function updateObjectWithObject(prevObj, updateObj) {
  return $.extend(true, prevObj, updateObj);
}

export function updateObjectWithKeyValue(prevObj, key, value) {
  setDeepPropertyValue(prevObj, key, value, true);
}

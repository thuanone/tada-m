import React from 'react';
import t from '../i18n';

const render = (location) => {
  const translatedValue = value(location);
  return <span>{translatedValue}</span>;
};

const value = (location) => {
  if (location && location.trim) {
    return t(`clg.common.region.${location.trim()}`);
  }

  return '';
};

export default { render, value };

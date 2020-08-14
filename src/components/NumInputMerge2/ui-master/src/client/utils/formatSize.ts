import t from './i18n';

const formatSize = (item) => {
  const bytes = item.virtualSize;
  const k = 1000;
  const dm = 0;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  if (i === 0) {
    return t('{{size}} B', { size });
  } else if (i === 1) {
    return t('{{size}} KB', { size });
  } else if (i === 2) {
    return t('{{size}} MB', { size });
  }
  return t('{{size}} GB', { size });
};

export default formatSize;

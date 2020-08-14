export function toIso(value: string) {
  if (typeof value !== 'string') {
    return null;
  }
  // 20170206164532
  if (/^\d{14}$/.test(value)) {
    const year = value.substr(0, 4);
    const month = value.substr(4, 2);
    const day = value.substr(6, 2);
    const hour = value.substr(8, 2);
    const min = value.substr(10, 2);
    const sec = value.substr(12);
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  }
  // 2017-02-06T16:45:32-0700
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[-+]\d{4})$/.test(value)) {
    return value;
  }
  return null;
}

const dateFormatOptions = {
  day: 'numeric',
  hour: 'numeric',
  hour12: false,
  minute: 'numeric',
  month: 'numeric',
  second: 'numeric',
  year: 'numeric',
};

export function format(value, locale: string, shortened: boolean) {
  // apply a shortened format
  const options = shortened ? dateFormatOptions : undefined;

  if (typeof value === 'number' && (value % 1) === 0) {
    return new Date(value).toLocaleDateString(locale, options);
  }
  const iso = toIso(value);
  if (iso) {
    return new Date(iso).toLocaleDateString(locale, options);
  }
  return value || undefined;
}

const kilobyte = 1000;
const megabyte = kilobyte * 1000;
const gigabyte = megabyte * 1000;
const terabyte = gigabyte * 1000;
const petabyte = terabyte * 1000;
const exabyte = petabyte * 1000;

const kibibyte = 1024;
const mebibyte = kibibyte * 1024;
const gibibyte = mebibyte * 1024;
const tebibyte = gibibyte * 1024;
const pebibyte = tebibyte * 1024;
const exbibyte = pebibyte * 1024;

const unitsToMultiplier = {
  e: exabyte,
  eb: exabyte,
  ei: exbibyte,
  eib: exbibyte,
  g: gigabyte,
  gb: gigabyte,
  gi: gibibyte,
  gib: gibibyte,
  k: kilobyte,
  kb: kilobyte,
  ki: kibibyte,
  kib: kibibyte,
  m: megabyte,
  mb: megabyte,
  mi: mebibyte,
  mib: mebibyte,
  p: petabyte,
  pb: petabyte,
  pi: pebibyte,
  pib: pebibyte,
  t: terabyte,
  tb: terabyte,
  ti: tebibyte,
  tib: tebibyte,
};

class MemoryUtils {
  normalizeUnit(unit) {
    let result = unit;

    if (result && result.length > 0 && result.toLowerCase().endsWith('b')) {
      result = result.substr(0, 2);
    }

    return result ? result.toUpperCase() : result;
  };

  convertValueToNumber(val) {
    let result;
    if (typeof val === 'string' && val.length > 0) {
      const regExp = new RegExp(/([0-9]*\.?[0-9]*)\s*(([kmgtpe]i?b)|([kmgtpe]i?))?/);
      const results = regExp.exec(val.trim().toLowerCase());

      let unit = '';
      if (results.length > 0) {
        if (results.length > 2) {
          unit = this.normalizeUnit(results[2]);
        }
        result = {
          unit: unit ? unit.toUpperCase() : unit,
          value: parseFloat(results[1]),
        };
      }
    }
    return result;
  }
  convertValueToBytes(val) { //takes in e.g. "1 mb" (string) and returns 1000000 (integer)

    const result = this.convertValueToNumber(val);

    if (!result || !result.value) {
      return 0;
    }

    // retrieve the multiplier for the given unit from a static map
    const multiplier = result.unit ? unitsToMultiplier[result.unit.toLowerCase()] : 1;

    // multiply the calculated value with its multiplier in order to get the number of bytes
    const numberOfBytes = result.value * multiplier;

    return numberOfBytes;
  }
  convertNumberToDisplayValueAndUnit(value, useSiUnits, suffix) {
    let intValue = value;
    let displayValue;

    if (!value || isNaN(value)) {
      displayValue = '-';
    } else {

      const divider = useSiUnits ? 1000 : 1024;
      const units = useSiUnits
        ? ['K', 'M', 'G', 'T', 'P', 'E']
        : ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'];

      let i = -1;
      do {
        intValue /= divider;
        ++i;
      } while (Math.abs(intValue) >= divider && i < units.length - 1);

      const maxLen = (`${intValue}`).length;

      if (Number.isInteger(intValue)) {
        displayValue = `${intValue.toFixed(0)}`;
      } else {
        displayValue = `${intValue.toFixed(3)}`;
      }

      displayValue = `${displayValue.substr(0, maxLen)} ${units[i]}`;  // remove unnecessary padding zeros
    }

    if (suffix) {
      displayValue += suffix;
    }

    // this value is transient. the real number stays untouched
    return displayValue;
  }

  convertBytesToUnit(value, unit) {
    if (!unit) {
      return -1;
    }
    const unitMultiplier = unitsToMultiplier[unit.toLowerCase()];
    if (!unitMultiplier) {
      return -1;
    }
    return value / unitsToMultiplier[unit];
  }

  /**
   * Converts the given number of bytes to a rounded whole number of the given target unit, without
   * adding the unit identifier to the resulting string
   *
   * @param bytes
   * @param targetUnit
   */
  convertBytesToDisplayValue(bytes, targetUnit) {
    let divider = unitsToMultiplier[targetUnit];

    if (!divider) {
      divider = mebibyte;
    }
    console.log('bytes',bytes,'targetUnit',targetUnit,'divider',divider)

    return Math.round(bytes / divider);
  }
}

export default MemoryUtils;
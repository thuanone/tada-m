
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



  /**
   * Converts Mi/Gi etc. to our internal mib and gib representation.
   *
   * @param unit
   */
  normalizeUnit(unit: string): string {
    let result: string = unit;

    if (result && result.length > 0 && result.toLowerCase().endsWith('b')) {
      result = result.substr(0, 2);
    }

    return result ? result.toUpperCase() : result;
  }

  /**
   * Tries to convert a string typed into the CustomInputField into a value.
   * Also returns the correct unit value, in case one was given.
   * If undefined is returned, it means no valid number was typed in.
   *
   * @param val
   * @return {Object}   { value: number, unit: string }
   */
  convertValueToNumber(val: string) {
    let result;
    if (typeof val === 'string' && val.length > 0) {
      const regExp = new RegExp(/([0-9]*\.?[0-9]*)\s*(([kmgtpe]i?b)|([kmgtpe]i?))?/);
      const results = regExp.exec(val.trim().toLowerCase());
      let unit: string = '';
      if (results && results.length > 1){
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

  convertValueToBytes(val: string): number {

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

  /**
   * Takes the current number value of the component (internal number) and calculates the proper
   * unit value (highest possible value, i.e. as soon as a value is higher than the nominal value represented by
   * the unit, it will be displayed along with that unit.
   *
   * Example:
   *
   * 998 is displayed as 998
   * 1002 is displayed as 1.002 KB
   * and so forth
   * @param {number} value - the number value that should be converted
   * @return {boolean} useSiUnits - choose whether to use SI units (k, M, G, T, P, E) or IEC units (Ki, Mi, Gi, Ti, Pi, Ei)
   */
  convertNumberToDisplayValueAndUnit(value: any, useSiUnits: boolean = true, suffix?: string): string {
    let intValue: number = value;
    let displayValue: string;

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

  convertBytesToUnit(value: number, unit: string): number {
    if (!unit) {
      return -1;
    }
    const unitMultiplier: number = unitsToMultiplier[unit.toLowerCase()];
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
  convertBytesToDisplayValue(bytes: number, targetUnit: string): number {
    let divider = unitsToMultiplier[targetUnit];

    if (!divider) {
      divider = mebibyte;
    }

    return Math.round(bytes / divider);
  }
}

export default MemoryUtils;
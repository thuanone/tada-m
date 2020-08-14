/**
 * This helper provides functions to deal with CPU units
 * see: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#meaning-of-cpu
 */
const milli = 1000;
const unitsToMultiplier = {
  m: milli,
};

/**
 * Tries to convert a string typed value.
 * Also returns the correct unit value, in case one was given.
 * If undefined is returned, it means no valid number was typed in.
 *
 * @param val
 * @return {Object}   { value: number, unit: string }
 */
function convertValueToNumberAndUnit(val: string) {
  let result;
  if (typeof val === 'string' && val.length > 0) {
    const regExp = new RegExp(/([0-9]*\.?[0-9]*)\s*([m])?/g);
    const results = regExp.exec(val.trim().toLowerCase());
    // console.info(`val: '${val}', results: '${JSON.stringify(results)}'`);
    let unit: string = '';
    if (results.length > 2 && results[0] === val) {
      if (results.length > 2) {
        unit = results[2];
      }
      result = {
        unit: unit ? unit.toLowerCase() : unit,
        value: parseFloat(results[1]),
      };
    }
  }
  return result;
}

export function convertValueToFloat(val: string): number {

  const result = convertValueToNumberAndUnit(val);

  if (!result || !result.value) {
    return 0;
  }

  // retrieve the multiplier for the given unit from a static map
  const multiplier = result.unit ? unitsToMultiplier[result.unit.toLowerCase()] : 1;

  // multiply the calculated value with its multiplier in order to get the number of bytes
  const numberOfCpuUnits = result.value / multiplier;
  // console.info(`val: '${val}': '${result.value}' / '${multiplier}' = '${numberOfCpuUnits}'`);
  return numberOfCpuUnits;
}

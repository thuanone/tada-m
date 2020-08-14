import * as commonValidators from './common-validator';

export class FloatValidator implements commonValidators.IClgFieldValidator {

  public isValid(val: any, rules: commonValidators.IClgNumberFieldRules): commonValidators.IClgValidationResult {

    // trim strings
    if (typeof val === 'string') {
      val = val.trim();
    }

    // first check whether this the given value is not null or empty
    if (val === '' || typeof val === 'undefined' || val === null) {
      return { valid: false, reason: 'NAN' };
    }

    // convert the value into a number
    let numberValue: number;
    try {
      numberValue = this.parseFloatAdvanced(val);
    } catch (err) {
      return { valid: false, reason: 'NAN' };
    }

    // check the lower and upper boundary
    if (numberValue < rules.min) {
      return { valid: false, reason: 'TOOLOW' };
    } else if (numberValue > rules.max) {
      return { valid: false, reason: 'TOOHIGH' };
    }

    return { valid: true, value: numberValue };
  }

  /**
   * This helper function is used to parse floating numbers.
   * It is more accurate than the built-in parseFloat function is it for example is capable of detecting '38.17foo' to be not a number
   * @param val the value that should be parsed to a float
   */
  private parseFloatAdvanced(val: any): number {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(val)) {
      return Number(val);
    }
    throw new Error('NAN');
  }
}

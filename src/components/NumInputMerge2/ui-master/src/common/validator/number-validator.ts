import * as commonValidators from './common-validator';

export class NumberValidator implements commonValidators.IClgFieldValidator {

  public isValid(val: any, rules: commonValidators.IClgNumberFieldRules): commonValidators.IClgValidationResult {

    // trim strings
    if (typeof val === 'string') {
      val = val.trim();
    }

    // first check whether this is a number
    if (val === '' || typeof val === 'undefined' || val === null || !commonValidators.isANumber(val)) {
      return { valid: false, reason: 'NAN' };
    }

    // convert the value into a number
    let numberValue: number;
    try {
      numberValue = parseInt(val, 10);
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
}

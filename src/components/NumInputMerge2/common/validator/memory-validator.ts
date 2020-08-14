import * as memoryUtils from './../utils/memory-utils';
import * as commonValidators from './common-validator';

export class MemoryValidator implements commonValidators.IClgFieldValidator {

  public isValid(val: any, rules: commonValidators.IClgNumberFieldRules): commonValidators.IClgValidationResult {
    // first check whether this is a number
    if (!commonValidators.isANumber(val)) {
      return { valid: false, reason: 'NAN' };
    }

    // convert the mebibyte value into bytes
    const bytes = memoryUtils.convertValueToBytes(`${val}Mi`);

    // check the lower and upper boundary
    if (bytes < rules.min) {
      return { valid: false, reason: 'TOOLOW' };
    } else if (bytes > rules.max) {
      return { valid: false, reason: 'TOOHIGH' };
    }

    return { valid: true, value: val };
  }
}

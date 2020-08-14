import * as commonValidators from './common-validator';

export class TextValidator implements commonValidators.IClgFieldValidator {

  public isValid(val: any, rules: commonValidators.IClgTextFieldRules): commonValidators.IClgValidationResult {
    // first check whether it is empty or null
    if (!rules.emptyAllowed) {
      if (this.isEmpty(val)) {
        return { valid: false, reason: 'EMPTY' };
      }
    } else if (this.isEmpty(val)) {
      return { valid: true, value: val };  // an empty val could be 'null', undefined or '' and we shouldn't auto-convert to undefined here!
    }

    // check whether the regexp matches
    if (rules.regexp) {
      if (!this.matchesRegexp(val, rules.regexp)) {
        return { valid: false, reason: 'REGEXP' };
      }
    }

    // check the lower and upper boundary
    if (rules.minLength && val.length < rules.minLength) {
      return { valid: false, reason: 'TOOSHORT' };
    } else if (rules.maxLength && val.length > rules.maxLength) {
      return { valid: false, reason: 'TOOLONG' };
    }

    return { valid: true, value: val };
  }

  private matchesRegexp(val: string, regexp: string): boolean {
    const match = val.match(regexp);
    // make sure we get a match of the WHOLE value provided not just junks of it
    return match && match[0] === val;
  }

  private isEmpty(val: string): boolean {
    return val === '' || typeof val === 'undefined' || val === null;
  }
}

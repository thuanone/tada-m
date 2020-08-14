import { IKeyValue } from './../../client/view/model/common-view-model';
/**
 * This interface is used to describe a number input field.
 * It can also be used for text field that should only have a number as value
 */
export interface IClgField {
  val: number | string | IKeyValue[];
  invalid?: string;
  rules?: any;   // if the field holds it's own rules and validator references, it can easily be revalidated later
  validator?: any;
}

/**
 * This interface is used to describe a number input field.
 * It can also be used for text field that should only have a number as value
 */
export interface IClgNumberField extends IClgField {
  val: number;
  invalid?: string;
}

/**
 * This interface is used to describe a text input field.
 */
export interface IClgTextField extends IClgField {
  val: string;
  invalid?: string;
}

/**
 * This interface is used to describe a set of key/value fields.
 * It can also be used for text field that should only have a number as value
 */
export interface IClgKeyValueFields extends IClgField {
  val: IKeyValue[];
  invalid?: string;
}

/**
 * This interface is used to describe a validation result.
 * In case the validation failed, the field reason is set, too
 */
export interface IClgValidationResult {
  valid: boolean;
  value?: any;
  reason?: string;
}

/**
 * This interface describe how validators should look like
 */
export interface IClgFieldValidator {
  isValid: (val: any, boundaries: IClgFieldRules) => IClgValidationResult;
}

/**
 * This interface is used as a decorator
 */
// tslint:disable-next-line:no-empty-interface
export interface IClgFieldRules {}

export interface IClgNumberFieldRules extends IClgFieldRules {
  default: number;
  max: number;
  min: number;
}

export interface IClgTextFieldRules extends IClgFieldRules {
  emptyAllowed: boolean;
  maxLength?: number;
  minLength?: number;
  regexp?: string;
}

export function getValidatedTextField(val: any, validator: IClgFieldValidator, rules: IClgFieldRules, storeMetaData: boolean = false): IClgTextField {
  const validation: IClgValidationResult = validator.isValid(val, rules);
  const field: IClgTextField = {
      invalid: validation.valid ? undefined : validation.reason,
      val: validation.valid ? validation.value : val,
  };

  if (storeMetaData) {
    field.rules = rules;
    field.validator = validator;
  }

  return field;
}

export function getValidatedNumberField(val: any, validator: IClgFieldValidator, rules: IClgFieldRules, storeMetaData: boolean = false): IClgNumberField {
  const validation: IClgValidationResult = validator.isValid(val, rules);
  const field: IClgNumberField = {
      invalid: validation.valid ? undefined : validation.reason,
      val: validation.valid ? validation.value : val,
  };

  if (storeMetaData) {
    field.rules = rules;
    field.validator = validator;
  }

  return field;
}

export function validateField(field: IClgField) {
  if (field.rules && field.validator) {
    const validationResult = field.validator.isValid(field.val, field.rules);

    field.invalid = validationResult.valid ? undefined : validationResult.reason;
  }
}

/**
 * util function to check whether the given value is a number
 * @param val true if the given value is of type number
 */
export function isANumber(val: any): boolean {
  return !isNaN(val);
}

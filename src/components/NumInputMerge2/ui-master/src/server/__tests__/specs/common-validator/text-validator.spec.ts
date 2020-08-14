
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidators from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';

describe('common text validator', () => {

  const validator: TextValidator = new TextValidator();

  it('can handle undefined and empty input', () => {

    const rules = coligoValidatorConfig.default.application.name;

    let val = '';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('EMPTY');

    val = undefined;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('EMPTY');

    val = null;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('EMPTY');
  });

  it('allows empty values if the rule comply', () => {

    const rules: commonValidators.IClgTextFieldRules = {
      emptyAllowed: true,
    };

    const val = '';
    const result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();
  });

  it('validates RFC 1123 names', () => {

    const rules = coligoValidatorConfig.default.application.name;

    let val = '123';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc1234';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc-1234';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc-1234-d36d';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc-1234-d36ddfsfsfsdfd-dfdsf-d-f-43-dfsd-fdsfds3423ccds-fdsfsd';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();
  });

  it('rejects string that are not compliant to RFC 1123', () => {

    const rules = coligoValidatorConfig.default.application.name;

    // do not start with alphanumeric
    let val = '-123';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('REGEXP');

    // do not end with alphanumeric
    val = 'abc-';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('REGEXP');

    // only lowercase characters are allowed
    val = 'ABC1234';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('REGEXP');

    // use dashes only
    val = 'abc_1234';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('REGEXP');

  });

  it('checks whether the max length is respected', () => {

    const rules = coligoValidatorConfig.default.application.name;

    // 64 or more characters
    const val = 'abc-1234-d36ddfsfsfsdfd-dfdsf-d-f-43-dfsd-fdsfds3423ccds-fdsfsds';
    const result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLONG');
  });

  it('checks whether the max length is respected', () => {

    const rules: commonValidators.IClgTextFieldRules = {
      emptyAllowed: true,
      minLength: 3,
    };

    // min length of 3
    const val = 'ab';
    const result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOSHORT');
  });

  it('checks whether the image name does not contain whitespaces', () => {

    const rules = coligoValidatorConfig.default.application.image;

    let val = '';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('EMPTY');

    val = 'with space';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('REGEXP');

    val = 'ibmcom/helloworld';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'ibmcom/helloworld:v1';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'docker.io/ibmcom/helloworld:v1';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();
  });

  it('checks whether envar values are validated correctly', () => {

    const rules = coligoValidatorConfig.default.common.keyvalueValue;

    let val = 'some value';
    let result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = Array(1048577).join('x');
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = Array(1048578).join('x');
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
  });
});

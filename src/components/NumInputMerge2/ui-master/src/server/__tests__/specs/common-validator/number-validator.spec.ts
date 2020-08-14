
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidators from '../../../../common/validator/common-validator';
import { NumberValidator } from '../../../../common/validator/number-validator';

describe('common number validator', () => {

  const validator: NumberValidator = new NumberValidator();

  it('can handle undefined and empty input', () => {

    const rules = coligoValidatorConfig.default.application.minScale;

    let val = '';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = ' ';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = undefined;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = null;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = '0';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = 'abc';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = '1e1'; // equals 10
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = '1.1';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = '1a1'; // equals bullshit
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();

    val = '1,1';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
  });

  it('detects values that are too small', () => {

    const rules = coligoValidatorConfig.default.application.minScale;

    const val: number | string = rules.min - 1;
    const result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLOW');
  });

  it('detects values that are too large', () => {

    const rules = coligoValidatorConfig.default.application.minScale;

    const val = rules.max + 1;
    const result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOHIGH');
  });

  it('approves values that are within the rules', () => {

    const rules = coligoValidatorConfig.default.application.memory;

    let val = rules.max;
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = rules.min;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = rules.default;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();
  });
});

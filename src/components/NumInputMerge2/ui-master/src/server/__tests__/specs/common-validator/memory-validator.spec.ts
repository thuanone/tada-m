
import * as memoryUtils from '../../../../common/utils/memory-utils';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidators from '../../../../common/validator/common-validator';
import { MemoryValidator } from './../../../../common/validator/memory-validator';

describe('common memory validator', () => {

  const validator: MemoryValidator = new MemoryValidator();

  it('can handle undefined and empty input', () => {

    const rules = coligoValidatorConfig.default.application.memory;

    let val = '';
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLOW');

    val = undefined;
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');

    val = '0';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLOW');

    val = 'abc';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('NAN');
  });

  it('detects values that are too small', () => {

    const rules = coligoValidatorConfig.default.application.memory;

    let val: number | string = memoryUtils.convertBytesToUnit(rules.min - 1, 'mi');
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLOW');

    val = '1';
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOLOW');
  });

  it('detects values that are too large', () => {

    const rules = coligoValidatorConfig.default.application.memory;

    const val = memoryUtils.convertBytesToUnit(rules.max + 1, 'mi');
    const result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeFalsy();
    expect(result.reason).toEqual('TOOHIGH');
  });

  it('approves values that are within the rules', () => {

    const rules = coligoValidatorConfig.default.application.memory;

    let val = memoryUtils.convertBytesToUnit(rules.max, 'mi');
    let result: commonValidators.IClgValidationResult = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = memoryUtils.convertBytesToUnit(rules.min, 'mi');
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();

    val = memoryUtils.convertBytesToUnit(rules.default, 'mi');
    result = validator.isValid(val, rules);
    expect(result).toBeDefined();
    expect(result.valid).toBeTruthy();
  });
});

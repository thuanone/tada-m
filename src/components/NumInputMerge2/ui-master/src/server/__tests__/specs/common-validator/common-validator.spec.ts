
import * as commonValidators from '../../../../common/validator/common-validator';
import { NumberValidator } from '../../../../common/validator/number-validator';
import { TextValidator } from '../../../../common/validator/text-validator';

describe('common validator', () => {

  const textValidator: TextValidator = new TextValidator();
  const numberValidator: NumberValidator = new NumberValidator();

  it('can check whether an input is a number', () => {

    let val = '12';
    let result: boolean = commonValidators.isANumber(val);
    expect(result).toBeTruthy();

    val = 'aa';
    result = commonValidators.isANumber(val);
    expect(result).toBeFalsy();
  });

  it('can store validator and ruleset in the text field and ease re-validations', () => {

    const rules: commonValidators.IClgTextFieldRules = {
      emptyAllowed: false,
    };

    const val = '';
    const field: commonValidators.IClgTextField = commonValidators.getValidatedTextField(val, textValidator, rules, true);
    expect(field).toBeDefined();
    expect(field.invalid).toBeDefined();

    // now change the value
    field.val = 'some';
    commonValidators.validateField(field);
    expect(field.invalid).toBeUndefined();
  });

  it('can store validator and ruleset in the number field and ease re-validations', () => {

    const rules: commonValidators.IClgNumberFieldRules = {
      default: 2,
      max: 3,
      min: 1,
    };

    const val = 0;
    const field: commonValidators.IClgNumberField = commonValidators.getValidatedNumberField(val, numberValidator, rules, true);
    expect(field).toBeDefined();
    expect(field.invalid).toBeDefined();

    // now change the value
    field.val = 2;
    commonValidators.validateField(field);
    expect(field.invalid).toBeUndefined();
  });
});

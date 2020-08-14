const assert = require('assert');

module.exports.assertion = function assertion(selector, expected, msg) {
  this.message = msg || `Testing if element <${selector}> text matches regex "${expected}".`;
  this.expected = expected;

  this.pass = function passFn(value) {
    return expected.test(value);
  };

  this.value = function valueFn(result) {
    return result && result.value;
  };

  this.command = function commandFn(callback) {
    return this.api.getText(selector, result => {
      assert(result && result.value, `Selector <${selector}> not found.`);
      callback(result);
    });
  };
};

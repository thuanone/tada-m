const assert = require('assert');

module.exports.assertion = function assertion(selector, attribute, expected, msg) {
  this.message = msg || `Testing if element <${selector}> attribute <${attribute}> matches regex "${expected}".`;
  this.expected = expected;

  this.pass = function passFn(value) {
    return expected.test(value);
  };

  this.value = function valueFn(result) {
    return result && result.value;
  };

  this.command = function commandFn(callback) {
    return this.api.getAttribute(selector, attribute, result => {
      assert(result && result.value, `Selector <${selector}> attribute <${attribute}> not found.`);
      callback(result);
    });
  };
};

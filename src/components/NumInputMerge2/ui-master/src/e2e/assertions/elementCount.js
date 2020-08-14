// Test that a given CSS selector matches a given number of elements
// - `expected` can be a number or function that will receive the number of matches
module.exports.assertion = function assertion(selector, expected, msg) {
  this.message = msg || `Testing if element <${selector}> occurs ${expected} times.`;
  this.expected = expected;

  this.pass = function passFn(value) {
    return typeof this.expected === 'function' ? this.expected(value) : value === expected;
  };

  this.value = function valueFn(result) {
    return result && result.value && result.value.length || 0;
  };

  this.command = function commandFn(callback) {
    return this.api.elements('css selector', selector, callback);
  };
};

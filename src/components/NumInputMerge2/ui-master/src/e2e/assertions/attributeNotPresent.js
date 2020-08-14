module.exports.assertion = function assertion(selector, attribute, msg) {
  this.message = msg || `Testing if element <${selector}> does not have attribute <${attribute}>.`;
  this.expected = false;

  this.pass = function passFn(value) {
    return value === this.expected;
  };

  this.value = function valueFn(result) {
    return !!(result && result.value);
  };

  this.command = function commandFn(callback) {
    return this.api.getAttribute(selector, attribute, result => {
      callback(result);
    });
  };
};

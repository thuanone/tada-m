module.exports.assertion = function assertion(selector, attribute, msg) {
  this.message = msg || `Testing if element <${selector}> has attribute <${attribute}>.`;
  this.expected = true;

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

module.exports.assertion = function assertion(msg) {
  this.message = msg || 'Testing if document is ready.';
  this.expected = 'complete';

  this.pass = function passFn(value) {
    return value === this.expected;
  };

  this.value = function valueFn(result) {
    return result && result.value;
  };

  this.command = function commandFn(callback) {
    return this.api.execute('return document.readyState', [], callback);
  };
};

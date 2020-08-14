const request = require('request');
const assert = require('assert');

module.exports.assertion = function assertion(selector, msg) {
  this.message = msg || `Testing if link <${selector}> is valid.`;
  this.expected = true;

  this.pass = function passFn(value) {
    return value === this.expected;
  };

  this.value = function valueFn(result) {
    return result;
  };

  this.command = function commandFn(callback) {
    return this.api.getAttribute(selector, 'href', href => {
      assert(href && href.value, `Selector <${selector}> not found.`);
      return this.api.perform(() => {
        request.head(href.value, (e, r) => this.api.log(`${href.value} => ${r.statusCode}`).perform(() => {
          // TODO: due to redirects and authentication and whatnot we can't simply
          // rely on a request to determine if the link is valid. We need to come up
          // with a better solution.
          callback(true);
        }));
      });
    });
  };
};

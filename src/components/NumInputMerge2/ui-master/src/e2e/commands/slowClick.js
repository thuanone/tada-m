module.exports.command = function command(selector) {
  return this.getLocationInView(selector)
    .pause(1000)
    .click(selector)
    .pause(1000);
};

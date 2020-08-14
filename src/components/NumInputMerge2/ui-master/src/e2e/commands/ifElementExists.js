module.exports.command = function command(selector, ifFound, ifNotFound) {
  const self = this;
  return this.element('css selector', selector, result => {
    if (result.value && result.value.ELEMENT) {
      ifFound.call(self);
    } else if (ifNotFound) {
      ifNotFound.call(self);
    }
  });
};

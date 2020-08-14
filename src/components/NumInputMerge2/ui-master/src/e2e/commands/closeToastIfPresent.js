module.exports.command = function command() {
  const self = this;
  return this.element('css selector', 'div.bx--toast-notification', result => {
    if (result.value && result.value.ELEMENT) {
      self.slowClick({
        selector: 'div.bx--toast-notification button.bx--toast-notification__close-button',
        locateStrategy: 'css selector',
      });
    }
  });
};

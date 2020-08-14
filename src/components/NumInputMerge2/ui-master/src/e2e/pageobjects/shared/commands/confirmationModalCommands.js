module.exports = [{
  waitUntilLoaded: function() {
    this.api.waitForElementVisible(this.elements.closeButton)
      .waitForElementVisible(this.elements.okButton)
      .waitForElementVisible(this.elements.cancelButton);

    return this;
  },

  confirm: function() {
    this.api.waitForElementVisible(this.elements.okButton)
      .click(this.elements.okButton)
      .waitForElementNotVisible(this.elements.okButton);

    return this;
  },

  cancel: function() {
    this.api.waitForElementVisible(this.elements.cancelButton)
      .click(this.elements.cancelButton)
      .waitForElementNotVisible(this.elements.cancelButton);

    return this;
  },

  closeDialog: function() {
    this.api.waitForElementVisible(this.elements.closeButton)
      .click(this.elements.closeButton)
      .waitForElementNotVisible(this.elements.closeButton);

    return this;
  }
}];

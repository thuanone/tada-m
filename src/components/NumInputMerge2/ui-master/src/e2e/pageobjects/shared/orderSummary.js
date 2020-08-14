/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "section.pal--order-summary-v2",
  locateStrategy: "css selector",

  elements: {
    title: {
      selector: "p.pal--order-header-title",
      locateStrategy: "css selector",
    },

    cancelBtn: {
      selector: "div.pal--order-summary-v2__footer button.bx--btn--secondary",
      locateStrategy: "css selector",
    },

    okBtn: {
      selector: "div.pal--order-summary-v2__footer button.bx--btn--primary",
      locateStrategy: "css selector",
    },

    loadingText: {
      selector: "div.bx--inline-loading div.bx--inline-loading__text",
      locateStrategy: "css selector",

    },
  },

  commands: {
    assertOkButtonEnabled: function(enabled) {
      if (!enabled) {
        this.api.assert.cssClassPresent(this.elements.okBtn, 'bx--btn--disabled');
      } else {
        this.api.assert.not.cssClassPresent(this.elements.okBtn, 'bx--btn--disabled');
      }

      return this;
    },

    waitForLoadingDone: function() {
      this.api.waitForElementVisible(this.elements.loadingText, 2000)
        .waitForElementNotPresent(this.elements.loadingText, 50000, 2000);

      return this;
    },

    submit: function() {
      this.api.waitForElementVisible(this.elements.okBtn)
        .click(this.elements.okBtn);

      return this;
    },

    cancel: function() {
      this.api.waitForElementVisible(this.elements.cancelBtn)
        .click(this.elements.cancelBtn);

      return this;
    },
  },
};

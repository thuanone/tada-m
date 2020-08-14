module.exports = {
  url: function() {
    return '';
  },

  elements: [
    {
      toastWindow: {
        selector: 'div.bx--toast-notification',
        locateStrategy: 'css selector',
      },

      closeButton: {
        selector: 'div.bx--toast-notification button.bx--toast-notification__close-button',
        locateStrategy: 'css selector',
      },

      title: {
        selector: 'div.bx--toast-notification div.bx--toast-notification__details  div.bx--toast-notification__title',
        locateStrategy: 'css selector',
      },

      subtitle: {
        selector: 'div.bx--toast-notification div.bx--toast-notification__details  div.bx--toast-notification__subtitle',
        locateStrategy: 'css selector',
      },

      caption: {
        selector: 'div.bx--toast-notification div.bx--toast-notification__details  div.bx--toast-notification__caption',
        locateStrategy: 'css selector',
      },
    },
  ],

  commands: [{
    /* info / warning / error / success */
    assertToastType: function(expectedType) {
      this.api.assert.elementPresent(this.elements.toastWindow);
      this.api.assert.cssClassPresent(this.elements.toastWindow, 'bx--toast-notification--' + expectedType);

      return this;
    },

    assertToastTitle: function(expectedTitle) {
      this.api.assert.elementPresent(this.elements.toastWindow);
      this.api.assert.containsText(this.elements.title, expectedTitle);

      return this;
    },

    assertToastSubtitle: function(expectedSubtitle) {
      this.api.assert.elementPresent(this.elements.toastWindow);
      this.api.assert.containsText(this.elements.subtitle, expectedSubtitle);

      return this;
    },

    assertToastCaption: function(expectedCaption) {
      this.api.assert.elementPresent(this.elements.toastWindow);
      this.api.assert.containsText(this.elements.caption, expectedCaption);

      return this;
    },

    closeToast: function() {
      this.api.assert.elementPresent(this.elements.toastWindow);
      this.api.click(this.elements.closeButton);
      this.api.waitForElementNotPresent(this.elements.toastWindow);

      return this;
    },
  }],
};

// replace 'toast' with 'inline' and you have the code for the inline notification section!

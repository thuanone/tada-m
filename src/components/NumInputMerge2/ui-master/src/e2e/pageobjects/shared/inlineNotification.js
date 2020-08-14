module.exports = {
  selector: 'div.bx--inline-notification',
  locateStrategy: 'css selector',

  elements: [
    {
      notification: {
        selector: 'div.bx--inline-notification',
        locateStrategy: 'css selector',
      },

      closeButton: {
        selector: 'div.bx--inline-notification button.bx--inline-notification__close-button',
        locateStrategy: 'css selector',
      },

      title: {
        selector: 'div.bx--inline-notification div.bx--inline-notification__details  div.bx--inline-notification__title',
        locateStrategy: 'css selector',
      },

      subtitle: {
        selector: 'div.bx--inline-notification div.bx--inline-notification__details  div.bx--inline-notification__subtitle',
        locateStrategy: 'css selector',
      },

      caption: {
        selector: 'div.bx--inline-notification div.bx--inline-notification__details  div.bx--inline-notification__caption',
        locateStrategy: 'css selector',
      },
    },
  ],

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.notification);

      return this;
    },

    /* info / warning / error / success */
    assertNotificationType: function(expectedType) {
      this.api.assert.elementPresent(this.elements.notification);
      this.api.assert.cssClassPresent(this.elements.notification, 'bx--inline-notification--' + expectedType);

      return this;
    },

    assertNotificationTitle: function(expectedTitle) {
      this.api.assert.elementPresent(this.elements.notification);
      this.api.assert.containsText(this.elements.title, expectedTitle);

      return this;
    },

    assertNotificationSubtitle: function(expectedSubtitle) {
      this.api.assert.elementPresent(this.elements.notification);
      this.api.assert.containsText(this.elements.subtitle, expectedSubtitle);

      return this;
    },

    assertNotificationCaption: function(expectedCaption) {
      this.api.assert.elementPresent(this.elements.notification);
      this.api.assert.containsText(this.elements.caption, expectedCaption);

      return this;
    },

    closeNotification: function() {
      this.api.assert.elementPresent(this.elements.notification);
      this.api.click(this.elements.closeButton);
      this.api.waitForElementNotPresent(this.elements.notification);

      return this;
    },
  }],
};

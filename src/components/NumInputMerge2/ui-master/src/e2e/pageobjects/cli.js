const worldNav = require('./shared/worldNav');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/cli';
  },

  elements: [{
    downloadCliBtn: {
      selector: 'header.pal--page-header div.pal--page-header__actions a.cli-page--action-link',
      locateStrategy: 'css selector',
    },

    pageTitle: {
      selector: 'h1.pal--page-header__title-text',
      locateStrategy: 'css selector',
    },
  }],

  sections: {
    worldNav,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.pageTitle)
        .waitForElementVisible(this.elements.downloadCliBtn);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },
  }],
};

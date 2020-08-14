const worldNav = require('./shared/worldNav');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/create/component';
  },

  elements: [{
    pageTitle: {
      selector: 'h1.pal--page-header__title-text',
      locateStrategy: 'css selector',
    },

    componentTypeSelector: {
      selector: 'fieldset.clg-type-selector-group',
      locateStrategy: 'css selector',
    }
  }],

  sections: {
    worldNav,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.componentTypeSelector);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },
  }],
};

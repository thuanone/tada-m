const worldNav = require('./shared/worldNav');
const orderSummary = require('./shared/orderSummary');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/create/project';
  },

  elements: [{

    experimentalLimitsBanner: {
      selector: '.banner--experimental-limitations',
      locateStrategy: 'css selector'
    },

    projectName: {
      selector: '#create-project-name',
      locateStrategy: 'css selector'
    },

    tags: {
      selector: '#project-tags',
      locateStrategy: 'css selector'
    },

    resourceGroupLoading: {
      selector: 'div.clg-resource-group-selector div.bx--skeleton.bx--dropdown-v2',
      locateStrategy: 'css selector',
    },

    resourceGroup: {
      selector: '#resource-group_selector div.bx--list-box__menu-icon',
      locateStrategy: 'css selector'
    },

    resourceGroupLabel: {
      selector: '#resource-group_selector span.bx--list-box__label',
      locateStrategy: 'css selector'
    },

    resourceGroupMenu: {
      selector: '#resource-group_selector',
      locateStrategy: 'css selector'
    },

    resourceGroupMenuItem: {
      selector: '#resource-group_selector div.bx--list-box__menu-item',
      locateStrategy: 'css selector'
    },

    regionLoading: {
      selector: 'div.clg-region-selector div.bx--skeleton.bx--dropdown-v2',
      locateStrategy: 'css selector',
    },

    region: {
      selector: '#region_selector div.bx--list-box__menu-icon',
      locateStrategy: 'css selector'
    },

    regionLabel: {
      selector: '#region_selector span.bx--list-box__label',
      locateStrategy: 'css selector'
    },

    regionMenu: {
      selector: '#region_selector__menu',
      locateStrategy: 'css selector'
    },

    regionMenuItem: {
      selector: '#region_selector__menu div.bx--list-box__menu-item__option',
      locateStrategy: 'css selector'
    },

    pageTitle: {
      selector: 'h1.pal--page-header__title-text',
      locateStrategy: 'css selector',
    },
  }],
  sections: {
    worldNav,
    orderSummary,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.projectName)
        .waitForElementVisible(this.elements.experimentalLimitsBanner)
        .waitForElementVisible(this.elements.tags)
        .waitForElementNotPresent(this.elements.resourceGroupLoading)
        .waitForElementNotPresent(this.elements.regionLoading);
      this.closeToastIfPresent();

      return this;
    },

    assertCreateButtonEnabled: function(enabled) {
      this.section.orderSummary.assertOkButtonEnabled(enabled);

      return this;
    },

    clickCancelButton: function() {
      this.section.orderSummary.cancel();

      return this;
    },

    clickCreateButton: function() {
      this.section.orderSummary.submit();

      return this;
    },

    setProjectName: function(projName) {
      this.api.clearValue(this.elements.projectName, () => {
        this.api.setValue(this.elements.projectName, projName);
      });

      return this;
    },

    selectResourceGroup: function(resGroup) {
      const selector = `//div[contains(@id, 'resource-group_selector')]//div[contains(@class, 'bx--list-box__menu-item') and contains(@title, '${resGroup}')]`;
      //div[@id='resource-group_selector__menu']//div[contains(@class, 'bx--list-box__menu-item') and contains(@title, '${resGroup}')]`;
      this.api.waitForElementVisible(this.elements.resourceGroup);
      this.slowClick(this.elements.resourceGroup)
        .waitForElementVisible({
          selector,
          locateStrategy: 'xpath'
        })
        .click({
          selector,
          locateStrategy: 'xpath'
        })
        .pause(200);

      return this;
    },

    selectLocation: function(location) {
      const selector = `//div[contains(@id, 'region_selector')]//div[contains(@class, 'bx--list-box__menu-item') and contains(@title, '${location}')]`;
      this.api.waitForElementVisible(this.elements.region);
      this.slowClick(this.elements.region)
        .waitForElementVisible({
          selector,
          locateStrategy: 'xpath'
        })
        .click({
           selector,
           locateStrategy: 'xpath'
        })
        .pause(200);

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },

    waitForLoadingDone: function() {
      this.section.orderSummary.waitForLoadingDone();

      return this;
    },
  }],
};

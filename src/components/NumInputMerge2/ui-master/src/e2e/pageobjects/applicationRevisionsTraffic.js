const applicationNav = require('./shared/applicationNav');
const breadcrumbs = require('./shared/breadcrumbs');
const dataTable = require('./shared/dataTable');
const pageActions = require('./shared/pageActions');

module.exports = {
  url: function() {
    return '';
  },

  elements: [{
    pageTitle: {
      selector: 'h1.pal--page-header__title-text',
      locateStrategy: 'css selector',
    },

    applicationUrlBtn: {
      selector: 'a#launch-application-url',
      locateStrategy: 'css selector',
    },

    statusDetails: {
      selector: 'div.pal--page-header__surfaced-details div.clg-item--status-caption',
      locateStrategy: 'css selector',
    },

    statusInstances: {
      selector: 'span.resource-status--instances button',
      locateStrategy: 'css selector',
    },

    tableSkeleton: {
      selector: 'table.bx--skeleton',
      locateStrategy: 'css selector'
    },
  }],

  sections: {
    applicationNav,
    breadcrumbs,
    dataTable,
    pageActions,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.section.breadcrumbs.waitUntilLoaded();
      this.closeToastIfPresent();

      this.api.waitForElementVisible(this.elements.applicationUrlBtn)
        .waitForElementNotPresent(this.elements.tableSkeleton, 5000, 100, false);

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },

    assertBreadcrumbs: function(expectedBreadcrumbs) {
      this.section.breadcrumbs.assertBreadcrumbs(expectedBreadcrumbs);

      return this;
    },

    clickApplicationUrlButton: function() {
      this.api.expect.element(this.elements.applicationUrlBtn).to.be.visible;
      this.click(this.elements.applicationUrlBtn);

      return this;
    },

    deleteApplication: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

    gotoRevision: function(name, callback) {
      this.section.dataTable.filterTable(name)
        .clickRow(0, callback);

      return this;
    },

  }],
};

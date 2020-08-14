const dataTable = require('./shared/dataTable');
const worldNav = require('./shared/worldNav');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/projects';
  },

  elements: [
    {
      createProjectBtn: {
        selector: '#create-project',
        locateStrategy: 'css selector'
      },

      learnAboutProjectsLink: {
        selector: "div.empty-state-card--morelink > a",
        locateStrategy: 'css selector'
      },

      tableSkeleton: {
        selector: 'table.bx--skeleton',
        locateStrategy: 'css selector'
      },

      pageTitle: {
        selector: 'h1.pal--page-header__title-text',
        locateStrategy: 'css selector',
      },
    },
  ],
  sections: {
    dataTable,
    worldNav,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementNotPresent(this.elements.tableSkeleton, 5000, 100, false);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },

    createNewProject: function() {
      this.api.waitForElementVisible(this.elements.createProjectBtn)
        .click(this.elements.createProjectBtn);
    },

    // filters down the list, by putting the name inside the filter input and then clicks on the first row
    gotoProject: function(name, callback) {
      this.section.dataTable.filterTable(name)
        .clickRow(0, callback);

      return this;
    },

    waitForProjectToBecomeActive: function(name) {
      this.section.dataTable.waitForRowToHaveStatus(name, 'Active');

      return this;
    },

    ifProjectExists: function(name, ifExists, ifNotExists) {
      this.section.dataTable.ifRowExists(name, ifExists, ifNotExists);

      return this;
    },
  }],
};

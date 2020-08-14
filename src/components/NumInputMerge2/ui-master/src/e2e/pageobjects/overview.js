const worldNav = require('./shared/worldNav');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/overview';
  },

  elements: [
    {
      viewTutorialsLink: {
        selector: '#view-tutorials',
        locateStrategy: 'css selector'
      },
      createProjectBtn: {
        selector: '#create-project',
        locateStrategy: 'css selector'
      },
      createApplicationBtn: {
        selector: '#create-application',
        locateStrategy: 'css selector'
      },
      createJobDefinitionBtn: {
        selector: '#create-jobdefinition',
        locateStrategy: 'css selector'
      },

      pageTitle: {
        selector: 'h1.pal--page-header__title-text',
        locateStrategy: 'css selector',
      },
    },
  ],
  sections: {
    worldNav,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.createProjectBtn, 20000, 500);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },

    navToProjects: function() {
      this.section.worldNav.click('@projects');

      return this;
    },
  }],
};

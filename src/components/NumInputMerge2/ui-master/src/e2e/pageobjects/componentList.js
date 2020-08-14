const breadcrumbs = require('./shared/breadcrumbs');
const dataTable = require('./shared/dataTable');
const pageActions = require('./shared/pageActions');
const projectNav = require('./shared/projectNav');

module.exports = {
  url: function() {
    return '';  // cannot navigate to this directly
  },

  elements: [
    {
      createApplicationBtn: {
        selector: '#create-application',
        locateStrategy: 'css selector'
      },
      createJobDefinitionBtn: {
        selector: '#create-job-definition',
        locateStrategy: 'css selector'
      },

      tableSkeleton: {
        selector: 'table.bx--skeleton',
        locateStrategy: 'css selector'
      },
    },
  ],
  sections: {
    breadcrumbs,
    dataTable,
    pageActions,
    projectNav,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.section.breadcrumbs.waitUntilLoaded();
      this.section.projectNav.waitUntilLoaded();
      this.api.waitForElementNotPresent(this.elements.tableSkeleton, 15000, 100, false);

      this.closeToastIfPresent();

      return this;
    },

    assertBreadcrumbs: function(expectedBreadcrumbs) {
      this.section.breadcrumbs.assertBreadcrumbs(expectedBreadcrumbs);

      return this;
    },

    createApplication: function() {
      this.api.assert.elementPresent(this.elements.createApplicationBtn);
      this.api.click(this.elements.createApplicationBtn);

      return this;
    },

    createJobDefinition: function() {
      this.api.assert.elementPresent(this.elements.createJobDefinitionBtn);
      this.api.click(this.elements.createJobDefinitionBtn);

      return this;
    },

    deleteProject: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

    gotoComponent: function(name) {
      this.section.dataTable.filterTable(name, 1)
        .clickRow(0);

      return this;
    },

    navToJobList: function() {
      this.section.projectNav.click('@jobs');

      return this;
    },

    ifComponentExists: function(name, ifExists, ifNotExists) {
      this.section.dataTable.ifRowExists(name, ifExists, ifNotExists);

      return this;
    },
  }],
};

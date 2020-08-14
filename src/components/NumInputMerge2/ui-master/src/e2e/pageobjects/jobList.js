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
      createProjectBtn: {
        selector: '#create-project',
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
      this.closeToastIfPresent();

      this.api.waitForElementNotPresent(this.elements.tableSkeleton, 5000, 100, false);

      return this;
    },

    assertBreadcrumbs: function(expectedBreadcrumbs) {
      this.section.breadcrumbs.assertBreadcrumbs(expectedBreadcrumbs);

      return this;
    },

    gotoJob: function(jobName) {
      this.section.dataTable.filterTable(jobName)
        .clickRow(0);

      return this;
    },

    navToComponentList: function() {
      this.section.projectNav.click('@components');

      return this;
    },

    deleteProject: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

    ifJobRunExists: function(name, ifExists, ifNotExists) {
      this.section.dataTable.ifRowExists(name, ifExists, ifNotExists);

      return this;
    },
  }],
};

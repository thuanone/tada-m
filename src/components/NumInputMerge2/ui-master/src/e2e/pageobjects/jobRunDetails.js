const breadcrumbs = require('./shared/breadcrumbs');
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

    statusDetails: {
      selector: 'div.pal--page-header__surfaced-details span.clg-item--caption',
      locateStrategy: 'css selector',
    },

    pending: {
      selector: '#job-instances-pending',
      locateStrategy: 'css selector',
    },

    running: {
      selector: '#job-instances-running',
      locateStrategy: 'css selector',
    },

    completed: {
      selector: '#job-instances-succeeded',
      locateStrategy: 'css selector',
    },

    failed: {
      selector: '#job-instances-failed',
      locateStrategy: 'css selector',
    },

    startTime: {
      selector: '#job-start-date',
      locateStrategy: 'css selector',
    },

    endTime: {
      selector: '#job-completion-date',
      locateStrategy: 'css selector',
    },

    viewLogsLink: {
      selector: 'a#job-logs-link',
      locateStrategy: 'css selector',
    },

    imageUrl: {
      selector: '#job-image',
      locateStrategy: 'css selector',
    },

    commands: {
      selector: '#job-command div.clg-expandable-section__items',
      locateStrategy: 'css selector',
    },

    noCommands: {
      selector: '#job-command div.clg-no-items',
      locateStrategy: 'css selector',
    },

    commandsTile: {
      selector: 'button#job-command',
      locateStrategy: 'css selector',
    },

    arraySize: {
      selector: '#job-arraysize',
      locateStrategy: 'css selector',
    },

    arraySpec: {
      selector: '#job-arraysize',
      locateStrategy: 'css selector',
    },

    memory: {
      selector: '#job-memory',
      locateStrategy: 'css selector',
    },

    cpus: {
      selector: '#job-cpus',
      locateStrategy: 'css selector',
    },

    retries: {
      selector: '#job-retries',
      locateStrategy: 'css selector',
    },

    timeout: {
      selector: '#job-timeout',
      locateStrategy: 'css selector',
    },

    arguments: {
      selector: '#job-arguments div.clg-expandable-section__items',
      locateStrategy: 'css selector',
    },

    noArguments: {
      selector: '#job-arguments div.clg-no-items',
      locateStrategy: 'css selector',
    },

    argumentsTile: {
      selector: 'button#job-arguments',
      locateStrategy: 'css selector',
    },

    noEnvironmentVariables: {
      selector: 'div.clg-jobrun-environment div.clg-no-items',
      locateStrategy: 'css selector',
    }
  }],

  sections: {
    breadcrumbs,
    pageActions,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.section.breadcrumbs.waitUntilLoaded();
      this.closeToastIfPresent();

      this.api
        .waitForElementVisible(this.elements.pageTitle)
        .waitForElementVisible(this.elements.pending)
        .waitForElementVisible(this.elements.running)
        .waitForElementVisible(this.elements.completed)
        .waitForElementVisible(this.elements.failed);

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

    assertJobRunStatus: function(expectedStatus) {
      this.api.assert.containsText(this.elements.statusDetails, expectedStatus);

      return this;
    },

    assertNoEnvironmentVariables: function() {
      this.api.assert.elementVisible(this.elements.noEnvironmentVariables);

      return this;
    },

    assertEnvironmentVariables: function(/* Array of string */ expectedNamesAndValues) {
      let idx = 0;
      for (const param of expectedNamesAndValues) {
        this.api.assert.containsText({
          selector: `div#env-param-${idx}-key`,
          locateStrategy: 'css selector',
        }, param.name);

        this.api.assert.containsText({
          selector: `div#env-param-${idx}-value`,
          locateStrategy: 'css selector',
        }, param.value);

        idx += 1;
      }

      return this;
    },

    deleteJobRun: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

    assertPendingInstances: function(expectedPending) {
      this.api.assert.containsText(this.elements.pending, expectedPending);

      return this;
    },

    assertRunningInstances: function(expectedRunning) {
      this.api.assert.containsText(this.elements.running, expectedRunning);

      return this;
    },

    assertCompletedInstances: function(expectedCompleted) {
      this.api.assert.containsText(this.elements.completed, expectedCompleted);

      return this;
    },

    assertFailedInstances: function(expectedFailed) {
      this.api.assert.containsText(this.elements.failed, expectedFailed);

      return this;
    },

    assertImageUrl: function(expectedUrl) {
      this.api.assert.containsText(this.elements.imageUrl, expectedUrl);

      return this;
    },

    assertCommands: function(/* Array of string */ expectedCommands) {
      const cmdStr = expectedCommands.join('\n');

      this.api.assert.containsText(this.elements.commands, cmdStr);

      return this;
    },

    assertArraySize: function(expectedSize) {
      this.api.assert.containsText(this.elements.arraySize, expectedSize);

      return this;
    },

    assertArraySpec: function(expectedArraySpec) {
      this.api.assert.containsText(this.elements.arraySpec, expectedArraySpec);

      return this;
    },

    assertMemory: function(expectedMemory) {
      this.api.assert.containsText(this.elements.memory, expectedMemory);

      return this;
    },

    assertCpus: function(expectedCpus) {
      this.api.assert.containsText(this.elements.cpus, expectedCpus);

      return this;
    },

    assertRetries: function(expectedRetries) {
      this.api.assert.containsText(this.elements.retries, expectedRetries);

      return this;
    },

    assertTimeout: function(expectedTimeout) {
      this.api.assert.containsText(this.elements.timeout, expectedTimeout);

      return this;
    },

    assertArguments: function(/* Array of string */ expectedArguments) {
      const argsStr = expectedArguments.join('\n');

      this.api.assert.containsText(this.elements.arguments, argsStr);

      return this;
    },

    clickViewLogs: function() {
      this.api.click(this.elements.viewLogsLink);

      return this;
    },

    toggleCommandsSection: function() {
      this.api.click(this.elements.commandsTile);

      return this;
    },

    toggleArgumentsSection: function() {
      this.api.click(this.elements.argumentsTile);

      return this;
    },
  }],
};

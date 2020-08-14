const applicationNav = require('./shared/applicationNav');
const breadcrumbs = require('./shared/breadcrumbs');
const environmentVariables = require('./shared/environmentVariables');
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
      selector: 'div.pal--page-header__surfaced-details div.clg-item--status-caption',
      locateStrategy: 'css selector',
    },

    statusInstances: {
      selector: 'span.resource-status--instances button',
      locateStrategy: 'css selector',
    },

    applicationUrlBtn: {
      selector: 'a#launch-application-url',
      locateStrategy: 'css selector',
    },

    createNewRevisionBtn: {
      selector: 'button.create-newrevision-btn',
      locateStrategy: 'css selector',
    },

    revisionName: {
      selector: 'input#revision-name:enabled',
      locateStrategy: 'css selector',
    },

    deployChangesBtn: {
      selector: 'button.save-newrevision-btn',
      locateStrategy: 'css selector',
    },

    cancelChangesBtn: {
      selector: 'button.cancel-newrevision-btn',
      locateStrategy: 'css selector',
    },

    invokeApplicationBtn: {
      selector: 'button.invoke-application-btn',
      locateStrategy: 'css selector',
    },

    revisionSelectorLoading: {
      selector: 'div.application-revision-loading',
      locateStrategy: 'css selector',
    },

    revisionSelector: {
      selector: '#application-revision_selector div.bx--list-box__menu-icon',
      locateStrategy: 'css selector'
    },

    revisionSelectorLabel: {
      selector: '#application-revision_selector span.bx--list-box__label',
      locateStrategy: 'css selector'
    },

    revisionSelectorMenu: {
      selector: '#application-revision_selector button',
      locateStrategy: 'css selector'
    },

    revisionSelectorMenuItem: {
      selector: '#application-revision_selector bx--list-box__menu-item',
      locateStrategy: 'css selector'
    },

    pendingInvocationResult: {
      selector: 'div.section.invocations div.application-invoke--invocations div.application-invoke--invocations__result.invocation-result.invocation-result__pending',
      locateStrategy: 'css selector',
    },

    tabCode: {
      selector: 'a#application-tab-code',
      locateStrategy: 'css selector',
    },

    tabEnvironment: {
      selector: 'a#application-tab-environment',
      locateStrategy: 'css selector',
    },

    tabRuntime: {
      selector: 'a#application-tab-runtime',
      locateStrategy: 'css selector',
    },

    tabCodeSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#application-tab-code',
      locateStrategy: 'css selector',
    },

    tabEnvironmentSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#application-tab-environment',
      locateStrategy: 'css selector',
    },

    tabRuntimeSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#application-tab-runtime',
      locateStrategy: 'css selector',
    },

    imageUrl: {
      selector: 'input[id$="-image"]',
      locateStrategy: 'css selector',
    },

    runtimeMemory: {
      selector: 'input[id$="-limit-memory"]',
      locateStrategy: 'css selector',
    },

    runtimeCpu: {
      selector: 'input[id$="-limit-cpus"]',
      locateStrategy: 'css selector',
    },

    requestsTimeout: {
      selector: 'input[id$="-limit-timeoutSeconds"]',
      locateStrategy: 'css selector',
    },

    containerConcurrency: {
      selector: 'input[id$="-limit-containerConcurrency"]',
      locateStrategy: 'css selector',
    },

    scalingMin: {
      selector: 'input[id$="-limit-minScale"]',
      locateStrategy: 'css selector',
    },

    scalingMax: {
      selector: 'input[id$="-limit-maxScale"]',
      locateStrategy: 'css selector',
    },
  }],

  sections: {
    applicationNav,
    breadcrumbs,
    environmentVariables,
    pageActions,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.section.breadcrumbs.waitUntilLoaded();

      this.api
        .waitForElementVisible(this.elements.tabCodeSelected)
        .waitForElementVisible(this.elements.imageUrl)
        .waitForElementNotPresent(this.elements.revisionSelectorLoading);

      this.closeToastIfPresent();

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

    selectRevision: function(revision) {
      const selector = `//div[@id='application-revision_selector']//div[contains(@class, 'bx--list-box__menu-item') and contains(@title, '${revision}')]`;
      this.api.expect.element(this.elements.revisionSelector).to.be.visible.before(500);
      this.api.click(this.elements.revisionSelector);
      this.api.expect.element({
        selector,
        locateStrategy: 'xpath'
      }).to.be.visible.before(500);
      this.api.click({
        selector,
        locateStrategy: 'xpath',
      });

      return this;
    },

    selectRevisionByIndex: function(idx) {
      const selector = `(//div[@id='application-revision_selector']//div[contains(@class, 'bx--list-box__menu-item')])[${idx + 1}]`;
      this.api.expect.element(this.elements.revisionSelector).to.be.visible.before(500);
      this.api.click(this.elements.revisionSelector);
      this.api.expect.element({
        selector,
        locateStrategy: 'xpath'
      }).to.be.visible.before(500);
      this.api.click({
        selector,
        locateStrategy: 'xpath',
      });

      return this;
    },

    setRevisionName: function(name, clearFirst) {
      this.api.assert.elementPresent(this.elements.revisionName);

      const setValue = () => {
        this.api.setValue(this.elements.revisionName, name);
      };

      if ((typeof clearFirst === 'boolean') && (clearFirst === true)) {
        this.api.clearValue(this.elements.revisionName, () => {
          setValue();
        });
      } else {
        setValue();
      }
      return this;
    },

    assertEnvironmentVariableCount: function(expectedCount) {
      this.api.assert.elementPresent(this.elements.tabEnvironmentSelected);

      this.section.environmentVariables
        .assertVariablesCount(expectedCount);

      return this;
    },

    assertEnvironmentVariables: function(/* Array of Object */ expectedNamesAndValues) {
      this.api.assert.elementPresent(this.elements.tabEnvironmentSelected);

      this.section.environmentVariables
        .assertVariables(expectedNamesAndValues);

      return this;
    },

    addEnvironmentVariable: function(idx, key, value) {
      this.api.assert.elementPresent(this.elements.tabEnvironmentSelected);

      this.section.environmentVariables.clickAddBtn()
        .setEnvVariableName(idx, key)
        .setEnvVariableValue(idx, value);

      return this;
    },

    deleteEnvironmentVariable: function(idx) {
      this.api.assert.elementPresent(this.elements.tabEnvironmentSelected);

      this.section.environmentVariables.deleteEnvVariable(idx);

      return this;
    },

    updateEnvironmentVariable: function(idx) {
      this.api.assert.elementPresent(this.elements.tabEnvironmentSelected);

      this.section.environmentVariables
        .setEnvVariableName(idx, key, true)
        .setEnvVariableValue(idx, value, true);

      return this;
    },

    assertDeployButtonEnabled: function(enabled) {
      if (!enabled) {
        this.api.assert.cssClassPresent(this.elements.deployChangesBtn, 'bx--btn--disabled');
      } else {
        this.api.assert.not.cssClassPresent(this.elements.deployChangesBtn, 'bx--btn--disabled');
      }

      return this;
    },

    assertDeployButtonVisible: function(visible) {
      if (!visible) {
        this.api.expect.element(this.elements.deployChangesBtn).to.not.be.present;
      } else {
        this.api.expect.element(this.elements.deployChangesBtn).to.be.present;
      }

      return this;
    },

    assertCancelButtonVisible: function(visible) {
      if (!visible) {
        this.api.expect.element(this.elements.cancelChangesBtn).to.not.be.visible;
      } else {
        this.api.expect.element(this.elements.cancelChangesBtn).to.be.visible;
      }

      return this;
    },

    clickCancelButton: function() {
      this.api.expect.element(this.elements.cancelChangesBtn).to.be.visible;
      this.click(this.elements.cancelChangesBtn);
      this.api.waitForElementNotPresent(this.elements.cancelChangesBtn)
        .waitForElementNotPresent(this.elements.revisionSelectorLoading);

      return this;
    },

    clickDeployButton: function() {
      this.api.expect.element(this.elements.deployChangesBtn).to.be.visible;
      this.click(this.elements.deployChangesBtn);
      this.api.waitForElementNotPresent(this.elements.cancelChangesBtn)
        .waitForElementNotPresent(this.elements.revisionSelectorLoading);

      return this;
    },

    clickNewRevisionButton: function() {
      this.api.expect.element(this.elements.createNewRevisionBtn).to.be.visible;
      this.click(this.elements.createNewRevisionBtn);

      return this;
    },

    clickTestButton: function() {
      this.api.expect.element(this.elements.invokeApplicationBtn).to.be.visible;
      this.click(this.elements.invokeApplicationBtn);

      return this;
    },

    assertInvocationResult: function(revisionName, expectedStatus, expectedResponse) {
      const selector = 'div.section.invocations div.application-invoke--invocations div.application-invoke--invocations__result.invocation-result.invocation-result__' + expectedStatus;
      const locateStrategy = 'css selector';

      const detailsSelector = selector + ' div.invocation-result__details div.invocation-result__details__section-content';

      this.api.waitForElementVisible({
        selector,
        locateStrategy
      }, 30000, 500);

      this.api.expect.element({
        selector: detailsSelector,
        locateStrategy,
      }).text.to.contain(expectedResponse);

      return this;
    },

    clickApplicationUrlButton: function() {
      this.api.expect.element(this.elements.applicationUrlBtn).to.be.visible;
      this.click(this.elements.applicationUrlBtn);

      return this;
    },

    clickTabCode: function() {
      this.api.expect.element(this.elements.tabCode).to.be.visible;
      this.click(this.elements.tabCode);
      this.api.expect.element(this.elements.tabCodeSelected).to.be.present;

      return this;
    },

    clickTabEnvironment: function() {
      this.api.expect.element(this.elements.tabEnvironment).to.be.visible;
      this.click(this.elements.tabEnvironment);
      this.api.expect.element(this.elements.tabEnvironmentSelected).to.be.present;

      return this;
    },

    clickTabRuntime: function() {
      this.api.expect.element(this.elements.tabRuntime).to.be.visible;
      this.click(this.elements.tabRuntime);
      this.api.expect.element(this.elements.tabRuntimeSelected).to.be.present;

      return this;
    },

    deleteApplication: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

/*    setName: function(name) {
      this.api.clearValue(this.elements.applicationName);
      this.api.setValue(this.elements.applicationName, name);

      return this;
    }, */

    assertImageUrl: function(expectedUrl) {
      this.api.assert.elementPresent(this.elements.tabCodeSelected);
      this.api.assert.value(this.elements.imageUrl, expectedUrl);

      return this;
    },

    setImageUrl: function(url) {
      this.api.assert.elementPresent(this.elements.tabCodeSelected);

      this.api.clearValue(this.elements.imageUrl);
      this.api.setValue(this.elements.imageUrl, url);

      return this;
    },

    assertMemory: function(expectedMemory) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.runtimeMemory, expectedMemory);

      return this;
    },

    setMemory: function(memory) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.runtimeMemory);
      this.api.setValue(this.elements.runtimeMemory, memory);

      return this;
    },

    assertCpu: function(expectedCpus) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.runtimeCpu, expectedCpus);

      return this;
    },

    setCpu: function(cpus) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.runtimeCpu);
      this.api.setValue(this.elements.runtimeCpu, cpus);

      return this;
    },

    assertRequestTimeout: function(expectedTimeout) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.requestsTimeout, expectedTimeout);

      return this;
    },

    setRequestTimeout: function(timeout) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.requestsTimeout);
      this.api.setValue(this.elements.requestsTimeout, timeout);

      return this;
    },

    assertConcurrency: function(expectedConcurrency) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.containerConcurrency, expectedConcurrency);

      return this;
    },

    setConcurrency: function(concurrency) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.containerConcurrency);
      this.api.setValue(this.elements.containerConcurrency, concurrency);

      return this;
    },

    assertScalingMin: function(expectedScalingMin) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.scalingMin, expectedScalingMin);

      return this;
    },

    setScalingMin: function(minScaling) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.scalingMin);
      this.api.setValue(this.elements.scalingMin, minScaling);

      return this;
    },

    assertScalingMax: function(expectedScalingMax) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);
      this.api.assert.value(this.elements.scalingMax, expectedScalingMax);

      return this;
    },

    setScalingMax: function(maxScaling) {
      this.api.assert.elementPresent(this.elements.tabRuntimeSelected);

      this.api.clearValue(this.elements.scalingMax);
      this.api.setValue(this.elements.scalingMax, maxScaling);

      return this;
    },

    assertApplicationStatus: function(expectedStatus) {
      const selector = `//div[contains(@class, 'pal--page-header__surfaced-details')]//div[contains(@class, 'clg-item--status')]/div[contains(text(), '${expectedStatus}')]`;

      this.api.expect.element({
        selector,
        locateStrategy: 'xpath',
      }).to.be.visible;

      return this;
    },

    waitForApplicationStatus: function(expectedStatus) {
      const selector = `//div[contains(@class, 'pal--page-header__surfaced-details')]//div[contains(@class, 'clg-item--status')]/div[contains(text(), '${expectedStatus}')]`;

      this.api.waitForElementVisible({
        selector,
        locateStrategy: 'xpath',
      }, 30000, 500);

      return this;
    },
  }],
};

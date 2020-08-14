const breadcrumbs = require('./shared/breadcrumbs');
const environmentVariables = require('./shared/environmentVariables');
const jobDefinitionNav = require('./shared/jobDefinitionNav');
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

    saveChangesBtn: {
      selector: 'button#save-changes-btn',
      locateStrategy: 'css selector',
    },

    cancelChangesBtn: {
      selector: 'button#cancel-changes-btn',
      locateStrategy: 'css selector',
    },

    submitJobBtn: {
      selector: 'button.invoke-application-btn',
      locateStrategy: 'css selector',
    },

    pendingInvocationResult: {
      selector: 'div.section.invocations div.application-invoke--invocations div.application-invoke--invocations__result.invocation-result.invocation-result__pending',
      locateStrategy: 'css selector',
    },

    tabCode: {
      selector: 'a#jobdefinition-tab-code',
      locateStrategy: 'css selector',
    },

    tabEnvironment: {
      selector: 'a#jobdefinition-tab-environment',
      locateStrategy: 'css selector',
    },

    tabRuntime: {
      selector: 'a#jobdefinition-tab-runtime',
      locateStrategy: 'css selector',
    },

    tabCodeSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#jobdefinition-tab-code',
      locateStrategy: 'css selector',
    },

    tabEnvironmentSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#jobdefinition-tab-environment',
      locateStrategy: 'css selector',
    },

    tabRuntimeSelected: {
      selector: 'li.bx--tabs__nav-item--selected a#jobdefinition-tab-runtime',
      locateStrategy: 'css selector',
    },

    imageUrl: {
      selector: 'input#jobdef-image',
      locateStrategy: 'css selector',
    },

    commands: {
      selector: 'textarea#jobdefinition-commands',
      locateStrategy: 'css selector',
    },

    arguments: {
      selector: 'textarea#jobdefinition-arguments',
      locateStrategy: 'css selector',
    },

    runtimeMemory: {
      selector: 'input#input-memory-limit',
      locateStrategy: 'css selector',
    },

    runtimeCpu: {
      selector: 'input#input-cpu-limit',
      locateStrategy: 'css selector',
    },
  }],

  sections: {
    breadcrumbs,
    jobDefinitionNav,
    environmentVariables,
    pageActions,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.section.breadcrumbs.waitUntilLoaded();

      this.api
        .waitForElementVisible(this.elements.tabCodeSelected)
        .waitForElementVisible(this.elements.imageUrl);

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

    assertSaveButtonEnabled: function(enabled) {
      if (!enabled) {
        this.api.assert.cssClassPresent(this.elements.saveChangesBtn, 'bx--btn--disabled');
      } else {
        this.api.assert.not.cssClassPresent(this.elements.saveChangesBtn, 'bx--btn--disabled');
      }

      return this;
    },

    assertSaveButtonVisible: function(visible) {
      if (!visible) {
        this.api.expect.element(this.elements.saveChangesBtn).to.not.be.visible;
      } else {
        this.api.expect.element(this.elements.saveChangesBtn).to.be.visible;
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
      this.api.waitForElementNotPresent(this.elements.cancelChangesBtn);

      return this;
    },

    clickSaveButton: function() {
      this.api.expect.element(this.elements.saveChangesBtn).to.be.visible;
      this.click(this.elements.saveChangesBtn);
      this.api.waitForElementNotPresent(this.elements.cancelChangesBtn);

      return this;
    },

    clickSubmitButton: function() {
      this.api.expect.element(this.elements.submitJobBtn).to.be.visible;
      this.click(this.elements.submitJobBtn);

      return this;
    },

    assertInvocationResult: function(revisionName, expectedStatus, expectedResponse) {
      const selector = 'div.section.invocations div.application-invoke--invocations div.application-invoke--invocations__result.invocation-result.invocation-result__' + expectedStatus;
      const locateStrategy = 'css selector';

      const detailsSelector = selector + ' div.invocation-result__details div.invocation-result__details__section-content';

      this.api.waitForElementVisible({
        selector,
        locateStrategy
      });

      this.api.expect.element({
        selector: detailsSelector,
        locateStrategy,
      }).text.to.contain(expectedResponse);

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

    deleteJobDefinition: function() {
      this.section.pageActions.deleteEntity();

      return this;
    },

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

    assertCommands: function(/* Array of string */ expectedCommands) {
      const cmdStr = expectedCommands.join('\n');

      this.api.assert.elementPresent(this.elements.commands);
      this.api.expect.element(this.elements.commands).to.have.value.that.equals(cmdStr);

      return this;
    },

    setCommands: function(/* Array of string */ commands, /* boolean */ clearFirst) {
      const cmdStr = commands.join('\n');

      this.api.assert.elementPresent(this.elements.commands);

      if (clearFirst) {
        this.api.clearValue(this.elements.commands);
      }

      this.api.setValue(this.elements.commands, cmdStr);

      return this;
    },

    assertArguments: function(/* Array of string */ expectedArguments) {
      const argsStr = expectedArguments.join('\n');

      this.api.assert.elementPresent(this.elements.arguments);
      this.api.expect.element(this.elements.arguments).to.have.value.that.equals(argsStr);

      return this;
    },

    setArguments: function(/* Array of string */ arguments, /* boolean */ clearFirst) {
      const argsStr = arguments.join('\n');

      this.api.assert.elementPresent(this.elements.arguments);

      if (clearFirst) {
        this.api.clearValue(this.elements.arguments);
      }

      this.api.setValue(this.elements.arguments, argsStr);

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
  }],
};

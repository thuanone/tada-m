const environmentVariables = require('./shared/environmentVariables');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/create/component/jobdefinition';
  },

  elements: [{
    pageTitle: {
      selector: 'h1.pal--page-header__title-text',
      locateStrategy: 'css selector',
    },

    projectSelectorLoading: {
      selector: '.clg-project-selector .bx--skeleton',
      locateStrategy: 'css selector',
    },

    projectSelector: {
      selector: '#project_selector div.bx--list-box__menu-icon',
      locateStrategy: 'css selector'
    },

    projectSelectorLabel: {
      selector: '#project_selector span.bx--list-box__label',
      locateStrategy: 'css selector'
    },

    projectSelectorMenu: {
      selector: '#project_selector button',
      locateStrategy: 'css selector'
    },

    projectSelectorMenuItem: {
      selector: '#project_selector div.bx--list-box__menu-item',
      locateStrategy: 'css selector'
    },

    jobDefinitionName: {
      selector: 'input#create-jobdefinition-name',
      locateStrategy: 'css selector',
    },

    imageUrl: {
      selector: 'input#create-jobdefinition-image',
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
      selector: 'input#create-jobdefinition-mem',
      locateStrategy: 'css selector',
    },

    runtimeCpu: {
      selector: 'input#create-jobdefinition-cpu',
      locateStrategy: 'css selector',
    },

    runtimeChevron: {
      selector: 'a#runtime-section-toggle',
      locateStrategy: 'css selector',
    },

    environmentChevron: {
      selector: 'a#environment-section-toggle',
      locateStrategy: 'css selector',
    },

    cancelBtn: {
      selector: 'div.action-btns button.bx--btn--secondary',
      locateStrategy: 'css selector',
    },

    createBtn: {
      selector: 'button#create-btn-jobdef',
      locateStrategy: 'css selector',
    },

    loadingText: {
      selector: "div.bx--inline-loading div.bx--inline-loading__text",
      locateStrategy: "css selector"

    },
  }],

  sections: {
    environmentVariables,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.jobDefinitionName)
        .waitForElementVisible(this.elements.cancelBtn);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

      return this;
    },

    selectProject: function(projectName, region) {
      const selector = `//div[@id='project_selector']//div[contains(@class, 'bx--list-box__menu-item') and contains(@title, '${projectName} (${region})')]`;

      this.api.waitForElementNotPresent(this.elements.projectSelectorLoading)
        .waitForElementVisible(this.elements.projectSelector);

      this.api.click(this.elements.projectSelector);
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

    selectProjectByIndex: function(idx) {
      const selector = `(//div[@id='project_selector']//div[contains(@class, 'bx--list-box__menu-item')])[${idx + 1}]`;

      this.api.waitForElementNotPresent(this.elements.projectSelectorLoading)
        .waitForElementVisible(this.elements.projectSelector);

      this.api.click(this.elements.projectSelector, () => {
        this.api.expect.element({
          selector,
          locateStrategy: 'xpath'
        }).to.be.visible.before(500);
        this.api.click({
          selector,
          locateStrategy: 'xpath',
        });
      });

      return this;
    },

    addEnvironmentVariable: function(idx, key, value) {
      this.section.environmentVariables.clickAddBtn()
        .setEnvVariableName(idx, key)
        .setEnvVariableValue(idx, value);

      return this;
    },

    deleteEnvironmentVariable: function(idx) {
      this.section.environmentVariables.deleteEnvVariable(idx);

      return this;
    },

    assertCreateButtonEnabled: function(enabled) {
      if (!enabled) {
        this.api.assert.cssClassPresent(this.elements.createBtn, 'bx--btn--disabled');
      } else {
        this.api.assert.not.cssClassPresent(this.elements.createBtn, 'bx--btn--disabled');
      }

      return this;
    },

    clickCancelButton: function() {
      this.api.expect.element(this.elements.cancelBtn).to.be.visible;
      this.api.click(this.elements.cancelBtn);

      return this;
    },

    clickCreateButton: function() {
      this.api.expect.element(this.elements.createBtn).to.be.visible;
      this.api.click(this.elements.createBtn);

      return this;
    },

    setName: function(name) {
      this.api.clearValue(this.elements.jobDefinitionName);
      this.api.setValue(this.elements.jobDefinitionName, name);

      return this;
    },

    setImageUrl: function(url) {
      this.api.clearValue(this.elements.imageUrl);
      this.api.setValue(this.elements.imageUrl, url);

      return this;
    },

    setMemory: function(memory) {
      this.api.clearValue(this.elements.runtimeMemory);
      this.api.setValue(this.elements.runtimeMemory, memory);

      return this;
    },

    setCpu: function(cpus) {
      this.api.clearValue(this.elements.runtimeCpu);
      this.api.setValue(this.elements.runtimeCpu, cpus);

      return this;
    },

    setCommands: function(/* Array of string */ commands, /* boolean */ clearFirst) {
      const cmdStr = commands.join('\n');

      if (clearFirst) {
        this.api.clearValue(this.elements.commands);
      }

      this.api.setValue(this.elements.commands, cmdStr);

      return this;
    },

    setArguments: function(/* Array of string */ arguments, /* boolean */ clearFirst) {
      const argsStr = arguments.join('\n');

      if (clearFirst) {
        this.api.clearValue(this.elements.arguments);
      }

      this.api.setValue(this.elements.arguments, argsStr);

      return this;
    },

    toggleRuntimeSection: function() {
      this.api.moveToElement(this.elements.runtimeChevron, 0, 0);
      this.api.expect.element(this.elements.runtimeChevron).to.be.visible;
      this.click(this.elements.runtimeChevron);

      return this;
    },

    toggleEnvironmentSection: function() {
      this.api.moveToElement(this.elements.environmentChevron, 0, 0);
      this.api.expect.element(this.elements.environmentChevron).to.be.visible;
      this.click(this.elements.environmentChevron);

      return this;
    },

    waitForCreatingDone: function() {
      this.api.waitForElementVisible(this.elements.loadingText, 2000)
        .waitForElementNotPresent(this.elements.loadingText, 20000, 2000);

      return this;
    },
  }],
};

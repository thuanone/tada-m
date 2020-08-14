const environmentVariables = require('./shared/environmentVariables');
const orderSummary = require('./shared/orderSummary');

module.exports = {
  url: function() {
    return this.api.launchUrl + this.api.globals.proxyRoot + '/create/component/application';
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
      selector: '#project_selector__menu button',
      locateStrategy: 'css selector'
    },

    projectSelectorMenuItem: {
      selector: '#project_selector__menu div.bx--list-box__menu-item__option',
      locateStrategy: 'css selector'
    },

    applicationName: {
      selector: 'input#create-application-name',
      locateStrategy: 'css selector',
    },

    imageUrl: {
      selector: 'input#create-application-image',
      locateStrategy: 'css selector',
    },

    runtimeMemory: {
      selector: 'input#create-application-instance-mem',
      locateStrategy: 'css selector',
    },

    runtimeCpu: {
      selector: 'input#create-application-instance-cpu',
      locateStrategy: 'css selector',
    },

    requestsTimeout: {
      selector: 'input#create-application-requests-timeout',
      locateStrategy: 'css selector',
    },

    containerConcurrency: {
      selector: 'input#create-application-container-concurrency',
      locateStrategy: 'css selector',
    },

    scalingMin: {
      selector: 'input#create-application-scaling-min',
      locateStrategy: 'css selector',
    },

    scalingMax: {
      selector: 'input#create-application-scaling-max',
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
  }],
  sections: {
    environmentVariables,
    orderSummary,
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.applicationName)
        .waitForElementVisible(this.elements.imageUrl);
      this.closeToastIfPresent();

      return this;
    },

    assertPageTitle: function(expectedTitle) {
      this.api.assert.containsText(this.elements.pageTitle, expectedTitle);

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

    assertDeployButtonEnabled: function(enabled) {
      this.section.orderSummary.assertOkButtonEnabled(enabled);

      return this;
    },

    clickCancelButton: function() {
      this.section.orderSummary.cancel();

      return this;
    },

    clickDeployButton: function() {
      this.section.orderSummary.submit();

      return this;
    },

    setName: function(name) {
      this.api.clearValue(this.elements.applicationName);
      this.api.setValue(this.elements.applicationName, name);

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

    setRequestTimeout: function(timeout) {
      this.api.clearValue(this.elements.requestsTimeout);
      this.api.setValue(this.elements.requestsTimeout, timeout);

      return this;
    },

    setConcurrency: function(concurrency) {
      this.api.clearValue(this.elements.containerConcurrency);
      this.api.setValue(this.elements.containerConcurrency, concurrency);

      return this;
    },

    setScalingMin: function(minScaling) {
      this.api.clearValue(this.elements.scalingMin);
      this.api.setValue(this.elements.scalingMin, minScaling);

      return this;
    },

    setScalingMax: function(maxScaling) {
      this.api.clearValue(this.elements.scalingMax);
      this.api.setValue(this.elements.scalingMax, maxScaling);

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
  }],
};

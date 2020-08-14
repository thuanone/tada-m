module.exports = {
  url: function() {
    return '';
  },

  elements: [
    {
      panel: {
        selector: 'div.pal--side-panel__content',
        locateStrategy: 'css selector',
      },

      panelTitle: {
        selector: 'div.pal--side-panel__content h3.pal--side-panel__heading',
        locateStrategy: 'css selector',
      },

      arraySize: {
        selector: 'div.pal--side-panel__content input#jobs-sp-arraysize',
        locateStrategy: 'css selector',
      },

      arraySpec: {
        selector: 'div.pal--side-panel__content input#jobs-sp-arrayspec',
        locateStrategy: 'css selector',
      },

      cpus: {
        selector: 'div.pal--side-panel__content input#jobs-sp-cpus',
        locateStrategy: 'css selector',
      },

      memory: {
        selector: 'div.pal--side-panel__content input#jobs-sp-memory',
        locateStrategy: 'css selector',
      },

      retries: {
        selector: 'div.pal--side-panel__content input#jobs-sp-retries',
        locateStrategy: 'css selector',
      },

      timeout: {
        selector: 'div.pal--side-panel__content input#jobs-sp-timeout',
        locateStrategy: 'css selector',
      },

      closeBtn: {
        selector: 'div.pal--side-panel__content button.pal--side-panel__button-close',
        locateStrategy: 'css selector',
      },

      submitBtn: {
        selector: 'div.pal--side-panel-container button.pal--side-panel__button.bx--btn.bx--btn--primary',
        locateStrategy: 'css selector',
      },

      cancelBtn: {
        selector: 'div.pal--side-panel-container button.pal--side-panel__button.bx--btn.bx--btn--secondary',
        locateStrategy: 'css selector',
      },

      loadingText: {
        selector: "div.pal--side-panel-container div.bx--inline-loading div.bx--inline-loading__text",
        locateStrategy: "css selector"

      },
    },
  ],

  commands: [{
    waitUntilLoaded: function() {
      this.api.pause(500)  // allow side-panel to fully slide out
        .waitForElementVisible(this.elements.panel)
        .waitForElementVisible(this.elements.panelTitle)
        .waitForElementVisible(this.elements.cancelBtn);

      return this;
    },

    assertArraySize: function(expectedSize) {
      this.api.assert.elementPresent(this.elements.arraySize);
      this.api.assert.value(this.elements.arraySize, expectedSize);

      return this;
    },

    assertArraySpec: function(expectedArraySpec) {
      this.api.assert.elementPresent(this.elements.arraySpec);
      this.api.assert.value(this.elements.arraySpec, expectedArraySpec);

      return this;
    },

    assertCpus: function(expectedCpus) {
      this.api.assert.elementPresent(this.elements.cpus);
      this.api.assert.value(this.elements.cpus, expectedCpus);

      return this;
    },

    assertMemory: function(expectedMemory) {
      this.api.assert.elementPresent(this.elements.memory);
      this.api.assert.value(this.elements.memory, expectedMemory);

      return this;
    },

    assertNumberOfJobs: function(expectedNum) {
      this.api.assert.elementPresent(this.elements.retries);
      this.api.assert.value(this.elements.retries, expectedNum);

      return this;
    },

    assertJobTimeout: function(expectedTimeout) {
      this.api.assert.elementPresent(this.elements.timeout);
      this.api.assert.value(this.elements.timeout, expectedTimeout);

      return this;
    },

    setArraySize: function(newSize) {
      this.api.assert.elementPresent(this.elements.arraySize);

      this.api.clearValue(this.elements.arraySize);
      this.api.setValue(this.elements.arraySize, newSize);

      return this;
    },

    setArraySpec: function(newArraySpec) {
      this.api.assert.elementPresent(this.elements.arraySpec);

      this.api.clearValue(this.elements.arraySpec);
      this.api.setValue(this.elements.arraySpec, newArraySpec);

      return this;
    },

    setCpus: function(newCpus) {
      this.api.assert.elementPresent(this.elements.cpus);

      this.api.clearValue(this.elements.cpus);
      this.api.setValue(this.elements.cpus, newCpus);

      return this;
    },

    setMemory: function(newMemory) {
      this.api.assert.elementPresent(this.elements.memory);

      this.api.clearValue(this.elements.memory);
      this.api.setValue(this.elements.memory, newMemory);

      return this;
    },

    setRetries: function(newNum) {
      this.api.assert.elementPresent(this.elements.retries);

      this.api.clearValue(this.elements.retries);
      this.api.setValue(this.elements.retries, newNum);

      return this;
    },

    setJobTimeout: function(newTimeout) {
      this.api.assert.elementPresent(this.elements.timeout);

      this.api.clearValue(this.elements.timeout);
      this.api.setValue(this.elements.timeout, newTimeout);

      return this;
    },

    clickCancelBtn: function() {
      this.api.assert.elementPresent(this.elements.cancelBtn);
      this.api.click(this.elements.cancelBtn);

      return this;
    },

    clickCloseBtn: function() {
      this.api.assert.elementPresent(this.elements.closeBtn);
      this.api.click(this.elements.closeBtn);

      return this;
    },

    submitJob: function() {
      this.api.assert.elementPresent(this.elements.submitBtn);
      this.api.click(this.elements.submitBtn);

      return this;
    },
  }],
};

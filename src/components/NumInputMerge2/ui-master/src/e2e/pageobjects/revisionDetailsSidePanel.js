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

      imageUrl: {
        selector: 'div.pal--side-panel__content div#application-revision-image',
        locateStrategy: 'css selector',
      },

      memory: {
        selector: 'div.pal--side-panel__content div#application-revision-memory',
        locateStrategy: 'css selector',
      },

      cpus: {
        selector: 'div.pal--side-panel__content div#application-revision-cpus',
        locateStrategy: 'css selector',
      },

      timeout: {
        selector: 'div.pal--side-panel__content div#application-revision-timeout',
        locateStrategy: 'css selector',
      },

      concurrency: {
        selector: 'div.pal--side-panel__content div#application-revision-concurrency',
        locateStrategy: 'css selector',
      },

      minScale: {
        selector: 'div.pal--side-panel__content div#application-revision-minscale',
        locateStrategy: 'css selector',
      },

      maxScale: {
        selector: 'div.pal--side-panel__content div#application-revision-maxscale',
        locateStrategy: 'css selector',
      },

      envToggle: {
        selector: 'div.pal--side-panel__content a#environment-variables-toggle',
        locateStrategy: 'css selector',
      },

      noEnvironmentVariables: {
        selector: '#empty-parameters-list',
        locateStrategy: 'css selector',
      },

      revisionStatus: {
        selector: 'div.pal--side-panel__content div#application-revision-status div.clg-item--status-caption',
        locateStrategy: 'css selector',
      },

      closeBtn: {
        selector: 'div.pal--side-panel__content button.pal--side-panel__button-close',
        locateStrategy: 'css selector',
      },
    },
  ],

  commands: [{
    waitUntilLoaded: function() {
      this.api.pause(200)  // allow side-panel to fully slide out
        .waitForElementVisible(this.elements.panel, 5000, 100, false)
        .waitForElementVisible(this.elements.panelTitle)
        .waitForElementVisible(this.elements.closeBtn);
      this.closeToastIfPresent();

      return this;
    },

    assertImageUrl: function(expectedUrl) {
      this.api.assert.elementPresent(this.elements.imageUrl);
      this.api.assert.containsText(this.elements.imageUrl, expectedUrl);

      return this;
    },

    assertMemory: function(expectedMemory) {
      this.api.assert.elementPresent(this.elements.memory);
      this.api.assert.containsText(this.elements.memory, expectedMemory);

      return this;
    },

    assertCpus: function(expectedCpus) {
      this.api.assert.elementPresent(this.elements.cpus);
      this.api.assert.containsText(this.elements.cpus, expectedCpus);

      return this;
    },

    assertTimeout: function(expectedTimeout) {
      this.api.assert.elementPresent(this.elements.timeout);
      this.api.assert.containsText(this.elements.timeout, expectedTimeout);

      return this;
    },

    assertConcurrency: function(expectedConcurrency) {
      this.api.assert.elementPresent(this.elements.concurrency);
      this.api.assert.containsText(this.elements.concurrency, expectedConcurrency);

      return this;
    },

    assertMinScale: function(expectedMinScale) {
      this.api.assert.elementPresent(this.elements.minScale);
      this.api.assert.containsText(this.elements.minScale, expectedMinScale);

      return this;
    },

    assertMaxScale: function(expectedMaxScale) {
      this.api.assert.elementPresent(this.elements.maxScale);
      this.api.assert.containsText(this.elements.maxScale, expectedMaxScale);

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

    toggleEnvVariables: function() {
      this.api.pause(200)
        .waitForElementVisible(this.elements.envToggle)
        .click(this.elements.envToggle);

      return this;
    },

    assertRevisionStatus: function(expectedRevisionStatus) {
      this.api.assert.elementPresent(this.elements.revisionStatus);
      this.api.assert.containsText(this.elements.revisionStatus, expectedRevisionStatus);

      return this;
    },

    clickCloseBtn: function() {
      this.api.assert.elementPresent(this.elements.closeBtn)
        .click(this.elements.closeBtn)
        .waitForElementNotVisible(this.elements.panel);

      return this;
    },
  }],
};

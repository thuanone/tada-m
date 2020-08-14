/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "section.environment-variables",
  locateStrategy: "css selector",

  elements: {
    emptyTitle: {
      selector: "div.environment-variables--none > span",
      locateStrategy: "css selector",
    },
    addBtn: {
      selector: "button.environment-variables--btn-add",
      locateStrategy: "css selector",
    },
    envVariable: {
      selector: "div.environment-variables--container div.environment-variables--param",
      locateStrategy: "css selector",
    }
  },

  commands: [{
    assertEnvVariableName: function(idx, name) {
      this.api.assert.value({
        selector: `input#env-variable-${idx}-key`,
        locateStrategy: 'css selector',
      }, name);

      return this;
    },

    assertEnvVariableValue: function(idx, value) {
      this.api.assert.value({
        selector: `input#env-variable-${idx}-value`,
        locateStrategy: 'css selector',
      }, value);

      return this;
    },

    clickAddBtn: function() {
      this.click(this.elements.addBtn);

      return this;
    },

    assertVariablesCount: function(expectedCount) {
      this.api.expect.elements(this.elements.envVariable).count.to.equal(expectedCount);

      return this;
    },

    assertVariables: function(/* Array of Object */ expectedNamesAndValues) {
      let idx = 0;
      for (const param of expectedNamesAndValues) {
        this.api.assert.value({
          selector: `input#env-variable-${idx}-key`,
          locateStrategy: 'css selector',
        }, param.name);

        this.api.assert.value({
          selector: `input#env-variable-${idx}-value`,
          locateStrategy: 'css selector',
        }, param.value);

        idx += 1;
      }

      return this;
    },

    getEnvVariableName: function(idx, callback) {
      this.api.getValue({
        selector: `input#env-variable-${idx}-key`,
        locateStrategy: 'css selector',
      }, result => {
        if (typeof callback === 'function') {
          callback(result);
        }
      });

      return this;
    },

    getEnvVariableValue: function(idx, callback) {
      this.api.getValue({
        selector: `input#env-variable-${idx}-value`,
        locateStrategy: 'css selector',
      }, result => {
        if (typeof callback === 'function') {
          callback(result);
        }
      });

      return this;
    },

    setEnvVariableName: function(idx, newName, clearFirst) {
      const locateStrategy = 'css selector';
      const selector = `input#env-variable-${idx}-key`;

      const setValue = () => {
        this.api.setValue({
          selector,
          locateStrategy,
        }, newName);
      };

      if ((typeof clearFirst === 'boolean') && (clearFirst === true)) {
        this.api.clearValue({
          selector,
          locateStrategy,
        }, () => {
            setValue();
        });
      } else {
        setValue();
      }
      return this;
    },

    setEnvVariableValue: function(idx, newValue, clearFirst) {
      const locateStrategy = 'css selector';
      const selector = `input#env-variable-${idx}-value`;

      const setValue = () => {
        this.api.setValue({
          selector,
          locateStrategy,
        }, newValue);
      };

      if ((typeof clearFirst === 'boolean') && (clearFirst === true)) {
        this.api.clearValue({
          selector,
          locateStrategy,
        }, () => {
          setValue();
        });
      } else {
        setValue();
      }
      return this;
    },

    deleteEnvVariable: function(idx) {
      this.api.click({
        selector: `#delete-param-button-${idx}-btn`,
        locateStrategy: 'css selector',
      });

      return this;
    },
  }],
};

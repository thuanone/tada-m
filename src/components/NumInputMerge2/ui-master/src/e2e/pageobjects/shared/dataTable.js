module.exports = {
  selector: "div.cfn-table-wrapper.clg-datatable-sortable",
  locateStrategy: "css selector",

  elements: {
    allRowsCheckbox: {
      selector: 'th.bx--table-column-checkbox > label.bx--checkbox-label',
      locateStrategy: 'css selector',
    },

    batchCancelBtn: {
      selector: 'button.bx--batch-summary__cancel',
      locateStrategy: 'css selector',
    },

    batchDeleteBtn: {
      selector: 'button#delete-rows-button',
      locateStrategy: 'css selector',
    },

    batchMessage: {
      selector: 'div.bx--batch-actions p.bx--batch-summary__para > span',
      locateStrategy: 'css selector',
    },

    emptyTable: {
      selector: 'table.bx--data-table.clg-table-emptystate',
      locateStrategy: 'css selector',
    },

    filterInputField: {
      selector: 'input.bx--search-input',
      locateStrategy: 'css selector',
    },

    filterInput: {
      selector: 'input.bx--search-input:enabled',
      locateStrategy: 'css selector',
    },

    filterClearBtn: {
      selector: 'button.bx--search-close',
      locateStrategy: 'css selector',
    },

    singleResultPaginationText: {
      selector: `//div[contains(@class, 'bx--pagination')]//span[contains(@class, 'bx--pagination__text') and contains(text(), '1 of 1')]`,
      locateStrategy: 'xpath',
    },

    singleTableRow: {
      selector: 'tbody tr.cfn-table-row-clickable',
      locateStrategy: 'css selector',
    },
  },

  commands: {
    assertBatchMessage: function(expectedText) {
      this.api.assert.containsText(this.elements.batchMessage, expectedText);

      return this;
    },

    assertTableRowsShown: function(rowNum) {
      this.api.pause(500);
      this.api.expect.elements(this.elements.singleTableRow).count.to.equal(rowNum);

      return this;
    },

    assertNothingSelected: function() {
      this.api.pause(1000);
      this.api.expect.element(this.elements.batchDeleteBtn).to.not.be.visible;
      this.api.expect.element(this.elements.batchCancelBtn).to.not.be.visible;

      return this;
    },

    clearFilter: function(callback) {
      this.api.click(this.elements.filterClearBtn, callback);

      return this;
    },

    filterTable: function(searchValue, expectedResultCount) {
      let count = -1;

      if (typeof expectedResultCount !== 'undefined') {
        count = expectedResultCount;
      }

      this.ifElementExists(this.elements.emptyTable, () => {
        // empty table, let's see whether expectedCount is set and larger than 0
        if (count > 0) {
          this.assertTableRowsShown(count);
        }
      }, () => {
        this.api.waitForElementVisible(this.elements.filterInput);
        const val = this.api.getValue(this.elements.filterInputField);
        this.api.slowClick(this.elements.filterInputField);
        for (let i = 0; i < val.length; i++) {
            this.api
              .keys(this.api.Keys.BACK_SPACE)
              .pause(20);
        }
        this.api.clearValue(this.elements.filterInputField);
        this.api.setValue(this.elements.filterInputField, searchValue);

        if (count >= 0) {
          if (count > 0) {
            this.api.
            waitForElementPresent({
              locateStrategy: 'xpath',
              selector: `//div[contains(@class, 'bx--pagination')]//span[contains(@class, 'bx--pagination__text') and contains(text(), '${count} of ${count}')]`,
            }, 500, 100, true)
              .pause(500);
          } else {
            this.api.expect.element({
              locateStrategy: 'xpath',
              selector: `//div[contains(@class, 'bx--pagination')]`,
            }).to.not.be.present;
          }
        }
      });

      return this;
    },

    /**
     * Checks whether a given row entry exists or not and either calls back the one or the other callback.
     * Can be used for conditional test execution, based on the existence of a row in a table.
     *
     * @param name
     * @param ifExistsCallback
     * @param ifNotExistsCallback
     */
    ifRowExists: function(name, ifExistsCallback, ifNotExistsCallback) {
      const selector = `//tr/td/descendant-or-self::*[contains(text(), '${name}')]`; // `//tr/td/*[0][contains(text(), '${name}')]`;
      const fallbackSelector = `//tr/td/div/span[contains(text(), '${name}')]`;
      const self = this;

      this.filterTable(name);
      this.api.element({
        selector,
        locateStrategy: 'xpath',
      }, (result) => {
        if (result && result.value) {
          ifExistsCallback.call(self);
        } else {
          // try second selector, if first one didn't yield any result
          this.api.element({
            selector: fallbackSelector,
            locateStrategy: 'xpath',
          }, (result) => {
            if (result && result.value) {
              ifExistsCallback.call(self);
            } else {
              ifNotExistsCallback.call(self);
            }
          });
        }
      });

      return this;
    },

    clickRow: function(index, callback) {
      const elem = {
        locateStrategy: 'css selector',
        selector: `table.bx--data-table tbody tr:nth-of-type(${index + 1})`,
      };

      this.api.waitForElementVisible(elem)
        .click(elem, () => {
          if (typeof callback === 'function') {
            callback(result);
          }
        });

      return this;
    },

    selectAll: function(callback) {
      this.api.click(this.elements.allRowsCheckbox, callback);

      return this;
    },

    selectRow: function(index, callback) {
      this.api.click({
        selector: `table.bx--data-table tbody tr:nth-of-type(${index + 1}) td.bx--table-column-checkbox > label.bx--checkbox-label`,
        locateStrategy: 'css selector',
      }, callback);

      return this;
    },

    deleteRow: function(index, callback) {
      const rowSelector = `table.bx--data-table tbody tr:nth-of-type(${index + 1})`;

      this.api.moveToElement({
        selector: rowSelector,
        locateStrategy: 'css selector'
      }, 0, 0, () => {
        this.api.waitForElementVisible({
          selector: `${rowSelector} a.bx--link.clg-table-row-delete`,
          locateStrategy: 'css selector',
        })
          .click({
            selector: `${rowSelector} a.bx--link.clg-table-row-delete`,
            locateStrategy: 'css selector',
          }, callback);
      });

      return this;
    },

    waitForRowToHaveStatus: function(rowName, value) {
      const rowSelector = `//tr/td/descendant-or-self::*[contains(text(), '${rowName}')]/ancestor-or-self::td/following-sibling::td[*]/div[contains(@class, 'clg-item--status')]/div[contains(text(), '${value}')]`;

      this.filterTable(rowName, 1)
        .api.waitForElementVisible({
          selector: rowSelector,
          locateStrategy: 'xpath',
        }, 300000, 5000);  // wait for a maximum of 5 minutes, checking every 5 seconds
    },

    batchDeleteItems: function(callback) {
      this.api.waitForElementVisible(this.elements.batchDeleteBtn)
        .click(this.elements.batchDeleteBtn, callback);

      return this;
    },

    cancelBatchAction: function(callback) {
      this.api.waitForElementVisible(this.elements.batchCancelBtn)
        .click(this.elements.batchCancelBtn, callback);

      return this;
    },
  },
};

module.exports = {
  'Registry Private Images page': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/registry/main/images`)
      .waitForElementVisible('.registry-dashboard-content', 60000)
      .pause(1000)
      .assert.containsText('.armada-page-header-title', 'Images')
      .assert.containsText('.armada-page-header-actions .bx--btn--secondary', 'Create image')

      // table with headers
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.elementCount('.armada-table-wrapper .bx--data-table-v2 th', 8)
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(2)', 'Repository')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(3)', 'Tags')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(4)', 'Digest')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(5)', 'Created')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(6)', 'Size')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(7)', 'Security Status')
      // .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(8)', 'Issue Count')

      .assert.visible('.bx--data-table-v2 tbody')
      // .assert.visible('.bx--parent-row-v2')

      // ensure selecting/unselecting a row doesn't trigger a page change
      .click('.armada-table-row-clickable:first-of-type td:first-of-type')
      .pause(500)
      .assert.elementCount('.armada-table-row-clickable:first-of-type .bx--checkbox:checked', 1)
      // unselect
      .click('.armada-table-row-clickable:first-of-type td:first-of-type')
      .pause(500)
      .assert.elementCount('.armada-table-row-clickable:first-of-type .bx--checkbox:checked', 0)
      .url((result) => {
        client.assert.equal(result.value, `${client.launch_url}${client.globals.proxyRoot}/registry/main/images`);
      });
  },
};

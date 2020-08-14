module.exports = {
  'Registry Private Repositories page': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/registry/main/private`)
      .waitForElementVisible('.registry-dashboard-content', 60000)
      .waitForElementVisible('.armada-page-header-title', 10000)
      .assert.containsText('.armada-page-header-title', 'Repositories')
      .assert.containsText('.armada-page-header-actions .bx--btn--secondary', 'Create repository')

      // table with headers
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.elementCount('.armada-table-wrapper .bx--data-table-v2 th', 7)
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(3)', 'Name')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(4)', 'Image Count')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(5)', 'Namespace')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(6)', 'Last Updated')

      .assert.visible('.bx--data-table-v2 tbody');
      // .assert.visible('.bx--parent-row-v2')
  },
};

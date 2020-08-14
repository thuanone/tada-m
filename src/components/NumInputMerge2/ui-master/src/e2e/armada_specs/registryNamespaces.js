module.exports = {
  'Registry Namespaces page': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/registry/main/namespaces`)
      .waitForElementVisible('.registry-dashboard', 60000)
      // .assert.containsText('h2.page-filters__title', 'Registry')
      // .assert.visible('.registryTabSelect')
      // .assert.elementCount('.bx--tile', 4)
      // .assert.containsText('.bx--tile:nth-child(2)', 'Namespaces')
      // .assert.containsText('.bx--tile:nth-child(3)', 'Repositories')
      // .assert.containsText('.bx--tile:nth-child(4)', 'Images')

      .waitForElementVisible('.registry-dashboard-content', 10000)
      .pause(1000)
      .assert.containsText('.armada-page-header-title', 'Namespaces')
      .assert.containsText('.armada-page-header-actions .bx--btn--secondary', 'Create namespace')

      // table with headers
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.elementCount('.armada-table-wrapper .bx--data-table-v2 th', 6)
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(3)', 'Name')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(4)', 'Repository Count')
      .assert.containsText('.armada-table-wrapper .bx--data-table-v2 th:nth-child(5)', 'Image Count');

      // .assert.visible('.bx--parent-row-v2')
      // .assert.visible(' .bx--table-expand-v2')
      // .assert.elementNotPresent('.bx--expandable-row-v2')
      // .click('.bx--table-expand-v2 button')
      // .assert.visible('.bx--expandable-row-v2')
  },
};

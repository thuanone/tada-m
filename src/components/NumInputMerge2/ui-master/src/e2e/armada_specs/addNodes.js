module.exports = {
  'Add worker nodes modal': client => client
    .openClusterDetail()
    .waitForElementVisible('.armada-nodes-state-container', 30000)
    .click('.armada-nodes-state-container')
    .pause(1000)
    .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
    .click('.bx--toolbar-content > button')
    .pause(1000)
    .waitForElementVisible('.armada-catalog-create-content .bx--btn--primary:not([disabled])', 60000)
    .assert.title('Add Worker Pool - IBM Cloud')
    .assert.containsText('.armada-page-header-title', 'Add worker pool')
    // .assert.elementCount('.config--step .machineTypeSelect .bx--tile', 8)
    .ifElementExists('.showRemainingBtn', () => client.slowClick('.showRemainingBtn'))
    .assert.elementNotPresent('.showRemainingBtn'),
    // .assert.elementCount('.config--step .machineTypeSelect .bx--tile', count => count > 8)
    // TODO: figure out why this doesn't always work
    // .click('.machineTypesFilterUi label[for="filter-ui-1-0"]') // filters for balanced cores and RAM
    // .assert.elementCount('.config--step .machineTypeSelect .bx--tile', 10), // filters down to the 10 that have this attr
};

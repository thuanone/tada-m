const testConfirmationModal = (client, btnIndex, title, btnText) => client
  .ifElementExists(`.bx--action-list > button:nth-of-type(${btnIndex})[disabled]`, () => {}, () => client
    .click(`.bx--action-list > button:nth-of-type(${btnIndex})`)
    .pause(500)
    .waitForElementVisible('.bx--modal.is-visible', 10000)
    .assert.containsText('.is-visible .bx--modal-header__heading', title)
    .assert.elementCount('.is-visible .bx--modal__buttons-container .bx--btn', 2)
    .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn:first-child', 'Cancel')
    .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn:last-child', btnText)
    .click('.is-visible .bx--modal__buttons-container .bx--btn:first-child')
    .pause(500)
  );

module.exports = {
  'Cluster detail Worker Nodes page': client => {
    client
      .openClusterDetail()
      .click('#nav-nodes')
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.title(`${client.globals.clusterName} Cluster - IBM Cloud`)
      .assert.containsText('.bx--data-table-v2-container', 'Worker Nodes')
      .assert.elementCount('.bx--toolbar-content > button', 1)
      .assert.containsText('.bx--toolbar-content > button', 'Add worker pool')
      .assert.visible('.bx--table-toolbar .bx--search')
      .assert.visible('.bx--table-expand-v2')
      .assert.elementNotPresent('.bx--expandable-row-v2')
      .click('.bx--table-expand-v2 button')
      .pause(500)
      .assert.visible('.bx--expandable-row-v2')
      .assert.containsText('.armada-table-row-detail', 'Flavor')
      .click('#selectAll-nodes-table + label')
      .pause(500)
      .assert.elementCount('.bx--action-list > button', 4)
      .assert.containsText('.bx--action-list > button:nth-of-type(1)', 'Reload')
      .assert.containsText('.bx--action-list > button:nth-of-type(2)', 'Reboot')
      .assert.containsText('.bx--action-list > button:nth-of-type(3)', 'Update')
      .assert.containsText('.bx--action-list > button:nth-of-type(4)', 'Delete')
      .perform(() => testConfirmationModal(client, 1, 'Reload Worker Nodes', 'Reload'))
      .perform(() => testConfirmationModal(client, 2, 'Reboot Worker Nodes', 'Reboot'))
      .perform(() => testConfirmationModal(client, 3, 'Update worker node version', 'Update'))
      .perform(() => testConfirmationModal(client, 4, 'Delete Worker Nodes', 'Delete'));
  },
};

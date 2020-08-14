module.exports = {
  'Clusters Table': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/clusters`)
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.title('IBM Cloud')
      .assert.containsText('.page-filters__title', 'Clusters')
      .assert.containsText('.page-filters__btn-container .page-filters__btn-txt', 'Create cluster')
      .assert.elementCount('.bx--data-table-v2 th', 7)
      .click('.bx--overflow-menu')
      .pause(1000)
      .waitForElementVisible('.bx--overflow-menu-options__option', 10000)
      .click('.bx--overflow-menu-options__option:nth-child(1)')
      .pause(1000)
      .waitForElementVisible('.is-visible.bx--modal', 30000)
      .assert.containsText('.is-visible .bx--modal-header__heading', 'Update cluster version')
      .click('.is-visible.bx--modal .bx--btn--secondary')
      .pause(1000)
      .click('.bx--overflow-menu')
      .pause(1000)
      .waitForElementVisible('.bx--overflow-menu-options__option', 10000)
      .click('.bx--overflow-menu-options__option:nth-child(5)')
      .pause(1000)
      .waitForElementVisible('.is-visible.bx--modal', 10000)
      .assert.containsText('.is-visible .bx--modal-header__heading', 'Delete Cluster')
      .click('.is-visible.bx--modal .bx--btn--tertiary')
      .pause(1000)
      .click('.armada-table-row-clickable')
      .pause(1000)
      .waitForElementVisible('.armada-cluster-detail', 60000)
      .assert.urlContains('overview');
  },
};

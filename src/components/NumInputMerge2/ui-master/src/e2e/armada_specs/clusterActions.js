module.exports = {
  'Cluster detail actions': client => client
    .openClusterDetail()
    .slowClick('.armada-page-header .bx--overflow-menu')
    // TODO: WHY is this so flaky? Seems like 75% of the time .bx--overflow-menu-options isn't found
    // for whatever reason. For now we'll just add a check so that we don't bother with testing the
    // actions if nightwatch can't find the menu.
    .ifElementExists('.armada-page-header .bx--overflow-menu-options', () => client
      .assert.containsText('.armada-page-header .bx--overflow-menu-options li:nth-of-type(1) button', 'Update version')
      .assert.containsText('.armada-page-header .bx--overflow-menu-options li:nth-of-type(2) button', 'Delete cluster')
      .assert.cssClassPresent('.armada-page-header .bx--overflow-menu-options li:nth-of-type(2)', 'bx--overflow-menu-options__option--danger')

      // Update API Server
      .slowClick('.armada-page-header .bx--overflow-menu-options li:nth-of-type(1) button')
      .waitForElementVisible('.bx--modal.is-visible', 30000)
      .assert.containsText('.bx--modal.is-visible .bx--modal-header h2', 'Update cluster version')
      .assert.elementCount('.is-visible .bx--modal__buttons-container .bx--btn', 2)
      .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn--secondary', 'Cancel')
      .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn--primary', 'Update')
      .ifElementExists('#kube-version', () => client
        .assert.visible('#kube-version option')
        .assert.containsText('.bx--modal.is-visible .bx--link', 'review the docs')
        , () => client
          .assert.matchesText('.bx--modal.is-visible .bx--modal-content p', /You're using the newest version of the API server./)
      )
      .slowClick('.is-visible .bx--modal__buttons-container .bx--btn--secondary')

      // Delete cluster
      .slowClick('.armada-page-header .bx--overflow-menu')
      .waitForElementVisible('.armada-page-header .bx--overflow-menu-options', 10000)
      .slowClick('.armada-page-header .bx--overflow-menu-options li:nth-of-type(2) button')
      .waitForElementVisible('.bx--modal--danger.is-visible', 10000)
      .assert.containsText('.bx--modal.is-visible .bx--modal-header h2', 'Delete Cluster')
      .assert.elementCount('.is-visible .bx--modal__buttons-container .bx--btn', 2)
      .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn--tertiary', 'Cancel')
      .assert.containsText('.is-visible .bx--modal__buttons-container .bx--btn--danger--primary', 'Delete')
      .assert.visible('#confirmation-modal-match-text')
      .assert.visible('.bx--modal.is-visible .bx--modal-content .bx--checkbox')
      .assert.containsText('.bx--modal.is-visible .bx--modal-content .bx--form-item:last-child label', `Type "${client.globals.clusterName}" to confirm`)
      .assert.attributePresent('.is-visible .bx--modal__buttons-container .bx--btn--danger--primary', 'disabled')
      .setValue('#confirmation-modal-match-text', client.globals.clusterName)
      .pause(500)
      .assert.attributeNotPresent('.is-visible .bx--modal__buttons-container .bx--btn--danger--primary', 'disabled')
      .slowClick('.is-visible .bx--modal__buttons-container .bx--btn--tertiary'),
    ),
};

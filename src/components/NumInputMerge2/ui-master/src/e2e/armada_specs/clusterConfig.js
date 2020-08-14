module.exports = {
  'Cluster configuration': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/catalog/cluster/create`)
      .waitForElementVisible(`#loc-${client.globals.zone}`, 60000)

      .assert.title('Create Cluster - IBM Cloud')
      // Standard cluster is selected initially
      .assert.containsText('.armada-cluster-plan-select .bx--tile--is-selected h2', 'Standard')
      .assert.elementCount('.bx--breadcrumb a', 1)
      .assert.attributeMatches('.bx--breadcrumb a', 'href', /\/catalog$/)
      .assert.containsText('.armada-page-header-title', 'Create a new cluster')
      .assert.elementPresent('#resourceGroup')
      .assert.elementPresent('#geography')
      .assert.elementNotPresent('.armada-catalog-create-flex-row #metro')
      .assert.elementPresent('#name')
      .assert.elementPresent('.bx--tag-area')
      .assert.elementPresent('.armada-location-select')
      .assert.containsText('.armada-location-select .bx--content-switcher--selected', 'Multizone')
      .assert.elementPresent('#metro')
      .assert.elementPresent('#serviceEndpoint')
      .assert.elementPresent('.armada-kube-version-select')
      .assert.elementPresent('.armada-flavor-select')
      .assert.elementPresent('#diskEncryption')
      .assert.elementPresent('#workerNum')
      .waitForElementVisible(`#privateVlan-${client.globals.zone}`, 60000)
      .waitForElementVisible('.armada-kube-version-select .bx--tile--selectable', 60000)
      .waitForElementVisible('.armada-flavor-select .bx--tile--selectable', 60000)

      // switch to free cluster
      .slowClick('.armada-cluster-plan-select .bx--tile:nth-child(1)')
      .assert.containsText('.armada-cluster-plan-select .bx--tile--is-selected h2', 'Free')
      .waitForElementVisible('.armada-catalog-create-content .bx--btn--primary:not([disabled]), .armada-catalog-create-error', 60000)
      .ifElementExists('.armada-catalog-create-error',
        () => client.assert.containsText('.armada-catalog-create-error .bx--link', 'View free cluster'),
        () => client.assert.elementPresent('#name'))
      .assert.elementPresent('.armada-catalog-create-flex-row #metro')
      .assert.elementNotPresent('.armada-location-select')
      .assert.elementNotPresent('#serviceEndpoint')
      .assert.elementNotPresent('.armada-kube-version-select')
      .assert.elementNotPresent('.armada-flavor-select')
      .assert.elementNotPresent('#diskEncryption')
      .assert.elementNotPresent('#workerNum')

      // switch back to standard
      .slowClick('.armada-cluster-plan-select .bx--tile:nth-child(2)')
      .waitForElementVisible(`#loc-${client.globals.zone}`, 10000)
      .slowClick('.armada-location-select .bx--content-switcher-btn')
      .slowClick(`#loc-${client.globals.zone}+label`)
      .clearValue('#name')
      .pause(1000)
      .setValue('#name', client.globals.clusterName)
      // .click('input[name="isolation"][value="public"]+label')
      // make sure config values are correct
      // .assert.matchesText('.bx--order-summary .bx--order-list', /b3c.4x16 - 4 Cores 16GB RAM|mb1c.4x32 - 4 Cores 32GB RAM/)
      .assert.matchesText('.bx--order-summary .bx--order-list', /\d+ Cores \d+GB RAM/)
      .assert.containsText('.bx--order-summary .bx--order-list', '3 worker nodes')
      .assert.matchesText('.bx--order-summary .bx--order-total-price', /\/ month\nestimated$/)
      // .waitForElementVisible('.machineTypeSelect', 2000)
      // .click('.machineTypeSelect .bx--tile:nth-child(1)')
      .clearValue('#workerNum')
      .pause(1000)
      .setValue('#workerNum', 2)
      // make sure number input arrows work
      .slowClick('.bx--number .up-icon')
      .assert.valueContains('#workerNum', 3)
      .slowClick('.bx--number .down-icon')
      .assert.valueContains('#workerNum', 2)
      // make sure filtering works
      // odd problem caused by cloud header brand covering the filters making nightwatch believe they are not clickable
      // workaround: first force the window to scroll up past the top most filter to make sure nothing is blocking them
      .getLocationInView('.armada-flavor-filters h4:first-of-type')
      .assert.visible('.armada-flavor-filters h4:first-of-type')
      // test the Virtual - dedicated filter
      .slowClick('#filter-virtualDedicated+label')
      .assert.matchesText('.armada-tile-prop-small', /Virtual - dedicated/)
      .slowClick('#filter-virtualDedicated+label')
      // test the Ubuntu 18 filter
      .slowClick('#filter-u18+label')
      // .assert.matchesText('.info p:nth-of-type(4)', /Ubuntu 18/)
      .slowClick('#filter-u18+label')
      // combo filter: Virtual - dedicated, Small, Ubuntu 18
      // TODO: reenable once ubuntu 18 flavors are available in prod
      // .click('#filter-ui-0-2+label')
      // .click('#filter-ui-2-0+label')
      // .click('#filter-ui-3-1+label')
      // .assert.matchesText('.info', /2 Cores/)
      // .assert.matchesText('.info', /Virtual - dedicated/)
      // .assert.matchesText('.info', /Ubuntu 18/)
      .slowClick('#filter-virtualDedicated+label')
      .slowClick('#filter-small+label')
      .slowClick('#filter-u18+label')
      // attempt to create cluster
      .waitForElementVisible('.armada-catalog-create-content .bx--btn--primary:not([disabled])', 60000)
      .slowClick('.armada-catalog-create-content .bx--btn--primary')
      // either we get an error modal or move to the cluster detail page
      .waitForElementVisible('.bx--modal--danger.is-visible, .armada-cluster-detail', 60000)
      .ifElementExists('.bx--modal--danger.is-visible', () => client
        .assert.matchesText('.bx--modal--danger.is-visible .bx--modal-content > div > p', /^A cluster with the same name already exists/));
  },
  // 'Cluster configuration (non-multi-az)': client => {
  //   client
  //     .url(`${client.launch_url}${client.globals.proxyRoot}/catalog/cluster/create`)
  //     .waitForElementVisible('#location option[value="dal10"]', 50000)
  //     .assert.title('Create Cluster - IBM Cloud')
  //     // Standard cluster is selected initially
  //     .assert.containsText('.clusterTypeSelector .bx--tile--is-selected h2', 'Standard')
  //     .assert.elementCount('.bx--breadcrumb a', 1)
  //     .assert.attributeMatches('.bx--breadcrumb a', 'href', /\/catalog$/)
  //     .assert.containsText('.armada-page-header-title', 'Create new cluster')
  //     .ifElementExists('.armada-paywall',
  //       () => client.assert.containsText('.armada-paywall .bx--btn', 'Upgrade'),
  //     () => client.assert.elementPresent('#name')
  //       .assert.elementPresent('#location')
  //       .click('#location option[value="dal10"')
  //       .waitForElementVisible('input[name="isolation"]', 30000)
  //       .assert.elementPresent('.machineTypeSelect')
  //       .assert.elementPresent('#workerNum')
  //       .assert.elementPresent('#privateVlan')
  //       .assert.elementPresent('#publicVlan')
  //       .assert.elementPresent('.radioButtonWrapper')
  //       .assert.elementPresent('#diskEncryption'))
  //     // switch to free cluster
  //     .click('.clusterTypeSelector .bx--tile:nth-child(1)')
  //     .waitForElementVisible('.config--step', 3000)
  //     .assert.containsText('.clusterTypeSelector .bx--tile--is-selected h2', 'Free')
  //     .ifElementExists('.armada-paywall',
  //       () => client.assert.containsText('.armada-paywall .bx--link', 'View free cluster'),
  //       () => client.assert.elementPresent('#name'))
  //     .assert.elementNotPresent('#location')
  //     .assert.elementNotPresent('.machineTypeSelect')
  //     .assert.elementNotPresent('#workerNum')
  //     .assert.elementNotPresent('#privateVlan')
  //     .assert.elementNotPresent('#publicVlan')
  //     .assert.elementNotPresent('.radioButtonWrapper')
  //     .assert.elementNotPresent('#diskEncryption')
  //     // switch back to standard
  //     .click('.clusterTypeSelector .bx--tile:nth-child(2)')
  //     .waitForElementVisible('#location option[value="dal10"]', 30000)
  //     .clearValue('#name')
  //     .setValue('#name', client.globals.clusterName)
  //     .click('#location')
  //     .pause(300)
  //     .click('#location option[value="dal10"')
  //     .waitForElementVisible('input[name="isolation"]', 30000)
  //     .click('input[name="isolation"][value="public"]+label')
  //     // make sure config values are correct
  //     .assert.matchesText('.bx--order-summary .bx--order-list', /b2c.4x16 - 4 Cores 16GB RAM|mb1c.4x32 - 4 Cores 32GB RAM/)
  //     .assert.containsText('.bx--order-summary .bx--order-list', '3 worker nodes')
  //     .assert.matchesText('.bx--order-summary .bx--order-total-price', /\/ (hr|month)\nestimated$/)
  //     // .waitForElementVisible('.machineTypeSelect', 2000)
  //     // .click('.machineTypeSelect .bx--tile:nth-child(1)')
  //     .clearValue('#workerNum')
  //     .setValue('#workerNum', 2)
  //     // make sure number input arrows work
  //     .click('#workerNum + .bx--number__controls .up-icon')
  //     .assert.valueContains('#workerNum', 3)
  //     .click('#workerNum + .bx--number__controls .down-icon')
  //     .assert.valueContains('#workerNum', 2)
  //     .waitForElementVisible('.col-2 .bx--btn--primary:not([disabled])', 30000)
  //     .click('.col-2 .bx--btn--primary')
  //     // either we get an error modal or move to the cluster detail page
  //     .waitForElementVisible('.bx--modal--danger.is-visible, .armada-cluster-detail', 30000)
  //     .ifElementExists('.bx--modal--danger.is-visible', () => client
  //       .assert.matchesText('.bx--modal--danger.is-visible .bx--modal-content > div > p', /^A cluster with the same name already exists/));
  // },
};

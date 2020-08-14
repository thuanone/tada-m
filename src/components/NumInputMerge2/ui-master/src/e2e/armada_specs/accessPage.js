const kubeconfigDownloadLink = '.content-block:nth-child(4) p:nth-child(8) a';

module.exports = {
  'Cluster detail Access page': client => {
    client
      .openClusterDetail()
      // .assert.elementCount('nav.bx--tabs > ul > li', 4)
      .assert.containsText('nav.bx--tabs > ul > li:nth-child(1) > a', 'Access')
      .assert.containsText('nav.bx--tabs > ul > li:nth-child(2) > a', 'Overview')
      .assert.containsText('nav.bx--tabs > ul > li:nth-child(3) > a', 'Worker Nodes')
      .assert.containsText('nav.bx--tabs > ul > li:nth-child(4) > a', 'Worker Pools')
      .click('#nav-access')
      .waitForElementVisible('.armada-access', 60000)
      .assert.title(`${client.globals.clusterName} Cluster - IBM Cloud`)
      .assert.containsText('.armada-page-header-title', client.globals.clusterName)
      .assert.elementCount('.code-block-copy', 4)
      .assert.elementCount('.code-block', 1)
      .assert.elementCount('.content-block a', 2)
      .assert.elementCount('.armada-access h3:not(.bx--modal-header__label)', 2)
      .assert.elementCount('.armada-access h2', 2)

      // there should be 1 breadcrumb
      .assert.elementCount('.armada-breadcrumbs a', 1)
      .assert.containsText('.armada-breadcrumbs a', 'Clusters')
      .assert.containsText('.armada-breadcrumbs .bx--breadcrumb-item:last-child', client.globals.clusterName)

      // links to external pages
      .assert.link('.armada-text-right a')

      // kubeconfig download link
      .assert.visible(kubeconfigDownloadLink)
      .getAttribute(kubeconfigDownloadLink, 'href', link => {
        if (link.value === 'javascript:void(0);') {
          // kubeconfig can't be downloaded, modal is displayed
          return client
            .click(kubeconfigDownloadLink)
            .waitForElementVisible('.armada-access-modal.is-visible', 3000)
            .assert.containsText('.armada-access-modal.is-visible .bx--modal-header h2', 'Cluster not ready')
            .assert.elementCount('.armada-access-modal.is-visible .bx--modal-footer button', 2)
            .assert.cssProperty('.armada-access-modal.is-visible .bx--modal-footer button:nth-of-type(1)', 'display', 'none')
            .assert.containsText('.armada-access-modal.is-visible .bx--modal-footer button:nth-of-type(2)', 'Close');
        }
        // download kubeconfig
        return client
          .click(kubeconfigDownloadLink)
          .pause(5000)
          .assert.documentReady()
          .assert.elementNotPresent('.armada-access-modal.is-visible')
          .assert.visible('.armada-access');
      });
  },
};

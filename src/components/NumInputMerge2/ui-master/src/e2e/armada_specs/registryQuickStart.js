module.exports = {
  'Registry Quick Start': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/registry/main/start`)
      .waitForElementVisible('.armada-registry-quickstart', 60000)
      // .assert.title('IBM Cloud')
      .assert.containsText('.armada-page-header-title', 'Registry Quick Start')
      // .assert.elementCount('.code-block-copy', 8)
      // .assert.elementCount('.content-block', 4)
      .assert.elementCount('.content-block', 3);
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(1) h3', 'Welcome')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(1) > p:nth-child(4) > span > a', 'Install the IBM Cloud CLI.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(1) > p:nth-child(4) > span > a', 'href', '/docs/cli/reference/ibmcloud?topic=cloud-cli-ibmcloud-cli#ibmcloud-cli')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(1) > p:nth-child(5) > span > a', 'Install the Docker CLI.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(1) > p:nth-child(5) > span > a', 'href', 'https://docs.docker.com/engine/installation/')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(2) h3', 'Push the image to your private registry')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(4) h3', 'How was this Quick Start?')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) h3', 'What\'s next')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(1) > a', 'Create a Kubernetes cluster and deploy a container from your image to the cluster.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(1) > a', 'href', '/docs/containers?topic=containers-clusters#clusters')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(2) > a', 'View your private registry in the web UI.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(2) > a', 'href', `${client.globals.proxyRoot}/registry/main/private`)
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(3) > a', 'Learn about other ways to store images in your namespace.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(3) > a', 'href', '/docs/services/Registry?topic=registry-getting-started#getting-started')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(4) > a', 'Find information about potential security issues and vulnerabilities.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(4) > a', 'href', 'https://www.ibm.com/blogs/bluemix/2015/07/vulnerability-advisor/')
      // .assert.containsText('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(5) > a', 'Review your service plan and quota usage.')
      // .assert.attributeContains('.armada-registry-quickstart > div:nth-child(3) > ul > li:nth-child(5) > a', 'href', '/docs/services/Registry?topic=registry-registry_quota#registry_quota');
  },
};

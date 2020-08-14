module.exports.command = function command(accountName) {
  const client = this;
  let alreadySelected = `//*[@id='acct-dropdown']/ul/li[contains(@class, 'bx--dropdown-text')]/span[contains(@class, 'bx--account-switcher__text') and (text()='${accountName}')]`;
  let listItem = `//*[@id='acct-dropdown']/ul/li/ul/li[contains(@class, 'bx--dropdown-item')]/a[@title='${accountName}']`;
  client
    .log(`Setting account: ${accountName}`)
    .click('#acct-dropdown')
    .waitForElementPresent({
      selector: listItem,
      locateStrategy: 'xpath',
    }, 90000)
    // select the right account if it's not already selected
    .ifElementExists({
        selector: alreadySelected,
        locateStrategy: 'xpath',
      }, () => client
      .log('Account already selected')
      .slowClick('#acct-dropdown')
    , () => client
      .pause(1000)
      .log('Selecting account')
      .slowClick({
        selector: listItem,
        locateStrategy: 'xpath',
      }))
      .pause(2000);
  return this;
};

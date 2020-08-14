module.exports.command = function command(account) {
  const client = this;
  let alreadySelected = `#acct-dropdown ul[data-value="${account}"]`;
  let listItem = `#acct-dropdown li[data-value="${account}"]`;
  if (Array.isArray(account)) {
    alreadySelected = account.map(act => `#acct-dropdown ul[data-value="${act}"]`).join(',');
    listItem = account.map(act => `#acct-dropdown li[data-value="${act}"]`).join(',');
  }
  client
    .log(`Setting account: ${account}`)
    .click('#acct-dropdown')
    .waitForElementPresent(listItem, 90000)
    // select the right account if it's not already selected
    .ifElementExists(alreadySelected, () => client
      .log('Account already selected')
      .slowClick('#acct-dropdown')
    , () => client
      .pause(1000)
      .log('Selecting account')
      .slowClick(listItem))
      .pause(2000);
  return this;
};

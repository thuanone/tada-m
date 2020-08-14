const username = process.env.CONSOLE_USER || process.env.E2E_TEST_USER;
const password = process.env.CONSOLE_PASSWORD || process.env.E2E_TEST_PASSWORD;

module.exports.command = function command() {
  return this
      // inject styles to keep any modals from popping up
      //.execute(utils.injectStyle)
      .waitForElementVisible('#userid', 60000)
      .pause(1000)
      .setValue('#userid', username)
      .slowClick('button.login-form__login-button, .login-form__realm-user-id-row .bx--btn--primary')
      .waitForElementVisible('#password', 60000)
      .clearValue('#password')
      .pause(1000)
      .setValue('#password', password)
      .slowClick('button.login-form__login-button, .login-form__password-row .bx--btn--primary')
      .waitForElementPresent('body.ace_loggedIn, #global-header', 60000)
      // inject styles to keep any modals from popping up
      //.execute(utils.injectStyle)
      .waitForElementVisible('.global-header-container.authenticated', 60000)
      .log(`Logged in with user ${username}`);
};

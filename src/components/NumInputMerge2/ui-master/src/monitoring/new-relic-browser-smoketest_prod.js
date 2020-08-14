/**
 * Feel free to explore, or check out the full documentation
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 * for details.
 */
var assert = require('assert');

/**
 * CONSTANTS
 */
const LANDING_PAGE_URL = 'https://cloud.ibm.com/codeengine';
const SHORT_WAIT_TIME_IN_SECONDS = 5;
const NORMAL_WAIT_TIME_IN_SECONDS = 30;
const LONG_WAIT_TIME_IN_SECONDS = 60;
const SELECTOR_CSS_BTN_GDPR_AGREE = "div.pdynamicbutton a.call[role='button']";
const SELECTOR_NAME_INPUT_USERID = 'userid';
const SELECTOR_NAME_INPUT_PASSWORD = 'password';
const SELECTOR_CSS_BTN_CONTINUE = '.login-form__button.bx--btn.bx--btn--primary';
const SELECTOR_CSS_BTN_LOGIN = '.login-form__password-row .login-form__button.bx--btn.bx--btn--primary';
const SELECTOR_CSS_WORLDNAV = '.pal--world-level-nav';
const SELECTOR_CSS_WORLDNAV_HEADER_LINK = '.pal--side-nav__header .pal--side-nav__link';
const EXPECTED_OFFERING_TITLE = 'Code Engine';

/**
 * For some locations the Cloud UI shows a GDPR modal dialogue, that needs to be handled, first.
 */
function handleGdprModal() {
    return $browser.findElements($driver.By.tagName('iframe')).then(function(iFrames) {
        return new Promise(async function(resolve, reject) {
            // ITERATE over all iFrames on the current page
            let idx = 0;
            for (const frame of iFrames) {
                console.log(`Processing IFrame ${idx} of ${iFrames.length} ...`);
                
                // switch to the iframe
                $browser.switchTo().frame(idx);
                try {
                    // find elements will be processed in sync to make it easier to understand this code
                    const btnElements = await $browser.findElements($driver.By.css(SELECTOR_CSS_BTN_GDPR_AGREE));
                    if(btnElements[0]) {
                        console.log('Found "Agree and Proceed" button in iFrame');
                        btnElements[0].click();

                        // after we clicked the button, we need to wait for a while
                        $browser.sleep(SHORT_WAIT_TIME_IN_SECONDS * 1000);
                        console.log(`Clicked the "Agree and Proceed" button!`);
                        break;
                    } else {
                        console.log(`"Agree and Proceed" button not found in iFrame`);
                    }
                } finally {
                    // after we processed this iframe, we need to switch back to the main browser frame
                    $browser.switchTo().defaultContent();
                }

                idx += 1;
            }
            resolve();
        });
    });
}

/**
 * The Smoketest
 * - Request the Coligo landing page
 * - Login the user
 * - Wait for the Coligo landing page to get loaded
 * - Check whether the offering title is set, correctly
 */
console.log(`Load the landing page '${LANDING_PAGE_URL}' and expect a redirect to the login page`);
$browser.get(LANDING_PAGE_URL).then(function(){
    console.log(`Landing page is loading ... `);
    // Wait for the login page (and its IFrames to get loaded)
    return $browser.sleep(SHORT_WAIT_TIME_IN_SECONDS * 1000);
}).then(function(){
    // Check whether the page contains an IFrame that puts a modal over the whole page
    // This modal must be handled first, before we can proceed with the login
    return handleGdprModal();
}).then(function(){
    console.log(`Waiting ... `);
    return $browser.sleep(SHORT_WAIT_TIME_IN_SECONDS * 1000);
}).then(function(){
    // Call the wait function to wait until the user id field appears
    return $browser.waitForAndFindElement($driver.By.name(SELECTOR_NAME_INPUT_USERID), NORMAL_WAIT_TIME_IN_SECONDS * 1000).then(function(usernameElement){
        console.log(`Input for userid appeared - input: ${usernameElement.toString()}. Sending keys now ...`);
        // the submits a secured username.
        return usernameElement.sendKeys($secure.UX_E2ETEST_USERNAME);
    });
}).then(function(){
    console.log(`Find the continue button and click it ...`);
    return $browser.findElement($driver.By.css(SELECTOR_CSS_BTN_CONTINUE)).click();
}).then(function(){
    console.log(`Wait for the password input to appear ...`);

    // Call the wait function to wait until the password field appears
    return $browser.waitForAndFindElement($driver.By.name(SELECTOR_NAME_INPUT_PASSWORD), NORMAL_WAIT_TIME_IN_SECONDS * 1000).then(function(passwordElement){
        console.log(`input for password appeared - input: ${passwordElement.toString()}. Sending keys now ...`);
        // the submits a secured password.
        return passwordElement.sendKeys($secure.UX_E2ETEST_PASSWORD);
    });
}).then(function(){
    console.log(`Wait for the Login button to be ready ...`);
    return $browser.waitForAndFindElement($driver.By.css(SELECTOR_CSS_BTN_LOGIN), NORMAL_WAIT_TIME_IN_SECONDS * 1000).then(function(loginButtonElement){
        console.log(`Login button is ready. Clicking now ...`);
        return loginButtonElement.click();
    });
}).then(function(){
    console.log(`Wait for the world level navigation to get loaded ...`);
    return $browser.waitForElement($driver.By.css(SELECTOR_CSS_WORLDNAV), LONG_WAIT_TIME_IN_SECONDS * 1000);
}).then(function(){
  return $browser.findElement($driver.By.css(SELECTOR_CSS_WORLDNAV_HEADER_LINK)).then(function(element){
    return element.getText().then(function(text){
      console.log(`World Nav Header Title: '${text}'`);
      assert.equal(EXPECTED_OFFERING_TITLE, text, `Offering title did not match - Expected: '${EXPECTED_OFFERING_TITLE}', Received: '${text}'`);
    });
  });
}).then(function(){
  $browser.takeScreenshot();
  console.log(`SUCCEEDED`);
  return Promise.resolve();
});
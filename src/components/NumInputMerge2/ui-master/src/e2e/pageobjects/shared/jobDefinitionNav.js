/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "nav.pal--resource-level-nav",
  locateStrategy: "css selector",

  elements: {
    configuration: {
      selector: `//ul[contains(@class, 'pal--side-nav__items')]//a[contains(@class, 'pal--side-nav__link') and contains(@id, '/configuration')]`,
      locateStrategy: "xpath",
    },
    logs: {
      selector: `//ul[contains(@class, 'pal--side-nav__items')]//a[contains(@class, 'pal--side-nav__link') and contains(@id, '/logs')]`,
      locateStrategy: "xpath",
    },
  },

  commands: {
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.configuration)
        .waitForElementVisible(this.elements.logs);

      return this;
    },
  },
};

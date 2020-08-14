/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "nav.pal--resource-level-nav",
  locateStrategy: "css selector",

  elements: {
    components: {
      selector: `//ul[contains(@class, 'pal--side-nav__items')]//a[contains(@class, 'pal--side-nav__link') and contains(@id, '/components')]`,
      locateStrategy: "xpath",
    },
    jobs: {
      selector: `//ul[contains(@class, 'pal--side-nav__items')]//a[contains(@class, 'pal--side-nav__link') and contains(@id, '/jobs')]`,
      locateStrategy: "xpath",
    },
  },

  commands: {
    waitUntilLoaded: function() {
      this.api.waitForElementVisible(this.elements.components)
        .waitForElementVisible(this.elements.jobs);

      return this;
    },
  },
};

/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "div.pal--page-header__actions",
  locateStrategy: "css selector",

  elements: {
    actionsDropdownBtn: {
      selector: "button.bx--overflow-menu",
      locateStrategy: "css selector",
    },
    deleteEntityBtn: {  // this is by intent using 'entity' over a specific value, so this section will work for all kind of detail pages
      selector: "#delete-entity",
      locateStrategy: "css selector",
    },
  },

  commands: {
    deleteEntity: function() {
      this.api.click(this.elements.actionsDropdownBtn)
              .waitForElementVisible(this.elements.deleteEntityBtn)
              .click(this.elements.deleteEntityBtn);

    },
  },
};

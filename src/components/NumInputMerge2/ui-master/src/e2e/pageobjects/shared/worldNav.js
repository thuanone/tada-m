/**
 * Exports shared elements visible from all pages (e.g. common navigation elements from the left nav)
 *
 * @type {{}}
 */
module.exports = {
  selector: "nav.pal--side-nav",
  locateStrategy: "css selector",

  elements: {
    coligo: {
      selector: "pal--side-nav__link",
      locateStrategy: "css selector",
    },
    projects: {
      selector: "#nav-item-projects",
      locateStrategy: "css selector",
    },
    cli: {
      selector: "#nav-item-cli",
      locateStrategy: "css selector",
    },
    documentation: {
      selector: "#nav-item-documentation",
      locateStrategy: "css selector",
    },
    collapseExpandBtn: {
      selector: "pal--side-nav__collapse-button",
      locateStrategy: "css selector",
    }
  },
};

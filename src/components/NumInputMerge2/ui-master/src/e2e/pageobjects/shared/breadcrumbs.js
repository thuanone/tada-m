module.exports = {
  selector: 'nav.pal--page-header__breadcrumb',
  locateStrategy: 'css selector',

  elements: {
      loadingBreadcrumb: {
        selector: `//ol[contains(@class, 'bx--breadcrumb')]//a[contains(@class, 'bx--link') and contains(text(), '...')]`,
        locateStrategy: 'xpath',
      },
  },

  commands: [{
    waitUntilLoaded: function() {
      this.api.waitForElementNotPresent(this.elements.loadingBreadcrumb);

      return this;
    },

    assertBreadcrumbs: function(/* Array of string */ breadcrumbs) {
      let idx = 0;

      for (const crumb of breadcrumbs) {
        this.api.expect.element({
            selector: `ol.bx--breadcrumb li:nth-of-type(${idx + 1}) a.bx--link`,
            locateStrategy: 'css selector',
          }).text.to.equal(crumb);

        idx += 1;
      }

      return this;
    },

    clickBreadcrumb: function(idx) {
      this.api.click({
        selector: `ol.bx--breadcrumb li:nth-of-type(${idx + 1}) a.bx--link`,
        locateStrategy: 'css selector',
      });

      return this;
    },
  }],
};

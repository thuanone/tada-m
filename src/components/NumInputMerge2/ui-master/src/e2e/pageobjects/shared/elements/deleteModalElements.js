module.exports = [
    {
      closeButton: {
        selector: this.selector + ' div.bx--modal-header button.bx--modal-close',
        locateStrategy: 'css selector'
      },
      okButton: {
        selector: this.selector + ' button.bx--btn--danger',
        locateStrategy: 'css selector'
      },
      cancelButton: {
        selector: this.selector + ' button.bx--btn--secondary',
        locateStrategy: 'css selector'
      },
    },
];

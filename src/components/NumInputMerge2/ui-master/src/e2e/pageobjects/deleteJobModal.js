const commands = require('./shared/commands/confirmationModalCommands');

module.exports = {
  url: function() {
    return '';
  },

  elements: [
    {
      closeButton: {
        selector: '#job-delete-modal div.bx--modal-container div.bx--modal-header button.bx--modal-close',
        locateStrategy: 'css selector'
      },
      okButton: {
        selector: '#job-delete-modal div.bx--modal-container button.bx--btn--danger',
        locateStrategy: 'css selector'
      },
      cancelButton: {
        selector: '#job-delete-modal div.bx--modal-container button.bx--btn--secondary',
        locateStrategy: 'css selector'
      },
    },
  ],

  commands,
};

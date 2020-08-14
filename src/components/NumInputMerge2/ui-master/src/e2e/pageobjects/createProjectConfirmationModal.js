const commands = require('./shared/commands/confirmationModalCommands');

module.exports = {
  url: function() {
    return '';
  },

  elements: [
    {
      closeButton: {
        selector: '#confirm-project-creation-modal div.bx--modal-container div.bx--modal-header button.bx--modal-close',
        locateStrategy: 'css selector'
      },
      okButton: {
        selector: '#confirm-project-creation-modal div.bx--modal-container button.bx--btn--primary',
        locateStrategy: 'css selector'
      },
      cancelButton: {
        selector: '#confirm-project-creation-modal div.bx--modal-container button.bx--btn--secondary',
        locateStrategy: 'css selector'
      },
    },
  ],

  commands,
};

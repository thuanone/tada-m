// The sole purpose of this module is to be a wrapper around the static ErrorModal.show
// function to allow us to more easily mock it for unit testing.

import ErrorModal from '@console/pal/Components/ErrorModal';
import t from './i18n';

// TODO: check for replacement import InfoModal from '@console/pal/Components/InfoModal';

// istanbul ignore next
const error = (message, xhr) => {
  ErrorModal.show(message, xhr);
};

// istanbul ignore next
const info = (options) => {
  console.error('No InfoModal replacement implemented yet. Need to check how Carbon V10 solves this.');
  // InfoModal.show(options);
};

const formatBatchDeleteMessage = (itemType: string, items: string[]): string => {
  let result = '';

  if (items && items.length > 0) {
    const len = items.length;

    if (len === 1) {
      result = t('clg.modal.confirmation.single.delete.message', {
        interpolation: { escapeValue: false },
        name: `\"${items[0]}\"`,
        type: itemType.toLowerCase(),
      });
    } else if (len < 4) {
      if (len === 2) {
        result = t('clg.modal.confirmation.batch.2x.delete.message', {
          interpolation: { escapeValue: false },
          last: `\"${items[1]}\"`,
          list: `\"${items[0]}\"`,
          type: itemType.toLowerCase(),
        });
      } else {
        // len === 3
        result = t('clg.modal.confirmation.batch.2x.delete.message', {
          interpolation: { escapeValue: false },
          last: `\"${items[2]}\"`,
          list: `\"${items[0]}\", \"${items[1]}\"`,
          type: itemType.toLowerCase(),
        });
      }
    } else {
      // 4+ items
      result = t('clg.modal.confirmation.batch.4x.delete.message', {
        interpolation: { escapeValue: false },
        list: `\"${items[0]}\", \"${items[1]}\", \"${items[2]}\"`,
        remainingCount: len - 3,
        type: itemType.toLowerCase(),
      });
    }
  }

  return result;
};

export default { error, formatBatchDeleteMessage, info };

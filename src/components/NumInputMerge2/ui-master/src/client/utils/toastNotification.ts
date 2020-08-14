
import ToastManager from '@console/pal/Components/ToastManager';

import { IClgToastNotification } from '../../../src/client/view/model/common-view-model';

const add = (toastToShow: IClgToastNotification) => {
  const toastNotification = {
    caption: toastToShow.caption || '',
    kind: toastToShow.kind,
    lowContrast: true,
    statusIconDescription: '',
    subtitle: toastToShow.subtitle,
    timeout: (toastToShow.timeout || toastToShow.timeout === 0) ? toastToShow.timeout : 5000,
    title: toastToShow.title,
  };

  // error notifications should not disapear
  if (toastToShow.kind === 'error') {
    toastNotification.timeout = 0;
  }

  // add the notification
  ToastManager.add(toastNotification);
};

export default {
  add,
};

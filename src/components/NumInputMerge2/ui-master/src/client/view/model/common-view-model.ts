import { IUIEnvItem, IUIEnvItemKind } from '../../../common/model/common-model';
import * as commonValidator from '../../../common/validator/common-validator';

export interface IClgInlineNotification {
  'analytics-category'?: string;
  'analytics-name'?: string;
  kind: string;  // unique error code
  title: string;
  subtitle?: string | undefined;
  actionFn?: () => void;
  actionLink?: string;
  actionTitle?: string;
  closeFn?: () => void;
  clgId?: string;
}

export interface IClgToastNotification {
  'analytics-category'?: string;
  'analytics-name'?: string;
  kind: string;  // success, error
  title: string;
  subtitle?: string;
  caption?: string;
  timeout?: number;
}

export interface IKeyValue {
  kind: IUIEnvItemKind;
  name: commonValidator.IClgTextField;
  originalValue?: IUIEnvItem;  // won't be set for new variables, only for existing ones that are unsupported by the UI
  value: commonValidator.IClgTextField;
}
export interface IComboBoxItem {
  id: string;
  text: string;
  selected?: boolean;
  invalid?: string;
}

export function sortComboBoxItemsByText(a: IComboBoxItem, b: IComboBoxItem) {
  const x = a.text.toLowerCase();
  const y = b.text.toLowerCase();
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}

export function getNewComboBoxItem(id: string): IUIComboBoxItem {
  return { id, text: id };
}

export interface IUIConfigMapEntry {
  id: string;
  key: string;    // will be used to build the actul IUIEnvItem
  value: string;  // only used for displaying purposes!
}

export interface IUISecretEntry {
  id: string;
  key: string;    // will be used to build the actul IUIEnvItem
  value: string;  // only used for displaying purposes!
}

export interface IUIComboBoxItem {
  id: string;
  text: string;
}

export type IUIConfigMapEntries = IUIConfigMapEntry[];
export type IUIConfigMapsList = string[];  // list of configmap names, plain strings
export type IUISecretEntries = IUISecretEntry[];
export type IUISecretsList = string[];  // list of secret names, plain strings

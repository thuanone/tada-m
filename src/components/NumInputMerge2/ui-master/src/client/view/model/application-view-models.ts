import * as configModel from '../../../common/model/config-model';
import * as commonValidator from '../../../common/validator/common-validator';
import { IKeyValue } from './common-view-model';

export interface IViewApplicationLimits {
  cpus: commonValidator.IClgNumberField;
  maxScale: commonValidator.IClgNumberField;
  memory: commonValidator.IClgNumberField;
  minScale: commonValidator.IClgNumberField;
  containerConcurrency: commonValidator.IClgNumberField;
  timeoutSeconds: commonValidator.IClgNumberField;
  shouldDisableSaveBtn: boolean;
}
export interface IViewApplicationCode {
  image: commonValidator.IClgTextField;
  registry: configModel.IUIRegistrySecret;
  shouldDisableSaveBtn: boolean;
}

export interface IViewApplicationEnvironment {
  parameters: IKeyValue[];
  shouldDisableSaveBtn: boolean;
}

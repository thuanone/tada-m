import * as configModel from '../../../common/model/config-model';
import {IClgNumberField, IClgTextField} from '../../../common/validator/common-validator';

export interface IViewBuildOutput {
    outputImage: IClgTextField;
    outputRegistry: configModel.IUIRegistrySecret;
}

export interface IViewBuildSource {
    name: IClgTextField;
    sourceUrl: IClgTextField;
    sourceRev?: IClgTextField;
    sourceCredentials: string;
}

export interface IViewBuildStrategy {
    strategyName: IClgTextField;
}

import * as configModel from '../../../common/model/config-model';
import { IClgNumberField, IClgTextField } from '../../../common/validator/common-validator';
import { IKeyValue } from './common-view-model';

export interface IViewJobDefinitionCode {
    image: IClgTextField;
    imagePullSecret: configModel.IUIRegistrySecret;
    command: IClgTextField;
    args: IClgTextField;
}

export interface IViewJobDefinitionEnvironment {
    env: IKeyValue[];
}

export interface IViewJobDefinitionRuntime {
    cpus: IClgNumberField;
    memory: IClgNumberField;
}

export interface IJobRunInfo {
    numFailedJobs: number;
    numRunningJobs: number;
    numSucceededJobs: number;
}

/*
    Interfaces for JobDefinition Details page
 */
export interface IUIEditJobDefinition extends IViewJobDefinitionCode, IViewJobDefinitionEnvironment, IViewJobDefinitionRuntime {}

export interface IUIEditJobRun {
    arraySpec: IClgTextField;
    cpus: IClgNumberField;
    memory: IClgNumberField;
    retries: IClgNumberField;
    timeout: IClgNumberField;
}

export function countInstances(arraySpec: string): number {
    if (arraySpec === undefined) {
        return undefined;
    }
    const arraySpecIndices = arraySpec.split(',');
    let  numInstances = 0;
    arraySpecIndices.forEach((index) => {
        if (index.includes('-')) {
            const rangeArray = index.split('-');
            const range = parseInt(rangeArray[1], 10) - parseInt(rangeArray[0], 10) + 1;
            numInstances += range;
        } else {
            numInstances++;
        }
    });
    return numInstances;
}

// react
import PropTypes from 'prop-types';
import React from 'react';
// 3rd-party
import * as log from 'loglevel';
// carbon + pal
import { Add16, TrashCan16 } from '@carbon/icons-react';
import { Button, TextInput } from '@console/pal/carbon-components-react';
// code-engine
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { validateField } from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import t from '../../../utils/i18n';
import { IUIEnvItemKind } from '../../../../common/model/common-model';
import { createLiteralKeyValue } from '../../../../common/utils/environment-utils';
import {
    IKeyValue,
    IUIConfigMapEntries,
    IUIConfigMapsList,
    IUISecretEntries,
    IUISecretsList
} from '../../model/common-view-model';
import ClgEnvVariableSidePanel from '../ClgEnvVariableSidePanel/ClgEnvVariableSidePanel';

interface IProps {
    allowInputDerivation?: boolean;
    handleChange: (updates: commonValidator.IClgKeyValueFields) => void;
    emptyText?: string;
    envVariables: IKeyValue[];
}

interface IState {
    envVariables: IKeyValue[];
    isSaveDisabled: boolean;
    isModified?: boolean;

    isEnvSidePanelOpen: boolean;
}

// The global banner that is shown on all pages
class ClgEnvironmentVariables extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props.allowInputDerivation) {
            return {
                envVariables: props.envVariables,
            };
        } else {
            return null;
        }
    }

    private readonly COMPONENT = 'ClgEnvironmentVariables';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private readonly PARAM_NAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.envVarName;
    private readonly PARAM_VALUE_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.envVarValue;

    constructor(props) {
        super(props);

        this.state = {
            envVariables: [],
            isSaveDisabled: false,
            isModified: false,

            isEnvSidePanelOpen: false,
        };

        this.addVariable = this.addVariable.bind(this);
        this.deleteVariable = this.deleteVariable.bind(this);
        this.onInputValueParamKeyChange = this.onInputValueParamKeyChange.bind(this);
        this.onInputValueParamValueChange = this.onInputValueParamValueChange.bind(this);
    }

    public addVariable() {
        this.logger.debug('addVariable');
        this.setState((oldState) => {
            const newVar = createLiteralKeyValue('', '');
            newVar.name.invalid = undefined;  // avoid invalid-error for all new (empty) fields.
            newVar.value.invalid = undefined;

            oldState.envVariables.push(newVar);
            return {
                envVariables: oldState.envVariables,
                isModified: true,
            };
        }, () => {
            this.populateChangesToParent();
        });
    }

    public deleteVariable(idx) {
        this.logger.debug(`deleteVariable - idx: '${idx}'`);

        if (typeof idx !== 'undefined') {
            // remove entry from 'env' array and make listEnvironmentVariables() create all new id's and bindings
            this.setState((oldState) => {
                oldState.envVariables.splice(idx, 1);
                return {
                    envVariables: oldState.envVariables,
                    isModified: true,
                };
            }, () => {
                this.populateChangesToParent();
            });
        }
    }

    public render() {
        this.logger.debug(`render - ${this.state.envVariables && this.state.envVariables.length} envVariables`);
        return (
            <div className='environment-variables coligo-form'>
                {(!this.state.envVariables || this.state.envVariables.length === 0) &&
                (
                    <section aria-label='no variables yet' className='environment-variables'>
                        <div className='environment-variables--none bx--form-item'>
                            <span>{t(this.props.emptyText || 'clg.common.label.no.variables')}</span>
                        </div>
                        <Button kind='tertiary' className='environment-variables--btn-add' renderIcon={Add16} onClick={this.addVariable}>{t('clg.cmp.envvariables.addVariable')}</Button>
                    </section>
                )
                }

                {(this.state.envVariables && this.state.envVariables.length > 0) &&
                (
                    <section aria-label='existing variables' className='environment-variables'>
                        <div className='environment-variables--container'>
                            {this.listEnvironmentVariables()}
                        </div>
                        <Button kind='tertiary' className='environment-variables--btn-add' renderIcon={Add16} onClick={this.addVariable}>{t('clg.cmp.envvariables.addVariable')}</Button>
                    </section>
                )
                }
            </div>
        );
    }

    /**
     * Parses the 'id' field of an event target Node and returns just the index to the
     * parameters array as a number
     *
     * @param idValue
     */
    private parseTargetId(idValue: string, prefix: string, suffix?: string): number {
        let endIdx;
        const startIdx = idValue.indexOf(prefix) + prefix.length;
        if (suffix) {
            endIdx = idValue.indexOf(suffix);
        } else {
            endIdx = idValue.length;
        }

        const numberStr = idValue.substring(startIdx, endIdx);
        return parseInt(numberStr, 10);
    }

    private onInputValueParamKeyChange(event) {
        const fn = `${this.COMPONENT}onInputValueParamKeyChange `;

        const idx = this.parseTargetId(event.target.id, 'env-variable-', '-key');

        const envParams = this.state.envVariables;
        envParams[idx].name.val = event.target.value;
        validateField(envParams[idx].name);

        this.setState({
            envVariables: envParams,
            isModified: true,
        }, () => {
            this.populateChangesToParent();
        });

    }

    private onInputValueParamValueChange(event) {
        const fn = `${this.COMPONENT}onInputValueParamValueChange `;

        const idx = this.parseTargetId(event.target.id, 'env-variable-', '-value');

        const envParams = this.state.envVariables;
        envParams[idx].value.val = event.target.value;
        validateField(envParams[idx].value);

        this.setState({
            envVariables: envParams,
            isModified: true,
        }, () => {
            this.populateChangesToParent();
        });
    }

    private listEnvironmentVariables() {
        const variables = [];
        for (let i = 0; i < this.state.envVariables.length; i++) {
            variables.push(
                <div key={`env-param-${i}`} className='bx--row environment-variables--param'>
                    <div className='bx--col-lg-7 bx--col-md-3 environment-variables--param-key'>
                        <TextInput
                            type={'text'}
                            disabled={this.state.envVariables[i].kind !== IUIEnvItemKind.LITERAL}
                            id={`env-variable-${i}-key`}
                            labelText={t('clg.cmp.envvariables.name')}
                            placeholder={t('clg.cmp.envvariables.namePlaceholder')}
                            className={'env-variable-input'}
                            value={this.state.envVariables[i].name.val}
                            invalid={typeof this.state.envVariables[i].name.invalid !== 'undefined'}
                            invalidText={t('clg.cmp.envvariables.name.invalid.' + this.state.envVariables[i].name.invalid, this.PARAM_NAME_RULES)}
                            onChange={this.onInputValueParamKeyChange}
                        />
                    </div>
                    <div className='bx--col-lg-7 bx--col-md-3 environment-variables--param-value'>
                        <TextInput
                            type={'text'}
                            disabled={this.state.envVariables[i].kind !== IUIEnvItemKind.LITERAL}
                            id={`env-variable-${i}-value`}
                            labelText={t('clg.cmp.envvariables.value')}
                            placeholder={t('clg.cmp.envvariables.valuePlaceholder')}
                            className={'env-variable-input'}
                            value={this.state.envVariables[i].value.val}
                            invalid={typeof this.state.envVariables[i].value.invalid !== 'undefined'}
                            invalidText={t('clg.cmp.envvariables.value.invalid.' + this.state.envVariables[i].value.invalid, this.PARAM_VALUE_RULES)}
                            onChange={this.onInputValueParamValueChange}
                        />
                    </div>
                    <div
                        id={`delete-param-button-${i}-div`}
                        className={'bx--col-lg-2 bx--col-md-2 environment-variables--delete-button'}
                    >
                        <Button
                            key={`delete-param-button-${i}-btn`}
                            hasIconOnly={true}
                            id={`delete-param-button-${i}-btn`}
                            kind='ghost'
                            renderIcon={TrashCan16}
                            onClick={this.deleteVariable.bind(this, i)}
                            iconDescription={t('clg.cmp.envvariables.deleteVariable')}
                            tooltipAlignment={'center'}
                            tooltipPosition={'bottom'}
                        />
                    </div>
                </div>
            );
        }

        return variables;
    }

    private isEnvVariableValid(envParameter: IKeyValue): boolean {
        if (!envParameter.name.val || envParameter.name.invalid || envParameter.value.invalid) {
        return false;
        }

        return true;
    }

    private shouldDisableSave(
        envVariables: IKeyValue[]): boolean {
            const fn = 'shouldDisableSave ';

            this.logger.debug(`${fn}>`);

            let allEnvParametersAreValid = true;
            // check if all variable fields are valid
            for (const variableToCheck of envVariables) {
                if (!this.isEnvVariableValid(variableToCheck)) {
                    allEnvParametersAreValid = false;
                    break;
                }
            }

            if (!allEnvParametersAreValid) {
                // disable the create button
                this.logger.debug(`${fn}< true`);
                return true;
            }

            this.logger.debug(`${fn}< false`);
            return false;
    }

    /**
     * This function is used to populate the current state to the parent component
     */
    private populateChangesToParent() {

        // evaluate whether the save button must be disabled
        const shouldDisableSaveBtn = this.shouldDisableSave(this.state.envVariables);

        this.props.handleChange({ val: this.state.envVariables, invalid: shouldDisableSaveBtn ? `${shouldDisableSaveBtn}` : undefined });
    }
}
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgEnvironmentVariables.propTypes = {
    allowInputDerivation: PropTypes.bool,
    emptyText: PropTypes.string,
    handleChange: PropTypes.func.isRequired,
};

export default ClgEnvironmentVariables;

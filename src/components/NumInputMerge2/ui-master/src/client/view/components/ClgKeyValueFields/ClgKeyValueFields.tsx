// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Add16, TrashCan16 } from '@carbon/icons-react';
import { Button, TextInput } from '@console/pal/carbon-components-react';

import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import t from '../../../utils/i18n';
import ClgTextInput from '../../components/ClgTextInput/ClgTextInput';
import * as commonViewModel from '../../model/common-view-model';
import { IUIEnvItemKind } from '../../../../common/model/common-model';

interface IProps {
    handleChange: (updates: commonValidator.IClgKeyValueFields) => void;
    emptyText?: string;
    renderValuesAsSecret?: boolean;
}

interface IState {
    keyvalueFields: commonViewModel.IKeyValue[];
    isSaveDisabled: boolean;
}

// The global banner that is shown on all pages
class ClgKeyValueFields extends React.Component<IProps, IState> {

    private readonly COMPONENT = 'ClgKeyValueFields';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private readonly PARAM_KEY_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.keyvalueKey;
    private readonly PARAM_VALUE_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.keyvalueValue;

    private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

    constructor(props) {
        super(props);

        this.state = {
            isSaveDisabled: false,
            keyvalueFields: [],
        };

        this.addKeyValue = this.addKeyValue.bind(this);
        this.deleteKeyValue = this.deleteKeyValue.bind(this);
        this.onInputValueParamKeyChange = this.onInputValueParamKeyChange.bind(this);
        this.onInputValueParamValueChange = this.onInputValueParamValueChange.bind(this);
    }

    public addKeyValue() {
        this.logger.debug('addKeyValue');
        this.setState((oldState) => {
            oldState.keyvalueFields.push({
                kind: IUIEnvItemKind.LITERAL,
                name: { val: '' },
                value: { val: '' },
            });
            return oldState;
        });
    }

    public deleteKeyValue(idx) {
        this.logger.debug(`deleteKeyValue - idx: '${idx}'`);

        if (typeof idx !== 'undefined') {
            // remove entry from 'env' array and make listKeyvalueFields() create all new id's and bindings
            this.setState((oldState) => {
                oldState.keyvalueFields.splice(idx, 1);
                return {
                    keyvalueFields: oldState.keyvalueFields,
                };
            }, () => {
                this.populateChangesToParent();
            });
        }
    }

    public render() {
        this.logger.debug(`render - ${this.state.keyvalueFields && this.state.keyvalueFields.length} keyvalueFields`);
        return (
            <div className='keyvalues-fields coligo-form'>
                {(!this.state.keyvalueFields || this.state.keyvalueFields.length === 0) &&
                (
                    <section aria-label='no fields yet' className='keyvalues-fields'>
                        {this.props.emptyText &&
                        (
                            <div className='keyvalues-fields--none form-section'>
                                <span>{t(this.props.emptyText)}</span>
                            </div>
                        )}
                        <Button kind='tertiary' className='keyvalues-fields--btn-add' renderIcon={Add16} onClick={this.addKeyValue}>{t('clg.cmp.keyvaluefields.addKeyValue')}</Button>
                    </section>
                )
                }

                {(this.state.keyvalueFields && this.state.keyvalueFields.length > 0) &&
                (
                    <section aria-label='existing variables' className='keyvalues-fields'>
                        <div className='keyvalues-fields--container'>
                            {this.listKeyvalueFields()}
                        </div>
                        <Button kind='tertiary' className='keyvalues-fields--btn-add' renderIcon={Add16} onClick={this.addKeyValue}>{t('clg.cmp.keyvaluefields.addKeyValue')}</Button>
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

        const idx = this.parseTargetId(event.target.id, 'keyvalue-field-', '-key');
        const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.PARAM_KEY_RULES);

        const envParams = this.state.keyvalueFields;
        envParams[idx].name = field;

        this.setState({
            keyvalueFields: envParams
        }, () => {
            this.populateChangesToParent();
        });

    }

    private onInputValueParamValueChange(event) {
        const fn = `${this.COMPONENT}onInputValueParamValueChange `;

        const idx = this.parseTargetId(event.target.id, 'keyvalue-field-', '-value');
        const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.PARAM_VALUE_RULES);

        const envParams = this.state.keyvalueFields;
        envParams[idx].value = field;

        this.setState({
            keyvalueFields: envParams
        }, () => {
            this.populateChangesToParent();
        });
    }

    private listKeyvalueFields() {
        const variables = [];
        for (let i = 0; i < this.state.keyvalueFields.length; i++) {
            variables.push(
                <div key={`env-param-${i}`} className='bx--row keyvalues-fields--param'>
                    <div className='bx--col-lg-7 bx--col-md-3 keyvalues-fields--param-key'>
                        <ClgTextInput
                            hasPlaceholderText={true}
                            inputId={`keyvalue-field-${i}-key`}
                            nlsKey='clg.cmp.keyvaluefields.key'
                            onChange={this.onInputValueParamKeyChange}
                            textField={this.state.keyvalueFields[i].name}
                            validationRules={this.PARAM_KEY_RULES}
                        />
                    </div>
                    <div className='bx--col-lg-7 bx--col-md-3 keyvalues-fields--param-value'>
                        <ClgTextInput
                            hasPlaceholderText={true}
                            inputId={`keyvalue-field-${i}-value`}
                            isSecret={this.props.renderValuesAsSecret}
                            nlsKey='clg.cmp.keyvaluefields.value'
                            onChange={this.onInputValueParamValueChange}
                            textField={this.state.keyvalueFields[i].value}
                            validationRules={this.PARAM_VALUE_RULES}
                        />
                    </div>
                    <div
                        id={`delete-param-button-${i}-div`}
                        className={'bx--col-lg-2 bx--col-md-2 keyvalues-fields--delete-button'}
                    >
                        <Button
                            key={`delete-param-button-${i}-btn`}
                            hasIconOnly={true}
                            id={`delete-param-button-${i}-btn`}
                            kind='ghost'
                            renderIcon={TrashCan16}
                            onClick={this.deleteKeyValue.bind(this, i)}
                            iconDescription={t('clg.cmp.keyvaluefields.deleteKeyValue')}
                            tooltipAlignment={'center'}
                            tooltipPosition={'bottom'}
                        />
                    </div>
                </div>
            );
        }

        return variables;
    }

    private isKeyvalueFieldValid(envParameter: commonViewModel.IKeyValue): boolean {
        if (!envParameter.name.val || envParameter.name.invalid || envParameter.value.invalid) {
        return false;
        }

        return true;
    }

    private shouldDisableSave(
        keyvalueFields: commonViewModel.IKeyValue[]): boolean {
            const fn = 'shouldDisableSave ';

            this.logger.debug(`${fn}>`);

            let allFieldsAreValid = true;
            // check if all variable fields are valid
            for (const variableToCheck of keyvalueFields) {
                if (!this.isKeyvalueFieldValid(variableToCheck)) {
                    allFieldsAreValid = false;
                    break;
                }
            }

            if (!allFieldsAreValid) {
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
        const shouldDisableSaveBtn = this.shouldDisableSave(this.state.keyvalueFields);

        this.props.handleChange({ val: this.state.keyvalueFields, invalid: shouldDisableSaveBtn ? `${shouldDisableSaveBtn}` : undefined });
    }
}
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgKeyValueFields.propTypes = {
    emptyText: PropTypes.string,
    handleChange: PropTypes.func.isRequired,
    renderValuesAsSecret: PropTypes.bool,
};

export default ClgKeyValueFields;

import PropTypes from 'prop-types';
import React from 'react';

import { TextInput, Tooltip } from '@console/pal/carbon-components-react';

import * as commonValidator from '../../../../common/validator/common-validator';
import t from '../../../utils/i18n';

interface IProps {
    className?: string;
    'data-focus-first'?: boolean;
    hasHelperText?: boolean;
    hasPlaceholderText?: boolean;
    hasTooltip?: boolean;
    hasTooltipFooter?: boolean;
    inputClassName?: string;
    inputId: string;
    isDisabled?: boolean;
    isSecret?: boolean;
    light?: boolean;
    nlsKey: string;
    onChange: (event: any) => void;
    textField: commonValidator.IClgField;
    tooltipDirection?: string;
    validationRules?: { [key: string]: any };
}

interface IState {
    type: string;
    disabled: boolean;
}

class ClgTextInput extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        if (state.disabled !== props.isDisabled) {
            return {
                disabled: props.isDisabled,
            };
        } else {
            return null;
        }
    }

    private TYPE_PASSWORD: string = 'password';
    private TYPE_TEXT: string = 'text';

    constructor(props) {
        super(props);

        this.state = {
            disabled: !!props.isDisabled,
            type: props.isSecret ? this.TYPE_PASSWORD : this.TYPE_TEXT,
        };

        this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
    }

    public togglePasswordVisibility() {
        this.setState({ type: (this.state.type === this.TYPE_PASSWORD ? this.TYPE_TEXT : this.TYPE_PASSWORD) });
    }

    public render() {

        return (
            <div className={`clg--text-input ${this.props.className || ''}`}>
                {this.props.hasTooltip &&
                    (
                        <Tooltip
                            direction={this.props.tooltipDirection || 'right'}
                            tabIndex={1}
                            triggerText={t(`${this.props.nlsKey}.label`)}
                        >
                            <p>
                                {t(`${this.props.nlsKey}.tooltip`, this.props.validationRules || {})}
                            </p>
                            {this.props.hasTooltipFooter &&
                                (
                                    <div className='bx--tooltip__footer' dangerouslySetInnerHTML={{ __html: t(`${this.props.nlsKey}.tooltipFooter`, this.props.validationRules || {}) }} />
                                )}
                        </Tooltip>
                    )}
                {this.props.isSecret ? (
                    <TextInput.ControlledPasswordInput
                        className={this.props.inputClassName}
                        data-focus-first={this.props['data-focus-first']}
                        disabled={this.state.disabled}
                        id={this.props.inputId}
                        hideLabel={this.props.hasTooltip}
                        labelText={t(`${this.props.nlsKey}.label`)}
                        light={this.props.light}
                        helperText={this.props.hasHelperText ? t(`${this.props.nlsKey}.helper`) : undefined}
                        hidePasswordLabel={t('clg.common.label.hide')}
                        placeholder={this.props.hasPlaceholderText ? t(`${this.props.nlsKey}.placeholder`, this.props.validationRules || {}) : ''}
                        showPasswordLabel={t('clg.common.label.show')}
                        tabIndex={0}
                        togglePasswordVisibility={this.togglePasswordVisibility}
                        type={this.state.type}
                        value={this.props.textField.val}
                        invalid={typeof this.props.textField.invalid !== 'undefined'}
                        invalidText={t(`${this.props.nlsKey}.invalid.${this.props.textField.invalid}`, this.props.validationRules || {})}
                        onChange={this.props.onChange}
                    />
                ) : (
                        <TextInput
                            className={this.props.inputClassName}
                            data-focus-first={this.props['data-focus-first']}
                            disabled={this.state.disabled}
                            id={this.props.inputId}
                            hideLabel={this.props.hasTooltip}
                            labelText={t(`${this.props.nlsKey}.label`)}
                            light={this.props.light}
                            helperText={this.props.hasHelperText ? t(`${this.props.nlsKey}.helper`) : undefined}
                            placeholder={this.props.hasPlaceholderText ? t(`${this.props.nlsKey}.placeholder`, this.props.validationRules || {}) : ''}
                            tabIndex={0}
                            type={'text'}
                            value={this.props.textField.val}
                            invalid={typeof this.props.textField.invalid !== 'undefined'}
                            invalidText={t(`${this.props.nlsKey}.invalid.${this.props.textField.invalid}`, this.props.validationRules || {})}
                            onChange={this.props.onChange}
                        />
                    )}
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgTextInput.propTypes = {
    className: PropTypes.string,
    hasHelperText: PropTypes.bool,
    hasPlaceholderText: PropTypes.bool,
    hasTooltip: PropTypes.bool,
    hasTooltipFooter: PropTypes.bool,
    inputClassName: PropTypes.string,
    inputId: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    isSecret: PropTypes.bool,
    light: PropTypes.bool,
    nlsKey: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    textField: PropTypes.object.isRequired,
    tooltipDirection: PropTypes.string,
    validationRules: PropTypes.object,
};

export default ClgTextInput;

// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// pal + carbon
import { Modal, TextInput } from '@console/pal/carbon-components-react';

// coligo
import t from '../../../utils/i18n';
import GlobalStateContext from '../../common/GlobalStateContext';

interface IProps {
    addConfirmationCheck?: boolean;
    confirmationLabel?: string;
    id: string;
    isDanger: boolean;
    itemsToConfirm?: string[];
    onSubmitHandler: () => any;
    onCancelHandler: () => any;
    heading: string;
    isOpen: boolean;
    isSubmitting?: boolean;
    label?: string;
    primaryBtnText: string;
    secondaryBtnText: string;
    size?: string;  // xs, sm, md, lg
    messages: string[];
}

interface IState {
    confirmationInput: string;
    hasConfirmed: boolean;
    requiredConfirmationText: string;
}

// The global banner that is shown on all pages
class ClgConfirmationModal extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgConfirmationModal';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

        this.state = {
            confirmationInput: '',
            hasConfirmed: props.addConfirmationCheck ? false : true,
            requiredConfirmationText: this.buildRequiredConfirmationText(props.itemsToConfirm),
        };

        this.buildMessage = this.buildMessage.bind(this);
        this.onConfirmationInputChange = this.onConfirmationInputChange.bind(this);
        this.checkConfirmedInput = this.checkConfirmedInput.bind(this);
    }

    public UNSAFE_componentWillReceiveProps(newProps) {
        const fn = 'componentWillReceiveProps ';
        this.logger.debug(`${fn}`);
        const requiredConfirmationText = this.buildRequiredConfirmationText(newProps.itemsToConfirm);
        if (newProps.addConfirmationCheck && (this.state.requiredConfirmationText !== requiredConfirmationText || !newProps.itemsToConfirm)) {
            this.logger.debug(`${fn}- state change needed! - '${this.props.itemsToConfirm}' vs '${newProps.itemsToConfirm}'`);
            // we need to re-set the state if the content of the confirmation modal has been changed
            this.setState({ confirmationInput: '', hasConfirmed: false, requiredConfirmationText});
        }
    }

    public checkConfirmedInput(confirmedValue) {
        this.logger.debug(`checkConfirmedInput- '${this.state.requiredConfirmationText}' vs '${confirmedValue}'`);
        this.setState({ confirmationInput: confirmedValue, hasConfirmed: (confirmedValue === this.state.requiredConfirmationText) });
    }

    public render() {
        this.logger.debug(`render - hasConfirmed? '${this.state.hasConfirmed}'`);
        return (
            <Modal
                className='clg-confirmation-modal'
                danger={this.props.isDanger || false}
                hasScrollingContent={false}
                iconDescription='Close the modal'
                id={this.props.id}
                modalAriaLabel='A label to be read by screen readers on the modal root node'
                modalHeading={this.props.heading}
                modalLabel={this.props.label}
                onRequestClose={this.props.onCancelHandler}
                onRequestSubmit={this.props.onSubmitHandler}
                onSecondarySubmit={this.props.onCancelHandler}
                open={this.props.isOpen}
                passiveModal={false}
                primaryButtonDisabled={this.props.isSubmitting || !this.state.hasConfirmed}
                primaryButtonText={this.props.primaryBtnText || t('clg.modal.button.ok')}
                secondaryButtonText={this.props.secondaryBtnText || t('clg.modal.button.cancel')}
                selectorPrimaryFocus='[data-modal-primary-focus]'
                shouldSubmitOnEnter={this.state.hasConfirmed}
                size={this.props.size || 'sm'}
            >
                <div className='bx--modal-content__text'>
                    {this.buildMessage()}
                    {this.props.addConfirmationCheck &&
                        (
                            <TextInput
                                className='confirmation-check'
                                id={`${this.props.id}-confirmation-check`}
                                labelText={this.props.confirmationLabel || t('clg.modal.confirmation.confirm.label', { name: this.state.requiredConfirmationText })}
                                light={false}
                                placeholder={this.state.requiredConfirmationText}
                                type={'text'}
                                value={this.state.confirmationInput}
                                onChange={this.onConfirmationInputChange}
                            />
                        )}
                </div>
            </Modal>
        );
    }

    private buildRequiredConfirmationText(itemsList) {
        // build the required confirmation check text
        let confirmationCheckText;
        if (itemsList && Array.isArray(itemsList) && itemsList.length === 1) {
            confirmationCheckText = itemsList[0];
        } else {
            // in case no item list has been provided show the default text
            // this text is used if this is a batch operation confirmation
            confirmationCheckText = t('clg.modal.confirmation.confirm.default');
        }
        return confirmationCheckText;
    }

    private buildMessage() {
        const result = [];
        const messages = [];

        // filter out empty strings
        for (const message of this.props.messages) {
            if (message.trim()) {
                messages.push(message);
            }
        }

        if (messages.length < 2) {
            result.push(
                <p key={1} className='bx--modal-content__text clg-modal-message-paragraph'>
                    {messages[0]}
                </p>
            );
        } else {
            let idx = 0;
            for (const message of messages) {
                idx += 1;
                result.push(
                    <p key={idx} className='bx--modal-content__text clg-modal-message-paragraph'>
                        {message}
                    </p>
                );
            }
        }

        return result;
    }

    private onConfirmationInputChange(event) {
        if (event.target) {
            this.checkConfirmedInput(event.target.value);
        }
    }
}

ClgConfirmationModal.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgConfirmationModal.propTypes = {
    heading: PropTypes.string.isRequired,
    id: PropTypes.string,
    isDanger: PropTypes.bool,
    isOpen: PropTypes.bool.isRequired,
    isSubmitting: PropTypes.bool,
    messages: PropTypes.array.isRequired,
    onCancelHandler: PropTypes.func.isRequired,
    onSubmitHandler: PropTypes.func.isRequired,
    primaryBtnText: PropTypes.string,
    secondaryBtnText: PropTypes.string,
    size: PropTypes.string,
};

export default ClgConfirmationModal;

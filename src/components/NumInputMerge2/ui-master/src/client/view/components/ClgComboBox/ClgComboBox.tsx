import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

import { ComboBox, DropdownSkeleton, FormItem, FormLabel, InlineLoading, Tooltip } from '@console/pal/carbon-components-react';

import t from '../../../utils/i18n';
import * as commonViewModel from '../../model/common-view-model';

interface IProps {
    className?: string;
    hasHelperText?: boolean;
    hasPlaceholderText?: boolean;
    hasTooltip?: boolean;
    hasTooltipFooter?: boolean;
    selectedItem?: commonViewModel.IComboBoxItem;
    inputClassName?: string;
    inputId: string;
    invalid?: string;
    isDataLoading?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    items?: commonViewModel.IComboBoxItem[];
    itemToString?: (item: commonViewModel.IComboBoxItem) => string;
    light?: boolean;
    nlsKey: string;
    onChange: (element: commonViewModel.IComboBoxItem) => void;
    tooltipDirection?: string;
}

interface IState {
    dataLoading: boolean;
    items?: commonViewModel.IComboBoxItem[];
    loading?: boolean;
    ownUpdate: boolean;
    selectedItem?: commonViewModel.IComboBoxItem;
}

interface IStateUpdate {
    dataLoading?: boolean;
    selectedItem?: commonViewModel.IComboBoxItem;
    loading?: boolean;
    ownUpdate: boolean;
    items?: commonViewModel.IComboBoxItem[];
}

const COMPONENT = 'ClgComboBox';
// setup the logger
const logger = log.getLogger(COMPONENT);

class ClgComboBox extends React.Component<IProps, IState> {

    public static getDerivedStateFromProps(props: IProps, state: IState) {
        const fn = 'getDerivedStateFromProps ';
        logger.trace(`${fn}> props: '${JSON.stringify(props)}', state: ${JSON.stringify(state)}`);

        if (state.ownUpdate) {
            logger.debug(`${fn}< - no updated due to own update`);
            return { ownUpdate: false };
        }

        const stateUpdate: IStateUpdate = { ownUpdate: false };

        if ((state.selectedItem && state.selectedItem.id) !== (props.selectedItem && props.selectedItem.id)) {
            stateUpdate.selectedItem = props.selectedItem;
        }

        if (state.items !== props.items) {
            // in case data loading is still ongoing, we do not want to update the items
            if (!!!props.isDataLoading) {
                stateUpdate.items = props.items;
            }
        }

        if (state.loading !== !!props.isLoading) {
            stateUpdate.loading = !!props.isLoading;
        }

        if (state.dataLoading !== !!props.isDataLoading) {
            stateUpdate.dataLoading = !!props.isDataLoading;

            // in case the combo box data is loading
            // we want to show an inline loading spinner below the combobox
            if (stateUpdate.dataLoading) {
                stateUpdate.items = [];
            } else {
                stateUpdate.items = props.items;

                // right after the loading has ended, the combobox should open and show the typeahead suggestions
                const listBoxField = `#${props.inputId}combobox .bx--list-box__field`;
                logger.debug(`${fn}- put focus on '${listBoxField}'`);
                $(listBoxField).focus();
                $(listBoxField).click();
                $(`${listBoxField} .bx--text-input`).focus();
            }
        }

        // check whether the state needs to be updated
        if (Object.keys(stateUpdate).length > 1) {
            logger.debug(`${fn}< state update! ${JSON.stringify(stateUpdate)}`);
            return stateUpdate;
        }

        logger.debug(`${fn}<`);
        return null;
    }

    private currentValue: string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            dataLoading: !!props.isDataLoading,
            ownUpdate: false,
            selectedItem: props.selectedItem,
            loading: !!props.isLoading,
        };

        this.onInputChange = this.onInputChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    public onSelectionChange(event) {
        const fn = 'onSelectionChange ';
        logger.debug(`${fn}> event: '${JSON.stringify(event)}'`);

        if (event && event.selectedItem) {

            // this check is necessary as we have a race condition between 'onInputChange' and 'onSelectionChange' and want to make sure that an update is only populated once
            if (this.currentValue && this.currentValue === event.selectedItem.id) {
                logger.debug(`${fn}< change is already in flight`);
                return;
            }
            this.currentValue = event.selectedItem.id;

            // TODO in case the user selected a default item (empty state info, or warning), we'll need to refuse the selection change

            if (this.state.selectedItem && this.state.selectedItem.id === event.selectedItem.id) {
                logger.debug(`${fn}< no need to update`);
            }

            this.setState(
                () => ({ selectedItem: event.selectedItem, ownUpdate: true }),
                () => {
                    // populate the updated item to the parent
                    this.props.onChange(event.selectedItem);
                    logger.debug(`${fn}<`);
                });

        }
    }

    public onInputChange(newValue: string) {
        const fn = 'onInputChange ';
        logger.debug(`${fn}> newValue: '${newValue}'`);

        // this check is necessary as we have a race condition between 'onInputChange' and 'onSelectionChange' and want to make sure that an update is only populated once
        if (this.currentValue && this.currentValue === newValue) {
            logger.debug(`${fn}< change is already in flight`);
            return;
        }
        this.currentValue = newValue;

        if (newValue && !this.state.selectedItem || this.state.selectedItem.id !== newValue) {

            this.setState(
                () => ({ selectedItem: { id: newValue, text: newValue }, ownUpdate: true }),
                () => {
                    // populate the updated item to the parent
                    this.props.onChange({ id: newValue, text: newValue });
                    logger.debug(`${fn}<`);
                });
        }
    }

    public render() {
        logger.debug(`render - dataLoading? ${!!this.state.dataLoading}, selectedItem: ${JSON.stringify(this.state.selectedItem)}, ${this.state.items && this.state.items.length} items`);

        const itemsToRender = this.getUpdatedItemList(this.state.items, this.state.selectedItem);

        return (
            <div className={`clg--combo-box ${this.props.className || ''}`}>
                {this.props.hasTooltip &&
                    (
                        <Tooltip
                            direction={this.props.tooltipDirection || 'right'}
                            tabIndex={1}
                            triggerText={t(`${this.props.nlsKey}.label`)}
                        >
                            <p>
                                {t(`${this.props.nlsKey}.tooltip`)}
                            </p>
                            {this.props.hasTooltipFooter &&
                                (
                                    <div className='bx--tooltip__footer' dangerouslySetInnerHTML={{ __html: t(`${this.props.nlsKey}.tooltipFooter`) }} />
                                )}
                        </Tooltip>
                    )}
                {this.state.loading ? (
                    <FormItem>
                        <FormLabel>{t(`${this.props.nlsKey}.label`)}</FormLabel>
                        <DropdownSkeleton />
                    </FormItem>
                ) : (
                        <FormItem>
                            <ComboBox
                                className={this.props.inputClassName}
                                disabled={this.props.isDisabled}
                                helperText={this.props.hasHelperText ? t(`${this.props.nlsKey}.helper`) : undefined}
                                id={this.props.inputId}
                                invalid={typeof this.props.invalid !== 'undefined'}
                                invalidText={this.props.invalid}
                                items={itemsToRender}
                                itemToString={this.props.itemToString || this.itemToString}
                                titleText={!this.props.hasTooltip && t(`${this.props.nlsKey}.label`)}
                                light={this.props.light}
                                onChange={this.onSelectionChange}
                                onInputChange={this.onInputChange}
                                placeholder={this.props.hasPlaceholderText ? t(`${this.props.nlsKey}.placeholder`) : ''}
                                selectedItem={this.state.selectedItem}
                            />
                            {this.state.dataLoading && (
                                <span className='loading data-loading'><InlineLoading description={t(`${this.props.nlsKey}.loading`)} /></span>
                            )}
                        </FormItem>
                    )}
            </div>
        );
    }

    private itemToString(item: commonViewModel.IComboBoxItem) {
        if (!item || !item.id) {
            return '';
        }
        return item.id;
    }

    private getUpdatedItemList(list: commonViewModel.IComboBoxItem[], item: commonViewModel.IComboBoxItem) {
        if (!list || !item) {
            if (!item) {
                return [];
            }
            return [item];
        }
        for (const listItem of list) {
            if (listItem.id === item.id) {
                return list;
            }
        }
        if (item.id === '') {
            return list;
        }
        // prepend the current item to the list
        return [item].concat(list);
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgComboBox.propTypes = {
    className: PropTypes.string,
    hasHelperText: PropTypes.bool,
    hasPlaceholderText: PropTypes.bool,
    hasTooltip: PropTypes.bool,
    hasTooltipFooter: PropTypes.bool,
    inputClassName: PropTypes.string,
    inputId: PropTypes.string.isRequired,
    invalid: PropTypes.string,
    isDataLoading: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    items: PropTypes.array,
    itemToString: PropTypes.func,
    light: PropTypes.bool,
    nlsKey: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    selectedItem: PropTypes.object,
    tooltipDirection: PropTypes.string,
};

export default ClgComboBox;

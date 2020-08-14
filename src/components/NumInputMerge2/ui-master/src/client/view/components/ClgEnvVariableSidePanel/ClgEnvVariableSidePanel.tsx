// react
import PropTypes from 'prop-types';
import React from 'react';
// 3rd-party
import * as log from 'loglevel';
// carbon + pal
import {
    Launch16,
} from '@carbon/icons-react';
import { ComboBox, DropdownSkeleton, FormItem, FormLabel } from '@console/pal/carbon-components-react';
import { SidePanel, SidePanelContainer } from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';
// coligo
import {
    IUIEnvItem,
    IUIEnvItemKeyRef,
    IUIEnvItemKind,
    IUIEnvItemLiteral,
    IUIEnvItemMapRef,
    IUIEnvItemPredefined,
    IUIEnvItems,
    IUIEnvRefKind
} from '../../../../common/model/common-model';
import t from '../../../utils/i18n';
import { FormGroup, RadioButton, RadioButtonGroup } from '../../common/carbon';
import {
    IUIConfigMapEntries, IUIConfigMapEntry,
    IUIConfigMapsList,
    IUISecretEntries,
    IUISecretsList
} from '../../model/common-view-model';
import ClgTextInput from '../ClgTextInput/ClgTextInput';
import { getValidatedTextField, IClgTextField, validateField } from '../../../../common/validator/common-validator';
import coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import { TextValidator } from '../../../../common/validator/text-validator';
import ClgTableWrapper, { IClgTableWrapperPropItem } from '../ClgTableWrapper/ClgTableWrapper';
import ClgTeaser from '../ClgTeaser/ClgTeaser';
import img from '../../../utils/img';
import nav from '../../../utils/nav';
import clgUIKey from '../../../utils/formatter/clgUIKey';
import clgUIValue from '../../../utils/formatter/clgUIValue';
import clgUISecretValue from '../../../utils/formatter/clgUISecretValue';

enum DEFINED_BY {
    CONTAINER = -1,
    LITERAL = 0,
    CONFIGMAP = 1,
    SECRET = 2,
}

const GlobalTextValidator = new TextValidator();

interface IUIEnvVarSidePanel {
    envVarName: IClgTextField;
    envVarValue: IClgTextField;
    envVarSecretName: IClgTextField;
    envVarConfigMapName: IClgTextField;
}

/**
 * Used to store easy-to-access variant of each possible IUIEnvItem type (for use in the UI)
 * Also used to convert from and to actual IUIEnvItem types on load/save.
 */
export interface IUIEnvItemFlat {
    name: string;
    originalValue?: string;  // for Container defined variables only. Carries the original value from the container.
    value: string;
    secretName: string;  // if both secretName and configMapName are undefined, this is either a Container or Literal EnvVarItem
    configMapName: string;
    selectedKeys: string[];  // this could be 1+ keys (or none) in case of 'Add variable' mode and one or none key in 'Edit variable' mode
    prefix: string;
    readonly: boolean;  // for Container EnvVarItems, this is true. Which means, editing the name is forbidden and changing the value
                        // adds an all new literal EnvVarItem on save.
}

export type IUISetNewEnvItemFn = (newEnvItem?: IUIEnvItem) => void;

/**
 * A note on editing "Container defined"-Environment variables:
 *
 * Per se, env variables, defined by the container are read-only. However, a user can always define another variable
 * with the same name, which will effectively override such container-defined variables.
 *
 * The SidePanel needs to be able to determine whether a variable is a container-defined one to properly show the
 * Container option and to disallow changing the name.
 *
 * When a user chooses to override a container-defined variable, a new variable needs to be created and returned by
 * the SidePanel. But what about already overridden container-defined variables? In that case, another read/write
 * env variable already exists with the same name of a container-defined variable.
 *
 * The EnvVariable table already needs to determine such an override to properly display that relationship.
 *
 * When a user tries to edit such an override, we need to offer two choices to the user:
 * a) go back to the original container-defined value
 * b) modify the override value and save that override
 *
 * Therefore, the SidePanel requires the input env variable to still carry the 'Container' type, while the value
 * should actually point to either the original or to the override value. To be able to revert back to the original
 * value, which effectively means undoing the override, we also need that original value - for two purposes:
 *
 * a) to display it in the sidepanel
 * b) to allow the outer table on save whether the override env variable can be removed (originalvalue === value), or
 *    whether it needs to be updated
 */
interface IProps {
    // dependency injection - caller provides methods for remote calls that return required lists and values
    getConfigMapEntriesFn: (configMapName) => Promise<IUIConfigMapEntries>;
    getConfigMapListFn: () => Promise<IUIConfigMapsList>;
    getSecretEntriesFn: (secretName) => Promise<IUISecretEntries>;
    getSecretsListFn: () => Promise<IUISecretsList>;

    id: string;  // an id for the sidepanel, in case we have more than one Env Var. table on one page

    isEditMode?: boolean;  // default is 'AddMode'
    isOpen: boolean;  // open/closed state is a controlled property! The sidepanel won't self-close.
    onSubmit: (result: IUIEnvItems) => void;
    onCancel?: () => void;
    onClose?: () => void;

    onGetSetNewEnvItemFn: (fn: IUISetNewEnvItemFn) => void;
}

interface IState {
    activeItem: IUIEnvItemFlat;  // reflects the current selection / input seen in the UI

    allowContainerType: boolean;  // unless the original EnvItem that was passed through Props was a Container defined
                                  // item, this will be false (users won't be able to select Container-type)

    definedBy: number;
    hasInvalidData?: boolean;
    sidePanelInputFields: IUIEnvVarSidePanel;

    isInvalidConfigMap?: boolean;  // true, if there is a problem loading this configMap
    isInvalidSecret?: boolean;     // true, if the secret cannot be loaded or the secret has the wrong type

    isOpen: boolean;
    isLoadingSecretEntries?: boolean;
    isLoadingConfigMapEntries?: boolean;

    configMapEntries: IUIConfigMapEntries;
    configMaps: IUIConfigMapsList;
    secretEntries: IUISecretEntries;
    secrets: IUISecretsList;

    ownUpdate?: boolean;
}

// static methods

/**
 * Fills the keyref information from the envItem into the given result value
 *
 * @param keyRef
 * @param result
 */
function getValueFromKeyRef(keyRef: IUIEnvItemKeyRef, result: IUIEnvItemFlat) {
    if (keyRef.keyRefKind === IUIEnvRefKind.SECRET) {
        result.secretName = keyRef.valueFrom.name;
    } else if (keyRef.keyRefKind === IUIEnvRefKind.CONFIGMAP) {
        result.configMapName = keyRef.valueFrom.name;
    }
    result.selectedKeys = [keyRef.valueFrom.key];  // key input is always single-entry!
}

/**
 * Fills the mapref information from the envItem into the given result value
 *
 * @param mapRef
 * @param result
 */
function getValueFromMapRef(mapRef: IUIEnvItemMapRef, result: IUIEnvItemFlat) {
    if (mapRef.mapRefKind === IUIEnvRefKind.SECRET) {
        result.secretName = mapRef.valuesFrom.name;
    } else if (mapRef.mapRefKind === IUIEnvRefKind.CONFIGMAP) {
        result.configMapName = mapRef.valuesFrom.name;
    }
    result.prefix = mapRef.prefix;
}

function convertIUIEnvItem(envItem: IUIEnvItem): IUIEnvItemFlat {
    const result = {
        readonly: false,
    } as IUIEnvItemFlat;

    if (envItem) {

        // for UNSUPPORTED kinds we won't even allow the EDIT option (only DELETE) from the table
        switch (envItem.kind) {
            case IUIEnvItemKind.PREDEFINED:
                const predef = envItem as IUIEnvItemPredefined;
                result.name = predef.name;
                result.originalValue = predef.value;  // this is what came from the container
                const override = predef.override;
                if (override) {
                    if (override.kind === IUIEnvItemKind.LITERAL) {
                        result.value = (override as IUIEnvItemLiteral).value;
                    } else if (override.kind === IUIEnvItemKind.KEYREF) {
                        getValueFromKeyRef(override as IUIEnvItemKeyRef, result);
                    }
                } else {
                    result.value = predef.value;  // show default value as the current value
                }
                result.readonly = true;
                break;
            case IUIEnvItemKind.LITERAL:
                const literal = envItem as IUIEnvItemLiteral;
                result.name = literal.name;
                result.value = literal.value;
                break;
            case IUIEnvItemKind.MAPREF:
                getValueFromMapRef(envItem as IUIEnvItemMapRef, result);
                break;
            case IUIEnvItemKind.KEYREF:
                getValueFromKeyRef(envItem as IUIEnvItemKeyRef, result);
                break;
        }
    }

    return result;
}

/**
 * Converts a given flatItem, one key at a time (in case there are many)
 *
 * @param flatItem
 * @param selectedKey
 */
function convertFlatEnvItem(flatItem: IUIEnvItemFlat, keyIndex?: number): IUIEnvItem {
    let result = {} as IUIEnvItem;

    if (flatItem.readonly) {
        // this is a Container envItem
        result = {
            kind: IUIEnvItemKind.PREDEFINED,
            name: flatItem.name,
            value: flatItem.originalValue,
        } as IUIEnvItemPredefined;

        if (flatItem.value === flatItem.originalValue) {
            // just throw out the original container envItem here, as we don't need an override!

            // Nothing to do here - result has already been set above
        } else {
            let overrideItem = {} as IUIEnvItem;

            // 3 options here: Literal, secret keyref, configmap keyref  (maprefs not supported)
            if (flatItem.selectedKeys &&
                (flatItem.selectedKeys.length > 0)) {   // only one key is allowed for PREDEFINED overrides

                if (flatItem.secretName) {
                    // secret keyref
                    overrideItem = {
                        kind: IUIEnvItemKind.KEYREF,
                        keyRefKind: IUIEnvRefKind.SECRET,
                        name: flatItem.name,
                        valueFrom: {
                          name: flatItem.secretName,
                          key: flatItem.selectedKeys[0],
                        },
                    } as IUIEnvItemKeyRef;
                } else if (flatItem.configMapName) {
                    // configmap keyref
                    overrideItem = {
                        kind: IUIEnvItemKind.KEYREF,
                        keyRefKind: IUIEnvRefKind.CONFIGMAP,
                        name: flatItem.name,
                        valueFrom: {
                            name: flatItem.configMapName,
                            key: flatItem.selectedKeys[0],
                        },
                    } as IUIEnvItemKeyRef;
                }
                (result as IUIEnvItemPredefined).override = (overrideItem as IUIEnvItemKeyRef);
            } else {
                // must be a literal here
                overrideItem = {
                    kind: IUIEnvItemKind.LITERAL,
                    name: flatItem.name,
                    value: flatItem.value,
                } as IUIEnvItemLiteral;
                (result as IUIEnvItemPredefined).override = (overrideItem as IUIEnvItemLiteral);
            }
        }
    } else {
        // this is a regular envItem
        if (!flatItem.secretName &&
            !flatItem.configMapName) {
            // this is a LITERAL value
            result = {
                kind: IUIEnvItemKind.LITERAL,
                name: flatItem.name,
                value: flatItem.value,
            } as IUIEnvItemLiteral;
        } else {
            if (flatItem.selectedKeys &&
                flatItem.selectedKeys.length > 0) {
                if (flatItem.secretName) {
                    // this is secretRef
                    // TODO: for now we only support keyrefs, not maprefs - therefore we can make shortcuts here
                    result = {
                        kind: IUIEnvItemKind.KEYREF,
                        keyRefKind: IUIEnvRefKind.SECRET,
                        name: flatItem.name,
                        valueFrom: {
                            name: flatItem.secretName,
                            key: flatItem.selectedKeys[keyIndex || 0],
                        },
                    } as IUIEnvItemKeyRef;
                } else if (flatItem.configMapName) {
                    // this is a configMapRef
                    // TODO: for now we only support keyrefs, not maprefs - therefore we can make shortcuts here
                    result = {
                        kind: IUIEnvItemKind.KEYREF,
                        keyRefKind: IUIEnvRefKind.CONFIGMAP,
                        name: flatItem.name,
                        valueFrom: {
                            name: flatItem.configMapName,
                            key: flatItem.selectedKeys[keyIndex || 0],
                        },
                    } as IUIEnvItemKeyRef;
                }
            }
        }
    }

    return result;
}

/**
 * This method converts the internal (flat) data structure to one or more actual EnvItems that
 * can be used to report selected keys to the caller of this SidePanel.
 *
 * @param flatItem
 */
function convertFlatEnvItems(flatItem: IUIEnvItemFlat): IUIEnvItems {
    const result = [] as IUIEnvItems;

    if (flatItem.selectedKeys &&
        flatItem.selectedKeys.length > 1) {
        for (let i = 0; i < flatItem.selectedKeys.length; i++) {
            result.push(convertFlatEnvItem(flatItem, i));
        }
    } else {
        result.push(convertFlatEnvItem(flatItem));
    }

    return result;
}

function initializeSidePanelInputFields(flatEnvItem: IUIEnvItemFlat): IUIEnvVarSidePanel {
    // build new valid/invalid input fields tracking object and put it into our state here
    const sidePanelInputFields: IUIEnvVarSidePanel = {
        envVarName: getValidatedTextField(flatEnvItem.name, GlobalTextValidator, coligoValidatorConfig.common.envVarName, true),
        envVarValue: getValidatedTextField(flatEnvItem.value, GlobalTextValidator, coligoValidatorConfig.common.envVarValue, true),
        envVarConfigMapName: getValidatedTextField(flatEnvItem.configMapName, GlobalTextValidator, coligoValidatorConfig.confMap.name, true),
        envVarSecretName: getValidatedTextField(flatEnvItem.secretName, GlobalTextValidator, coligoValidatorConfig.secret.name, true),
    };

    sidePanelInputFields.envVarName.invalid = undefined;
    sidePanelInputFields.envVarValue.invalid = undefined;
    sidePanelInputFields.envVarConfigMapName.invalid = undefined;
    sidePanelInputFields.envVarSecretName.invalid = undefined;

    return sidePanelInputFields;
}

function hasInvalidFields(oldState: IState): boolean {
    let allValid = true;

    const { activeItem, definedBy } = oldState;

    if (definedBy === DEFINED_BY.CONTAINER ||
        definedBy === DEFINED_BY.LITERAL) {
        allValid = (activeItem.name && (typeof activeItem.value !== 'undefined'));
    } else if (definedBy === DEFINED_BY.CONFIGMAP) {
        allValid = (activeItem.name && activeItem.configMapName) &&
            activeItem.selectedKeys &&
            !!activeItem.selectedKeys[0]; // if this is undefined or an empty string, it is not considered valid
    } else if (definedBy === DEFINED_BY.SECRET) {
        allValid = (activeItem.name && activeItem.secretName) &&
            activeItem.selectedKeys &&
            !!activeItem.selectedKeys[0]; // if this is undefined or an empty string, it is not considered valid
    }

    return !allValid;
}

class ClgEnvVariableSidePanel extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        const newState = {} as IState;

        if (!state.ownUpdate && !state.isOpen && props.isOpen) {
            // side panel about to open
            const flatEnvItem = {} as IUIEnvItemFlat;

            flatEnvItem.name = '';
            flatEnvItem.value = '';
            flatEnvItem.configMapName = '';
            flatEnvItem.secretName = '';
            flatEnvItem.readonly = false;
            flatEnvItem.selectedKeys = [];

            newState.definedBy = DEFINED_BY.LITERAL;

            newState.sidePanelInputFields = initializeSidePanelInputFields(flatEnvItem);
            newState.isOpen = true;
            newState.allowContainerType = flatEnvItem.readonly;
            newState.activeItem = flatEnvItem;
            newState.hasInvalidData = hasInvalidFields(newState);
        } else if (state.ownUpdate && !state.isOpen) { // self-close
            // side panel about to be closed
            newState.isOpen = false;
        } else if (state.isOpen && !props.isOpen) {  // outer-close
            // side panel about to be closed
            newState.isOpen = false;
        }

        // updates of the state and props while the sidepanel is open
        if (state.isOpen) {
            // update hasInvalidData on the state
            newState.hasInvalidData = hasInvalidFields(state);
        }

        // reset the ownUpdate flag
        newState.ownUpdate = false;

        return newState;
    }

    private readonly configMapColumns;
    private readonly secretColumns;
    private readonly COMPONENT = 'ClgEnvVariableSidePanel';

    // functions for controlling the selection in the table of key/value pairs
    private setSecretsSelectionFn;
    private clearSecretsSelectionFn;
    private setConfigMapSelectionFn;
    private clearConfigMapSelectionFn;

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props: IProps) {
        super(props);
        this.logger.debug('constructor');

        this.configMapColumns = [
            {
                field: 'key',
                formatter: clgUIKey.render,
                label: t('clg.common.table.th.key'),
                stringValue: clgUIKey.value,
            },
            {
                field: 'value',
                formatter: clgUIValue.render,
                label: t('clg.common.table.th.value'),
                stringValue: clgUIValue.value,
            }
        ];

        this.secretColumns = [
            {
                field: 'key',
                formatter: clgUIKey.render,
                label: t('clg.common.table.th.key'),
                stringValue: clgUIKey.value,
            },
            {
                field: 'value',
                formatter: clgUISecretValue.render,
                label: t('clg.common.table.th.value'),
                stringValue: clgUISecretValue.value,
            }
        ];

        this.state = {
            activeItem: undefined,
            allowContainerType: false, // TODO: needs to depend on original environmentVar's type
            definedBy: DEFINED_BY.LITERAL,
            hasInvalidData: false,
            isOpen: false,
            sidePanelInputFields: {
                envVarSecretName: {
                  val: '',
                },
                envVarConfigMapName: {
                  val: '',
                },
                envVarValue: {
                    val: '',
                },
                envVarName: {
                    val: '',
                },
            },

            configMapEntries: undefined,
            configMaps: undefined,
            secretEntries: undefined,
            secrets: undefined,
        };

        // use the bind to enable setState within this function
        this.buildResult = this.buildResult.bind(this);
        this.onDefinedByChanged = this.onDefinedByChanged.bind(this);
        this.loadConfigMaps = this.loadConfigMaps.bind(this);
        this.loadSecrets = this.loadSecrets.bind(this);
        this.loadConfigMapEntries = this.loadConfigMapEntries.bind(this);
        this.loadSecretEntries = this.loadSecretEntries.bind(this);
        this.onChangeEnvVarName = this.onChangeEnvVarName.bind(this);
        this.onChangeEnvVarValue = this.onChangeEnvVarValue.bind(this);
        this.onSelectConfigMap = this.onSelectConfigMap.bind(this);
        this.onSelectSecret = this.onSelectSecret.bind(this);
        this.setNewEnvItem = this.setNewEnvItem.bind(this);

        this.renderEmptyState = this.renderEmptyState.bind(this);
        this.renderRadioButtons = this.renderRadioButtons.bind(this);
        this.renderConfigMapsControls = this.renderConfigMapsControls.bind(this);
        this.renderSecretsControls = this.renderSecretsControls.bind(this);

        this.onGetClearSecretsSelectionFn = this.onGetClearSecretsSelectionFn.bind(this);
        this.onGetSetSecretsSelectionFn = this.onGetSetSecretsSelectionFn.bind(this);
        this.onGetClearConfigMapSelectionFn = this.onGetClearConfigMapSelectionFn.bind(this);
        this.onGetSetConfigMapSelectionFn = this.onGetSetConfigMapSelectionFn.bind(this);
        this.setConfigMapSelection = this.setConfigMapSelection.bind(this);
        this.setSecretsSelection = this.setSecretsSelection.bind(this);
        this.clearConfigMapSelection = this.clearConfigMapSelection.bind(this);
        this.clearSecretsSelection = this.clearSecretsSelection.bind(this);

        this.onSelectedKeysChanged = this.onSelectedKeysChanged.bind(this);
        this.computeSelectedKeys = this.computeSelectedKeys.bind(this);

        this.onCancel = this.onCancel.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onDone = this.onDone.bind(this);

        if (this.props.onGetSetNewEnvItemFn) {
            this.props.onGetSetNewEnvItemFn(this.setNewEnvItem);
        }
    }

    public render() {
        this.logger.debug('render');

        return (
            <SidePanelContainer
                className={'clg--sidepanel-container'}
                id={`sidepanelcontainer_envvar_${this.props.id}`}
                previousText={t('clg.common.label.back')}
                cancelText={t('clg.common.label.cancel')}
                closePanelText={t('clg.common.label.close')}
                doneText={t('clg.common.label.save')}
                hasOverlay={true}
                isOpen={this.state.isOpen}
                locale={getLocale(window.navigator.language)}
                nextText={t('clg.common.label.next')}
                panelSize={'large'}
            >
                <SidePanel
                    id={`sidepanel_envvar_${this.props.id}`}
                    primaryButtonDisabled={this.state.hasInvalidData}
                    title={this.props.isEditMode ? t('clg.cmp.envvariables.title.edit.label') : t('clg.cmp.envvariables.title.add.label')}
                    onCloseClick={this.onClose}
                    onDoneClick={this.onDone}
                    onCancelClick={this.onCancel}
                >
                    <div>
                        <div className='clg--sidepanel-description'>
                            {t('clg.cmp.envvariables.description.text')}
                        </div>
                        <p/>
                        <FormItem>
                            <ClgTextInput
                                className=''
                                data-focus-first={true}
                                hasTooltip={true}
                                inputId={`envvar-${this.props.id}-input-name`}
                                light={true}
                                nlsKey='clg.cmp.envvariables.name'
                                onChange={this.onChangeEnvVarName}
                                textField={this.state.sidePanelInputFields.envVarName}
                                validationRules={{}}
                            />
                        </FormItem>

                        <FormGroup legendText={t('clg.cmp.envvariables.definedby.label')}>
                            {this.renderRadioButtons()}
                        </FormGroup>

                        {((this.state.definedBy === DEFINED_BY.LITERAL) || (this.state.definedBy === DEFINED_BY.CONTAINER)) && (
                            <FormItem>
                                <ClgTextInput
                                    className=''
                                    hasTooltip={true}
                                    inputId={`envvar-${this.props.id}-input-value`}
                                    light={true}
                                    nlsKey='clg.cmp.envvariables.value'
                                    onChange={this.onChangeEnvVarValue}
                                    textField={this.state.sidePanelInputFields.envVarValue}
                                    validationRules={{}}
                                />
                            </FormItem>
                        )}

                        {this.state.definedBy === DEFINED_BY.CONFIGMAP &&
                            this.renderConfigMapsControls()
                        }

                        {this.state.definedBy === DEFINED_BY.SECRET &&
                            this.renderSecretsControls()
                        }
                    </div>
                </SidePanel>
            </SidePanelContainer>
        );
    }

    private renderRadioButtons() {
        const containerRadioButton = (
            <RadioButton
                disabled={!this.state.allowContainerType}
                id={`envvar_${this.props.id}_radio_container`}
                labelText={t('clg.cmp.envvariables.type.container.label')}
                value='Container'
            />
        );

        const literalRadioButton = (
            <RadioButton
                id={`envvar_${this.props.id}_radio_literal`}
                labelText={t('clg.cmp.envvariables.type.literal.label')}
                value='Literal'
            />
        );

        const configMapRadioButton = (
            <RadioButton
                id={`envvar_${this.props.id}_radio_configmap`}
                labelText={t('clg.cmp.envvariables.type.configMapRef.label')}
                value='ConfigMap'
            />
        );

        const secretRadioButton = (
            <RadioButton
                id={`envvar_${this.props.id}_radio_secret`}
                labelText={t('clg.cmp.envvariables.type.secretRef.label')}
                value='Secret'
            />
        );

        const children = [];

        if (this.state.allowContainerType) {
            children.push(containerRadioButton);
        }

        children.push(literalRadioButton);
        children.push(secretRadioButton);
        children.push(configMapRadioButton);

        return React.createElement(RadioButtonGroup, {
            defaultSelected: this.state.definedBy,
            legend: 'Group Legend',
            name: 'radio-button-group',
            onChange: this.onDefinedByChanged,
            orientation: 'vertical',
            valueSelected: this.getDefinedBy(),
        }, children);

    }

    private renderConfigMapsControls() {
        if (!this.state.configMaps) {
            return (
                <React.Fragment>
                    <FormLabel>
                        {t('clg.cmp.envvariables.configMapName.label')}
                    </FormLabel>
                    <FormItem>
                        <DropdownSkeleton/>
                    </FormItem>
                </React.Fragment>
            );
        } else {
            return (
                <React.Fragment>
                    <FormItem>
                        <ComboBox
                            ariaLabel={t('clg.cmp.envvariables.configMapName.label')}
                            direction='bottom'
                            disabled={!!(this.state.configMaps && this.state.configMaps.length === 0)}
                            helperText={t('clg.cmp.envvariables.configMapName.tooltip')}
                            id='envvar-configmap-combo'
                            selectedItem={this.state.sidePanelInputFields.envVarConfigMapName.val}
                            invalid={this.state.sidePanelInputFields.envVarConfigMapName.invalid}
                            invalidText={this.state.sidePanelInputFields.envVarConfigMapName.invalid}
                            items={this.state.configMaps}
                            light={true}
                            onChange={this.onSelectConfigMap}
                            placeholder={t('clg.cmp.envvariables.configMapName.placeholder')}
                            titleText={t('clg.cmp.envvariables.configMapName.label')}
                            type='default'
                        />
                    </FormItem>
                    {(this.state.configMapEntries || this.state.isLoadingConfigMapEntries) && (
                        <ClgTableWrapper
                            title=''
                            description=''
                            emptyStateComponent={this.renderEmptyState()}
                            className='clg-datatable-sortable clg-table-wrapper__sm'
                            id='env-sidepanel-configmap-entries-table'
                            key='env-sidepanel-configmap-entries-table'
                            sortField='key'
                            sortDir={-1}
                            columns={this.configMapColumns}
                            items={this.state.configMapEntries}
                            size={'compact'}
                            radio={true}
                            hasSecrets={false}
                            hasSecretsKey=''
                            onGetClearSelectionFn={this.onGetClearConfigMapSelectionFn}
                            onGetSetSelectionFn={this.onGetSetConfigMapSelectionFn}
                            onSelectionChanged={this.onSelectedKeysChanged}
                        />
                    )}
                </React.Fragment>
            );
        }
    }

    private renderSecretsControls() {
        if (!this.state.secrets) {
            return (
                <React.Fragment>
                    <FormLabel>
                        {t('clg.cmp.envvariables.secretName.label')}
                    </FormLabel>
                    <FormItem>
                        <DropdownSkeleton/>
                    </FormItem>
                </React.Fragment>
            );
        } else {
            return (
                <React.Fragment>
                    <FormItem>
                        <ComboBox
                            ariaLabel={t('clg.cmp.envvariables.secretName.label')}
                            direction='bottom'
                            disabled={!!(this.state.secrets && this.state.secrets.length === 0)}
                            helperText={t('clg.cmp.envvariables.secretName.tooltip')}
                            id='envvar-secrets-combo'
                            selectedItem={this.state.sidePanelInputFields.envVarSecretName.val}
                            invalid={this.state.sidePanelInputFields.envVarSecretName.invalid}
                            invalidText={this.state.sidePanelInputFields.envVarSecretName.invalid}
                            items={this.state.secrets}
                            light={true}
                            onChange={this.onSelectSecret}
                            placeholder={t('clg.cmp.envvariables.secretName.placeholder')}
                            titleText={t('clg.cmp.envvariables.secretName.label')}
                            type='default'
                        />
                    </FormItem>
                    {(this.state.secretEntries || this.state.isLoadingSecretEntries) && (
                        <ClgTableWrapper
                            title=''
                            description=''
                            emptyStateComponent={this.renderEmptyState()}
                            className='clg-datatable-sortable clg-table-wrapper__sm'
                            id='env-sidepanel-secret-entries-table'
                            key='env-sidepanel-secret-entries-table'
                            sortField='key'
                            sortDir={-1}
                            columns={this.secretColumns}
                            items={this.state.secretEntries}
                            size={'compact'}
                            radio={true}
                            hasSecrets={true}
                            hasSecretsKey={'value'}
                            onGetClearSelectionFn={this.onGetClearSecretsSelectionFn}
                            onGetSetSelectionFn={this.onGetSetSecretsSelectionFn}
                            onSelectionChanged={this.onSelectedKeysChanged}
                        />
                    )}
                </React.Fragment>
            );
        }
    }

    private renderEmptyState() {
        return (
            <div>
                <div className=''>
                    {(this.state.definedBy === DEFINED_BY.SECRET) ? (
                        <ClgTeaser
                            icon={<img src={img.get('clg-secret-empty')} alt={t('clg.cmp.envvariables.empty.secret.label')} />}
                            title='clg.cmp.envvariables.empty.secret.title'
                            description='clg.cmp.envvariables.empty.secret.desc'
                            moreLabel='clg.cmp.envvariables.empty.secret.more'
                            moreLink={nav.getDocsLink('secrets')}
                            moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                        />
                    ) : (
                        <ClgTeaser
                            icon={<img src={img.get('clg-configMap-empty')} alt={t('clg.cmp.envvariables.empty.configMap.label')} />}
                            title='clg.cmp.envvariables.empty.configMap.title'
                            description='clg.cmp.envvariables.empty.configMap.desc'
                            moreLabel='clg.cmp.envvariables.empty.configMap.more'
                            moreLink={nav.getDocsLink('config-maps')}
                            moreIcon={<Launch16 className={'clg-filled-link clg-link-icon'} />}
                        />
                    )}
                </div>
            </div>
        );
    }

    private onCancel() {
        if (typeof this.props.onCancel === 'function') {
            this.props.onCancel();
        } else {
            this.setState({
                isOpen: false,
                ownUpdate: true,
            });
        }
    }

    private onClose() {
        if (typeof this.props.onClose === 'function') {
            this.props.onClose();
        } else {
            this.setState({
                isOpen: false,
                ownUpdate: true,
            });
        }
    }

    private onDone() {
        if (typeof this.props.onSubmit === 'function') {
            this.props.onSubmit(this.buildResult());
        } else {
            this.setState({
                isOpen: false,
                ownUpdate: true,
            });
        }
    }

    private onGetSetConfigMapSelectionFn(selectFn: any) {
        this.setConfigMapSelectionFn = selectFn;
    }

    private onGetSetSecretsSelectionFn(selectFn: any) {
        this.setSecretsSelectionFn = selectFn;
    }

    private onGetClearConfigMapSelectionFn(clearFn: any) {
        this.clearConfigMapSelectionFn = clearFn;
    }

    private onGetClearSecretsSelectionFn(clearFn: any) {
        this.clearSecretsSelectionFn = clearFn;
    }

    private setConfigMapSelection(newSelection: IClgTableWrapperPropItem[]) {
        if (typeof this.setConfigMapSelectionFn === 'function') {
            this.setConfigMapSelectionFn(newSelection);
        }
    }

    private setSecretsSelection(newSelection: IClgTableWrapperPropItem[]) {
        if (typeof this.setSecretsSelectionFn === 'function') {
            this.setSecretsSelectionFn(newSelection);
        }
    }

    private clearConfigMapSelection() {
        if (typeof this.clearConfigMapSelectionFn === 'function') {
            this.clearConfigMapSelectionFn();
        }
    }

    private clearSecretsSelection() {
        if (typeof this.clearSecretsSelectionFn === 'function') {
            this.clearSecretsSelectionFn();
        }
    }

    private onSelectedKeysChanged(newItems: IClgTableWrapperPropItem[]) {
        const { activeItem } = this.state;

        activeItem.selectedKeys = [];

        for (const selectedItem of newItems) {
            // IUIConfigMapEntry and IUISecretEntry share the same interface layout
            activeItem.selectedKeys.push((selectedItem as IUIConfigMapEntry).key);
        }

        this.setState({
            activeItem,
        });
    }

    /**
     * Maps the given selectedKeys information in state.activeItem to actual
     * table items in either state.configMapEntries or state.secretEntries
     */
    private computeSelectedKeys(selectedKeys: string[]): IClgTableWrapperPropItem[] {
        const result = [] as IClgTableWrapperPropItem[];

        if (selectedKeys &&
            selectedKeys.length > 0) {
            for (const secretKeyName of selectedKeys) {
                result.push({  // create a fake entry, based on the selected key-name. If it doesn't exist, it won't matter
                    id: secretKeyName,
                });
            }
        }

        return result;
    }

    /**
     * This method can be called by outside code to set a new envItem that shall be edited in the sidePanel.
     * It updates the 'activeItem' on the state along with a lot of other state values, depending on the
     * environmentVariable. It also sets isEditMode to true, which can only be false, if no environmentVariable
     * was given in the first place.
     *
     * If calling code wants the sidePanel to reset itself to the 'Add variable' mode with empty default state,
     * it simply needs to call this method without parameters (newEnvItem === undefined/null).
     *
     * @param newEnvItem
     */
    private setNewEnvItem(newEnvItem: IUIEnvItem) {
        const newState = {} as IState;

        let flatEnvItem = {} as IUIEnvItemFlat;

        if (newEnvItem) {
            flatEnvItem = convertIUIEnvItem(newEnvItem);

            // determine whether we have to load secrets or configmaps, as well as secret-entries/configmap entries,
            // if we have a valid selection
            if (flatEnvItem.secretName) {
                newState.definedBy = DEFINED_BY.SECRET;
                this.loadSecrets();
                this.loadSecretEntries(flatEnvItem.secretName);
                this.setSecretsSelection(this.computeSelectedKeys(flatEnvItem.selectedKeys));
            } else if (flatEnvItem.configMapName) {
                newState.definedBy = DEFINED_BY.CONFIGMAP;
                this.loadConfigMaps();
                this.loadConfigMapEntries(flatEnvItem.configMapName);
                this.setConfigMapSelection(this.computeSelectedKeys(flatEnvItem.selectedKeys));
            } else if (flatEnvItem.readonly &&
                       (flatEnvItem.value === flatEnvItem.originalValue)) {
                newState.definedBy = DEFINED_BY.CONTAINER;
            } else {
                newState.definedBy = DEFINED_BY.LITERAL;
            }
        } else {
            flatEnvItem.name = '';
            flatEnvItem.value = '';
            flatEnvItem.configMapName = '';
            flatEnvItem.secretName = '';
            flatEnvItem.readonly = false;
            flatEnvItem.selectedKeys = [];

            // new variables are by default always literal values
            newState.definedBy = DEFINED_BY.LITERAL;
        }

        if ((newState.definedBy === DEFINED_BY.LITERAL) ||
            (newState.definedBy === DEFINED_BY.CONTAINER)) {
            newState.secretEntries = null;
            newState.secrets = null;
            newState.configMapEntries = null;
            newState.configMaps = null;
        }

        newState.sidePanelInputFields = initializeSidePanelInputFields(flatEnvItem);
        newState.allowContainerType = flatEnvItem.readonly;
        newState.activeItem = flatEnvItem;
        newState.hasInvalidData = hasInvalidFields(newState);

        this.setState(newState);
    }

    private onChangeSidePanelInputField(fieldName, newValue) {
        this.setState((oldState) => {
            const { activeItem, sidePanelInputFields } = oldState;
            sidePanelInputFields[fieldName].val = newValue || '';
            validateField(sidePanelInputFields[fieldName]);

            // only transfer value to activeItem, if it is actually valid
            if (!sidePanelInputFields[fieldName].invalid) {
                if (fieldName === 'envVarName') {
                    activeItem.name = newValue;
                } else if (fieldName === 'envVarValue') {
                    activeItem.value = newValue;
                }
            } else {
                if (fieldName === 'envVarName') {
                    activeItem.name = undefined;
                } else if (fieldName === 'envVarValue') {
                    activeItem.value = undefined;
                }
            }

            return {
                activeItem,
                sidePanelInputFields,
            };
        });
    }

    private onChangeEnvVarName(event) {
        this.onChangeSidePanelInputField('envVarName', event.target.value);
    }

    private onChangeEnvVarValue(event) {
        this.onChangeSidePanelInputField('envVarValue', event.target.value);
    }

    private onSelectConfigMap(selection) {
        const { activeItem, sidePanelInputFields } = this.state;
        const { envVarConfigMapName } = sidePanelInputFields;
        const selectedItem = selection.selectedItem;
        if (selectedItem) {
            this.loadConfigMapEntries(selectedItem);
            envVarConfigMapName.val = selectedItem;
            validateField(envVarConfigMapName);
            if (!envVarConfigMapName.invalid) {
                activeItem.configMapName = selectedItem;
            } else {
                // invalid name selection
                activeItem.configMapName = undefined;
            }

            this.setState(() => ({
                activeItem,
                sidePanelInputFields,
            }));
        } else if (selectedItem === null) {  // clicked the 'x' in the combobox or completely cleared the inputbox
            envVarConfigMapName.val = '';
            envVarConfigMapName.invalid = undefined;
            activeItem.configMapName = undefined;

            this.setState(() => ({
                activeItem,
                configMapEntries: null,
                sidePanelInputFields,
            }));
        }
    }

    /**
     * Carbon Combobox takes care of all the non-sense intermediate steps when typing in the combobox.
     * Unless you change your input to a valid (aka existing in the list of options) string and hit ENTER, or select
     * the string in the list by clicking, no onChange() event happens.
     *
     * So we're safe to loadEntries whenever we receive a non-null selection here.
     *
     * @param selection
     */
    private onSelectSecret(selection) {
        const { activeItem, sidePanelInputFields } = this.state;
        const { envVarSecretName } = sidePanelInputFields;
        const selectedItem = selection.selectedItem;
        if (selectedItem) {
            this.loadSecretEntries(selectedItem);
            envVarSecretName.val = selectedItem;
            validateField(envVarSecretName);

            if (!envVarSecretName.invalid) {
                activeItem.secretName = selectedItem;
            } else {
                activeItem.secretName = undefined;
            }

            this.setState(() => ({
                activeItem,
                sidePanelInputFields,
            }));
        } else if (selectedItem === null) {  // clicked the 'x' in the combobox or completely cleared the inputbox
            envVarSecretName.val = '';
            envVarSecretName.invalid = undefined;
            activeItem.secretName = undefined;

            this.setState(() => ({
                activeItem,
                secretEntries: null,
                sidePanelInputFields,
            }));
        }
    }

    /**
     *  Builds one or more EnvItems to return. In EditMode, it will always return just one item. In AddMode, multiple
     *  items could be returned, if a whole map or secret is selected.
     *
     *  Container defined items are a special case: The input value cannot be edited and thus, we will return the original
     *  item along with a new literal item that will effectively override the container defined value.
     *
     *      Calling code needs to take care not to actually use any CONTAINER kind EnvItems when returned by this method.
     */
    private buildResult(): IUIEnvItems {
        const { activeItem, definedBy } = this.state;

        // clean out values in activeItem that aren't applicable to the type (definedBy) to allow
        // convertFlatEnvItems() to properly convert the item
        if ((definedBy === DEFINED_BY.LITERAL) ||
            (definedBy === DEFINED_BY.CONTAINER)) {
            activeItem.secretName = undefined;
            activeItem.configMapName = undefined;
            activeItem.selectedKeys = [];
        } else if (definedBy === DEFINED_BY.CONFIGMAP) {
            activeItem.secretName = undefined;
            activeItem.value = undefined;
        } else if (definedBy === DEFINED_BY.SECRET) {
            activeItem.configMapName = undefined;
            activeItem.value = undefined;
        }

        return convertFlatEnvItems(activeItem);
    }

    private getDefinedBy() {
        let result;

        switch (this.state.definedBy) {
            case DEFINED_BY.CONTAINER:
                result = 'Container';
                break;
            case DEFINED_BY.CONFIGMAP:
                result = 'ConfigMap';
                break;
            case DEFINED_BY.SECRET:
                result = 'Secret';
                break;
            default:
            case DEFINED_BY.LITERAL:
                result = 'Literal';
                break;
        }

        return result;
    }

    private onDefinedByChanged(newType: string) {
        let definedBy;
        let { configMaps, secrets, configMapEntries, secretEntries } = this.state;
        const { activeItem, sidePanelInputFields } = this.state;
        const { envVarValue, envVarSecretName, envVarConfigMapName } = sidePanelInputFields;

        switch (newType) {
            case 'Container':
                definedBy = DEFINED_BY.CONTAINER;
                configMaps = null;
                secrets = null;
                configMapEntries = null;
                secretEntries = null;
                activeItem.selectedKeys = [];
                activeItem.secretName = undefined;
                activeItem.configMapName = undefined;
                // TODO: determine exact way to revert back to Container mode (like which interface elements to validate, reset, etc)
                break;
            case 'ConfigMap':
                if ((this.state.definedBy !== DEFINED_BY.CONFIGMAP) &&
                    typeof this.props.getConfigMapListFn === 'function') {
                    activeItem.selectedKeys = [];
                    activeItem.value = undefined;
                    activeItem.secretName = undefined;
                    activeItem.configMapName = undefined;
                    configMaps = null;
                    secrets = null;
                    configMapEntries = null;
                    secretEntries = null;
                    envVarValue.val = '';
                    envVarConfigMapName.val = '';
                    envVarSecretName.val = '';
                    envVarConfigMapName.invalid = undefined;
                    this.clearConfigMapSelection();
                    this.loadConfigMaps();
                }
                definedBy = DEFINED_BY.CONFIGMAP;
                secrets = null;
                break;
            case 'Secret':
                if ((this.state.definedBy !== DEFINED_BY.SECRET) &&
                    typeof this.props.getSecretsListFn === 'function') {
                    activeItem.selectedKeys = [];
                    activeItem.value = undefined;
                    activeItem.secretName = undefined;
                    activeItem.configMapName = undefined;
                    configMaps = null;
                    secrets = null;
                    configMapEntries = null;
                    secretEntries = null;
                    envVarValue.val = '';
                    envVarConfigMapName.val = '';
                    envVarSecretName.val = '';
                    envVarSecretName.invalid = undefined;
                    this.clearSecretsSelection();
                    this.loadSecrets();
                }
                definedBy = DEFINED_BY.SECRET;
                configMaps = null;
                break;
            default:
            case 'Literal':
                definedBy = DEFINED_BY.LITERAL;
                configMaps = null;
                secrets = null;
                configMapEntries = null;
                secretEntries = null;
                envVarValue.val = '';
                envVarValue.invalid = undefined;
                envVarConfigMapName.val = '';
                envVarSecretName.val = '';
                activeItem.value = '';
                activeItem.selectedKeys = [];
                activeItem.secretName = undefined;
                activeItem.configMapName = undefined;
                break;
        }
        this.setState({
            activeItem,
            configMapEntries,
            configMaps,
            definedBy,
            secrets,
            secretEntries,
            sidePanelInputFields,
        });
    }

    private loadConfigMaps() {
        const { allowContainerType, sidePanelInputFields } = this.state;
        const invalidateConfigMapCombo = () => {
            if (allowContainerType) {
                sidePanelInputFields.envVarConfigMapName.invalid = t('clg.cmp.envvariables.empty.configMap.combo.container');
            } else {
                sidePanelInputFields.envVarConfigMapName.invalid = t('clg.cmp.envvariables.empty.configMap.combo.noContainer');
            }
        };

        if (typeof this.props.getConfigMapListFn === 'function') {
            this.props.getConfigMapListFn()
                .then((list: IUIConfigMapsList) => {
                    if (!list || list.length === 0) {
                        // no entries found
                        invalidateConfigMapCombo();
                    }
                    this.setState({
                        configMaps: list,
                        sidePanelInputFields,
                    });
                })
                .catch((e) => {
                    this.logger.error('Could not retrieve list of ConfigMaps.', e);
                    invalidateConfigMapCombo();
                    this.setState({
                        configMaps: [] as IUIConfigMapsList,
                        sidePanelInputFields,
                    });
                });
        } else {
            invalidateConfigMapCombo();
            this.setState({
               configMaps: [] as IUIConfigMapsList,
               sidePanelInputFields,
            });
        }
    }

    private loadSecrets() {
        const { allowContainerType, sidePanelInputFields } = this.state;
        const invalidateSecretsCombo = () => {
            if (allowContainerType) {
                sidePanelInputFields.envVarSecretName.invalid = t('clg.cmp.envvariables.empty.secret.combo.container');
            } else {
                sidePanelInputFields.envVarSecretName.invalid = t('clg.cmp.envvariables.empty.secret.combo.noContainer');
            }
        };

        if (typeof this.props.getSecretsListFn === 'function') {
            this.props.getSecretsListFn()
                .then((list: IUISecretsList) => {
                    if (!list || list.length === 0) {
                        // no entries found
                        invalidateSecretsCombo();
                    }
                    this.setState({
                        secrets: list,
                        sidePanelInputFields,
                    });
                })
                .catch((e) => {
                    this.logger.error('Could not retrieve list of Secrets.', e);
                    this.setState({
                        secrets: [] as IUISecretsList,
                        sidePanelInputFields,
                    });
                });
        } else {
            this.setState({
                secrets: [] as IUISecretsList,
                sidePanelInputFields,
            });
        }
    }

    private loadConfigMapEntries(configMapName: string) {
        if (typeof this.props.getConfigMapEntriesFn === 'function') {
            this.setState({
                isLoadingConfigMapEntries: true,
            });
            this.props.getConfigMapEntriesFn(configMapName)
                .then((list: IUIConfigMapEntries) => {
                    this.setState({
                        configMapEntries: list,
                    });
                })
                .catch((e) => {
                    this.logger.error(`Could not retrieve list of entries for ConfigMap ${configMapName}.`, e);
                    this.setState({
                        configMapEntries: [] as IUIConfigMapEntries,
                    });
                })
                .finally(() => {
                    this.setState({
                        isLoadingConfigMapEntries: false,
                    });
                });
        } else {
            this.setState({
                configMapEntries: [] as IUIConfigMapEntries,
            });
        }
    }

    private loadSecretEntries(secretName: string) {
        if (typeof this.props.getSecretEntriesFn === 'function') {
            this.setState({
                isLoadingSecretEntries: true,
            });
            this.props.getSecretEntriesFn(secretName)
                .then((list: IUISecretEntries) => {
                    this.setState({
                        secretEntries: list,
                    });
                })
                .catch((e) => {
                    this.logger.error(`Could not retrieve list of entries for Secret ${secretName}.`, e);
                    this.setState({
                        secretEntries: [] as IUISecretEntries,
                    });
                })
                .finally(() => {
                    this.setState({
                        isLoadingSecretEntries: false,
                    });
                });
        } else {
            this.setState({
                secretEntries: [] as IUISecretEntries,
            });
        }
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgEnvVariableSidePanel.propTypes = {
    getConfigMapEntriesFn: PropTypes.func.isRequired,
    getConfigMapListFn: PropTypes.func.isRequired,
    getSecretEntriesFn: PropTypes.func.isRequired,
    getSecretsListFn: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,

    isEditMode: PropTypes.bool,
    isOpen: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onClose: PropTypes.func,
    onGetSetNewEnvItemFn: PropTypes.func,
};

export default ClgEnvVariableSidePanel;

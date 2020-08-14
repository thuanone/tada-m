import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Dropdown, DropdownSkeleton, FormItem, FormLabel, InlineNotification, NotificationActionButton } from '@console/pal/carbon-components-react';

import * as commonModel from '../../../../common/model/common-model';
import * as projModel from '../../../../common/model/project-model';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import { IClgInlineNotification } from '../../model/common-view-model';

interface IProps {
    disabled?: boolean;
    onError: (error) => any;
    onSelect: (resourceGroup: projModel.IUIResourceGroup) => any;
}

interface IState {
    resourceGroups?: any[];
    disabled: boolean;
    error?: IClgInlineNotification;
    failedToListResourceGroups?: string;
    info?: IClgInlineNotification;
    isLoading: boolean;
    selectedResourceGroup?: projModel.IUIResourceGroup;
}

class ClgResourceGroupSelector extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgResourceGroupSelector';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private readonly RESOURCE_GROUPS_CACHE_NAME = 'resource-groups';

    private removeCacheListener: () => any;

    constructor(props) {
        super(props);

        this.closeInfoNotification = this.closeInfoNotification.bind(this);
        this.handleResourceGroupChange = this.handleResourceGroupChange.bind(this);
        this.itemToString = this.itemToString.bind(this);
        this.loadResourceGroups = this.loadResourceGroups.bind(this);
        this.onResourceGroupsLoaded = this.onResourceGroupsLoaded.bind(this);
        this.onResourceGroupsLoadingFailed = this.onResourceGroupsLoadingFailed.bind(this);

        this.state = {
            disabled: this.props.disabled || false,
            isLoading: true,
            selectedResourceGroup: undefined,
        };
    }

    public componentDidMount() {
        this.logger.debug('componentDidMount');
        this.loadResourceGroups();
    }

    public componentWillUnmount() {
        if (this.removeCacheListener) {
            // remove the cache listener in order to avoid background syncs with the backend
            this.removeCacheListener();
        }
    }

    public UNSAFE_componentWillReceiveProps(newProps) {
        const fn = 'componentWillReceiveProps ';
        this.logger.debug(`${fn}- this.state.disabled: '${this.state.disabled}', props.disabled: '${newProps && newProps.disabled}'`);

        // check whether the disabled value has changed
        if (this.state.disabled !== newProps.disabled) {
            this.setState({ disabled: newProps.disabled });
        }
    }

    public handleResourceGroupChange(event) {
        const newResourceGroup = event.selectedItem;

        if (newResourceGroup) {
            this.setState(() => {
                if (this.props.onSelect) {
                    this.props.onSelect(newResourceGroup);
                }
                return {
                    isLoading: false,
                    selectedResourceGroup: newResourceGroup,
                };
            });
        }
    }

    public onResourceGroupsLoaded(resourceGroups: projModel.IUIResourceGroup[]) {
        const fn = 'onResourceGroupsLoaded ';
        this.logger.debug(`${fn}>`);

        let selectedResourceGroup;
        if (resourceGroups && resourceGroups.length > 0) {

            if (!selectedResourceGroup) {
                selectedResourceGroup = resourceGroups[0];
            }

            if (selectedResourceGroup && selectedResourceGroup.id && this.props.onSelect) {
                this.props.onSelect(selectedResourceGroup);
            }

            this.setState(() => ({ resourceGroups, selectedResourceGroup, isLoading: false }));

            // once we loaded the resource groups, we can de-register from the cache listener
            this.removeCacheListener();
        } else {

            // in case the user has no resource group, or he is not allowed to see a resource group, we'll show an info notification

            const infoNotification: IClgInlineNotification = {
                actionFn: this.loadResourceGroups,
                actionTitle: t('clg.component.resourceGroupSelector.info.nogroups.action'),
                kind: 'info',
                subtitle: t('clg.component.resourceGroupSelector.info.nogroups.subtitle'),
                title: t('clg.component.resourceGroupSelector.info.nogroups.title'),
            };
            this.setState(() => {
                return {
                    info: infoNotification,
                    isLoading: false,
                    resourceGroups: [],
                    selectedResourceGroup: undefined,
                };
            });
        }
        this.logger.debug(`${fn}<`);
    }

    public onResourceGroupsLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onResourceGroupsLoaded ';
        this.logger.debug(`${fn}> - failed to load resource groups - error ${commonModel.stringifyUIRequestError(requestError)}`);

        const errorNotification: IClgInlineNotification = {
            actionFn: this.loadResourceGroups,
            actionTitle: t('clg.component.resourceGroupSelector.error.action'),
            // clgId: requestError.clgId,
            kind: 'error',
            title: t('clg.component.resourceGroupSelector.error.title'),
        };

        this.setState(() => {
            if (this.props.onError) {
                this.props.onError(errorNotification);
            }

            return {
                disabled: true,
                error: errorNotification,
                failedToListResourceGroups: t('clg.component.resourceGroupSelector.error.title'),
                isLoading: false,
                resourceGroups: [],
            };
        });
        this.logger.debug(`${fn}<`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <FormItem className='clg-resource-group-selector'>
                {this.state.isLoading ? (
                    <React.Fragment>
                        <FormLabel>{t('clg.common.label.resourceGroup')}</FormLabel>
                        <DropdownSkeleton />
                    </React.Fragment>
                ) : (
                        <React.Fragment>
                            {this.state.info ? (
                                <React.Fragment>
                                    <FormLabel>{t('clg.common.label.resourceGroup')}</FormLabel>
                                    <InlineNotification
                                        className=''
                                        kind={this.state.info.kind}
                                        statusIconDescription={this.state.info.title}
                                        lowContrast={true}
                                        title={this.state.info.title}
                                        subtitle={(<span>{t(this.state.info.subtitle)}</span>)}
                                        onCloseButtonClick={this.closeInfoNotification}
                                        actions={this.state.info.actionFn &&
                                            (
                                                <NotificationActionButton onClick={this.state.info.actionFn}>
                                                    {this.state.info.actionTitle}
                                                </NotificationActionButton>
                                            )
                                        }
                                    />
                                </React.Fragment>
                            ) : (
                                    <Dropdown
                                        disabled={this.state.disabled}
                                        id={'resource-group_selector'}
                                        type={'default'}
                                        titleText={t('clg.common.label.resourceGroup')}
                                        label={t('clg.common.label.resourceGroup')}
                                        items={this.state.resourceGroups}
                                        itemToString={this.itemToString}
                                        selectedItem={this.state.selectedResourceGroup}
                                        onChange={this.handleResourceGroupChange}
                                        invalid={(this.state.failedToListResourceGroups !== null)}
                                        invalidText={this.state.failedToListResourceGroups}
                                    />
                                )}
                        </React.Fragment>
                    )
                }
            </FormItem>
        );
    }

    private loadResourceGroups() {
        // reset the error state
        this.setState(() => ({ disabled: false, error: null, info: undefined, isLoading: true, failedToListResourceGroups: null }));

        if (this.removeCacheListener) {
            this.removeCacheListener();
        }

        this.removeCacheListener = cache.listen(this.RESOURCE_GROUPS_CACHE_NAME, this.onResourceGroupsLoaded, this.onResourceGroupsLoadingFailed);
        cache.update(null, this.RESOURCE_GROUPS_CACHE_NAME);
    }

    private itemToString(item) {
        return (item ? `${ item.name }` : 'N/A');
    }

    private closeInfoNotification() {
        this.setState({ info: undefined });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgResourceGroupSelector.propTypes = {
    onError: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default ClgResourceGroupSelector;

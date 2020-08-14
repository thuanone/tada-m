import { ExpandableTile, TileAboveTheFoldContent, TileBelowTheFoldContent } from '@console/pal/carbon-components-react';
import PropTypes from 'prop-types';
import React from 'react';
import t from '../../../utils/i18n';
import GlobalStateContext from '../../common/GlobalStateContext';

interface IProps {
    className: string;
    collapsedHeightCss: string;
    expandedHeightCss: string;
    id: string;
    isExpanded: boolean;
    maxHeight: number;
    noItemsText: string;
    items: any[];
    light: boolean;
    maxCollapsedItems: number;
    renderItemFn: (item) => any;
}

const DEFAULT_MAX_COLLAPSED_ITEMS = 3;

// The global banner that is shown on all pages
class ClgExpandableSection extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.onBeforeClick = this.onBeforeClick.bind(this);
        this.renderItems = this.renderItems.bind(this);
    }

    public render() {
        let numCollapsedItems;
        let remainingItems;
        let isExpanded;

        if (!this.props.maxCollapsedItems) {
            numCollapsedItems = this.props.items.length;
            remainingItems = 0;
        } else {
            numCollapsedItems = Math.min(this.props.maxCollapsedItems || DEFAULT_MAX_COLLAPSED_ITEMS, this.props.items.length);
            remainingItems = this.props.items.length - numCollapsedItems;
        }

        // calculate default for isExpanded based on properties
        isExpanded = (typeof this.props.isExpanded === 'boolean' ? this.props.isExpanded : false);

        // then correct the value, in case there is nothing to expand
        if (remainingItems === 0) {
            isExpanded = false;
        }

        return (
            <div className={'clg-expandable-section ' + (this.props.className || '')}>
                {this.props.items.length <= 0 ? (
                    <div id={this.props.id} className='clg-no-items'>{this.props.noItemsText || 'No items to display'}</div>
                ) : (
                        <ExpandableTile
                            id={this.props.id}
                            tabIndex={0}
                            expanded={isExpanded}
                            tileMaxHeight={this.props.maxHeight || 0}
                            tilePadding={0}
                            onBeforeClick={this.onBeforeClick}
                            handleClick={this.handleClick}
                            tileCollapsedIconText={t('clg.common.section.expand.label')}
                            tileExpandedIconText={t('clg.common.section.collapse.label')}
                            light={(typeof this.props.light === 'boolean' ? this.props.light : false)}
                        >
                            <TileAboveTheFoldContent>
                                <div style={{ height: (this.props.collapsedHeightCss ? this.props.collapsedHeightCss : '200px'), }} >
                                    {this.renderItems(0, numCollapsedItems - 1)}
                                </div>
                            </TileAboveTheFoldContent>
                            {remainingItems > 0 ? (
                                <TileBelowTheFoldContent>
                                    <div style={{ height: (this.props.expandedHeightCss ? this.props.expandedHeightCss : '400px'), }} >
                                        {this.renderItems(numCollapsedItems, this.props.items.length - 1)}
                                    </div>
                                </TileBelowTheFoldContent>
                            ) : (
                                    <span />
                                )
                            }
                        </ExpandableTile>
                    )
                }
            </div>
        );
    }

    private handleClick() {
        return false;
    }

    // disable click support for the expandable tile by returning false here
    private onBeforeClick() {
        return true;
    }

    private renderItems(startIdx: number, endIdx: number) {
        const children = [];

        for (let i = startIdx; i <= endIdx; i++) {
            children.push(this.props.renderItemFn(this.props.items[i]));
        }

        return React.createElement('div', {
            className: 'clg-expandable-section__items'
        },
            children);
    }
}

ClgExpandableSection.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgExpandableSection.propTypes = {
    className: PropTypes.string,
    collapsedHeightCss: PropTypes.string,
    expandedHeightCss: PropTypes.string,
    id: PropTypes.string,
    isExpanded: PropTypes.bool,
    items: PropTypes.array.isRequired,
    light: PropTypes.bool,
    maxCollapsedItems: PropTypes.number,
    maxHeight: PropTypes.number,
    noItemsText: PropTypes.string,
    renderItemFn: PropTypes.func.isRequired,
};

export default ClgExpandableSection;

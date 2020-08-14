import {
    Button,
    DataTableSkeleton,
    Link as CarbonLink,
    OverflowMenu,
    OverflowMenuItem,
    Pagination,
    Tooltip,
} from '@console/pal/carbon-components-react';

import { TrashCan16, View16, ViewOff16 } from '@carbon/icons-react';

import DataTable, {
    TableBatchAction,
    TableBatchActions,
    TableBody,
    TableCell,
    TableContainer,
    TableExpandedRow,
    TableExpandHeader,
    TableExpandRow,
    TableHead,
    TableHeader,
    TableRow,
    TableSelectAll,
    TableSelectRow,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
} from '@console/pal/carbon-components-react';

import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import t from '../../../utils/i18n';
import win from '../../../utils/window';

enum EColumnType {
    string = 'string',
    number = 'number',
    date = 'date',
    alphaNumeric = 'alphaNumeric',
}

enum ESortDir {
    Ascending = -1,
    Descending = 1,
    None = 0,
}

declare global {
    // tslint:disable-next-line:interface-name
    interface Window {
        storage: {
            ready: (callback) => any,
            getItem: (key, options?) => any,
            setItem: (key, data, options?) => any,
            removeItem: (key) => any,
            getStorage: (flag?: boolean) => any,
            getStorageKey: (key) => string
        };
    }
}

export interface IClgTableWrapperValidationResult {
    tooltip?: string;
    valid: boolean;
}

type IClgTableWrapperValidationFunction = (selection) => IClgTableWrapperValidationResult;

interface IClgTableWrapperPropColumn {
    label: any;
    field: string;
    formatter: () => any;
    type: EColumnType;  // allowed values: 'string', 'number', 'date', 'alphaNumeric'
    canSort: boolean;
}

interface IClgTableWrapperPropAction {
    className?: string;
    handler: (keys?) => any;
    id?: string;
    kind?: string;
    label: string;
    icon?: any;
    sprite?: string;
    validate?: IClgTableWrapperValidationFunction;
}

interface IClgTableWrapperPropBatchAction {
    className?: string;
    handler: (keys?) => any;
    label: string;
    icon?: any;
    iconDescription?: string;
    id?: string;
    sprite?: string;
    validate?: (obj) => any;
}

export interface IClgTableWrapperPropItem {
    id: string;
}

interface IClgTableWrapperProps {
    title: string;
    description?: string | Node;
    emptyStateComponent?: any;
    className?: string;
    columns: IClgTableWrapperPropColumn[];
    actions?: IClgTableWrapperPropAction[];
    batchActions?: IClgTableWrapperPropBatchAction[];
    deleteItemHandler?: (item) => any;
    radio?: boolean;
    rowActions?: (item) => any;
    hidePaging?: boolean;
    items?: IClgTableWrapperPropItem[];
    id: string;
    sortField?: string;
    sortDir?: ESortDir;
    filterTriggerTimeout?: number;
    rowDetail?: any;
    rowClickHandler?: (item) => any;
    filterString?: string;
    rowId?: string;
    hasSecretsKey?: string; // item property (boolean) name that determines whether an item has secrets to hide/show
    isDisabledKey?: string;  // the key of a prop on each item that reflect the disabled/enabled state of that item
    isButtonDisabled?: boolean; // is the primary table button disabled
    disableSelection?: boolean;
    onFilter?: (value) => any;
    type?: string;
    usePersistentSearchBar?: boolean;
    onGetClearSelectionFn?: (clearFn) => void;
    onGetSetSelectionFn?: (setSelectionFn) => void;
    onSelectionChanged?: (items: IClgTableWrapperPropItem[]) => any;
    initialSelection?: IClgTableWrapperPropItem[];
    hasSecrets?: boolean; // default is 'false'
    size?: string; // default is '' aka 'normal', other values are: 'short', 'compact', 'tall'
}

interface IClgTableWrapperState {
    expanded?: any;
    filterInputValue?: string;
    filterString?: string;
    id?: string;
    page?: number;
    pageSize?: number;
    revealedSecrets?: any;
    selection?: any;
    sortDir?: ESortDir;
    sortField?: string;
    t?: (key, params?) => string;
}

const tablePageNumbers = {};
const pageSizes = [10, 20, 30, 40, 50];

const tableRowSizeToCss = (givenSize: string): string => {
    const newSize = (givenSize || '').toLowerCase();

    let result = 'bx--data-table--';

    switch (newSize) {
        case 'tall':
            result += 'tall';
            break;
        case 'short':
            result += 'short';
            break;
        case 'compact':
            result += 'compact';
            break;
        default:
        case 'normal':
        case '':
            result = '';
            break;
    }

    return result;
};

const getIdMapFromItems = (items: IClgTableWrapperPropItem[]): any => {
    if (!items || !items.length) {
        return {};
    }

    return items.reduce((p, c) => {
        p[c.id] = c;
        return p;
    }, {});
};

const getPageNumber = (desiredPage, items, pageSize) => {
    if (!items || items.length === 0) {
        return 1;
    }
    const pageCount = Math.ceil(items.length / pageSize);
    return desiredPage <= pageCount ? desiredPage : 1;
};

const isEmpty = (value) => {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return true;
    }
    return false;
};

const renderCellData = (item, col, revealSecret?: boolean) => {
    if (col.formatter) {
        return col.formatter(item, revealSecret);
    }
    const value = item[col.field];  // No reveal secret support for columns without a formatter!
    if (isEmpty(value)) {
        return '--';
    }
    return value.toString();
};

const stringValue = (item, col, revealSecret?: boolean) => {
    if (col.stringValue) {
        return col.stringValue(item, revealSecret);
    }
    return renderCellData(item, col, revealSecret);
};

/**
 * When searching through a table, we tell all formatters to make use of the 'revealed secret' value, as we assume that
 * only the person that could reveal them anyway is performing that operation.
 *
 * @param item
 * @param cols
 * @param rowDetail
 * @param value
 */
const rowMatches = (item, cols, rowDetail, value) => {
    const tableRowStr = cols.map((col) => stringValue(item, col, false).toLowerCase()).join('~~');
    const rowDetailStr = rowDetail && rowDetail.stringValue ? rowDetail.stringValue(item, true).toLowerCase() : '';
    return [tableRowStr, rowDetailStr].join('~~').indexOf(value.toLowerCase()) > -1;
};

class ClgTableWrapper extends React.Component<IClgTableWrapperProps, IClgTableWrapperState> {
    public static getDerivedStateFromProps(props: IClgTableWrapperProps, state: IClgTableWrapperState) {
        const { page, pageSize, selection } = state;
        const { /* filterString,*/ items, rowId, initialSelection } = props;
        const pageNumber = getPageNumber(page, items, pageSize);
        const newSelection = {};

        if (!selection && initialSelection) {
            // we received a new selection
            // remove items from selection that are not present in the list of items
            const itemsMap = getIdMapFromItems(items);

            for (const selItem of initialSelection) {
                if (itemsMap[selItem.id]) {
                    newSelection[selItem.id] = selItem;
                }
            }
        } else {
            // just clean out the existing selection, in case items got removed
            (items && Array.isArray(items) && items || []).forEach((item) => {
                if (selection[item[rowId]]) {
                    newSelection[item[rowId]] = item;
                }
            });
        }

        const stateToSet: IClgTableWrapperState = { page: pageNumber, selection: newSelection };

        /*        if (filterString !== state.filterString) {
                    stateToSet.filterString = filterString;
                } */

        return stateToSet;
    }

    private filteredItemCount: number;
    private filterTriggerTimeout: () => any;

    constructor(props) {
        super(props);

        const pageSize = props.hidePaging ? 500 : (window.storage.getItem(`${props.id}-pageSize`) || pageSizes[0]);
        const page = getPageNumber(tablePageNumbers[props.id] || 1, props.items, pageSize);
        const sortField = window.storage.getItem(`${props.id}-sortField`) || props.sortField;
        const sortDir = window.storage.getItem(`${props.id}-sortDir`) || props.sortDir || 1;

        this.state = {
            expanded: {},
            filterInputValue: props.filterString,
            filterString: props.filterString,
            page,
            pageSize,
            revealedSecrets: {},
            selection: props.selectedItems ? getIdMapFromItems(props.selectedItems) : {},
            sortDir,
            sortField,
            t,
        };

        this.sort = this.sort.bind(this);
        this.filter = this.filter.bind(this);
        this.getPageItems = this.getPageItems.bind(this);
        this.isPaging = this.isPaging.bind(this);
        this.onPageChange = this.onPageChange.bind(this);
        this.onRowSelect = this.onRowSelect.bind(this);
        this.onRowClick = this.onRowClick.bind(this);
        this.onSelectAll = this.onSelectAll.bind(this);
        this.toggleRow = this.toggleRow.bind(this);
        this.renderTableCell = this.renderTableCell.bind(this);
        this.translateBatchActions = this.translateBatchActions.bind(this);
        this.translateFilterInput = this.translateFilterInput.bind(this);
        this.clearSelection = this.clearSelection.bind(this);
        this.setSelection = this.setSelection.bind(this);
        this.processSelectionChange = this.processSelectionChange.bind(this);
        this.renderHideOrRevealIcon = this.renderHideOrRevealIcon.bind(this);

        if (typeof props.onGetClearSelectionFn === 'function') {
            props.onGetClearSelectionFn(this.clearSelection);
        }

        if (typeof props.onGetSetSelectionFn === 'function') {
            props.onGetSetSelectionFn(this.setSelection);
        }
    }

    public onPageChange(data) {
        const { id } = this.props;
        tablePageNumbers[id] = data.page;
        window.storage.setItem(`${id}-pageSize`, data.pageSize);
        this.setState({ page: data.page, pageSize: data.pageSize, selection: {} },
            this.processSelectionChange);
    }

    public onRowClick(evt, item) {
        const { selection } = this.state;
        const { rowClickHandler } = this.props;
        const { charCode, target } = evt;
        if (charCode && charCode !== 13) {
            return;
        }
        const clickedCheckbox = target.closest('td') && target.closest('td').querySelector('.bx--checkbox-label');
        const clickedLink = target.closest('a') || target.closest('button') || target.closest('.pal--tag--clickable');
        const clickedOverflow = target.closest('.bx--overflow-menu, .bx--overflow-menu-options');
        const clickedRadio = target.closest('td') && target.closest('td').querySelector('input.bx--radio-button');
        if (!clickedLink && !clickedCheckbox && !clickedOverflow && !clickedRadio && Object.keys(selection).length <= 0) {
            rowClickHandler(item);
        }
    }

    public onRowSelect(item) {
        const { radio, rowId } = this.props;
        let { selection } = this.state;

        if (radio) {
            selection = {};
        }

        if (!selection[item[rowId]]) {
            selection[item[rowId]] = item;
        } else {
            delete selection[item[rowId]];
        }
        this.setState({ selection },
            this.processSelectionChange);
    }

    public onSelectAll() {
        const { rowId } = this.props;
        const { selection } = this.state;
        const newSelection = {};
        const items = this.getPageItems();
        if (Object.keys(selection).length !== items.length) {
            items.forEach((item) => {
                if (!this.props.isDisabledKey || !item[this.props.isDisabledKey]) {
                    newSelection[item[rowId]] = item;
                }
            });
        }
        this.setState({ selection: newSelection },
            this.processSelectionChange);
    }

    public getPageItems() {
        const { items, columns, rowDetail } = this.props;
        const { filterString, sortField, sortDir, page, pageSize } = this.state;
        let pageItems = items || [];
        if (filterString) {
            pageItems = pageItems.filter((item) => rowMatches(item, columns, rowDetail, filterString));
        }
        if (sortField && sortDir !== 0) {
            const col = columns.find((c) => c.field === sortField);
            if (col) {
                const first = sortDir === 1 ? 0 : 1;
                const second = sortDir === 1 ? 1 : 0;
                // I don't really know what's going on here. Since I changed this to use the `stringValue`
                // function istanbul keeps telling me the branch isn't covered, when it obviously is since
                // I can test the results of the sort.
                // istanbul ignore next
                let sortFunc = (...args) => stringValue(args[first], col, false).localeCompare(stringValue(args[second], col, false));
                if (col.type === 'number') {
                    sortFunc = (...args) => args[first][col.field] - args[second][col.field];
                } else if (col.type === 'alphaNumeric') {
                    // istanbul ignore next
                    sortFunc = (...args) => args[first][col.field].localeCompare(args[second][col.field], undefined, { numeric: true, sensitivity: 'base' });
                }

                // prevent a NPE
                if (pageItems.sort) {

                    // sort the items based
                    pageItems.sort(sortFunc);
                }
            }
        }
        this.filteredItemCount = pageItems.length;
        if (this.isPaging()) {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            pageItems = pageItems.slice(start, end);
        }
        return pageItems;
    }

    public isPaging(): boolean {
        const { items } = this.props;
        const { pageSize } = this.state;
        return !!items && !!this.filteredItemCount && this.filteredItemCount > pageSize;
    }

    public filter(value) {
        const { onFilter, filterTriggerTimeout } = this.props;
        this.setState({ filterInputValue: value });
        if (this.filterTriggerTimeout) {
            this.filterTriggerTimeout();
        }
        this.filterTriggerTimeout = win.timeout(() => {
            if (onFilter) {
                onFilter(value);
                this.setState({ selection: {}, page: 1 },
                    this.processSelectionChange);
            } else {
                this.setState({ filterString: value, selection: {}, page: 1 },
                    this.processSelectionChange);
            }
        }, filterTriggerTimeout);
    }

    public sort(field) {
        const { sortField, sortDir, id } = this.state;
        const state: IClgTableWrapperState = {};
        if (sortField === field) {
            state.sortDir = sortDir === -1 ? 1 : -1;
        } else {
            state.sortField = field;
            state.sortDir = 1;
        }
        window.storage.setItem(`${id}-sortField`, field);
        window.storage.setItem(`${id}-sortDir`, state.sortDir);
        // The sort icon stays active on other column headers for whatever reason
        // See https://github.com/carbon-design-system/carbon-components-react/issues/503
        const currentSort = document.getElementsByClassName('bx--table-sort-v2--active')[0];
        if (currentSort) {
            currentSort.classList.remove('bx--table-sort-v2--active');
        }
        // $('.bx--table-sort-v2--active').removeClass('bx--table-sort-v2--active');
        this.setState(state);
    }

    public toggleRow(id) {
        const { expanded } = this.state;
        if (!expanded[id]) {
            expanded[id] = true;
        } else {
            delete expanded[id];
        }
        this.setState({ expanded });
    }

    public translateBatchActions(id) {
        const { selection } = this.state;
        if (id === 'carbon.table.batch.cancel') {
            return t('clg.common.label.cancel');
        }
        if (id === 'carbon.table.batch.items.selected') {
            return t('clg.cmp.tablewrapper.default.selected.batchitems', { count: Object.keys(selection).length });
        }
        if (id === 'carbon.table.batch.item.selected') {
            return t('clg.cmp.tablewrapper.default.selected.batchitem');
        }
        return '--';
    }

    public translateFilterInput(id) {
        if (id === 'carbon.table.toolbar.search.label' || id === 'carbon.table.toolbar.search.placeholder') {
            return t('clg.cmp.tablewrapper.default.filter.text');
        }
        return '--';
    }

    public renderTableCell(item, col) {
        const { rowId } = this.props;
        const { revealedSecrets } = this.state;
        const id = item[rowId];
        const attrs = {
            className: '',
            key: `${id}-${col.field}`,
            title: '',
        };
        if (col.className) {
            attrs.className = col.className;
        }
        if (col.title) {
            attrs.title = col.title(item);
        }

        // determine whether a potential secret value may be shown as-is or hidden
        let showRealValue = false;
        if (this.props.hasSecrets) {
            if (!this.props.hasSecretsKey ||
                (this.props.hasSecretsKey && item[this.props.hasSecretsKey])) {
                showRealValue = !!revealedSecrets[id];
            }
        } else {
            showRealValue = true;
        }

        return <TableCell {...attrs}>{renderCellData(item, col, showRealValue)}</TableCell>;
    }

    public render() {
        const { selection, filterInputValue, sortField, sortDir, expanded, page, pageSize } = this.state;
        const { items: allItems, columns, deleteItemHandler, disableSelection, emptyStateComponent,
            rowDetail, actions, rowActions, batchActions, className, title, description, id,
            isDisabledKey, radio, rowId, rowClickHandler, type, hidePaging, hasSecrets, hasSecretsKey,
            size } = this.props;
        if (!t) {
            return null;
        }
        const pageItems = this.getPageItems();
        const loading = !allItems;
        const empty = !loading && pageItems.length === 0;
        const hasData = !loading && pageItems.length > 0;
        let emptyState = null;
        let tableState = 'ready';
        if (empty) {
            emptyState = emptyStateComponent ? emptyStateComponent : t('clg.cmp.tablewrapper.default.emptystate.text');
            tableState = 'empty';
        }
        let colSpan = columns.length;
        if (rowDetail) {
            colSpan += 1;
        }

        if (deleteItemHandler) {
            colSpan += 1;
        }

        if (hasSecrets) {
            colSpan += 1;
        }

        if (rowActions) {
            colSpan += 1;
        }
        if ((batchActions || radio) && tableState === 'ready') {
            colSpan += 1;
        }
        const selectedIds = Object.keys(selection);
        const RowDetail = rowDetail;
        const shouldShowBatchActions = (selectedIds.length > 0);

        /* tslint:disable:jsx-no-lambda */
        return (
            <div className={classnames('cfn-table-wrapper', className)} data-state={tableState}>
                <TableContainer title={title} description={description} className={shouldShowBatchActions ? 'showing-batch-actions' : ''}>
                    <TableToolbar>
                        <TableBatchActions
                            totalSelected={selectedIds.length}
                            shouldShowBatchActions={shouldShowBatchActions}
                            onCancel={() => {
                                this.setState({ selection: {} },
                                    this.processSelectionChange);
                            }
                            }
                            translateWithId={this.translateBatchActions}
                        >
                            {!!batchActions && batchActions.map((action) => {
                                const attrs = {
                                    disabled: false,
                                    icon: null,
                                    iconDescription: action.iconDescription || '',
                                    id: action.id || `${action.label}batch-action-id`,
                                    key: action.label,
                                    onClick: () => action.handler(selectedIds),
                                    renderIcon: action.icon || null,
                                };
                                let tooltip = null;
                                if (action.validate) {
                                    const v = action.validate(selection);
                                    if (!v.valid) {
                                        attrs.disabled = true;
                                    }
                                    if (v.tooltip) {
                                        tooltip = v.tooltip;
                                    }
                                }
                                // if (action.className) attrs.className = action.className;
                                if (action.sprite && !tooltip) {
                                    attrs.icon = action.sprite;
                                    attrs.iconDescription = action.label;
                                }
                                return tooltip
                                    ? <TableBatchAction {...attrs}><Tooltip key={`tooltip-${action.label}`} triggerText={action.label}>{tooltip}</Tooltip></TableBatchAction>
                                    : <TableBatchAction {...attrs}>{action.label}</TableBatchAction>;
                            })}
                        </TableBatchActions>
                        <TableToolbarContent>
                            {!(empty && !filterInputValue) &&
                                (
                                    <TableToolbarSearch
                                        onChange={(evt) => this.filter(evt.target.value)}
                                        value={filterInputValue}
                                        persistent={this.props.usePersistentSearchBar || true}
                                        translateWithId={this.translateFilterInput}
                                        disabled={loading}
                                    />
                                )
                            }
                            {!!actions && actions.map((action) => {
                                const { handler, icon, label, sprite, validate, kind } = action;
                                const attrs = {
                                    className: '',
                                    disabled: false,
                                    icon: '',
                                    iconDescription: '',
                                    id: action.id,
                                    key: action.label,
                                    onClick: () => handler(),
                                    size: 'small',
                                };
                                let tooltip = null;
                                if (validate) {
                                    const v = validate(selection);
                                    if (!v.valid) {
                                        attrs.disabled = true;
                                    }
                                    if (v.tooltip) {
                                        tooltip = v.tooltip;
                                    }
                                }
                                if (action.className) {
                                    attrs.className = action.className;
                                }
                                if (tooltip) {
                                    return <Button {...attrs}><Tooltip key={`tooltip-${label}`} triggerText={action.label}>{tooltip}</Tooltip></Button>;
                                }
                                return (
                                    <Button
                                        key={label + '.action.button'}
                                        {...attrs}
                                        renderIcon={icon}
                                        icon={sprite}
                                        kind={kind || 'primary'}
                                        iconDescription={(icon || sprite) ? label : null}
                                        disabled={this.props.isButtonDisabled}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                        </TableToolbarContent>
                    </TableToolbar>
                    {loading && (
                        <DataTableSkeleton
                            compact={!!(this.props.size === 'compact')}
                            columnCount={(this.props.columns && this.props.columns.length) || 5}
                        />
                    )}
                    {!loading && (
                        <table className={classnames('bx--data-table', tableRowSizeToCss(size), `${!!emptyState ? 'clg-table-emptystate' : ''}`)}>
                            <TableHead>
                                {empty && !filterInputValue ? (
                                    <TableRow><th scope='col' /></TableRow>
                                ) : (
                                        <TableRow>
                                            {rowDetail && <TableExpandHeader ariaLabel='' isExpanded={false} />}
                                            {!radio && !!batchActions && tableState === 'ready' && (
                                                <TableSelectAll
                                                    checked={selectedIds.length === pageItems.length}
                                                    disabled={disableSelection}
                                                    onSelect={this.onSelectAll}
                                                    id={`selectAll-${id}`}
                                                    name={`selectAll-${id}`}
                                                />
                                            )}
                                            {!!radio && tableState === 'ready' && (
                                                <TableHeader />
                                            )}
                                            {columns.map((col) => {
                                                let sortDirection = 'NONE';
                                                if (!empty && col.field === sortField) {
                                                    sortDirection = sortDir === 1 ? 'ASC' : 'DESC';
                                                }
                                                const attrs = {
                                                    isSortHeader: col.canSort !== false,
                                                    isSortable: col.canSort !== false,
                                                    key: col.field,
                                                    onClick: undefined,
                                                    sortDirection,
                                                };
                                                if (attrs.isSortHeader) {
                                                    attrs.onClick = () => this.sort(col.field);
                                                }
                                                const colLabel = (typeof col.label === 'function') ? col.label() : col.label;
                                                // tslint:disable-next-line:jsx-key
                                                return <TableHeader {...attrs}>{colLabel}</TableHeader>;
                                            })}
                                            {!!hasSecrets && <TableHeader />}
                                            {!!deleteItemHandler && <TableHeader />}
                                            {!!rowActions && <TableHeader />}
                                        </TableRow>
                                    )}
                            </TableHead>
                            <TableBody>
                                {!!emptyState && (
                                    <TableRow>
                                        <TableCell colSpan={colSpan} className='clg-table-emptystate-col'>
                                            {emptyStateComponent ? (
                                                <React.Fragment>{emptyState}</React.Fragment>
                                            ) : (
                                                    <div style={{ textAlign: 'center', }}>{emptyState}</div>
                                                )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {hasData && pageItems.map((item) => {
                                    const rowAttrs = {
                                        'ariaLabel': '',
                                        'className': (isDisabledKey && item[isDisabledKey]) ? 'clg-table-row-disabled' : '',
                                        'data-id': item[rowId],
                                        'disabled': isDisabledKey ? item[isDisabledKey] : false,
                                        'isExpanded': false,
                                        'key': item[rowId],
                                        'onClick': undefined,
                                        'onExpand': undefined,
                                        'onKeyPress': undefined,
                                        'tabIndex': '-1',
                                    };

                                    if (rowClickHandler &&
                                        !disableSelection &&
                                        (!isDisabledKey || !item[isDisabledKey])) {
                                        rowAttrs.onClick = (evt) => this.onRowClick(evt, item);
                                        rowAttrs.onKeyPress = (evt) => this.onRowClick(evt, item);
                                        rowAttrs.tabIndex = '0';
                                        rowAttrs.className += ' cfn-table-row-clickable';
                                    }
                                    let RowType = TableRow;
                                    if (rowDetail) {
                                        RowType = TableExpandRow;
                                        rowAttrs.key = `expand-${item[rowId]}`;
                                        rowAttrs.onExpand = () => this.toggleRow(item[rowId]);
                                        rowAttrs.isExpanded = expanded[item[rowId]] || false;
                                        rowAttrs.ariaLabel = 'Expand the row';
                                    }
                                    return [
                                        (
                                            <RowType {...rowAttrs}>
                                                {(!!batchActions || !!radio) && (
                                                    <TableSelectRow
                                                        key={`select-${item[rowId]}`}
                                                        name={`select-${item[rowId]}`}
                                                        id={`select-${item[rowId]}`}
                                                        onSelect={() => this.onRowSelect(item)}
                                                        disabled={disableSelection || (isDisabledKey ? item[isDisabledKey] : false)}
                                                        checked={!!selection[item[rowId]]}
                                                        ariaLabel='Select the row'
                                                        radio={radio}
                                                    />
                                                )}
                                                {columns.map((col) => this.renderTableCell(item, col))}
                                                {!!hasSecrets && (
                                                    <TableCell>
                                                        {(!hasSecretsKey || (hasSecretsKey && item[hasSecretsKey])) && (
                                                            <CarbonLink
                                                                className={'clg-table-row-delete'}
                                                                disabled={disableSelection || (isDisabledKey ? item[isDisabledKey] : false)}
                                                                key={`reveal-${item[rowId]}`}
                                                                href={'#'}
                                                                onClick={this.revealSecretValues.bind(this, item)}
                                                            >
                                                                {this.renderHideOrRevealIcon(item)}
                                                            </CarbonLink>
                                                        )}
                                                    </TableCell>
                                                )}
                                                {!!deleteItemHandler && (
                                                    <TableCell>
                                                        <CarbonLink
                                                            className={'clg-table-row-delete'}
                                                            disabled={disableSelection || (isDisabledKey ? item[isDisabledKey] : false)}
                                                            key={`delete-${item[rowId]}`}
                                                            href={'#'}
                                                            onClick={deleteItemHandler.bind(this, item)}
                                                        >
                                                            <TrashCan16
                                                                alt={t('clg.cmp.tablewrapper.default.action.deleterow.alt')}
                                                                aria-label={t('clg.common.label.delete')}
                                                                className={'clg-hover-link'}
                                                                icontitle={t('clg.common.label.delete')}
                                                                role={'img'}
                                                            />
                                                        </CarbonLink>
                                                    </TableCell>
                                                )}
                                                {!!rowActions && (
                                                    <TableCell>
                                                        <OverflowMenu flipped={true}>
                                                            {rowActions(item).map((a) => (
                                                                <OverflowMenuItem
                                                                    itemText={a.label}
                                                                    onClick={() => a.handler(item)}
                                                                    isDelete={a.isDelete}
                                                                    key={a.label}
                                                                    requireTitle={true}
                                                                />
                                                            ))}
                                                        </OverflowMenu>
                                                    </TableCell>
                                                )}
                                            </RowType>
                                        ), rowDetail && expanded[item[rowId]] && (
                                            <TableExpandedRow key={`detail-${item[rowId]}`} colSpan={colSpan}>
                                                <RowDetail item={item} type={type} />
                                            </TableExpandedRow>
                                        ),
                                    ];
                                })}
                            </TableBody>
                        </table>
                    )}
                </TableContainer>
                {!!!hidePaging && this.filteredItemCount > 0 && !loading && (
                    <Pagination
                        page={page}
                        pageSize={pageSize}
                        onChange={this.onPageChange}
                        totalItems={this.filteredItemCount}
                        pageSizes={pageSizes}
                        isLastPage={this.filteredItemCount < pageSize}
                        backwardText={t('clg.cmp.tablewrapper.default.pagination.prevpage')}
                        itemRangeText={(min, max, total) => t('clg.cmp.tablewrapper.default.pagination.itemrange', { min, max, total })}
                        forwardText={t('clg.cmp.tablewrapper.default.pagination.nextpage')}
                        itemsPerPageText={t('clg.cmp.tablewrapper.default.pagination.itemsperpage')}
                        pageNumberText={t('clg.cmp.tablewrapper.default.pagination.pagenumber')}
                        pageRangeText={(current, total) => t('clg.cmp.tablewrapper.default.pagination.pagerange', { current, total })}
                        itemText={(min, max) => t('clg.cmp.tablewrapper.default.pagination.itemtext', { min, max })}
                        pageText={(pageNumber) => t('clg.cmp.tablewrapper.default.pagination.pagetext', { pageNumber })}
                    />
                )}
            </div>
        );
    }

    private renderHideOrRevealIcon(item) {
        const { rowId } = this.props;
        if (this.state.revealedSecrets[item[rowId]]) {
            return (
                <ViewOff16
                    className={'clg-hover-link'}
                    icontitle={t('clg.common.label.hide')}
                    role={'img'}
                />
            );
        } else {
            return (
                <View16
                    className={'clg-hover-link'}
                    icontitle={t('clg.common.label.show')}
                    role={'img'}
                />
            );
        }
    }

    private revealSecretValues(item) {
        const { rowId } = this.props;
        const { revealedSecrets } = this.state;
        const id = item[rowId];

        if (revealedSecrets[id]) {
            delete revealedSecrets[id];
        } else {
            revealedSecrets[id] = item;
        }

        this.setState(() => ({
            revealedSecrets,
        }));
    }

    private clearSelection() {
        this.setState({
            selection: {},
        }, this.processSelectionChange);
    }

    private setSelection(selectedItems: IClgTableWrapperPropItem[]) {
        if (selectedItems) {
            this.setState({
                selection: getIdMapFromItems(selectedItems),
            });  // DO NOT process the selection change here, because it was triggered from the outside and DOES NOT have to
            // be communicated back again!
        } else {
            return null;
        }
    }

    /**
     * Use optional callback function to notify caller of changed selection.
     * The returned array contains the actual selected items.
     */
    private processSelectionChange() {
        if (typeof this.props.onSelectionChanged === 'function') {
            this.props.onSelectionChanged(Object.values(this.state.selection));
        }
    }
}

// @ts-ignore
ClgTableWrapper.propTypes = {
    actions: PropTypes.arrayOf(PropTypes.shape({
        handler: PropTypes.func.isRequired,
        icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        sprite: PropTypes.string,
        validate: PropTypes.func,
    })),
    batchActions: PropTypes.arrayOf(PropTypes.shape({
        className: PropTypes.string,
        handler: PropTypes.func.isRequired,
        label: PropTypes.string.isRequired,
        validate: PropTypes.func,
    })),
    className: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.shape({
        canSort: PropTypes.bool,
        field: PropTypes.string.isRequired,
        formatter: PropTypes.func,
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
        type: PropTypes.oneOf(['string', 'number', 'date', 'alphaNumeric']),
    })).isRequired,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]),
    emptyStateComponent: PropTypes.any,
    filterString: PropTypes.string,
    filterTriggerTimeout: PropTypes.number,
    id: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
    })),
    onFilter: PropTypes.func,
    rowActions: PropTypes.func,
    rowClickHandler: PropTypes.func,
    rowDetail: PropTypes.any,
    rowId: PropTypes.string,
    sortDir: PropTypes.oneOf([-1, 0, 1]),
    sortField: PropTypes.string,
    title: PropTypes.string.isRequired,
    type: PropTypes.string,
    radio: PropTypes.bool,
    deleteItemHandler: PropTypes.func,
    hidePaging: PropTypes.bool,
    hasSecretsKey: PropTypes.string,
    isDisabledKey: PropTypes.string,
    disableSelection: PropTypes.bool,
    usePersistentSearchBar: PropTypes.bool,
    onGetClearSelectionFn: PropTypes.func,
    onGetSetSelectionFn: PropTypes.func,
    onSelectionChanged: PropTypes.func,
    initialSelection: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
    })),
    hasSecrets: PropTypes.bool,
    size: PropTypes.oneOf(['normal', 'short', 'compact', 'tall']), // default is '' aka 'normal', other values are: 'short', 'compact', 'tall'
};

// @ts-ignore
ClgTableWrapper.defaultProps = {
    filterTriggerTimeout: 300,
    rowId: 'id',
    // description: '',
    // className: '',
    // actions: [],
    // batchActions: [],
    // rowActions: '',
    // items: '',
    // type: '',
    // sortField: '',
    // sortDir: '',
    // rowDetail: () => {},
    // rowClickHandler: () => {},
    // filterString: '',
    // onFilter: () => {},
};

export default ClgTableWrapper;

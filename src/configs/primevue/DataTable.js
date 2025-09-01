/**
 * Advanced PrimeVue DataTable Configuration
 * The ultimate test of zero-overhead design system capabilities
 * Demonstrates complex prop transformations, event handling, and slot management
 */
export default {
    name: 'DataTable',
    category: 'data',
    description: 'A comprehensive data table with sorting, filtering, pagination, selection, and templating',

    baseComponent: 'DataTable',

    props: [
        // Core Data Props
        {
            name: 'data',
            type: 'array',
            required: true,
            description: 'Array of data objects to display'
        },
        {
            name: 'columns',
            type: 'array',
            required: true,
            description: 'Column configuration array'
        },
        {
            name: 'loading',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Show loading indicator'
        },
        {
            name: 'lazy',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable lazy loading mode'
        },
        {
            name: 'totalRecords',
            type: 'number',
            required: false,
            description: 'Total number of records for lazy loading'
        },

        // Pagination Props
        {
            name: 'paginate',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Enable pagination'
        },
        {
            name: 'pageSize',
            type: 'number',
            required: false,
            default: 10,
            options: [5, 10, 20, 50, 100],
            description: 'Number of rows per page'
        },
        {
            name: 'currentPage',
            type: 'number',
            required: false,
            default: 1,
            description: 'Current page number'
        },
        {
            name: 'showPageSizeSelector',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Show page size selector'
        },

        // Sorting Props
        {
            name: 'sortable',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Enable column sorting'
        },
        {
            name: 'multiSort',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable multi-column sorting'
        },
        {
            name: 'sortField',
            type: 'string',
            required: false,
            description: 'Default sort field'
        },
        {
            name: 'sortOrder',
            type: 'number',
            required: false,
            default: 1,
            options: [-1, 1],
            description: 'Sort direction: 1 for ASC, -1 for DESC'
        },

        // Selection Props
        {
            name: 'selectable',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable row selection'
        },
        {
            name: 'selectionMode',
            type: 'string',
            required: false,
            default: 'single',
            options: ['single', 'multiple'],
            description: 'Row selection mode'
        },
        {
            name: 'selectedRows',
            type: 'array',
            required: false,
            default: [],
            description: 'Selected row data'
        },
        {
            name: 'rowKey',
            type: 'string',
            required: false,
            default: 'id',
            description: 'Unique identifier field for rows'
        },

        // Filtering Props
        {
            name: 'filterable',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable column filtering'
        },
        {
            name: 'globalFilter',
            type: 'string',
            required: false,
            description: 'Global filter value'
        },
        {
            name: 'filters',
            type: 'object',
            required: false,
            default: {},
            description: 'Column-specific filters'
        },

        // Display Props
        {
            name: 'striped',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Alternating row colors'
        },
        {
            name: 'bordered',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Show table borders'
        },
        {
            name: 'hoverable',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Highlight rows on hover'
        },
        {
            name: 'size',
            type: 'string',
            required: false,
            default: 'normal',
            options: ['small', 'normal', 'large'],
            description: 'Table size'
        },
        {
            name: 'responsive',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Enable responsive behavior'
        },
        {
            name: 'scrollable',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable table scrolling'
        },
        {
            name: 'scrollHeight',
            type: 'string',
            required: false,
            description: 'Height for scrollable table'
        },

        // Export Props
        {
            name: 'exportable',
            type: 'boolean',
            required: false,
            default: false,
            description: 'Enable data export functionality'
        },
        {
            name: 'exportFilename',
            type: 'string',
            required: false,
            default: 'data-export',
            description: 'Default filename for exports'
        }
    ],

    // Complex prop mappings for PrimeVue DataTable
    propMappings: [
        // Core data mapping
        {
            type: 'direct',
            source: 'data',
            target: 'value'  // PrimeVue uses 'value' not 'data'
        },
        {
            type: 'direct',
            source: 'loading',
            target: 'loading'
        },
        {
            type: 'direct',
            source: 'lazy',
            target: 'lazy'
        },
        {
            type: 'direct',
            source: 'totalRecords',
            target: 'totalRecords'
        },

        // Pagination mapping
        {
            type: 'direct',
            source: 'paginate',
            target: 'paginator'  // PrimeVue uses 'paginator'
        },
        {
            type: 'direct',
            source: 'pageSize',
            target: 'rows'  // PrimeVue uses 'rows' for page size
        },
        {
            type: 'conditional',
            source: 'showPageSizeSelector',
            target: 'rowsPerPageOptions',
            condition: 'showPageSizeSelector === true',
            transform: '[5, 10, 20, 50, 100]',
            fallback: 'undefined'
        },
        {
            type: 'value',
            source: 'currentPage',
            target: 'first',
            transform: '(page) => (page - 1) * (props.pageSize || 10)'  // Convert page to first record index
        },

        // Sorting mapping
        {
            type: 'direct',
            source: 'sortField',
            target: 'sortField'
        },
        {
            type: 'direct',
            source: 'sortOrder',
            target: 'sortOrder'
        },
        {
            type: 'direct',
            source: 'multiSort',
            target: 'multiSortMeta'
        },

        // Selection mapping
        {
            type: 'direct',
            source: 'selectedRows',
            target: 'selection'  // PrimeVue uses 'selection'
        },
        {
            type: 'direct',
            source: 'selectionMode',
            target: 'selectionMode'
        },
        {
            type: 'direct',
            source: 'rowKey',
            target: 'dataKey'  // PrimeVue uses 'dataKey'
        },

        // Filtering mapping
        {
            type: 'direct',
            source: 'filters',
            target: 'filters'
        },
        {
            type: 'direct',
            source: 'globalFilter',
            target: 'globalFilterValue'  // PrimeVue specific prop name
        },

        // Display mapping
        {
            type: 'direct',
            source: 'striped',
            target: 'stripedRows'  // PrimeVue uses 'stripedRows'
        },
        {
            type: 'conditional',
            source: 'bordered',
            target: 'tableStyle',
            condition: 'bordered === true',
            transform: '{ border: "1px solid #e5e7eb" }',
            fallback: '{}'
        },
        {
            type: 'direct',
            source: 'hoverable',
            target: 'rowHover'  // PrimeVue uses 'rowHover'
        },
        {
            type: 'value',
            source: 'size',
            target: 'size',
            transform: '(size) => size === "normal" ? undefined : size'  // PrimeVue defaults to undefined for normal
        },
        {
            type: 'direct',
            source: 'responsive',
            target: 'responsiveLayout'
        },
        {
            type: 'direct',
            source: 'scrollable',
            target: 'scrollable'
        },
        {
            type: 'direct',
            source: 'scrollHeight',
            target: 'scrollHeight'
        }
    ],

    // Comprehensive event handling
    events: [
        // Data Events
        {
            name: 'page',
            emit: 'page',
            payload: 'PageEvent',
            description: 'Fired when pagination changes'
        },
        {
            name: 'sort',
            emit: 'sort',
            payload: 'SortEvent',
            description: 'Fired when sorting changes'
        },
        {
            name: 'filter',
            emit: 'filter',
            payload: 'FilterEvent',
            description: 'Fired when filters change'
        },

        // Selection Events
        {
            name: 'selection-change',
            emit: 'update:selectedRows',
            payload: 'Array',
            description: 'Fired when row selection changes'
        },
        {
            name: 'row-select',
            emit: 'row-select',
            payload: 'Object',
            description: 'Fired when a row is selected'
        },
        {
            name: 'row-unselect',
            emit: 'row-unselect',
            payload: 'Object',
            description: 'Fired when a row is unselected'
        },
        {
            name: 'select-all-change',
            emit: 'select-all-change',
            payload: 'SelectAllChangeEvent',
            description: 'Fired when select all checkbox changes'
        },

        // Row Events
        {
            name: 'row-click',
            emit: 'row-click',
            payload: 'RowClickEvent',
            description: 'Fired when a row is clicked'
        },
        {
            name: 'row-dblclick',
            emit: 'row-dblclick',
            payload: 'RowClickEvent',
            description: 'Fired when a row is double-clicked'
        },
        {
            name: 'row-contextmenu',
            emit: 'row-contextmenu',
            payload: 'RowClickEvent',
            description: 'Fired when row context menu is triggered'
        },

        // Cell Events
        {
            name: 'cell-edit-init',
            emit: 'cell-edit-init',
            payload: 'CellEditEvent',
            description: 'Fired when cell editing starts'
        },
        {
            name: 'cell-edit-complete',
            emit: 'cell-edit-complete',
            payload: 'CellEditEvent',
            description: 'Fired when cell editing completes'
        },
        {
            name: 'cell-edit-cancel',
            emit: 'cell-edit-cancel',
            payload: 'CellEditEvent',
            description: 'Fired when cell editing is cancelled'
        }
    ],

    // Advanced slot system for maximum flexibility
    slots: [
        {
            name: 'default',
            description: 'Default content - Column definitions'
        },
        {
            name: 'header',
            description: 'Table header content'
        },
        {
            name: 'footer',
            description: 'Table footer content'
        },
        {
            name: 'empty',
            description: 'Content shown when no data'
        },
        {
            name: 'loading',
            description: 'Custom loading indicator'
        },
        {
            name: 'expansion',
            description: 'Row expansion template'
        },
        {
            name: 'groupheader',
            description: 'Group header template'
        },
        {
            name: 'groupfooter',
            description: 'Group footer template'
        },
        {
            name: 'paginatorstart',
            description: 'Left side of paginator'
        },
        {
            name: 'paginatorend',
            description: 'Right side of paginator'
        }
    ],

    // Performance optimizations for large datasets
    performance: {
        memoize: true,
        lazyLoad: true,  // Critical for large datasets
        treeshake: true,
        virtualScrolling: true,
        dataTableOptimizations: {
            columnResizing: true,
            columnReordering: true,
            rowGrouping: true,
            frozenColumns: true,
            contextMenu: true
        }
    },

    // Custom styles for professional appearance
    styles: `
/* DataTable Container */
.p-datatable {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

/* Header Styling */
.p-datatable .p-datatable-thead > tr > th {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  padding: 1rem;
}

.p-datatable .p-datatable-thead > tr > th.p-sortable-column:hover {
  background: #f3f4f6;
}

/* Row Styling */
.p-datatable .p-datatable-tbody > tr {
  transition: background-color 0.2s;
}

.p-datatable .p-datatable-tbody > tr:hover {
  background: #f8fafc;
}

.p-datatable .p-datatable-tbody > tr.p-highlight {
  background: #dbeafe;
  color: #1e40af;
}

.p-datatable .p-datatable-tbody > tr > td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 1rem;
}

/* Pagination Styling */
.p-datatable .p-paginator {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

/* Loading Overlay */
.p-datatable .p-datatable-loading-overlay {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

/* Selection Checkbox */
.p-datatable .p-selection-column {
  width: 3rem;
  text-align: center;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .p-datatable .p-datatable-thead > tr > th,
  .p-datatable .p-datatable-tbody > tr > td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}

/* Scrollable Table */
.p-datatable.p-datatable-scrollable .p-datatable-wrapper {
  border-radius: 0;
}

/* Filter Row */
.p-datatable .p-datatable-thead > tr.p-filter-row > td {
  padding: 0.5rem;
  background: #ffffff;
}

/* Export Button Styling */
.datatable-export-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.datatable-export-buttons .p-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Status Indicators */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}
  `
};
/**
 * PrimeVue Library Adapter
 */
import { LibraryAdapter } from '../adapters/LibraryAdapter.js'

export class PrimeVueAdapter extends LibraryAdapter {
    constructor(version = '3.45.0') {
        super('PrimeVue', version);
        this.initializeComponentMappings();
        this.initializePropMappings();
        this.initializeEventMappings();
    }

    getImportStatement(componentName) {
        const actualComponent = this.getComponent(componentName);
        return `import ${actualComponent} from 'primevue/${actualComponent.toLowerCase()}';`;
    }

    initializeComponentMappings() {
        // Common component mappings
        this.registerComponent('Button', 'Button');
        this.registerComponent('Input', 'InputText');
        this.registerComponent('Select', 'Dropdown');
        this.registerComponent('Checkbox', 'Checkbox');
        this.registerComponent('Radio', 'RadioButton');
        this.registerComponent('Card', 'Card');
        this.registerComponent('Dialog', 'Dialog');
        this.registerComponent('Table', 'DataTable');
        this.registerComponent('Menu', 'Menu');
        this.registerComponent('Tabs', 'TabView');
        this.registerComponent('Panel', 'Panel');
    }

    initializePropMappings() {
        // Common prop mappings for PrimeVue
        this.registerProp('disabled', 'disabled');
        this.registerProp('loading', 'loading');
        this.registerProp('size', 'size');
        this.registerProp('variant', 'severity'); // PrimeVue uses 'severity' for variants
        this.registerProp('placeholder', 'placeholder');
        this.registerProp('value', 'modelValue'); // Vue 3 v-model
    }

    initializeEventMappings() {
        // Common event mappings
        this.registerEvent('click', 'click');
        this.registerEvent('change', 'update:modelValue');
        this.registerEvent('input', 'input');
        this.registerEvent('focus', 'focus');
        this.registerEvent('blur', 'blur');
    }

    getComponentConfig(componentName) {
        const configs = {
            Button: {
                defaultProps: {
                    type: 'button',
                    severity: 'primary'
                },
                requiredProps: [],
                slots: ['default', 'icon']
            },
            InputText: {
                defaultProps: {
                    type: 'text'
                },
                requiredProps: [],
                slots: []
            },
            Dropdown: {
                defaultProps: {
                    optionLabel: 'label',
                    optionValue: 'value'
                },
                requiredProps: ['options'],
                slots: ['value', 'option']
            },
            DataTable: {
                defaultProps: {
                    paginator: true,
                    rows: 10,
                    rowsPerPageOptions: [5, 10, 20, 50],
                    paginatorTemplate: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
                    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} entries',
                    responsiveLayout: 'scroll',
                    showGridlines: true,
                    stripedRows: false,
                    rowHover: true
                },
                requiredProps: ['value'],
                slots: [
                    'header', 'footer', 'empty', 'loading', 'expansion',
                    'groupheader', 'groupfooter', 'paginatorstart', 'paginatorend'
                ],
                events: [
                    'page', 'sort', 'filter', 'row-click', 'row-dblclick', 'row-contextmenu',
                    'row-select', 'row-unselect', 'select-all-change', 'cell-edit-init',
                    'cell-edit-complete', 'cell-edit-cancel', 'column-resize-end',
                    'column-reorder', 'row-expand', 'row-collapse'
                ]
            }
        };

        return configs[componentName] || {};
    }
}
/**
 * Vuetify Library Adapter
 */

import { LibraryAdapter } from './LibraryAdapter.js'

export class VuetifyAdapter extends LibraryAdapter {
    constructor(version = "3.6.1") {
        super('Vuetify', version)
        this.initializeComponentMappings()
        this.initializePropMappings()
        this.initializeEventMappings()
    }

    getImportStatement(componentName) {
        const actualComponent = this.getComponent(componentName)
        return `import { ${actualComponent} } from vuetify/componnets`
    }

    initializeComponentMappings() {
        this.registerComponent('Button', 'VBtn')
        this.registerComponent('Input', 'VTextField')
        this.registerComponent('Select', 'VSelect')
        this.registerComponent('Checkbox', 'VCheckbox')
        this.registerComponent('Radio', 'VRadio')
        this.registerComponent('Card', 'VCard')
        this.registerComponent('Dialog', 'VDialog')
        this.registerComponent('Table', 'VDataTable')
        this.registerComponent('Menu', 'VMenu')
        this.registerComponent('Tabs', 'VTabs')
        this.registerComponent('Panel', 'VExpansionPanels')
        this.registerComponent('Switch', 'VSwitch')
        this.registerComponent('Slider', 'VSlider')
        this.registerComponent('ProgressBar', 'VProgressLinear')
        this.registerComponent('Avatar', 'VAvatar')
        this.registerComponent('Chip', 'VChip')
    }

    initializePropMappings() {
        // Vuetify prop mappings
        this.registerProp('disabled', 'disabled')
        this.registerProp('loading', 'loading')
        this.registerProp('size', 'size')
        this.registerProp('variant', 'variant') // Vuetify uses 'variant' directly
        this.registerProp('color', 'color')
        this.registerProp('placeholder', 'placeholder')
        this.registerProp('value', 'modelValue')
        this.registerProp('label', 'label')
        this.registerProp('dense', 'density') // Vuetify 3 uses 'density'
        this.registerProp('outlined', 'variant') // Maps to variant="outlined"
        this.registerProp('filled', 'variant') // Maps to variant="filled"
    }

    initializeEventMappings() {
        // Vuetify event mappings
        this.registerEvent('click', 'click')
        this.registerEvent('change', 'update:modelValue')
        this.registerEvent('input', 'input')
        this.registerEvent('focus', 'focus')
        this.registerEvent('blur', 'blur')
        this.registerEvent('update', 'update:modelValue')
    }

    getComponentConfig(componentName) {
        const configs = {
            VBtn: {
                defaultProps: {
                    variant: 'elevated',
                    color: 'primary'
                },
                requiredProps: [],
                slots: ['default', 'prepend', 'append'],
                variantOptions: ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain']
            },
            VTextField: {
                defaultProps: {
                    variant: 'filled',
                    density: 'default'
                },
                requiredProps: [],
                slots: ['prepend', 'append', 'prepend-inner', 'append-inner'],
                variantOptions: ['filled', 'outlined', 'underlined', 'solo', 'solo-inverted']
            },
            VSelect: {
                defaultProps: {
                    variant: 'filled',
                    itemTitle: 'title',
                    itemValue: 'value'
                },
                requiredProps: ['items'],
                slots: ['selection', 'item', 'prepend-item', 'append-item']
            },
            VCard: {
                defaultProps: {
                    variant: 'elevated'
                },
                requiredProps: [],
                slots: ['default', 'title', 'subtitle', 'text', 'actions']
            }
        }

        return configs[componentName] || {}
    }

    /**
     * Get Vuetify-specific variant transformation
     * @param {string} genericVariant - Generic variant
     * @param {string} componentName - Component name
     * @returns {string} Vuetify variant
     */
    transformVariant(genericVariant, componentName) {
        const variantMaps = {
            VBtn: { 'primary': 'elevated', 'secondary': 'tonal', 'success': 'elevated', 'warning': 'elevated', 'danger': 'elevated', 'info': 'elevated' },
            VTextField: { 'outlined': 'outlined', 'filled': 'filled', 'standard': 'underlined' }
        }

        return variantMaps[componentName]?.[genericVariant] || genericVariant
    }
}
/**
 * Configuration for Vuetify Button.
 * File: src/configs/vuetify/button.config.js
 */

export default {
    name: 'Button',
    category: 'Form',
    description: 'Button Component with multiple variants and states',
    baseComponent: 'VBtn',
    props: [
        { name: 'label', type: 'string', required: false, default: '' },
        { name: 'color', type: 'string', required: false, default: 'primary', options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'] },
        { name: 'variant', type: 'string', required: false, default: 'elevated', options: ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'] },
        { name: 'size', type: 'string', required: false, default: 'default', options: ['x-small', 'small', 'default', 'large', 'x-large'] },
        { name: 'disabled', type: 'boolean', required: false, default: false },
        { name: 'loading', type: 'boolean', required: false, default: false },
        { name: 'icon', type: 'string', required: false },
        { name: 'iconPosition', type: 'string', required: false, default: 'left', options: ['left', 'right'] },
        { name: 'rounded', type: 'boolean', required: false, default: false }
    ],
    propMappings: [
        { type: 'direct', source: 'label', target: 'text' },
        { type: 'direct', source: 'variant', target: 'variant' },
        { type: 'direct', source: 'size', target: 'size' },
        { type: 'direct', source: 'disabled', target: 'disabled' },
        { type: 'conditional', source: 'icon', target: 'prependIcon', condition: 'iconPosition === "left" && icon', fallback: 'undefined' },
        { type: 'conditional', source: 'icon', target: 'appendIcon', condition: 'iconPosition === "right" && icon', fallback: 'undefined' },
        { type: 'direct', source: 'rounded', target: 'rounded' }
    ],
    events: [
        { name: 'click', emit: 'click', payload: 'MouseEvent' },
        { name: 'focus', emit: 'focus', payload: 'FocusEvent' },
        { name: 'blur', emit: 'blur', payload: 'FocusEvent' }
    ],
    slots: [
        { name: 'default', description: 'Button Content' },
        { name: 'prepend', description: 'Content Before button text' },
        { name: 'append', description: 'Content after button text' }
    ],
    performance: {
        memoize: true, lazyLoad: false, treeshake: true, vuetifyOptimizations: { useDirectives: true, optimizeClasses: true }
    }
}
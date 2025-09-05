/**
 * Configuration for Primevue Button.
 * File: src/configs/primevue/button.config.js
 */
export default {
    name: 'Button',
    category: 'Form',
    description: 'Button Component with multiple variants and states',
    baseComponent: 'Button',
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
        { type: 'direct', source: 'label', target: 'label' },
        { type: 'direct', source: 'color', target: 'severity' },
        { type: 'direct', source: 'size', target: 'size' },
        { type: 'direct', source: 'disabled', target: 'disabled' },
        { type: 'direct', source: 'loading', target: 'loading' },
        { type: 'direct', source: 'icon', target: ' icon' },
        { type: 'conditional', source: 'iconPosition', target: 'iconPos', condition: 'iconPosition === "right"', fallback: '"left"' }
    ],
    events: [
        { name: 'click', emit: 'click', payload: 'MouseEvent' },
        { name: 'focus', emit: 'focus', payload: 'FocusEvent' },
        { name: 'blur', emit: 'blur', payload: 'FocusEvent' }
    ],
    slots: [
        { name: 'default', description: 'Button content when label prop is not used' },
        { name: 'icon', description: 'Custom icon content' }
    ],
    performance: { memoize: true, lazyLoad: false, treeshake: true }
}
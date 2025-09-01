/**
 * Vuetify Button Component Configuration
 * Demonstrates advanced Phase 2 transformations and Vuetify-specific features
 */
export default {
    name: 'ButtonVuetify',
    category: 'form',
    description: 'A Vuetify button component with advanced prop transformations',

    baseComponent: 'Button', // Generic name, will map to VBtn

    props: [
        {
            name: 'label',
            type: 'string',
            required: false,
            default: ''
        },
        {
            name: 'variant',
            type: 'string',
            required: false,
            default: 'elevated',
            options: ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain']
        },
        {
            name: 'size',
            type: 'string',
            required: false,
            default: 'default',
            options: ['x-small', 'small', 'default', 'large', 'x-large']
        },
        {
            name: 'color',
            type: 'string',
            required: false,
            default: 'primary',
            options: ['primary', 'secondary', 'success', 'warning', 'error', 'info']
        },
        {
            name: 'disabled',
            type: 'boolean',
            required: false,
            default: false
        },
        {
            name: 'loading',
            type: 'boolean',
            required: false,
            default: false
        },
        {
            name: 'icon',
            type: 'string',
            required: false
        },
        {
            name: 'iconPosition',
            type: 'string',
            required: false,
            default: 'left',
            options: ['left', 'right']
        },
        {
            name: 'block',
            type: 'boolean',
            required: false,
            default: false
        },
        {
            name: 'rounded',
            type: 'boolean',
            required: false,
            default: false
        }
    ],

    // Advanced Phase 2 prop mappings
    propMappings: [
        {
            type: 'direct',
            source: 'label',
            target: 'text'
        },
        {
            type: 'direct',
            source: 'variant',
            target: 'variant'
        },
        {
            type: 'direct',
            source: 'size',
            target: 'size'
        },
        {
            type: 'direct',
            source: 'color',
            target: 'color'
        },
        {
            type: 'direct',
            source: 'disabled',
            target: 'disabled'
        },
        {
            type: 'direct',
            source: 'loading',
            target: 'loading'
        },
        {
            type: 'direct',
            source: 'block',
            target: 'block'
        },
        {
            type: 'conditional',
            source: 'icon',
            target: 'prependIcon',
            condition: 'iconPosition === "left" && icon',
            fallback: 'undefined'
        },
        {
            type: 'conditional',
            source: 'icon',
            target: 'appendIcon',
            condition: 'iconPosition === "right" && icon',
            fallback: 'undefined'
        },
        {
            type: 'value',
            source: 'rounded',
            target: 'rounded',
            transform: '(val) => val ? "xl" : false'
        }
    ],

    events: [
        {
            name: 'click',
            emit: 'click',
            payload: 'MouseEvent'
        },
        {
            name: 'focus',
            emit: 'focus',
            payload: 'FocusEvent'
        },
        {
            name: 'blur',
            emit: 'blur',
            payload: 'FocusEvent'
        }
    ],

    slots: [
        {
            name: 'default',
            description: 'Button content'
        },
        {
            name: 'prepend',
            description: 'Content before button text'
        },
        {
            name: 'append',
            description: 'Content after button text'
        }
    ],

    // Advanced performance optimizations
    performance: {
        memoize: true,
        lazyLoad: false,
        treeshake: true,
        vuetifyOptimizations: {
            useDirectives: true,
            optimizeClasses: true
        }
    },

    // Vuetify-specific styles
    styles: `
.btn-elevated-primary {
  box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
}

.btn-tonal-secondary {
  background-color: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
}

.v-btn--loading {
  pointer-events: none;
  opacity: 0.6;
}
  `
};
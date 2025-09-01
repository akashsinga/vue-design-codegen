/**
 * Sample Button Component Configuration
 * This demonstrates the zero-overhead design system configuration format
 */
export default {
    // Component metadata
    name: 'Button',
    category: 'form',
    description: 'A versatile button component with multiple variants and states',

    // Base component from UI library
    baseComponent: 'Button',

    // Component props with type safety
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
            default: 'primary',
            options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info']
        },
        {
            name: 'size',
            type: 'string',
            required: false,
            default: 'medium',
            options: ['small', 'medium', 'large']
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
        }
    ],

    // Prop mappings to library-specific props
    propMappings: [
        {
            type: 'direct',
            source: 'label',
            target: 'label'
        },
        {
            type: 'direct',
            source: 'variant',
            target: 'severity' // PrimeVue uses 'severity' instead of 'variant'
        },
        {
            type: 'direct',
            source: 'size',
            target: 'size'
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
            source: 'icon',
            target: 'icon'
        },
        {
            type: 'conditional',
            source: 'iconPosition',
            target: 'iconPos',
            condition: 'iconPosition === "right"',
            fallback: '"left"'
        }
    ],

    // Event definitions
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

    // Slot definitions
    slots: [
        {
            name: 'default',
            description: 'Button content when label prop is not used'
        },
        {
            name: 'icon',
            description: 'Custom icon content'
        }
    ],

    // Performance optimizations
    performance: {
        memoize: true,
        lazyLoad: false,
        treeshake: true
    },

    // Custom styles (optional)
    styles: `
.custom-button {
  transition: all 0.2s ease-in-out;
}

.custom-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
  `
};
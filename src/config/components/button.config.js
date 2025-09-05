/**
 * Button component configuration with embedded validation
 * Demonstrates semantic component definition with library-agnostic props
 */
export default {
    name: 'Button',
    description: 'Interactive button component with multiple variants and states',
    category: 'form',
    version: '1.0.0',

    // Semantic prop definitions with validation
    semanticProps: {
        variant: {
            type: 'enum',
            values: ['primary', 'secondary', 'outline', 'ghost', 'link'],
            default: 'primary',
            description: 'Visual style variant of the button'
        },
        size: {
            type: 'enum',
            values: ['xs', 'sm', 'md', 'lg', 'xl'],
            default: 'md',
            description: 'Size of the button'
        },
        disabled: {
            type: 'boolean',
            default: false,
            description: 'Whether the button is disabled'
        },
        loading: {
            type: 'boolean',
            default: false,
            description: 'Whether the button is in loading state'
        },
        icon: {
            type: 'string',
            required: false,
            description: 'Icon name to display in the button'
        },
        iconPosition: {
            type: 'enum',
            values: ['left', 'right'],
            default: 'left',
            description: 'Position of the icon relative to text'
        },
        fullWidth: {
            type: 'boolean',
            default: false,
            description: 'Whether button should take full width of container'
        },
        href: {
            type: 'string',
            required: false,
            description: 'URL to navigate to (renders as link)'
        },
        target: {
            type: 'enum',
            values: ['_self', '_blank', '_parent', '_top'],
            default: '_self',
            description: 'Link target attribute'
        }
    },

    // Event definitions
    events: {
        click: {
            description: 'Fired when button is clicked',
            parameters: [
                { name: 'event', type: 'MouseEvent' }
            ]
        },
        focus: {
            description: 'Fired when button receives focus',
            parameters: [
                { name: 'event', type: 'FocusEvent' }
            ]
        },
        blur: {
            description: 'Fired when button loses focus',
            parameters: [
                { name: 'event', type: 'FocusEvent' }
            ]
        }
    },

    // Slot definitions
    slots: {
        default: {
            description: 'Button content (text, icons, etc.)',
            required: false
        },
        icon: {
            description: 'Custom icon content',
            required: false
        },
        loading: {
            description: 'Custom loading indicator',
            required: false
        }
    },

    // Component dependencies
    dependencies: [],

    // Required imports for this component
    imports: [
        "import { computed, ref } from 'vue';"
    ],

    // Prop transformations for different libraries
    transformations: {
        variant: {
            type: 'mapping',
            target: 'severity', // PrimeVue uses 'severity'
            mapping: {
                primary: 'primary',
                secondary: 'secondary',
                outline: 'outlined',
                ghost: 'text',
                link: 'link'
            },
            default: 'primary'
        },
        size: {
            type: 'direct',
            target: 'size'
        },
        disabled: {
            type: 'direct',
            target: 'disabled'
        },
        loading: {
            type: 'direct',
            target: 'loading'
        },
        icon: {
            type: 'conditional',
            conditions: [
                {
                    if: { prop: 'iconPosition', value: 'left' },
                    then: { target: 'icon', transform: 'addPrefix', prefix: 'pi pi-' }
                },
                {
                    if: { prop: 'iconPosition', value: 'right' },
                    then: { target: 'iconPos', value: 'right' }
                }
            ]
        },
        fullWidth: {
            type: 'custom',
            transform: (value, allProps, context) => {
                if (value) {
                    return { style: 'width: 100%' };
                }
                return {};
            }
        }
    },

    // Performance optimization hints
    performance: {
        props: {
            optimize: true,
            removeUnused: true
        },
        events: {
            debounce: ['click'],
            debounceMs: 150
        }
    },

    // Examples for documentation
    examples: [
        {
            name: 'Basic Button',
            props: { variant: 'primary' },
            slots: { default: 'Click me' }
        },
        {
            name: 'Button with Icon',
            props: { variant: 'secondary', icon: 'check' },
            slots: { default: 'Save' }
        },
        {
            name: 'Loading Button',
            props: { variant: 'primary', loading: true },
            slots: { default: 'Saving...' }
        }
    ],

    // Embedded validation rules
    validationRules: {
        requiredSlots: ['default'],
        propCombinations: [
            {
                condition: { prop: 'href', exists: true },
                required: [],
                forbidden: ['loading']
            }
        ]
    },

    // Component validation function
    validate(config) {
        // Validate that href and loading are not used together
        if (config.semanticProps.href && config.semanticProps.loading) {
            return 'href and loading props cannot be used together';
        }

        // Validate icon prop format
        if (config.semanticProps.icon && typeof config.semanticProps.icon.default === 'string') {
            const iconName = config.semanticProps.icon.default;
            if (iconName.includes(' ') || iconName.includes('.')) {
                return 'icon prop should be a simple icon name without spaces or dots';
            }
        }

        return true;
    },

    // Required fields for this config
    required: ['name', 'semanticProps'],

    // Constraints for validation
    constraints: [
        (config) => {
            if (!config.semanticProps.variant) {
                return 'variant prop is required for Button component';
            }
            return true;
        },
        (config) => {
            const variantValues = config.semanticProps.variant.values;
            if (!variantValues || !variantValues.includes('primary')) {
                return 'Button component must support primary variant';
            }
            return true;
        }
    ]
};
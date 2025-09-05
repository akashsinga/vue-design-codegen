// src/config/components/button.config.js
export default {
    name: 'Button',
    description: 'A versatile button component with multiple variants and states',
    category: 'input',
    tags: ['form', 'action', 'interactive'],

    // Semantic prop definitions
    props: {
        label: {
            type: 'string',
            description: 'Text content of the button',
            required: false,
            default: undefined
        },
        color: {
            type: 'string',
            description: 'Visual Color',
            required: false,
            default: 'primary'
        },
        variant: {
            type: 'string',
            description: 'Visual style variant of the button',
            required: false,
            default: 'primary',
            enum: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'help', 'contrast'],
            validation: {
                pattern: /^(primary|secondary|success|warning|danger|info|help|contrast)$/
            }
        },
        size: {
            type: 'string',
            description: 'Size of the button',
            required: false,
            default: 'medium',
            enum: ['small', 'medium', 'large'],
            validation: {
                pattern: /^(small|medium|large)$/
            }
        },
        disabled: {
            type: 'boolean',
            description: 'Whether the button is disabled',
            required: false,
            default: false
        },
        loading: {
            type: 'boolean',
            description: 'Whether the button is in loading state',
            required: false,
            default: false
        },
        icon: {
            type: 'string',
            description: 'Icon to display in the button',
            required: false,
            default: undefined
        },
        iconPosition: {
            type: 'string',
            description: 'Position of the icon relative to text',
            required: false,
            default: 'left',
            enum: ['left', 'right', 'top', 'bottom'],
            validation: {
                pattern: /^(left|right|top|bottom)$/
            }
        },
        outlined: {
            type: 'boolean',
            description: 'Whether the button has outlined style',
            required: false,
            default: false
        },
        text: {
            type: 'boolean',
            description: 'Whether the button has text-only style',
            required: false,
            default: false
        },
        rounded: {
            type: 'boolean',
            description: 'Whether the button has rounded corners',
            required: false,
            default: false
        },
        fullWidth: {
            type: 'boolean',
            description: 'Whether the button takes full width of container',
            required: false,
            default: false
        },
        type: {
            type: 'string',
            description: 'HTML button type',
            required: false,
            default: 'button',
            enum: ['button', 'submit', 'reset']
        }
    },

    // Event mappings
    events: {
        click: {
            description: 'Fired when button is clicked',
            parameters: ['event']
        },
        focus: {
            description: 'Fired when button receives focus',
            parameters: ['event']
        },
        blur: {
            description: 'Fired when button loses focus',
            parameters: ['event']
        },
        mouseenter: {
            description: 'Fired when mouse enters button',
            parameters: ['event']
        },
        mouseleave: {
            description: 'Fired when mouse leaves button',
            parameters: ['event']
        }
    },

    // Slot configurations
    slots: {
        default: {
            description: 'Default slot for button content',
            required: false
        },
        icon: {
            description: 'Slot for custom icon content',
            required: false
        },
        loading: {
            description: 'Slot for custom loading indicator',
            required: false
        }
    },

    // Transformation rules for different libraries
    transformation: {
        props: {
            variant: {
                type: 'library-specific',
                rules: {
                    vuetify: {
                        target: 'variant',
                        mapping: {
                            primary: 'elevated',
                            secondary: 'outlined',
                            success: 'elevated',
                            warning: 'elevated',
                            danger: 'elevated',
                            info: 'elevated',
                            help: 'elevated',
                            contrast: 'elevated'
                        }
                    },
                    primevue: {
                        target: 'severity',
                        mapping: {
                            primary: 'primary',
                            secondary: 'secondary',
                            success: 'success',
                            warning: 'warning',
                            danger: 'danger',
                            info: 'info',
                            help: 'help',
                            contrast: 'contrast'
                        }
                    }
                }
            },
            color: {
                type: 'library-specific',
                rules: {
                    vuetify: {
                        target: 'color',
                        mapping: {
                            primary: 'primary',
                            secondary: 'secondary',
                            success: 'success',
                            warning: 'warning',
                            danger: 'error',
                            info: 'info',
                            help: 'primary',
                            contrast: 'surface-variant'
                        }
                    },
                    primevue: {
                        target: 'severity',
                        mapping: {
                            primary: 'primary',
                            secondary: 'secondary',
                            success: 'success',
                            warning: 'warning',
                            danger: 'danger',
                            info: 'info'
                        }
                    }
                }
            },
            iconPosition: {
                type: 'library-specific',
                rules: {
                    vuetify: {
                        transform: (value, props) => {
                            if (value === 'left') {
                                return { prependIcon: props.icon };
                            } else if (value === 'right') {
                                return { appendIcon: props.icon };
                            }
                            return { prependIcon: props.icon };
                        }
                    },
                    primevue: {
                        target: 'iconPos',
                        mapping: {
                            left: 'left',
                            right: 'right',
                            top: 'top',
                            bottom: 'bottom'
                        }
                    }
                }
            }
        },
        events: {
            click: {
                type: 'direct'
            }
        }
    },

    // TypeScript interface definition
    typescript: {
        props: `
interface ButtonProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'help' | 'contrast';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  outlined?: boolean;
  text?: boolean;
  rounded?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}`,
        events: `
interface ButtonEvents {
  click: (event: MouseEvent) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  mouseenter: (event: MouseEvent) => void;
  mouseleave: (event: MouseEvent) => void;
}`,
        slots: `
interface ButtonSlots {
  default?: () => any;
  icon?: () => any;
  loading?: () => any;
}`
    },

    // Performance optimization hints
    performance: {
        renderCost: 'low',
        memoryUsage: 'minimal',
        optimizations: [
            'Use CSS-only hover states when possible',
            'Lazy load icons only when needed',
            'Minimize re-renders on prop changes'
        ]
    },

    // Accessibility features
    accessibility: {
        role: 'button',
        ariaLabel: 'auto',
        keyboardNavigation: true,
        focusIndicator: true,
        screenReaderSupport: true
    },

    // Design tokens used
    designTokens: [
        'color.primary',
        'color.secondary',
        'spacing.sm',
        'spacing.md',
        'spacing.lg',
        'typography.button',
        'border.radius',
        'shadow.sm'
    ],

    // Embedded validation rules
    validation: {
        type: 'object',
        required: ['name', 'props', 'events'],
        schema: {
            name: { type: 'string', required: true },
            props: { type: 'object', required: true },
            events: { type: 'object', required: true },
            variant: {
                type: 'string',
                enum: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'help', 'contrast']
            }
        },
        custom: [
            (config) => {
                if (!config.props.variant) {
                    return 'Button must have variant prop defined';
                }
                return true;
            },
            (config) => {
                if (!config.events.click) {
                    return 'Button must have click event defined';
                }
                return true;
            },
            (config) => {
                // Validate transformation rules
                if (config.transformation && config.transformation.props) {
                    for (const [propName, rule] of Object.entries(config.transformation.props)) {
                        if (!config.props[propName]) {
                            return `Transformation rule defined for non-existent prop: ${propName}`;
                        }
                    }
                }
                return true;
            }
        ]
    },

    // Usage examples
    examples: [
        {
            name: 'Basic Button',
            code: '<Button label="Click Me" @click="handleClick" />'
        },
        {
            name: 'Primary Button with Icon',
            code: '<Button label="Save" variant="primary" icon="pi pi-save" @click="save" />'
        },
        {
            name: 'Loading Button',
            code: '<Button label="Loading..." :loading="isLoading" @click="submit" />'
        },
        {
            name: 'Outlined Secondary Button',
            code: '<Button label="Cancel" variant="secondary" outlined @click="cancel" />'
        }
    ]
};
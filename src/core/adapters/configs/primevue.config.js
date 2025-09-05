/**
 * PrimeVue adapter configuration with embedded validation
 * Maps semantic components to PrimeVue-specific implementations
 */
export default {
    name: 'PrimeVue',
    version: '3.53.1',

    // Component mappings from semantic to PrimeVue components
    componentMappings: {
        Button: {
            component: 'Button',
            import: "import Button from 'primevue/button';",
            props: {
                variant: 'severity',
                size: 'size',
                disabled: 'disabled',
                loading: 'loading',
                icon: 'icon',
                fullWidth: 'class'
            },
            events: {
                click: 'click',
                focus: 'focus',
                blur: 'blur'
            },
            slots: {
                default: 'default',
                icon: 'icon'
            }
        },
        Card: {
            component: 'Card',
            import: "import Card from 'primevue/card';",
            props: {
                title: 'title',
                subtitle: 'subtitle',
                padding: 'class'
            },
            slots: {
                default: 'content',
                header: 'header',
                footer: 'footer',
                title: 'title',
                subtitle: 'subtitle'
            }
        },
        Input: {
            component: 'InputText',
            import: "import InputText from 'primevue/inputtext';",
            props: {
                value: 'modelValue',
                placeholder: 'placeholder',
                disabled: 'disabled',
                readonly: 'readonly',
                size: 'size',
                invalid: 'invalid'
            },
            events: {
                input: 'update:modelValue',
                focus: 'focus',
                blur: 'blur',
                change: 'change'
            }
        },
        Select: {
            component: 'Dropdown',
            import: "import Dropdown from 'primevue/dropdown';",
            props: {
                value: 'modelValue',
                options: 'options',
                placeholder: 'placeholder',
                disabled: 'disabled',
                optionLabel: 'optionLabel',
                optionValue: 'optionValue'
            },
            events: {
                change: 'update:modelValue',
                focus: 'focus',
                blur: 'blur'
            }
        },
        DataTable: {
            component: 'DataTable',
            import: "import DataTable from 'primevue/datatable'; import Column from 'primevue/column';",
            props: {
                data: 'value',
                columns: 'columns',
                loading: 'loading',
                pagination: 'paginator',
                sortable: 'sortMode',
                selectable: 'selectionMode'
            },
            events: {
                rowSelect: 'rowSelect',
                rowUnselect: 'rowUnselect',
                sort: 'sort'
            },
            slots: {
                default: 'default',
                header: 'header',
                footer: 'footer'
            }
        }
    },

    // Prop transformations specific to PrimeVue
    propTransformations: {
        Button: {
            variant: {
                type: 'mapping',
                target: 'severity',
                mapping: {
                    primary: 'primary',
                    secondary: 'secondary',
                    outline: 'outlined',
                    ghost: 'text',
                    link: 'link',
                    danger: 'danger',
                    warning: 'warning',
                    success: 'success',
                    info: 'info'
                },
                default: 'primary'
            },
            size: {
                type: 'mapping',
                target: 'size',
                mapping: {
                    xs: 'small',
                    sm: 'small',
                    md: 'normal',
                    lg: 'large',
                    xl: 'large'
                },
                default: 'normal'
            },
            fullWidth: {
                type: 'custom',
                transform: (value) => {
                    return value ? { class: 'w-full' } : {};
                }
            },
            icon: {
                type: 'custom',
                transform: (value, allProps) => {
                    if (!value) return {};

                    const iconClass = value.startsWith('pi-') ? `pi ${value}` : `pi pi-${value}`;

                    if (allProps.iconPosition === 'right') {
                        return {
                            iconPos: 'right',
                            icon: iconClass
                        };
                    }

                    return { icon: iconClass };
                }
            }
        },
        Card: {
            padding: {
                type: 'mapping',
                target: 'class',
                mapping: {
                    none: 'p-0',
                    sm: 'p-2',
                    md: 'p-4',
                    lg: 'p-6',
                    xl: 'p-8'
                }
            }
        },
        Input: {
            size: {
                type: 'mapping',
                target: 'size',
                mapping: {
                    xs: 'small',
                    sm: 'small',
                    md: 'normal',
                    lg: 'large',
                    xl: 'large'
                }
            },
            error: {
                type: 'direct',
                target: 'invalid'
            }
        }
    },

    // Event mappings for PrimeVue
    eventMappings: {
        Button: {
            click: {
                target: 'click',
                transform: (handler) => handler
            }
        },
        Input: {
            input: {
                target: 'update:modelValue',
                transform: (handler) => (event) => handler(event.target.value)
            }
        },
        Select: {
            change: {
                target: 'update:modelValue',
                transform: (handler) => handler
            }
        }
    },

    // Global imports required for PrimeVue
    imports: [
        {
            from: 'primevue/config',
            import: ['PrimeVue'],
            default: false
        },
        {
            from: 'primeicons/primeicons.css',
            import: [],
            default: false
        },
        {
            from: 'primevue/resources/themes/saga-blue/theme.css',
            import: [],
            default: false
        }
    ],

    // Default PrimeVue configuration
    defaultConfig: {
        ripple: true,
        inputStyle: 'outlined',
        theme: 'saga-blue'
    },

    // Installation options for Vue app
    installOptions: {
        ripple: true
    },

    // Library-specific configuration
    libraryConfig: {
        params: {
            ripple: true,
            inputStyle: 'outlined'
        }
    },

    // Compatibility information
    compatibility: {
        versions: ['3.x'],
        features: [
            'components',
            'theming',
            'icons',
            'ripple-effects',
            'form-validation',
            'data-tables',
            'charts'
        ],
        breakingChanges: [],
        migrationPath: 'https://primevue.org/migration',
        checkVersion: async () => {
            // In a real implementation, this would check the installed PrimeVue version
            return true;
        }
    },

    // Performance optimization hints
    performance: {
        Button: {
            props: {
                optimize: true,
                removeUnused: true,
                mergeStatic: true
            },
            events: {
                debounce: ['click'],
                debounceMs: 150
            },
            imports: {
                optimize: true,
                exclude: []
            }
        },
        DataTable: {
            props: {
                optimize: true,
                removeUnused: false // Keep all props for DataTable
            },
            memory: {
                optimize: true
            }
        }
    },

    // Adapter validation function
    validateAdapter(config) {
        // Check required mappings
        const requiredComponents = ['Button', 'Input', 'Card'];
        for (const component of requiredComponents) {
            if (!config.componentMappings[component]) {
                return `Missing required component mapping: ${component}`;
            }
        }

        // Check import statements
        for (const [componentName, mapping] of Object.entries(config.componentMappings)) {
            if (!mapping.import) {
                return `Missing import statement for component: ${componentName}`;
            }
        }

        return true;
    },

    // Post-processing transformations
    postProcess: [
        // Add PrimeVue-specific optimizations
        (props, context) => {
            // Remove empty class attributes
            if (props.class === '') {
                delete props.class;
            }

            // Optimize icon props
            if (props.icon && props.iconPos) {
                // Combine icon optimizations
                return {
                    ...props,
                    icon: props.icon,
                    iconPos: props.iconPos
                };
            }

            return props;
        }
    ],

    // Required fields for this adapter
    required: ['name', 'version', 'componentMappings', 'propTransformations', 'imports'],

    // Adapter constraints
    constraints: [
        (config) => {
            if (config.version && !config.version.startsWith('3.')) {
                return 'This adapter requires PrimeVue version 3.x';
            }
            return true;
        }
    ]
};
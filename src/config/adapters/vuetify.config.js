// src/config/adapters/configs/vuetify.config.js
export default {
    name: 'vuetify',
    version: '3.7.2',
    displayName: 'Vuetify',
    description: 'Vuetify Material Design Component Framework Adapter',

    // Base imports required for library
    imports: {
        base: [
            "import 'vuetify/styles'",
            "import '@mdi/font/css/materialdesignicons.css'"
        ],
        plugin: "import { createVuetify } from 'vuetify'",
        components: {}
    },

    // Supported versions
    supportedVersions: ['3.x', '3.7.x', '3.7.2'],

    // Component mappings
    components: {
        Button: {
            tag: 'VBtn',
            import: "import { VBtn } from 'vuetify/components'",
            props: {
                label: {
                    name: 'text',
                    type: 'string',
                    transform: {
                        type: 'direct'
                    }
                },
                variant: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'primary': 'elevated',
                            'secondary': 'outlined',
                            'success': 'elevated',
                            'warning': 'elevated',
                            'danger': 'elevated',
                            'info': 'elevated',
                            'help': 'elevated',
                            'contrast': 'elevated'
                        }
                    }
                },
                color: {
                    name: 'color',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'primary': 'primary',
                            'secondary': 'secondary',
                            'success': 'success',
                            'warning': 'warning',
                            'danger': 'error',
                            'info': 'info',
                            'help': 'primary',
                            'contrast': 'surface-variant'
                        }
                    }
                },
                size: {
                    name: 'size',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'small': 'small',
                            'medium': 'default',
                            'large': 'large'
                        }
                    }
                },
                disabled: { name: 'disabled', type: 'boolean' },
                loading: { name: 'loading', type: 'boolean' },
                icon: {
                    name: 'prependIcon',
                    type: 'string',
                    transform: {
                        type: 'function',
                        handler: (value) => value ? `mdi-${value}` : undefined
                    }
                },
                iconPosition: {
                    name: 'iconPos',
                    type: 'string',
                    transform: {
                        type: 'function',
                        handler: (value, context) => {
                            // Vuetify uses prependIcon and appendIcon
                            if (value === 'right') {
                                return { appendIcon: context.icon, prependIcon: undefined };
                            }
                            return { prependIcon: context.icon, appendIcon: undefined };
                        }
                    }
                },
                outlined: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'conditional',
                        condition: (value) => value === true,
                        trueValue: 'outlined',
                        falseValue: 'elevated'
                    }
                },
                text: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'conditional',
                        condition: (value) => value === true,
                        trueValue: 'text',
                        falseValue: 'elevated'
                    }
                },
                rounded: { name: 'rounded', type: 'boolean' },
                block: { name: 'block', type: 'boolean' }
            },
            events: {
                click: { name: 'click' },
                focus: { name: 'focus' },
                blur: { name: 'blur' }
            },
            slots: ['default', 'prepend', 'append'],
            features: ['ripple', 'elevation', 'theme', 'density'],
            dependencies: []
        },

        Card: {
            tag: 'VCard',
            import: "import { VCard, VCardTitle, VCardSubtitle, VCardText, VCardActions } from 'vuetify/components'",
            props: {
                title: {
                    name: 'title',
                    type: 'string',
                    transform: {
                        type: 'slot',
                        slot: 'title'
                    }
                },
                subtitle: {
                    name: 'subtitle',
                    type: 'string',
                    transform: {
                        type: 'slot',
                        slot: 'subtitle'
                    }
                },
                elevation: {
                    name: 'elevation',
                    type: 'number',
                    transform: {
                        type: 'direct'
                    }
                },
                variant: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'elevated': 'elevated',
                            'flat': 'flat',
                            'outlined': 'outlined'
                        }
                    }
                }
            },
            events: {
                click: { name: 'click' }
            },
            slots: ['default', 'title', 'subtitle', 'text', 'actions', 'prepend', 'append'],
            features: ['elevation', 'theme', 'density'],
            dependencies: ['VCardTitle', 'VCardSubtitle', 'VCardText', 'VCardActions']
        },

        InputText: {
            tag: 'VTextField',
            import: "import { VTextField } from 'vuetify/components'",
            props: {
                modelValue: { name: 'modelValue', type: 'string' },
                label: { name: 'label', type: 'string' },
                placeholder: { name: 'placeholder', type: 'string' },
                disabled: { name: 'disabled', type: 'boolean' },
                readonly: { name: 'readonly', type: 'boolean' },
                required: { name: 'required', type: 'boolean' },
                error: { name: 'error', type: 'boolean' },
                errorMessages: { name: 'errorMessages', type: 'array' },
                variant: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'filled': 'filled',
                            'outlined': 'outlined',
                            'underlined': 'underlined',
                            'solo': 'solo'
                        }
                    }
                },
                density: {
                    name: 'density',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'small': 'compact',
                            'medium': 'default',
                            'large': 'comfortable'
                        }
                    }
                },
                clearable: { name: 'clearable', type: 'boolean' },
                prependIcon: { name: 'prependIcon', type: 'string' },
                appendIcon: { name: 'appendIcon', type: 'string' }
            },
            events: {
                'update:modelValue': { name: 'update:modelValue' },
                input: { name: 'input' },
                focus: { name: 'focus' },
                blur: { name: 'blur' },
                keydown: { name: 'keydown' },
                click: { name: 'click' }
            },
            slots: ['prepend', 'append', 'prependInner', 'appendInner', 'label', 'message'],
            features: ['validation', 'icons', 'theme', 'density'],
            dependencies: []
        },

        DataTable: {
            tag: 'VDataTable',
            import: "import { VDataTable } from 'vuetify/components'",
            props: {
                items: { name: 'items', type: 'array' },
                headers: { name: 'headers', type: 'array' },
                search: { name: 'search', type: 'string' },
                sortBy: { name: 'sortBy', type: 'array' },
                itemsPerPage: { name: 'itemsPerPage', type: 'number' },
                page: { name: 'page', type: 'number' },
                loading: { name: 'loading', type: 'boolean' },
                noDataText: { name: 'noDataText', type: 'string' },
                loadingText: { name: 'loadingText', type: 'string' },
                itemValue: { name: 'itemValue', type: 'string' },
                returnObject: { name: 'returnObject', type: 'boolean' },
                showSelect: { name: 'showSelect', type: 'boolean' },
                multiSort: { name: 'multiSort', type: 'boolean' },
                mustSort: { name: 'mustSort', type: 'boolean' },
                density: {
                    name: 'density',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'small': 'compact',
                            'medium': 'default',
                            'large': 'comfortable'
                        }
                    }
                }
            },
            events: {
                'update:page': { name: 'update:page' },
                'update:itemsPerPage': { name: 'update:itemsPerPage' },
                'update:sortBy': { name: 'update:sortBy' },
                'update:options': { name: 'update:options' },
                'click:row': { name: 'click:row' },
                'update:expanded': { name: 'update:expanded' }
            },
            slots: ['top', 'headers', 'item', 'body', 'bottom', 'footer', 'no-data', 'loading'],
            features: ['pagination', 'sorting', 'filtering', 'selection', 'expansion'],
            dependencies: []
        },

        Select: {
            tag: 'VSelect',
            import: "import { VSelect } from 'vuetify/components'",
            props: {
                modelValue: { name: 'modelValue', type: 'any' },
                items: { name: 'items', type: 'array' },
                itemTitle: { name: 'itemTitle', type: 'string' },
                itemValue: { name: 'itemValue', type: 'string' },
                label: { name: 'label', type: 'string' },
                placeholder: { name: 'placeholder', type: 'string' },
                disabled: { name: 'disabled', type: 'boolean' },
                readonly: { name: 'readonly', type: 'boolean' },
                required: { name: 'required', type: 'boolean' },
                error: { name: 'error', type: 'boolean' },
                errorMessages: { name: 'errorMessages', type: 'array' },
                multiple: { name: 'multiple', type: 'boolean' },
                chips: { name: 'chips', type: 'boolean' },
                closableChips: { name: 'closableChips', type: 'boolean' },
                clearable: { name: 'clearable', type: 'boolean' },
                noDataText: { name: 'noDataText', type: 'string' },
                variant: {
                    name: 'variant',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'filled': 'filled',
                            'outlined': 'outlined',
                            'underlined': 'underlined',
                            'solo': 'solo'
                        }
                    }
                },
                density: {
                    name: 'density',
                    type: 'string',
                    transform: {
                        type: 'mapping',
                        map: {
                            'small': 'compact',
                            'medium': 'default',
                            'large': 'comfortable'
                        }
                    }
                }
            },
            events: {
                'update:modelValue': { name: 'update:modelValue' },
                'update:menu': { name: 'update:menu' },
                focus: { name: 'focus' },
                blur: { name: 'blur' }
            },
            slots: ['prepend', 'append', 'prependInner', 'appendInner', 'label', 'selection', 'item', 'chip', 'no-data'],
            features: ['filtering', 'multiple-selection', 'chips', 'validation'],
            dependencies: []
        }
    },

    // Performance optimization hints
    performance: {
        bundleSize: 'large',
        treeShaking: true,
        ssr: true,
        asyncComponents: true,
        lazyLoading: true
    },

    // Build optimization
    optimization: {
        treeshake: {
            components: true,
            styles: true
        },
        chunks: {
            vendor: ['vuetify'],
            common: ['@mdi/font']
        }
    },

    // Theme integration
    theme: {
        system: 'material-design',
        customizable: true,
        presets: ['light', 'dark'],
        defaultPreset: 'light',
        tokens: {
            colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
            typography: 'material-design-typography',
            spacing: 'material-design-spacing'
        }
    },

    // Plugin configuration
    plugin: {
        name: 'Vuetify',
        global: true,
        options: {
            theme: {
                defaultTheme: 'light'
            },
            defaults: {
                VBtn: {
                    variant: 'elevated'
                },
                VTextField: {
                    variant: 'outlined'
                }
            }
        }
    },

    // Compatibility checking
    compatibility: {
        vue: '^3.3.0',
        node: '>=16.0.0',
        check: (version) => {
            const [major, minor] = version.split('.').map(Number);
            if (major < 3) {
                return {
                    compatible: false,
                    reason: 'Vuetify 3.x requires Vue 3.x'
                };
            }
            if (major === 3 && minor < 3) {
                return {
                    compatible: false,
                    reason: 'Vuetify 3.x requires Vue 3.3.0 or higher'
                };
            }
            return { compatible: true };
        }
    },

    // Embedded validation rules
    validation: {
        type: 'object',
        required: ['name', 'version', 'components', 'imports'],
        schema: {
            name: { type: 'string', required: true },
            version: { type: 'string', required: true },
            components: { type: 'object', required: true },
            imports: { type: 'object', required: true }
        },
        versionCheck: true,
        componentIntegrity: true,
        custom: [
            (config) => {
                if (!config.components.Button) {
                    return 'Button component mapping is required';
                }
                return true;
            },
            (config) => {
                if (!config.imports.plugin) {
                    return 'Plugin import is required';
                }
                return true;
            },
            (config) => {
                // Validate Vuetify component naming convention
                for (const [componentName, mapping] of Object.entries(config.components)) {
                    if (!mapping.tag.startsWith('V')) {
                        return `Vuetify component tags must start with 'V': ${mapping.tag}`;
                    }
                }
                return true;
            }
        ]
    }
};
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
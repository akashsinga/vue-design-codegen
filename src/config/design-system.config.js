// src/config/design-system.config.js
export default {
    // System identification
    name: 'Zero-Overhead Design System',
    version: '1.0.0',
    description: 'Configuration-driven Vue.js design system with zero runtime overhead',

    // Target library configuration
    targetLibrary: 'vuetify',
    libraryVersion: '3.6.1',

    // Components to include in the design system
    components: [
        'Button',
    ],

    // Component configuration
    componentPrefix: '', // No prefix by default
    globalComponents: true, // Register components globally
    strictMode: false, // Allow partial failures during development

    // Theme configuration
    theme: {
        name: 'default',
        preset: 'aura', // For PrimeVue
        tokens: {
            // Color tokens
            colors: {
                primary: '#3B82F6',
                secondary: '#6B7280',
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                info: '#06B6D4',
                light: '#F9FAFB',
                dark: '#111827'
            },

            // Typography tokens
            typography: {
                fontFamily: {
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace']
                },
                fontSize: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem',
                    '2xl': '1.5rem',
                    '3xl': '1.875rem'
                },
                fontWeight: {
                    normal: 400,
                    medium: 500,
                    semibold: 600,
                    bold: 700
                }
            },

            // Spacing tokens
            spacing: {
                xs: '0.25rem',
                sm: '0.5rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem',
                '2xl': '3rem'
            },

            // Border radius tokens
            borderRadius: {
                none: '0',
                sm: '0.25rem',
                md: '0.375rem',
                lg: '0.5rem',
                full: '9999px'
            },

            // Shadow tokens
            shadows: {
                sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }
        },

        // Theme customization
        customization: {
            cssVariables: true,
            darkMode: true,
            responsive: true
        }
    },

    // Library-specific configuration
    libraryConfig: {
        // PrimeVue specific options
        primevue: {
            ripple: true,
            inputStyle: 'outlined',
            locale: 'en',
            theme: 'aura-light-green'
        },

        // Vuetify specific options
        vuetify: {
            theme: {
                defaultTheme: 'light',
                themes: {
                    light: {
                        colors: {
                            primary: '#3B82F6',
                            secondary: '#6B7280'
                        }
                    }
                }
            }
        },

        // Quasar specific options
        quasar: {
            brand: {
                primary: '#3B82F6',
                secondary: '#6B7280'
            }
        }
    },

    // Build configuration
    build: {
        // Output formats
        formats: ['esm', 'cjs'],

        // Optimization options
        optimization: {
            treeshake: true,
            minify: true,
            sourcemaps: true,
            cssExtraction: true
        },

        // Bundle splitting
        chunks: {
            vendor: ['vue'],
            library: true,
            components: false // Individual component chunks
        },

        // Output configuration
        output: {
            directory: './dist',
            filename: '[name].[format].js',
            chunkFilename: '[name].[hash].js',
            assetFilename: '[name].[hash].[ext]'
        }
    },

    // Development configuration
    development: {
        // Hot module replacement
        hotReload: true,

        // Component inspector
        inspector: true,

        // Performance monitoring
        performance: true,

        // Source maps
        sourcemaps: true,

        // Validation
        strictValidation: false,

        // Mock data
        mockData: true
    },

    // TypeScript configuration
    typescript: {
        enabled: true,
        strict: true,
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: false
    },

    // Plugin configuration
    plugins: {
        // Vue plugin options
        vue: {
            runtimeCompiler: false,
            optimizeSSR: false
        },

        // Vite plugin options
        vite: {
            define: {
                __DESIGN_SYSTEM_VERSION__: JSON.stringify('1.0.0'),
                __TARGET_LIBRARY__: JSON.stringify('primevue')
            }
        }
    },

    // Testing configuration
    testing: {
        // Unit testing
        unit: {
            framework: 'vitest',
            coverage: true,
            threshold: 80
        },

        // Visual regression testing
        visual: {
            enabled: false,
            threshold: 0.02
        },

        // Accessibility testing
        a11y: {
            enabled: true,
            rules: 'wcag2aa'
        }
    },

    // Documentation configuration
    documentation: {
        // Generate documentation
        generate: true,

        // Documentation format
        format: 'markdown',

        // Include examples
        examples: true,

        // API documentation
        api: true,

        // Playground
        playground: true
    },

    // Performance configuration
    performance: {
        // Bundle size limits
        bundleSize: {
            maxSize: '100kb',
            warn: '80kb'
        },

        // Component size limits
        componentSize: {
            maxSize: '10kb',
            warn: '8kb'
        },

        // Generation time limits
        generationTime: {
            maxTime: 1000, // ms
            warn: 500 // ms
        }
    },

    // Migration configuration
    migration: {
        // Backup original configurations
        backup: true,

        // Validation before migration
        validate: true,

        // Rollback on failure
        rollback: true,

        // Migration reports
        reports: true
    },

    // Validation rules embedded in configuration
    validation: {
        type: 'object',
        required: ['name', 'targetLibrary', 'components'],
        schema: {
            name: {
                type: 'string',
                required: true,
                minLength: 1
            },
            targetLibrary: {
                type: 'string',
                required: true,
                enum: ['primevue', 'vuetify', 'quasar', 'antdv']
            },
            components: {
                type: 'object',
                required: true,
                minItems: 1,
                items: {
                    type: 'string',
                    pattern: /^[A-Z][a-zA-Z0-9]*$/
                }
            },
            theme: {
                type: 'object',
                schema: {
                    tokens: {
                        type: 'object',
                        schema: {
                            colors: { type: 'object' },
                            typography: { type: 'object' },
                            spacing: { type: 'object' }
                        }
                    }
                }
            }
        },
        custom: [
            (config) => {
                // Validate component names
                for (const component of config.components || []) {
                    if (!/^[A-Z][a-zA-Z0-9]*$/.test(component)) {
                        return `Invalid component name: ${component}. Must be PascalCase.`;
                    }
                }
                return true;
            },
            (config) => {
                // Validate library configuration
                if (config.targetLibrary && config.libraryConfig) {
                    if (!config.libraryConfig[config.targetLibrary]) {
                        return `Missing library configuration for ${config.targetLibrary}`;
                    }
                }
                return true;
            },
            (config) => {
                // Validate theme configuration
                if (config.theme && config.theme.tokens) {
                    const requiredTokens = ['colors', 'typography', 'spacing'];
                    for (const token of requiredTokens) {
                        if (!config.theme.tokens[token]) {
                            return `Missing required theme token: ${token}`;
                        }
                    }
                }
                return true;
            }
        ]
    },

    // Feature flags
    features: {
        // Core features
        zeroOverhead: true,
        instantMigration: true,
        configurationDriven: true,
        selfContained: true,

        // Advanced features
        buildTimeOptimization: true,
        runtimeTypeChecking: false,
        componentInheritance: true,
        themeInheritance: true,

        // Experimental features
        codeGeneration: true,
        staticAnalysis: true,
        performanceOptimization: true,
        bundleAnalysis: true
    },

    // Integration configuration
    integrations: {
        // Bundler integrations
        bundlers: {
            vite: true,
            webpack: true,
            rollup: true
        },

        // Framework integrations
        frameworks: {
            nuxt: true,
            vite: true
        },

        // Design tool integrations
        design: {
            figma: false,
            sketch: false,
            adobeXd: false
        },

        // CI/CD integrations
        cicd: {
            github: true,
            gitlab: false,
            jenkins: false
        }
    },

    // Monitoring configuration
    monitoring: {
        // Performance monitoring
        performance: {
            enabled: true,
            metrics: ['bundleSize', 'generationTime', 'componentCount'],
            alerts: {
                bundleSize: '100kb',
                generationTime: '1000ms'
            }
        },

        // Error monitoring
        errors: {
            enabled: true,
            reporting: false,
            threshold: 10
        },

        // Usage analytics
        analytics: {
            enabled: false,
            anonymous: true
        }
    }
};
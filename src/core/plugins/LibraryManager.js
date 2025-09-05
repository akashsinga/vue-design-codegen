// src/core/plugins/LibraryManager.js
import AdapterLoader from '../adapters/AdapterLoader.js';

export class LibraryManager {
    constructor() {
        this.currentLibrary = null;
        this.currentAdapter = null;
        this.libraryPlugin = null;
        this.version = null;
        this.config = null;
    }

    /**
     * Initialize library manager
     */
    async initialize(libraryName, options = {}) {
        const { version, config } = options;

        try {
            // Load adapter for the library
            this.currentAdapter = await AdapterLoader.loadAdapter(libraryName);
            this.currentLibrary = libraryName;
            this.version = version || this.currentAdapter.config.version;
            this.config = config || {};

            // Create library plugin instance
            this.libraryPlugin = await this.createLibraryPlugin(libraryName, this.config);

            console.log(`📚 Library Manager initialized with ${libraryName} v${this.version}`);

        } catch (error) {
            throw new Error(`Failed to initialize library manager: ${error.message}`);
        }
    }

    /**
     * Create library plugin instance
     */
    async createLibraryPlugin(libraryName, config) {
        switch (libraryName) {
            case 'vuetify':
                return await this.createVuetifyPlugin(config);

            case 'primevue':
                return await this.createPrimeVuePlugin(config);

            default:
                throw new Error(`Unsupported library: ${libraryName}`);
        }
    }

    /**
     * Create Vuetify plugin
     */
    async createVuetifyPlugin(config) {
        // Dynamic import for Vuetify
        try {
            const { createVuetify } = await import('vuetify');

            const vuetifyConfig = {
                theme: {
                    defaultTheme: 'light',
                    themes: {
                        light: {
                            colors: {
                                primary: '#3B82F6',
                                secondary: '#6B7280',
                                success: '#10B981',
                                warning: '#F59E0B',
                                error: '#EF4444',
                                info: '#06B6D4'
                            }
                        }
                    }
                },
                defaults: {
                    VBtn: {
                        variant: 'elevated'
                    },
                    VTextField: {
                        variant: 'outlined'
                    }
                },
                ...config
            };

            return createVuetify(vuetifyConfig);

        } catch (error) {
            console.warn('Vuetify not available, creating mock plugin');
            return {
                install: (app) => {
                    console.log('Mock Vuetify plugin installed');
                }
            };
        }
    }

    /**
     * Create PrimeVue plugin
     */
    async createPrimeVuePlugin(config) {
        try {
            const PrimeVue = await import('primevue/config');

            const primeVueConfig = {
                ripple: true,
                inputStyle: 'outlined',
                locale: 'en',
                ...config
            };

            return {
                install: (app) => {
                    app.use(PrimeVue.default, primeVueConfig);
                }
            };

        } catch (error) {
            console.warn('PrimeVue not available, creating mock plugin');
            return {
                install: (app) => {
                    console.log('Mock PrimeVue plugin installed');
                }
            };
        }
    }

    /**
     * Get library plugin for Vue app.use()
     */
    getLibraryPlugin() {
        return this.libraryPlugin;
    }

    /**
     * Get current library name
     */
    getCurrentLibrary() {
        return this.currentLibrary;
    }

    /**
     * Get library version
     */
    getVersion() {
        return this.version;
    }

    /**
     * Get library information
     */
    getLibraryInfo() {
        return {
            name: this.currentLibrary,
            version: this.version,
            adapter: this.currentAdapter?.config,
            config: this.config,
            features: this.getSupportedFeatures()
        };
    }

    /**
     * Get supported features for current library
     */
    getSupportedFeatures() {
        if (!this.currentAdapter) return [];

        const features = [];

        // Check adapter performance features
        const performance = this.currentAdapter.config.performance || {};
        if (performance.treeShaking) features.push('tree-shaking');
        if (performance.ssr) features.push('ssr');
        if (performance.asyncComponents) features.push('async-components');

        // Check theme features
        const theme = this.currentAdapter.config.theme || {};
        if (theme.customizable) features.push('custom-themes');
        if (theme.system === 'css-variables') features.push('css-variables');

        return features;
    }

    /**
     * Check if feature is supported
     */
    isFeatureSupported(feature) {
        return this.getSupportedFeatures().includes(feature);
    }

    /**
     * Migrate to different library
     */
    async migrate(newLibrary, options = {}) {
        const previousLibrary = this.currentLibrary;

        try {
            // Get migration plan
            const migrationResult = await AdapterLoader.migrate(
                this.currentLibrary,
                newLibrary,
                options
            );

            if (!migrationResult.success) {
                throw new Error(`Migration validation failed: ${migrationResult.errors.join(', ')}`);
            }

            // Initialize with new library
            await this.initialize(newLibrary, {
                version: options.version,
                config: options.config
            });

            console.log(`🔄 Library migrated from ${previousLibrary} to ${newLibrary}`);

            return {
                success: true,
                previousLibrary,
                newLibrary,
                warnings: migrationResult.warnings,
                migratedComponents: Object.keys(migrationResult.mappings)
            };

        } catch (error) {
            // Rollback on failure
            if (previousLibrary) {
                await this.initialize(previousLibrary, {
                    version: this.version,
                    config: this.config
                });
            }

            throw new Error(`Migration failed: ${error.message}`);
        }
    }

    /**
     * Validate library configuration
     */
    async validateConfiguration() {
        if (!this.currentAdapter) {
            throw new Error('No adapter loaded');
        }

        // Validate adapter configuration
        const validation = this.currentAdapter.validateConfig();

        // Validate version compatibility
        const compatibility = this.currentAdapter.validateCompatibility(this.version);
        if (!compatibility.compatible) {
            throw new Error(`Version incompatibility: ${compatibility.reason}`);
        }

        return {
            valid: true,
            adapter: validation,
            version: compatibility
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        if (!this.currentAdapter) {
            return { error: 'No adapter loaded' };
        }

        return {
            library: this.currentLibrary,
            version: this.version,
            adapter: this.currentAdapter.getPerformanceMetrics(),
            features: this.getSupportedFeatures(),
            bundleOptimization: this.getBundleOptimization()
        };
    }

    /**
     * Get bundle optimization info
     */
    getBundleOptimization() {
        const optimization = this.currentAdapter?.config?.optimization || {};

        return {
            treeshaking: optimization.treeshake || false,
            chunks: optimization.chunks || {},
            minification: true, // Always enabled in production
            cssExtraction: true
        };
    }

    /**
     * Get import statements for current library
     */
    getImports() {
        if (!this.currentAdapter) return [];

        return this.currentAdapter.getImports();
    }

    /**
     * Get component mapping for current library
     */
    getComponentMapping(componentName) {
        if (!this.currentAdapter) {
            throw new Error('No adapter loaded');
        }

        return this.currentAdapter.getComponentMapping(componentName);
    }

    /**
     * Transform props for current library
     */
    transformProps(componentName, props) {
        if (!this.currentAdapter) {
            throw new Error('No adapter loaded');
        }

        return this.currentAdapter.transformProps(componentName, props);
    }

    /**
     * Check library availability
     */
    async checkAvailability(libraryName) {
        try {
            await AdapterLoader.loadAdapter(libraryName, { validate: true });
            return { available: true };
        } catch (error) {
            return {
                available: false,
                reason: error.message
            };
        }
    }

    /**
     * Get library recommendations
     */
    getRecommendations() {
        const recommendations = {
            vuetify: {
                pros: ['Material Design', 'Comprehensive components', 'Great TypeScript support'],
                cons: ['Large bundle size', 'Opinionated styling'],
                useCases: ['Enterprise apps', 'Material Design requirement', 'Rich data tables']
            },
            primevue: {
                pros: ['Lightweight', 'Multiple themes', 'Flexible styling'],
                cons: ['Smaller community', 'Less comprehensive'],
                useCases: ['Custom designs', 'Performance critical apps', 'Theme flexibility']
            }
        };

        return recommendations;
    }

    /**
     * Cleanup library manager
     */
    cleanup() {
        this.currentLibrary = null;
        this.currentAdapter = null;
        this.libraryPlugin = null;
        this.version = null;
        this.config = null;
    }
}

export default new LibraryManager();
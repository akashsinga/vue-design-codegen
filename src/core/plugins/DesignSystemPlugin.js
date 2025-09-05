// src/core/plugins/DesignSystemPlugin.js
import ComponentRegistry from './ComponentRegistry.js';
import ThemeProvider from './ThemeProvider.js';
import LibraryManager from './LibraryManager.js';
import ConfigurationLoader from '../ConfigurationLoader.js';

export class DesignSystemPlugin {
    constructor() {
        this.componentRegistry = ComponentRegistry;
        this.themeProvider = ThemeProvider;
        this.libraryManager = LibraryManager;
        this.configLoader = ConfigurationLoader;
        this.isInstalled = false;
        this.config = null;
    }

    /**
     * Install plugin - called by app.use()
     */
    install(app, options = {}) {
        if (this.isInstalled) {
            console.warn('Design System Plugin already installed');
            return;
        }

        this.isInstalled = true;

        return this.initializePlugin(app, options);
    }

    /**
     * Initialize plugin with configuration
     */
    async initializePlugin(app, options = {}) {
        try {
            // Load main design system configuration
            await this.loadConfiguration(options);

            // Initialize library manager
            await this.initializeLibraryManager(app);

            // Initialize theme provider
            await this.initializeThemeProvider(app);

            // Register components
            await this.registerComponents(app);

            // Setup development features
            if (this.isDevelopment()) {
                await this.setupDevelopmentFeatures(app);
            }

            // Provide global properties
            this.setupGlobalProperties(app);

            console.log(`✅ Design System Plugin initialized with ${this.config.targetLibrary}`);

        } catch (error) {
            console.error('❌ Failed to initialize Design System Plugin:', error);
            throw error;
        }
    }

    /**
     * Load design system configuration
     */
    async loadConfiguration(options = {}) {
        const configPath = options.configPath || 'design-system.config.js';

        try {
            this.config = await this.configLoader.loadConfig(configPath);

            // Merge with provided options
            this.config = {
                ...this.config,
                ...options,
                // Don't override core config with options
                components: this.config.components,
                theme: { ...this.config.theme, ...options.theme }
            };

            this.validateConfiguration();

        } catch (error) {
            throw new Error(`Failed to load design system configuration: ${error.message}`);
        }
    }

    /**
     * Validate plugin configuration
     */
    validateConfiguration() {
        const requiredFields = ['targetLibrary', 'components'];

        for (const field of requiredFields) {
            if (!this.config[field]) {
                throw new Error(`Design system configuration missing required field: ${field}`);
            }
        }

        // Validate target library
        const supportedLibraries = ['primevue', 'vuetify', 'quasar', 'antdv'];
        if (!supportedLibraries.includes(this.config.targetLibrary)) {
            throw new Error(`Unsupported target library: ${this.config.targetLibrary}`);
        }
    }

    /**
     * Initialize library manager
     */
    async initializeLibraryManager(app) {
        await this.libraryManager.initialize(this.config.targetLibrary, {
            version: this.config.libraryVersion,
            config: this.config.libraryConfig
        });

        // Install underlying library plugin
        const libraryPlugin = this.libraryManager.getLibraryPlugin();
        if (libraryPlugin) {
            app.use(libraryPlugin, this.config.libraryConfig || {});
        }
    }

    /**
     * Initialize theme provider
     */
    async initializeThemeProvider(app) {
        await this.themeProvider.initialize(this.config.theme || {}, {
            targetLibrary: this.config.targetLibrary,
            customTokens: this.config.designTokens
        });

        // Apply theme to app
        this.themeProvider.applyTheme(app);
    }

    /**
     * Register all components
     */
    async registerComponents(app) {
        const componentNames = this.config.components || [];

        for (const componentName of componentNames) {
            try {
                await this.componentRegistry.registerComponent(
                    app,
                    componentName,
                    this.config.targetLibrary,
                    {
                        prefix: this.config.componentPrefix,
                        global: this.config.globalComponents !== false
                    }
                );
            } catch (error) {
                console.warn(`Failed to register component ${componentName}:`, error.message);

                if (this.config.strictMode) {
                    throw error;
                }
            }
        }

        console.log(`📦 Registered ${componentNames.length} components`);
    }

    /**
     * Setup development features
     */
    async setupDevelopmentFeatures(app) {
        // Hot module replacement for configurations
        if (this.config.hotReload !== false) {
            this.setupHotReload();
        }

        // Component inspector
        if (this.config.inspector !== false) {
            this.setupComponentInspector(app);
        }

        // Performance monitoring
        if (this.config.performance !== false) {
            this.setupPerformanceMonitoring(app);
        }
    }

    /**
     * Setup hot reload for development
     */
    setupHotReload() {
        if (typeof window !== 'undefined' && window.__VUE_HMR_RUNTIME__) {
            // Setup file watchers for config changes
            this.watchConfigurationChanges();
        }
    }

    /**
     * Setup component inspector
     */
    setupComponentInspector(app) {
        app.config.globalProperties.$designSystem = {
            getComponentInfo: (componentName) => {
                return this.componentRegistry.getComponentInfo(componentName);
            },
            getThemeInfo: () => {
                return this.themeProvider.getThemeInfo();
            },
            getLibraryInfo: () => {
                return this.libraryManager.getLibraryInfo();
            }
        };
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring(app) {
        const startTime = performance.now();

        app.mixin({
            beforeCreate() {
                if (this.$options.__designSystemComponent) {
                    this._dsCreateTime = performance.now();
                }
            },
            mounted() {
                if (this.$options.__designSystemComponent) {
                    const mountTime = performance.now();
                    const createTime = mountTime - this._dsCreateTime;

                    if (createTime > 10) { // Log if > 10ms
                        console.log(`🐌 Slow component: ${this.$options.name} took ${createTime.toFixed(2)}ms`);
                    }
                }
            }
        });

        const initTime = performance.now() - startTime;
        console.log(`⚡ Design System initialized in ${initTime.toFixed(2)}ms`);
    }

    /**
     * Setup global properties
     */
    setupGlobalProperties(app) {
        app.config.globalProperties.$ds = {
            // Theme utilities
            theme: this.themeProvider.getThemeUtilities(),

            // Component utilities
            component: {
                getInfo: (name) => this.componentRegistry.getComponentInfo(name),
                isRegistered: (name) => this.componentRegistry.isRegistered(name)
            },

            // Library utilities
            library: {
                getName: () => this.config.targetLibrary,
                getVersion: () => this.libraryManager.getVersion(),
                isSupported: (feature) => this.libraryManager.isFeatureSupported(feature)
            },

            // Configuration utilities
            config: {
                get: (path) => this.getConfigValue(path),
                targetLibrary: this.config.targetLibrary
            }
        };

        // Provide reactive configuration
        app.provide('designSystemConfig', this.config);
        app.provide('designSystemTheme', this.themeProvider.getReactiveTheme());
    }

    /**
     * Watch for configuration changes
     */
    watchConfigurationChanges() {
        // This would use chokidar or similar in a real implementation
        console.log('🔥 Hot reload enabled for design system configurations');
    }

    /**
     * Get configuration value by path
     */
    getConfigValue(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }

    /**
     * Check if running in development mode
     */
    isDevelopment() {
        return process.env.NODE_ENV === 'development' ||
            this.config.development === true;
    }

    /**
     * Migrate to different library
     */
    async migrate(newLibrary, options = {}) {
        if (!this.isInstalled) {
            throw new Error('Plugin not installed');
        }

        console.log(`🔄 Migrating from ${this.config.targetLibrary} to ${newLibrary}...`);

        try {
            // Update configuration
            this.config.targetLibrary = newLibrary;

            // Reinitialize library manager
            await this.libraryManager.migrate(newLibrary, options);

            // Update theme for new library
            await this.themeProvider.migrate(newLibrary);

            // Re-register components for new library
            await this.componentRegistry.migrateComponents(newLibrary);

            console.log(`✅ Successfully migrated to ${newLibrary}`);

            return {
                success: true,
                previousLibrary: this.config.targetLibrary,
                newLibrary: newLibrary,
                migratedComponents: this.componentRegistry.getRegisteredComponents()
            };

        } catch (error) {
            console.error(`❌ Migration failed:`, error);
            throw error;
        }
    }

    /**
     * Get plugin information
     */
    getInfo() {
        return {
            version: '1.0.0',
            isInstalled: this.isInstalled,
            targetLibrary: this.config?.targetLibrary,
            registeredComponents: this.componentRegistry.getRegisteredComponents(),
            currentTheme: this.themeProvider.getCurrentTheme(),
            libraryVersion: this.libraryManager.getVersion(),
            performanceMetrics: this.getPerformanceMetrics()
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            componentsCount: this.componentRegistry.getRegisteredComponents().length,
            themeTokensCount: this.themeProvider.getTokenCount(),
            bundleSize: 'calculated at build time',
            initializationTime: this.initializationTime || 0
        };
    }

    /**
     * Cleanup plugin
     */
    cleanup() {
        this.componentRegistry.cleanup();
        this.themeProvider.cleanup();
        this.libraryManager.cleanup();
        this.isInstalled = false;
    }
}

// Create singleton instance
const designSystemPlugin = new DesignSystemPlugin();

// Export as Vue plugin
export default {
    install(app, options = {}) {
        return designSystemPlugin.install(app, options);
    },

    // Export plugin instance for direct access
    instance: designSystemPlugin
};
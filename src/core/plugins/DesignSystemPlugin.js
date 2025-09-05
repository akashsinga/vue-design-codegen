import { ComponentRegistry } from './ComponentRegistry.js';
import { ThemeProvider } from './ThemeProvider.js';
import { LibraryManager } from './LibraryManager.js';

/**
 * Main Vue plugin for design system integration
 * Provides single app.use() registration for complete system integration
 */
export class DesignSystemPlugin {
    constructor(options = {}) {
        this.options = {
            // Default configuration
            library: 'primevue', // Default UI library
            theme: 'light', // Default theme
            components: 'auto', // 'auto', 'all', or array of component names
            typescript: false, // Enable TypeScript support
            development: false, // Development mode features
            performance: {
                cache: true, // Enable component caching
                preload: false, // Preload components
                lazy: true // Enable lazy loading
            },
            ...options
        };

        // Initialize core services
        this.componentRegistry = new ComponentRegistry(this.options);
        this.themeProvider = new ThemeProvider(this.options);
        this.libraryManager = new LibraryManager(this.options);

        // Plugin state
        this.installed = false;
        this.app = null;
        this.registeredComponents = new Map();

        // Development mode features
        if (this.options.development) {
            this.enableDevelopmentFeatures();
        }
    }

    /**
     * Vue plugin install method
     * @param {Object} app - Vue application instance
     * @param {Object} options - Installation options
     */
    install(app, options = {}) {
        if (this.installed) {
            console.warn('DesignSystemPlugin is already installed');
            return;
        }

        // Merge installation options
        Object.assign(this.options, options);

        this.app = app;
        this.installed = true;

        try {
            // Initialize the design system
            this.initializeDesignSystem(app);

            // Provide global properties
            this.provideGlobalProperties(app);

            // Setup component auto-registration
            this.setupComponentRegistration(app);

            // Initialize theme system
            this.initializeThemeSystem(app);

            // Setup library integration
            this.setupLibraryIntegration(app);

            // Development mode setup
            if (this.options.development) {
                this.setupDevelopmentMode(app);
            }

            console.log(`Design System Plugin installed with ${this.options.library} adapter`);
        } catch (error) {
            console.error('Design System Plugin installation failed:', error);
            throw error;
        }
    }

    /**
     * Initialize the core design system
     * @param {Object} app - Vue application instance
     */
    async initializeDesignSystem(app) {
        // Load and set the target library adapter
        await this.libraryManager.setLibrary(this.options.library);

        // Load component configurations
        await this.componentRegistry.loadComponents(this.options.components);

        // Initialize theme system
        if (this.options.theme) {
            await this.themeProvider.setTheme(this.options.theme);
        }

        // Validate configuration
        this.validateConfiguration();
    }

    /**
     * Provide global properties and methods
     * @param {Object} app - Vue application instance
     */
    provideGlobalProperties(app) {
        // Global design system instance
        app.provide('$designSystem', {
            // Theme management
            theme: {
                current: () => this.themeProvider.getCurrentTheme(),
                set: (themeName) => this.themeProvider.setTheme(themeName),
                tokens: () => this.themeProvider.getThemeTokens(),
                switch: (themeName) => this.themeProvider.switchTheme(themeName)
            },

            // Library management
            library: {
                current: () => this.libraryManager.getCurrentLibrary(),
                switch: (libraryName) => this.switchLibrary(libraryName),
                info: () => this.libraryManager.getLibraryInfo()
            },

            // Component management
            components: {
                list: () => this.componentRegistry.getRegisteredComponents(),
                info: (name) => this.componentRegistry.getComponentInfo(name),
                register: (name, config) => this.registerComponent(name, config)
            },

            // System information
            version: this.getVersion(),
            options: this.options
        });

        // Global configuration access
        app.config.globalProperties.$designSystem = app._context.provides.$designSystem;

        // Convenience methods
        app.config.globalProperties.$theme = app._context.provides.$designSystem.theme;
        app.config.globalProperties.$dsComponents = app._context.provides.$designSystem.components;
    }

    /**
     * Setup automatic component registration
     * @param {Object} app - Vue application instance
     */
    async setupComponentRegistration(app) {
        if (this.options.components === 'none') {
            return;
        }

        try {
            let componentsToRegister = [];

            if (this.options.components === 'auto' || this.options.components === 'all') {
                // Register all available components
                componentsToRegister = await this.componentRegistry.getAvailableComponents();
            } else if (Array.isArray(this.options.components)) {
                // Register specified components
                componentsToRegister = this.options.components;
            }

            // Register components with lazy loading if enabled
            for (const componentName of componentsToRegister) {
                await this.registerComponent(app, componentName);
            }

            console.log(`Registered ${componentsToRegister.length} design system components`);
        } catch (error) {
            console.error('Component registration failed:', error);
            throw error;
        }
    }

    /**
     * Initialize theme system
     * @param {Object} app - Vue application instance
     */
    async initializeThemeSystem(app) {
        try {
            // Apply initial theme
            await this.themeProvider.applyTheme();

            // Setup theme switching capabilities
            this.setupThemeSwitching(app);

            // Inject theme CSS if required
            if (this.options.injectThemeCSS !== false) {
                this.themeProvider.injectThemeCSS();
            }
        } catch (error) {
            console.warn('Theme system initialization failed:', error);
        }
    }

    /**
     * Setup library integration
     * @param {Object} app - Vue application instance
     */
    async setupLibraryIntegration(app) {
        try {
            // Initialize the underlying UI library
            await this.libraryManager.initializeLibrary(app);

            // Setup library-specific configurations
            this.libraryManager.configureLibrary(app, this.options);

        } catch (error) {
            console.error('Library integration failed:', error);
            throw error;
        }
    }

    /**
     * Setup development mode features
     * @param {Object} app - Vue application instance
     */
    setupDevelopmentMode(app) {
        // Hot module replacement support
        if (import.meta.hot) {
            this.setupHMR();
        }

        // Development tools integration
        this.setupDevTools(app);

        // Performance monitoring
        this.setupPerformanceMonitoring(app);

        // Debug information
        window.__DESIGN_SYSTEM__ = {
            plugin: this,
            registry: this.componentRegistry,
            theme: this.themeProvider,
            library: this.libraryManager
        };
    }

    /**
     * Register a single component
     * @param {Object} app - Vue application instance
     * @param {string} componentName - Component name to register
     * @returns {Promise<void>}
     */
    async registerComponent(app, componentName) {
        try {
            // Check if already registered
            if (this.registeredComponents.has(componentName)) {
                return;
            }

            // Generate or load component
            const component = await this.componentRegistry.getComponent(componentName);

            if (!component) {
                throw new Error(`Component ${componentName} not found`);
            }

            // Register with Vue
            if (this.options.performance.lazy) {
                // Lazy registration
                app.component(componentName, () => Promise.resolve(component));
            } else {
                // Immediate registration
                app.component(componentName, component);
            }

            this.registeredComponents.set(componentName, component);

            if (this.options.development) {
                console.log(`Registered component: ${componentName}`);
            }
        } catch (error) {
            console.error(`Failed to register component ${componentName}:`, error);
            throw error;
        }
    }

    /**
     * Switch to a different UI library
     * @param {string} libraryName - Target library name
     * @returns {Promise<void>}
     */
    async switchLibrary(libraryName) {
        if (!this.installed) {
            throw new Error('Plugin not installed');
        }

        try {
            // Switch library adapter
            await this.libraryManager.setLibrary(libraryName);

            // Re-register all components with new adapter
            await this.reregisterComponents();

            // Update options
            this.options.library = libraryName;

            console.log(`Switched to ${libraryName} library`);
        } catch (error) {
            console.error(`Failed to switch to ${libraryName}:`, error);
            throw error;
        }
    }

    /**
     * Re-register all components (used after library switch)
     * @returns {Promise<void>}
     */
    async reregisterComponents() {
        const componentNames = Array.from(this.registeredComponents.keys());

        // Clear current registrations
        this.registeredComponents.clear();

        // Re-register with new adapter
        for (const componentName of componentNames) {
            await this.registerComponent(this.app, componentName);
        }
    }

    /**
     * Setup theme switching capabilities
     * @param {Object} app - Vue application instance
     */
    setupThemeSwitching(app) {
        // Watch for theme changes
        this.themeProvider.onThemeChange((newTheme, oldTheme) => {
            // Emit global theme change event
            app.config.globalProperties.$emit?.('theme-changed', {
                newTheme,
                oldTheme,
                tokens: this.themeProvider.getThemeTokens()
            });

            if (this.options.development) {
                console.log(`Theme switched from ${oldTheme} to ${newTheme}`);
            }
        });
    }

    /**
     * Setup Hot Module Replacement
     */
    setupHMR() {
        import.meta.hot.accept(['../adapters/configs/*'], async (modules) => {
            console.log('HMR: Adapter config changed, reloading...');
            await this.libraryManager.reloadAdapter();
            await this.reregisterComponents();
        });

        import.meta.hot.accept(['../../config/components/*'], async (modules) => {
            console.log('HMR: Component config changed, reloading...');
            await this.componentRegistry.reloadComponents();
            await this.reregisterComponents();
        });

        import.meta.hot.accept(['../../config/themes/*'], async (modules) => {
            console.log('HMR: Theme config changed, reloading...');
            await this.themeProvider.reloadTheme();
        });
    }

    /**
     * Setup development tools integration
     * @param {Object} app - Vue application instance
     */
    setupDevTools(app) {
        // Vue DevTools integration
        if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
            window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = app;
        }

        // Custom devtools panel
        if (this.options.development && window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
            this.registerDevToolsPanel();
        }
    }

    /**
     * Register custom DevTools panel
     */
    registerDevToolsPanel() {
        // Implementation would add a custom DevTools panel
        // for design system inspection and debugging
    }

    /**
     * Setup performance monitoring
     * @param {Object} app - Vue application instance
     */
    setupPerformanceMonitoring(app) {
        if (!this.options.development) return;

        const perfTracker = {
            componentLoads: new Map(),
            themeChanges: 0,
            librarySwitch: 0
        };

        // Track component registration performance
        const originalRegister = this.registerComponent.bind(this);
        this.registerComponent = async (app, componentName) => {
            const start = performance.now();
            await originalRegister(app, componentName);
            const end = performance.now();

            perfTracker.componentLoads.set(componentName, end - start);
        };

        // Expose performance data
        window.__DESIGN_SYSTEM_PERF__ = perfTracker;
    }

    /**
     * Enable development features
     */
    enableDevelopmentFeatures() {
        // Enhanced error messages
        this.options.verboseErrors = true;

        // Component debugging
        this.options.debugComponents = true;

        // Performance tracking
        this.options.trackPerformance = true;
    }

    /**
     * Validate plugin configuration
     */
    validateConfiguration() {
        const required = ['library'];

        for (const field of required) {
            if (!this.options[field]) {
                throw new Error(`Required option '${field}' is missing`);
            }
        }

        // Validate library is supported
        const supportedLibraries = this.libraryManager.getSupportedLibraries();
        if (!supportedLibraries.includes(this.options.library)) {
            throw new Error(
                `Unsupported library '${this.options.library}'. ` +
                `Supported: ${supportedLibraries.join(', ')}`
            );
        }
    }

    /**
     * Get plugin version
     * @returns {string} Version string
     */
    getVersion() {
        return '1.0.0'; // Should be loaded from package.json
    }

    /**
     * Get plugin statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            installed: this.installed,
            library: this.options.library,
            theme: this.themeProvider.getCurrentTheme(),
            registeredComponents: this.registeredComponents.size,
            performance: {
                registry: this.componentRegistry.getStats(),
                theme: this.themeProvider.getStats(),
                library: this.libraryManager.getStats()
            }
        };
    }

    /**
     * Cleanup plugin resources
     */
    destroy() {
        if (!this.installed) return;

        // Clear registrations
        this.registeredComponents.clear();

        // Cleanup services
        this.componentRegistry.destroy();
        this.themeProvider.destroy();
        this.libraryManager.destroy();

        // Reset state
        this.installed = false;
        this.app = null;

        // Clean up global references
        if (window.__DESIGN_SYSTEM__) {
            delete window.__DESIGN_SYSTEM__;
        }

        if (window.__DESIGN_SYSTEM_PERF__) {
            delete window.__DESIGN_SYSTEM_PERF__;
        }
    }
}

// Export default plugin instance creator
export function createDesignSystemPlugin(options = {}) {
    return new DesignSystemPlugin(options);
}

// Export Vue plugin factory
export default {
    install(app, options = {}) {
        const plugin = new DesignSystemPlugin(options);
        plugin.install(app, options);
        return plugin;
    }
};
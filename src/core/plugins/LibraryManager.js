import { AdapterLoader } from '../adapters/AdapterLoader.js';

/**
 * Library manager that handles UI library initialization, configuration,
 * and runtime switching with zero dependency management for applications
 */
export class LibraryManager {
    constructor(options = {}) {
        this.options = {
            library: 'primevue',
            autoInstall: true,
            isolateStyles: true,
            treeshaking: true,
            development: false,
            ...options
        };

        // Initialize adapter loader
        this.adapterLoader = new AdapterLoader();

        // Library state
        this.currentLibrary = null;
        this.currentAdapter = null;
        this.libraryInstance = null;
        this.installedLibraries = new Map();

        // Configuration state
        this.libraryConfigs = new Map();
        this.globalConfigs = new Map();

        // Performance tracking
        this.stats = {
            librariesLoaded: 0,
            switches: 0,
            instancesCreated: 0,
            configsApplied: 0
        };

        // Library instances cache
        this.instanceCache = new Map();

        // Import tracking for cleanup
        this.dynamicImports = new Map();

        // Switching state
        this.switching = false;
        this.switchQueue = [];
    }

    /**
     * Initialize the library manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Load all available adapters
            await this.adapterLoader.loadAllAdapters();

            // Set initial library
            await this.setLibrary(this.options.library);

            if (this.options.development) {
                console.log(`Library manager initialized with: ${this.currentLibrary}`);
            }
        } catch (error) {
            throw new Error(`Library manager initialization failed: ${error.message}`);
        }
    }

    /**
     * Set the current UI library
     * @param {string} libraryName - Library name to set
     * @returns {Promise<void>}
     */
    async setLibrary(libraryName) {
        if (this.currentLibrary === libraryName) {
            return;
        }

        try {
            // Load adapter for the library
            const adapter = await this.adapterLoader.loadAdapter(libraryName);
            await this.adapterLoader.setCurrentLibrary(libraryName);

            // Update state
            this.currentLibrary = libraryName;
            this.currentAdapter = adapter;

            // Create library instance if needed
            if (this.options.autoInstall) {
                await this.createLibraryInstance();
            }

            this.stats.librariesLoaded++;

            if (this.options.development) {
                console.log(`Library set to: ${libraryName}`);
            }
        } catch (error) {
            throw new Error(`Failed to set library '${libraryName}': ${error.message}`);
        }
    }

    /**
     * Switch to a different library with proper cleanup
     * @param {string} libraryName - Target library name
     * @param {Object} options - Switch options
     * @returns {Promise<void>}
     */
    async switchLibrary(libraryName, options = {}) {
        if (this.switching) {
            // Queue the switch if already switching
            this.switchQueue.push({ libraryName, options });
            return;
        }

        if (this.currentLibrary === libraryName) {
            return;
        }

        this.switching = true;

        try {
            const switchOptions = {
                cleanup: true,
                preserveConfig: false,
                ...options
            };

            // Cleanup current library if requested
            if (switchOptions.cleanup && this.currentLibrary) {
                await this.cleanupCurrentLibrary();
            }

            // Switch to new library
            await this.setLibrary(libraryName);

            // Apply preserved configuration if available
            if (!switchOptions.preserveConfig && this.globalConfigs.has(libraryName)) {
                await this.applyLibraryConfiguration(this.globalConfigs.get(libraryName));
            }

            this.stats.switches++;

            if (this.options.development) {
                console.log(`Switched library from ${this.currentLibrary} to ${libraryName}`);
            }
        } finally {
            this.switching = false;

            // Process queued switches
            if (this.switchQueue.length > 0) {
                const next = this.switchQueue.shift();
                await this.switchLibrary(next.libraryName, next.options);
            }
        }
    }

    /**
     * Initialize library with Vue app instance
     * @param {Object} app - Vue application instance
     * @returns {Promise<void>}
     */
    async initializeLibrary(app) {
        if (!this.currentAdapter) {
            throw new Error('No adapter loaded');
        }

        try {
            // Create library instance
            const instance = await this.createLibraryInstance();

            // Install library with Vue app
            if (instance && instance.install) {
                app.use(instance, this.getLibraryInstallOptions());
            } else if (instance && typeof instance === 'object') {
                // Handle libraries that export individual components
                await this.installLibraryComponents(app, instance);
            }

            // Store reference to library instance
            this.libraryInstance = instance;
            this.installedLibraries.set(this.currentLibrary, {
                instance,
                app,
                installedAt: new Date().toISOString()
            });

            if (this.options.development) {
                console.log(`Library ${this.currentLibrary} initialized with Vue app`);
            }
        } catch (error) {
            throw new Error(`Library initialization failed: ${error.message}`);
        }
    }

    /**
     * Create library instance based on adapter configuration
     * @returns {Promise<Object>} Library instance
     */
    async createLibraryInstance() {
        if (!this.currentAdapter) {
            throw new Error('No adapter available');
        }

        try {
            // Check cache first
            const cacheKey = `${this.currentLibrary}:${this.currentAdapter.version}`;
            if (this.instanceCache.has(cacheKey)) {
                return this.instanceCache.get(cacheKey);
            }

            // Get library imports from adapter
            const imports = this.currentAdapter.imports || [];
            const libraryConfig = this.currentAdapter.libraryConfig || {};

            // Dynamically import the library
            const instance = await this.dynamicImportLibrary(imports, libraryConfig);

            // Cache the instance
            this.instanceCache.set(cacheKey, instance);
            this.stats.instancesCreated++;

            return instance;
        } catch (error) {
            throw new Error(`Failed to create library instance: ${error.message}`);
        }
    }

    /**
     * Dynamically import library based on import configuration
     * @param {Array} imports - Import configurations
     * @param {Object} libraryConfig - Library configuration
     * @returns {Promise<Object>} Library instance
     */
    async dynamicImportLibrary(imports, libraryConfig) {
        try {
            const importedModules = new Map();

            // Process each import
            for (const importConfig of imports) {
                if (typeof importConfig === 'string') {
                    // Simple import
                    const module = await import(importConfig);
                    importedModules.set('default', module.default || module);
                } else if (typeof importConfig === 'object') {
                    // Complex import configuration
                    const module = await this.processImportConfig(importConfig);
                    importedModules.set(importConfig.name || 'default', module);
                }
            }

            // Track dynamic imports for cleanup
            this.dynamicImports.set(this.currentLibrary, importedModules);

            // Create library instance based on configuration
            return this.createInstanceFromImports(importedModules, libraryConfig);
        } catch (error) {
            throw new Error(`Dynamic import failed: ${error.message}`);
        }
    }

    /**
     * Process complex import configuration
     * @param {Object} importConfig - Import configuration
     * @returns {Promise<*>} Imported module
     */
    async processImportConfig(importConfig) {
        const { from, import: importName, default: isDefault, transform } = importConfig;

        try {
            const module = await import(from);

            let importedValue;
            if (isDefault) {
                importedValue = module.default;
            } else if (importName) {
                if (Array.isArray(importName)) {
                    // Multiple named imports
                    importedValue = {};
                    for (const name of importName) {
                        importedValue[name] = module[name];
                    }
                } else {
                    // Single named import
                    importedValue = module[importName];
                }
            } else {
                // Entire module
                importedValue = module;
            }

            // Apply transformation if specified
            if (transform && typeof transform === 'function') {
                importedValue = transform(importedValue);
            }

            return importedValue;
        } catch (error) {
            throw new Error(`Import failed for ${importConfig.from}: ${error.message}`);
        }
    }

    /**
     * Create library instance from imported modules
     * @param {Map} importedModules - Imported modules map
     * @param {Object} libraryConfig - Library configuration
     * @returns {Object} Library instance
     */
    createInstanceFromImports(importedModules, libraryConfig) {
        const defaultModule = importedModules.get('default');

        // Handle different library structures
        if (defaultModule && typeof defaultModule === 'function') {
            // Library is a function (e.g., createApp plugin)
            return libraryConfig.params ? defaultModule(libraryConfig.params) : defaultModule();
        }

        if (defaultModule && typeof defaultModule === 'object' && defaultModule.install) {
            // Library is a Vue plugin
            return defaultModule;
        }

        if (defaultModule && typeof defaultModule === 'object') {
            // Library exports components/utilities
            return defaultModule;
        }

        // Combine all imported modules
        const combinedInstance = {};
        for (const [name, module] of importedModules) {
            if (name === 'default') {
                Object.assign(combinedInstance, module);
            } else {
                combinedInstance[name] = module;
            }
        }

        return combinedInstance;
    }

    /**
     * Install library components individually
     * @param {Object} app - Vue app instance
     * @param {Object} libraryInstance - Library instance
     * @returns {Promise<void>}
     */
    async installLibraryComponents(app, libraryInstance) {
        const componentMappings = this.currentAdapter.componentMappings || {};

        for (const [semanticName, mapping] of Object.entries(componentMappings)) {
            const libraryComponent = mapping.component;

            if (libraryInstance[libraryComponent]) {
                app.component(libraryComponent, libraryInstance[libraryComponent]);
            }
        }
    }

    /**
     * Configure library with specific options
     * @param {Object} app - Vue app instance
     * @param {Object} options - Configuration options
     * @returns {Promise<void>}
     */
    async configureLibrary(app, options = {}) {
        if (!this.currentAdapter) {
            return;
        }

        try {
            const config = {
                ...this.currentAdapter.defaultConfig,
                ...options.libraryConfig,
                ...options
            };

            // Apply library-specific configuration
            if (this.libraryInstance && this.libraryInstance.config) {
                this.libraryInstance.config(config);
            }

            // Store configuration for future use
            this.libraryConfigs.set(this.currentLibrary, config);
            this.globalConfigs.set(this.currentLibrary, config);

            this.stats.configsApplied++;

            if (this.options.development) {
                console.log(`Library ${this.currentLibrary} configured:`, config);
            }
        } catch (error) {
            console.warn(`Library configuration failed: ${error.message}`);
        }
    }

    /**
     * Apply library configuration
     * @param {Object} config - Configuration to apply
     * @returns {Promise<void>}
     */
    async applyLibraryConfiguration(config) {
        if (this.libraryInstance && this.libraryInstance.config) {
            this.libraryInstance.config(config);
            this.stats.configsApplied++;
        }
    }

    /**
     * Get library installation options
     * @returns {Object} Installation options
     */
    getLibraryInstallOptions() {
        const baseOptions = {
            // Common options across libraries
        };

        if (this.currentAdapter.installOptions) {
            return { ...baseOptions, ...this.currentAdapter.installOptions };
        }

        return baseOptions;
    }

    /**
     * Cleanup current library resources
     * @returns {Promise<void>}
     */
    async cleanupCurrentLibrary() {
        if (!this.currentLibrary) {
            return;
        }

        try {
            // Remove library instance
            if (this.libraryInstance && this.libraryInstance.destroy) {
                this.libraryInstance.destroy();
            }

            // Clear dynamic imports
            this.dynamicImports.delete(this.currentLibrary);

            // Remove from installed libraries
            this.installedLibraries.delete(this.currentLibrary);

            // Clear instance cache for current library
            const cacheKeys = Array.from(this.instanceCache.keys())
                .filter(key => key.startsWith(`${this.currentLibrary}:`));

            for (const key of cacheKeys) {
                this.instanceCache.delete(key);
            }

            if (this.options.development) {
                console.log(`Cleaned up library: ${this.currentLibrary}`);
            }
        } catch (error) {
            console.warn(`Library cleanup failed: ${error.message}`);
        }
    }

    /**
     * Get current library name
     * @returns {string|null} Current library name
     */
    getCurrentLibrary() {
        return this.currentLibrary;
    }

    /**
     * Get current library adapter
     * @returns {Object|null} Current adapter
     */
    getCurrentAdapter() {
        return this.currentAdapter;
    }

    /**
     * Get current library instance
     * @returns {Object|null} Current library instance
     */
    getCurrentInstance() {
        return this.libraryInstance;
    }

    /**
     * Get library information
     * @returns {Object} Library information
     */
    getLibraryInfo() {
        if (!this.currentAdapter) {
            return null;
        }

        return {
            name: this.currentLibrary,
            version: this.currentAdapter.version,
            adapter: this.currentAdapter.name,
            supportedComponents: this.currentAdapter.getSupportedComponents?.() || [],
            configuration: this.libraryConfigs.get(this.currentLibrary) || {},
            instance: !!this.libraryInstance
        };
    }

    /**
     * Get supported libraries
     * @returns {string[]} Supported library names
     */
    getSupportedLibraries() {
        return this.adapterLoader.getLoadedAdapters();
    }

    /**
     * Check if library is supported
     * @param {string} libraryName - Library name to check
     * @returns {boolean} Whether library is supported
     */
    isLibrarySupported(libraryName) {
        return this.adapterLoader.isAdapterLoaded(libraryName);
    }

    /**
     * Check migration compatibility between libraries
     * @param {string} fromLibrary - Source library
     * @param {string} toLibrary - Target library
     * @returns {Object} Migration compatibility info
     */
    checkMigrationCompatibility(fromLibrary, toLibrary) {
        return this.adapterLoader.checkMigrationCompatibility(fromLibrary, toLibrary);
    }

    /**
     * Reload current adapter (for HMR)
     * @returns {Promise<void>}
     */
    async reloadAdapter() {
        if (!this.currentLibrary) {
            return;
        }

        try {
            // Clear adapter cache
            this.adapterLoader.clearAdapters();

            // Reload adapter
            await this.adapterLoader.loadAdapter(this.currentLibrary);
            await this.adapterLoader.setCurrentLibrary(this.currentLibrary);

            // Update current adapter reference
            this.currentAdapter = this.adapterLoader.getCurrentAdapter();

            // Clear instance cache
            this.instanceCache.clear();

            if (this.options.development) {
                console.log(`Adapter reloaded for: ${this.currentLibrary}`);
            }
        } catch (error) {
            console.error('Adapter reload failed:', error);
        }
    }

    /**
     * Get library manager statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            currentLibrary: this.currentLibrary,
            installedLibraries: this.installedLibraries.size,
            cachedInstances: this.instanceCache.size,
            dynamicImports: this.dynamicImports.size,
            supportedLibraries: this.getSupportedLibraries().length
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.instanceCache.clear();
        this.dynamicImports.clear();
        this.libraryConfigs.clear();
    }

    /**
     * Destroy the library manager and cleanup
     */
    destroy() {
        // Cleanup current library
        this.cleanupCurrentLibrary();

        // Clear all caches and state
        this.instanceCache.clear();
        this.dynamicImports.clear();
        this.libraryConfigs.clear();
        this.globalConfigs.clear();
        this.installedLibraries.clear();
        this.switchQueue.length = 0;

        // Cleanup adapter loader
        this.adapterLoader.clearAdapters();

        // Reset state
        this.currentLibrary = null;
        this.currentAdapter = null;
        this.libraryInstance = null;
        this.switching = false;

        // Reset statistics
        this.stats = {
            librariesLoaded: 0,
            switches: 0,
            instancesCreated: 0,
            configsApplied: 0
        };
    }
}
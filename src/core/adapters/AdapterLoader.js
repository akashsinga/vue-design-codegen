// src/core/adapters/AdapterLoader.js
import ConfigurationLoader from '../ConfigurationLoader.js';
import LibraryAdapter from './LibraryAdapter.js';

export class AdapterLoader {
    constructor() {
        this.adapters = new Map();
        this.currentAdapter = null;
        this.configLoader = ConfigurationLoader;
    }

    /**
     * Load adapter configuration and create adapter instance
     */
    async loadAdapter(libraryName, options = {}) {
        const { useCache = true, validate = true } = options;

        if (useCache && this.adapters.has(libraryName)) {
            return this.adapters.get(libraryName);
        }

        const configPath = `adapters/${libraryName}.config.js`;

        try {
            const adapterConfig = await this.configLoader.loadConfig(configPath, { validate });
            const adapter = new LibraryAdapter(libraryName, adapterConfig);

            if (useCache) {
                this.adapters.set(libraryName, adapter);
            }

            return adapter;
        } catch (error) {
            throw new Error(`Failed to load adapter for ${libraryName}: ${error.message}`);
        }
    }

    /**
     * Set current active adapter
     */
    async setCurrentAdapter(libraryName, options = {}) {
        const adapter = await this.loadAdapter(libraryName, options);
        this.currentAdapter = adapter;
        return adapter;
    }

    /**
     * Get current active adapter
     */
    getCurrentAdapter() {
        if (!this.currentAdapter) {
            throw new Error('No adapter is currently set. Call setCurrentAdapter() first.');
        }
        return this.currentAdapter;
    }

    /**
     * Get available adapters
     */
    async getAvailableAdapters() {
        const adapters = ['primevue', 'vuetify', 'quasar', 'antdv'];
        const available = [];

        for (const adapter of adapters) {
            try {
                await this.loadAdapter(adapter, { useCache: false, validate: false });
                available.push(adapter);
            } catch (error) {
                // Adapter not available
            }
        }

        return available;
    }

    /**
     * Validate adapter compatibility
     */
    async validateCompatibility(libraryName, version = 'latest') {
        const adapter = await this.loadAdapter(libraryName);
        return adapter.validateCompatibility(version);
    }

    /**
     * Get adapter mapping for component
     */
    async getComponentMapping(libraryName, componentName) {
        const adapter = await this.loadAdapter(libraryName);
        return adapter.getComponentMapping(componentName);
    }

    /**
     * Transform props using adapter rules
     */
    async transformProps(libraryName, componentName, props) {
        const adapter = await this.loadAdapter(libraryName);
        return adapter.transformProps(componentName, props);
    }

    /**
     * Get import statements for adapter
     */
    async getImports(libraryName) {
        const adapter = await this.loadAdapter(libraryName);
        return adapter.getImports();
    }

    /**
     * Migrate from one adapter to another
     */
    async migrate(fromLibrary, toLibrary, options = {}) {
        const fromAdapter = await this.loadAdapter(fromLibrary);
        const toAdapter = await this.loadAdapter(toLibrary);

        const migrationResult = {
            success: true,
            warnings: [],
            errors: [],
            mappings: {}
        };

        // Get all component mappings from source adapter
        const fromMappings = fromAdapter.getAllMappings();

        for (const [componentName, fromMapping] of Object.entries(fromMappings)) {
            try {
                const toMapping = toAdapter.getComponentMapping(componentName);

                if (!toMapping) {
                    migrationResult.warnings.push(`Component ${componentName} not available in ${toLibrary}`);
                    continue;
                }

                // Compare prop mappings
                const propDifferences = this.comparePropMappings(fromMapping.props, toMapping.props);
                if (propDifferences.length > 0) {
                    migrationResult.warnings.push(`Prop differences in ${componentName}: ${propDifferences.join(', ')}`);
                }

                migrationResult.mappings[componentName] = {
                    from: fromMapping,
                    to: toMapping,
                    differences: propDifferences
                };
            } catch (error) {
                migrationResult.errors.push(`Failed to migrate ${componentName}: ${error.message}`);
                migrationResult.success = false;
            }
        }

        return migrationResult;
    }

    /**
     * Compare prop mappings between adapters
     */
    comparePropMappings(fromProps, toProps) {
        const differences = [];

        for (const propName of Object.keys(fromProps)) {
            if (!toProps[propName]) {
                differences.push(`Missing prop: ${propName}`);
            } else if (fromProps[propName].type !== toProps[propName].type) {
                differences.push(`Type mismatch for ${propName}: ${fromProps[propName].type} vs ${toProps[propName].type}`);
            }
        }

        return differences;
    }

    /**
     * Clear adapter cache
     */
    clearCache(libraryName = null) {
        if (libraryName) {
            this.adapters.delete(libraryName);
        } else {
            this.adapters.clear();
            this.currentAdapter = null;
        }
    }

    /**
     * Get performance metrics for adapter
     */
    async getPerformanceMetrics(libraryName) {
        const adapter = await this.loadAdapter(libraryName);
        return adapter.getPerformanceMetrics();
    }

    /**
     * Hot reload adapter configuration
     */
    async hotReload(libraryName) {
        this.clearCache(libraryName);
        this.configLoader.clearCache(`adapters/configs/${libraryName}.config.js`);
        return await this.loadAdapter(libraryName, { useCache: false });
    }
}

export default new AdapterLoader();
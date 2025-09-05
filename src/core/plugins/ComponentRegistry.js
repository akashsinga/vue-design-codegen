import { ComponentLoader } from '../components/ComponentLoader.js';
import { ComponentGenerator } from '../components/ComponentGenerator.js';
import { AdapterLoader } from '../adapters/AdapterLoader.js';

/**
 * Component registry that manages automatic registration and generation
 * of design system components with caching and lazy loading support
 */
export class ComponentRegistry {
    constructor(options = {}) {
        this.options = {
            cache: true,
            lazy: true,
            preload: false,
            development: false,
            ...options
        };

        // Initialize core services
        this.componentLoader = new ComponentLoader();
        this.componentGenerator = new ComponentGenerator();
        this.adapterLoader = new AdapterLoader();

        // Registry state
        this.registeredComponents = new Map();
        this.componentCache = new Map();
        this.loadingPromises = new Map();
        this.generationStats = {
            loaded: 0,
            generated: 0,
            cached: 0,
            errors: 0
        };

        // Component metadata
        this.componentMetadata = new Map();
        this.dependencyGraph = new Map();

        // Initialization state
        this.initialized = false;
    }

    /**
     * Initialize the component registry
     * @param {Object} adapterLoader - Adapter loader instance
     * @param {Object} themeLoader - Theme loader instance
     * @returns {Promise<void>}
     */
    async initialize(adapterLoader, themeLoader) {
        if (this.initialized) return;

        try {
            // Set dependencies
            this.adapterLoader = adapterLoader;
            this.componentGenerator = new ComponentGenerator(
                adapterLoader,
                this.componentLoader,
                themeLoader
            );

            // Load all component configurations
            await this.loadComponentConfigurations();

            // Build dependency graph
            this.buildDependencyGraph();

            // Preload components if enabled
            if (this.options.preload) {
                await this.preloadComponents();
            }

            this.initialized = true;

            if (this.options.development) {
                console.log(`Component registry initialized with ${this.componentMetadata.size} components`);
            }
        } catch (error) {
            throw new Error(`Component registry initialization failed: ${error.message}`);
        }
    }

    /**
     * Load component configurations from the config directory
     * @returns {Promise<void>}
     */
    async loadComponentConfigurations() {
        try {
            const components = await this.componentLoader.loadAllComponents();

            // Store metadata for each component
            for (const [componentName, config] of components) {
                this.componentMetadata.set(componentName, {
                    name: componentName,
                    config,
                    loaded: true,
                    generated: false,
                    dependencies: this.componentLoader.getComponentDependencies(componentName),
                    category: config.category || 'general',
                    description: config.description || '',
                    version: config.version || '1.0.0'
                });
            }

            this.generationStats.loaded = components.size;
        } catch (error) {
            throw new Error(`Failed to load component configurations: ${error.message}`);
        }
    }

    /**
     * Load specific components by name
     * @param {string|string[]} components - Component name(s) to load
     * @returns {Promise<void>}
     */
    async loadComponents(components) {
        if (!this.initialized) {
            throw new Error('Component registry not initialized');
        }

        const componentNames = Array.isArray(components) ? components : [components];

        if (components === 'auto' || components === 'all') {
            // Load all available components
            return this.loadAllComponents();
        }

        const loadPromises = componentNames.map(name => this.loadComponent(name));
        await Promise.all(loadPromises);
    }

    /**
     * Load all available components
     * @returns {Promise<void>}
     */
    async loadAllComponents() {
        const availableComponents = this.getAvailableComponents();
        await this.loadComponents(availableComponents);
    }

    /**
     * Get a component (generate if not cached)
     * @param {string} componentName - Component name
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Vue component
     */
    async getComponent(componentName, options = {}) {
        try {
            // Check if component exists
            if (!this.componentMetadata.has(componentName)) {
                throw new Error(`Component '${componentName}' not found`);
            }

            // Check cache first
            const cacheKey = this.generateCacheKey(componentName, options);
            if (this.options.cache && this.componentCache.has(cacheKey)) {
                this.generationStats.cached++;
                return this.componentCache.get(cacheKey);
            }

            // Check if already loading
            if (this.loadingPromises.has(cacheKey)) {
                return this.loadingPromises.get(cacheKey);
            }

            // Generate component
            const loadingPromise = this.generateComponent(componentName, options);
            this.loadingPromises.set(cacheKey, loadingPromise);

            try {
                const component = await loadingPromise;

                // Cache the result
                if (this.options.cache) {
                    this.componentCache.set(cacheKey, component);
                }

                // Update metadata
                const metadata = this.componentMetadata.get(componentName);
                metadata.generated = true;

                this.generationStats.generated++;

                return component;
            } finally {
                this.loadingPromises.delete(cacheKey);
            }
        } catch (error) {
            this.generationStats.errors++;
            throw new Error(`Failed to get component '${componentName}': ${error.message}`);
        }
    }

    /**
     * Generate a component using the component generator
     * @param {string} componentName - Component name
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated Vue component
     */
    async generateComponent(componentName, options = {}) {
        try {
            // Generate component code
            const generated = await this.componentGenerator.generateComponent(
                componentName,
                {
                    ...this.options,
                    ...options
                }
            );

            // Convert generated code to Vue component
            const component = await this.createVueComponent(generated);

            // Store generation metadata
            const metadata = this.componentMetadata.get(componentName);
            metadata.lastGenerated = new Date().toISOString();
            metadata.generatedWith = {
                adapter: generated.metadata.adapter,
                version: generated.metadata.version,
                optimizations: generated.metadata.optimizations
            };

            return component;
        } catch (error) {
            throw new Error(`Component generation failed for '${componentName}': ${error.message}`);
        }
    }

    /**
     * Create Vue component from generated code
     * @param {Object} generated - Generated component data
     * @returns {Promise<Object>} Vue component
     */
    async createVueComponent(generated) {
        try {
            // For SFC components, we need to compile the template
            if (generated.code.includes('<template>')) {
                return this.compileSFCComponent(generated);
            }

            // For JSX or render function components
            return this.compileJSComponent(generated);
        } catch (error) {
            throw new Error(`Vue component creation failed: ${error.message}`);
        }
    }

    /**
     * Compile Single File Component
     * @param {Object} generated - Generated component data
     * @returns {Promise<Object>} Compiled Vue component
     */
    async compileSFCComponent(generated) {
        // In a real implementation, this would use @vue/compiler-sfc
        // For now, we'll create a basic component structure

        const componentDefinition = {
            name: generated.componentName,
            template: this.extractTemplate(generated.code),
            props: this.extractProps(generated.code),
            emits: this.extractEmits(generated.code),
            setup(props, { emit }) {
                // Extract setup logic from generated code
                return this.extractSetupLogic(generated.code, props, emit);
            }
        };

        // Add component metadata
        componentDefinition.__designSystem = {
            semanticName: generated.semanticName,
            libraryComponent: generated.libraryComponent,
            adapter: generated.metadata.adapter,
            dependencies: generated.dependencies,
            performanceHints: generated.performanceHints
        };

        return componentDefinition;
    }

    /**
     * Compile JavaScript component
     * @param {Object} generated - Generated component data
     * @returns {Promise<Object>} Compiled Vue component
     */
    async compileJSComponent(generated) {
        // Create component from JSX or render function
        const componentDefinition = {
            name: generated.componentName,
            render() {
                // Execute the generated render function
                return this.executeGeneratedRender(generated.code);
            }
        };

        componentDefinition.__designSystem = {
            semanticName: generated.semanticName,
            libraryComponent: generated.libraryComponent,
            adapter: generated.metadata.adapter,
            dependencies: generated.dependencies,
            performanceHints: generated.performanceHints
        };

        return componentDefinition;
    }

    /**
     * Extract template from SFC code
     * @param {string} code - SFC code
     * @returns {string} Template content
     */
    extractTemplate(code) {
        const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
        return templateMatch ? templateMatch[1].trim() : '';
    }

    /**
     * Extract props from SFC code
     * @param {string} code - SFC code
     * @returns {Array|Object} Props definition
     */
    extractProps(code) {
        const propsMatch = code.match(/defineProps\(\[(.*?)\]\)/);
        if (propsMatch) {
            return propsMatch[1].split(',').map(prop => prop.trim().replace(/['"]/g, ''));
        }
        return [];
    }

    /**
     * Extract emits from SFC code
     * @param {string} code - SFC code
     * @returns {Array} Emits definition
     */
    extractEmits(code) {
        const emitsMatch = code.match(/defineEmits\(\[(.*?)\]\)/);
        if (emitsMatch) {
            return emitsMatch[1].split(',').map(emit => emit.trim().replace(/['"]/g, ''));
        }
        return [];
    }

    /**
     * Extract setup logic from SFC code
     * @param {string} code - SFC code
     * @param {Object} props - Component props
     * @param {Function} emit - Emit function
     * @returns {Object} Setup return object
     */
    extractSetupLogic(code, props, emit) {
        // Basic setup logic extraction
        // In a real implementation, this would be more sophisticated
        return {
            props,
            emit
        };
    }

    /**
     * Execute generated render function
     * @param {string} code - Generated code
     * @returns {*} Render result
     */
    executeGeneratedRender(code) {
        // Execute the generated render function
        // This would need proper sandboxing in production
        try {
            const renderFunction = new Function('h', 'props', 'emit', code);
            return renderFunction(this.$createElement || h, this.$props, this.$emit);
        } catch (error) {
            console.error('Render function execution failed:', error);
            return null;
        }
    }

    /**
     * Build dependency graph for components
     */
    buildDependencyGraph() {
        for (const [componentName, metadata] of this.componentMetadata) {
            const dependencies = metadata.dependencies || [];
            this.dependencyGraph.set(componentName, dependencies);
        }
    }

    /**
     * Preload components for performance
     * @returns {Promise<void>}
     */
    async preloadComponents() {
        const componentsToPreload = Array.from(this.componentMetadata.keys());

        // Preload in dependency order
        const sortedComponents = this.topologicalSort(componentsToPreload);

        const preloadPromises = sortedComponents.map(componentName =>
            this.getComponent(componentName).catch(error => {
                console.warn(`Preload failed for ${componentName}:`, error.message);
            })
        );

        await Promise.all(preloadPromises);

        if (this.options.development) {
            console.log(`Preloaded ${sortedComponents.length} components`);
        }
    }

    /**
     * Topological sort for dependency resolution
     * @param {string[]} components - Component names
     * @returns {string[]} Sorted component names
     */
    topologicalSort(components) {
        const visited = new Set();
        const visiting = new Set();
        const result = [];

        const visit = (componentName) => {
            if (visiting.has(componentName)) {
                throw new Error(`Circular dependency detected: ${componentName}`);
            }

            if (visited.has(componentName)) {
                return;
            }

            visiting.add(componentName);

            const dependencies = this.dependencyGraph.get(componentName) || [];
            for (const dep of dependencies) {
                if (components.includes(dep)) {
                    visit(dep);
                }
            }

            visiting.delete(componentName);
            visited.add(componentName);
            result.push(componentName);
        };

        for (const component of components) {
            visit(component);
        }

        return result;
    }

    /**
     * Register a component with Vue
     * @param {Object} app - Vue app instance
     * @param {string} componentName - Component name
     * @returns {Promise<void>}
     */
    async registerWithVue(app, componentName) {
        try {
            const component = await this.getComponent(componentName);

            if (this.options.lazy) {
                // Lazy registration
                app.component(componentName, () => Promise.resolve(component));
            } else {
                // Immediate registration
                app.component(componentName, component);
            }

            this.registeredComponents.set(componentName, true);

            if (this.options.development) {
                console.log(`Registered component: ${componentName}`);
            }
        } catch (error) {
            console.error(`Registration failed for ${componentName}:`, error);
            throw error;
        }
    }

    /**
     * Get available component names
     * @returns {string[]} Available component names
     */
    getAvailableComponents() {
        return Array.from(this.componentMetadata.keys());
    }

    /**
     * Get registered component names
     * @returns {string[]} Registered component names
     */
    getRegisteredComponents() {
        return Array.from(this.registeredComponents.keys());
    }

    /**
     * Get component metadata
     * @param {string} componentName - Component name
     * @returns {Object|null} Component metadata
     */
    getComponentInfo(componentName) {
        return this.componentMetadata.get(componentName) || null;
    }

    /**
     * Check if component is registered
     * @param {string} componentName - Component name
     * @returns {boolean} Whether component is registered
     */
    isRegistered(componentName) {
        return this.registeredComponents.has(componentName);
    }

    /**
     * Check if component is available
     * @param {string} componentName - Component name
     * @returns {boolean} Whether component is available
     */
    isAvailable(componentName) {
        return this.componentMetadata.has(componentName);
    }

    /**
     * Get components by category
     * @param {string} category - Component category
     * @returns {string[]} Component names in category
     */
    getComponentsByCategory(category) {
        const components = [];

        for (const [name, metadata] of this.componentMetadata) {
            if (metadata.category === category) {
                components.push(name);
            }
        }

        return components;
    }

    /**
     * Get all component categories
     * @returns {string[]} Available categories
     */
    getCategories() {
        const categories = new Set();

        for (const metadata of this.componentMetadata.values()) {
            categories.add(metadata.category);
        }

        return Array.from(categories);
    }

    /**
     * Reload components (for HMR)
     * @returns {Promise<void>}
     */
    async reloadComponents() {
        // Clear caches
        this.componentCache.clear();
        this.loadingPromises.clear();

        // Reload configurations
        await this.loadComponentConfigurations();
        this.buildDependencyGraph();

        if (this.options.development) {
            console.log('Components reloaded');
        }
    }

    /**
     * Generate cache key for component
     * @param {string} componentName - Component name
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(componentName, options) {
        const adapter = this.adapterLoader.getCurrentAdapter();
        const adapterInfo = adapter ? `${adapter.name}:${adapter.version}` : 'no-adapter';
        const optionsHash = JSON.stringify(options);
        return `${componentName}:${adapterInfo}:${optionsHash}`;
    }

    /**
     * Get registry statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.generationStats,
            available: this.componentMetadata.size,
            registered: this.registeredComponents.size,
            cached: this.componentCache.size,
            loading: this.loadingPromises.size
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.componentCache.clear();
        this.loadingPromises.clear();
        this.componentGenerator.clearCache();
    }

    /**
     * Destroy the registry and cleanup resources
     */
    destroy() {
        // Clear all caches and maps
        this.registeredComponents.clear();
        this.componentCache.clear();
        this.loadingPromises.clear();
        this.componentMetadata.clear();
        this.dependencyGraph.clear();

        // Cleanup services
        this.componentLoader.clearComponents();
        this.componentGenerator.clearCache();

        // Reset state
        this.initialized = false;
        this.generationStats = {
            loaded: 0,
            generated: 0,
            cached: 0,
            errors: 0
        };
    }
}
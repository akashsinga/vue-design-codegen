import { ConfigurationLoader } from '../ConfigurationLoader.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Dynamic component loader that manages component configurations
 * with inheritance, validation, and dependency resolution
 */
export class ComponentLoader {
    constructor() {
        this.configLoader = new ConfigurationLoader();
        this.components = new Map();
        this.dependencyGraph = new Map();
        this.inheritanceChain = new Map();
        this.validationRules = new Map();
    }

    /**
     * Load a single component configuration with validation
     * @param {string} componentName - Name of the component to load
     * @param {string} configsPath - Path to component configurations directory
     * @returns {Promise<Object>} Loaded component configuration
     */
    async loadComponent(componentName, configsPath = 'src/config/components') {
        try {
            const componentConfigPath = path.join(configsPath, `${componentName}.config.js`);

            // Check if component config exists
            if (!await fs.pathExists(componentConfigPath)) {
                throw new Error(`Component configuration not found: ${componentName}`);
            }

            // Load component configuration with validation
            const componentConfig = await this.configLoader.loadConfig(componentConfigPath);

            // Process inheritance if specified
            const processedConfig = await this.processInheritance(componentConfig, configsPath);

            // Validate component configuration
            await this.validateComponentConfig(processedConfig, componentName);

            // Process dependencies
            await this.processDependencies(processedConfig, componentName, configsPath);

            // Cache the component
            this.components.set(componentName, processedConfig);

            return processedConfig;
        } catch (error) {
            throw new Error(`Failed to load component ${componentName}: ${error.message}`);
        }
    }

    /**
     * Load multiple component configurations
     * @param {string[]} componentNames - Array of component names to load
     * @param {string} configsPath - Path to component configurations directory
     * @returns {Promise<Map>} Map of component names to configurations
     */
    async loadComponents(componentNames, configsPath = 'src/config/components') {
        const loadPromises = componentNames.map(name =>
            this.loadComponent(name, configsPath)
        );

        await Promise.all(loadPromises);

        // Resolve dependencies after all components are loaded
        await this.resolveDependencies();

        return this.components;
    }

    /**
     * Load all components from the configurations directory
     * @param {string} configsPath - Path to component configurations directory
     * @returns {Promise<Map>} Map of all loaded components
     */
    async loadAllComponents(configsPath = 'src/config/components') {
        try {
            const configFiles = await fs.readdir(configsPath);
            const componentFiles = configFiles.filter(file =>
                file.endsWith('.config.js') && !file.startsWith('.')
            );

            const componentNames = componentFiles.map(file =>
                path.basename(file, '.config.js')
            );

            return await this.loadComponents(componentNames, configsPath);
        } catch (error) {
            throw new Error(`Failed to load all components: ${error.message}`);
        }
    }

    /**
     * Process component inheritance hierarchy
     * @param {Object} componentConfig - Component configuration
     * @param {string} configsPath - Path to configurations directory
     * @returns {Promise<Object>} Processed configuration with inheritance applied
     */
    async processInheritance(componentConfig, configsPath) {
        if (!componentConfig.extends) {
            return componentConfig;
        }

        const parentName = componentConfig.extends;
        const inheritanceKey = `${componentConfig.name || 'unknown'}_${parentName}`;

        // Check for circular inheritance
        if (this.inheritanceChain.has(inheritanceKey)) {
            throw new Error(`Circular inheritance detected: ${inheritanceKey}`);
        }

        this.inheritanceChain.set(inheritanceKey, true);

        try {
            // Load parent configuration
            const parentConfig = await this.loadComponent(parentName, configsPath);

            // Merge configurations with child overriding parent
            const mergedConfig = this.mergeConfigurations(parentConfig, componentConfig);

            this.inheritanceChain.delete(inheritanceKey);
            return mergedConfig;
        } catch (error) {
            this.inheritanceChain.delete(inheritanceKey);
            throw new Error(`Failed to process inheritance from ${parentName}: ${error.message}`);
        }
    }

    /**
     * Merge parent and child configurations with proper override logic
     * @param {Object} parentConfig - Parent component configuration
     * @param {Object} childConfig - Child component configuration
     * @returns {Object} Merged configuration
     */
    mergeConfigurations(parentConfig, childConfig) {
        const merged = { ...parentConfig };

        // Merge semantic props
        if (childConfig.semanticProps) {
            merged.semanticProps = {
                ...merged.semanticProps,
                ...childConfig.semanticProps
            };
        }

        // Merge transformations
        if (childConfig.transformations) {
            merged.transformations = {
                ...merged.transformations,
                ...childConfig.transformations
            };
        }

        // Merge events
        if (childConfig.events) {
            merged.events = {
                ...merged.events,
                ...childConfig.events
            };
        }

        // Merge slots
        if (childConfig.slots) {
            merged.slots = {
                ...merged.slots,
                ...childConfig.slots
            };
        }

        // Override other properties
        const overrideFields = [
            'name', 'description', 'category', 'version',
            'performance', 'examples', 'documentation'
        ];

        for (const field of overrideFields) {
            if (childConfig[field] !== undefined) {
                merged[field] = childConfig[field];
            }
        }

        // Combine dependencies
        if (childConfig.dependencies) {
            merged.dependencies = [
                ...(merged.dependencies || []),
                ...childConfig.dependencies
            ].filter((dep, index, arr) => arr.indexOf(dep) === index); // Remove duplicates
        }

        return merged;
    }

    /**
     * Process component dependencies
     * @param {Object} componentConfig - Component configuration
     * @param {string} componentName - Component name
     * @param {string} configsPath - Path to configurations directory
     * @returns {Promise<void>}
     */
    async processDependencies(componentConfig, componentName, configsPath) {
        if (!componentConfig.dependencies || !Array.isArray(componentConfig.dependencies)) {
            return;
        }

        const dependencies = [];

        for (const depName of componentConfig.dependencies) {
            // Load dependency if not already loaded
            if (!this.components.has(depName)) {
                await this.loadComponent(depName, configsPath);
            }

            dependencies.push(depName);
        }

        this.dependencyGraph.set(componentName, dependencies);
    }

    /**
     * Resolve all component dependencies and detect circular dependencies
     * @returns {Promise<void>}
     */
    async resolveDependencies() {
        const visited = new Set();
        const visiting = new Set();

        const visit = (componentName) => {
            if (visiting.has(componentName)) {
                throw new Error(`Circular dependency detected involving: ${componentName}`);
            }

            if (visited.has(componentName)) {
                return;
            }

            visiting.add(componentName);

            const dependencies = this.dependencyGraph.get(componentName) || [];
            for (const depName of dependencies) {
                visit(depName);
            }

            visiting.delete(componentName);
            visited.add(componentName);
        };

        // Visit all components to check for circular dependencies
        for (const componentName of this.components.keys()) {
            visit(componentName);
        }
    }

    /**
     * Validate component configuration using embedded validation rules
     * @param {Object} componentConfig - Component configuration to validate
     * @param {string} componentName - Component name for error reporting
     * @returns {Promise<void>}
     */
    async validateComponentConfig(componentConfig, componentName) {
        // Required component fields
        const requiredFields = ['name', 'semanticProps'];

        for (const field of requiredFields) {
            if (!(field in componentConfig)) {
                throw new Error(`Required field '${field}' missing in component ${componentName}`);
            }
        }

        // Validate semantic props structure
        if (!componentConfig.semanticProps || typeof componentConfig.semanticProps !== 'object') {
            throw new Error(`Invalid semanticProps in component ${componentName}`);
        }

        // Validate each semantic prop
        for (const [propName, propConfig] of Object.entries(componentConfig.semanticProps)) {
            await this.validateSemanticProp(propName, propConfig, componentName);
        }

        // Validate transformations if present
        if (componentConfig.transformations) {
            await this.validateTransformations(componentConfig.transformations, componentName);
        }

        // Run component-specific validation if provided
        if (componentConfig.validate && typeof componentConfig.validate === 'function') {
            const validationResult = await componentConfig.validate(componentConfig);
            if (validationResult !== true) {
                throw new Error(`Component validation failed for ${componentName}: ${validationResult}`);
            }
        }

        // Store validation rules for runtime use
        if (componentConfig.validationRules) {
            this.validationRules.set(componentName, componentConfig.validationRules);
        }
    }

    /**
     * Validate a semantic prop configuration
     * @param {string} propName - Prop name
     * @param {Object} propConfig - Prop configuration
     * @param {string} componentName - Component name for error reporting
     * @returns {Promise<void>}
     */
    async validateSemanticProp(propName, propConfig, componentName) {
        if (typeof propConfig !== 'object') {
            throw new Error(`Invalid prop configuration for ${propName} in ${componentName}`);
        }

        // Check required prop fields
        if (!propConfig.type) {
            throw new Error(`Prop type missing for ${propName} in ${componentName}`);
        }

        // Validate prop type
        const validTypes = [
            'string', 'number', 'boolean', 'object', 'array',
            'function', 'date', 'enum', 'union', 'any'
        ];

        if (!validTypes.includes(propConfig.type)) {
            throw new Error(`Invalid prop type '${propConfig.type}' for ${propName} in ${componentName}`);
        }

        // Validate enum values if type is enum
        if (propConfig.type === 'enum' && !Array.isArray(propConfig.values)) {
            throw new Error(`Enum values missing for ${propName} in ${componentName}`);
        }

        // Validate union types if type is union
        if (propConfig.type === 'union' && !Array.isArray(propConfig.types)) {
            throw new Error(`Union types missing for ${propName} in ${componentName}`);
        }
    }

    /**
     * Validate transformation configurations
     * @param {Object} transformations - Transformations object
     * @param {string} componentName - Component name for error reporting
     * @returns {Promise<void>}
     */
    async validateTransformations(transformations, componentName) {
        for (const [propName, transformation] of Object.entries(transformations)) {
            if (!transformation.type) {
                throw new Error(`Transformation type missing for ${propName} in ${componentName}`);
            }

            const validTypes = [
                'direct', 'conditional', 'mapping', 'computed', 'multi-prop', 'custom'
            ];

            if (!validTypes.includes(transformation.type)) {
                throw new Error(`Invalid transformation type '${transformation.type}' for ${propName} in ${componentName}`);
            }
        }
    }

    /**
     * Get component configuration by name
     * @param {string} componentName - Component name
     * @returns {Object|null} Component configuration or null if not loaded
     */
    getComponent(componentName) {
        return this.components.get(componentName) || null;
    }

    /**
     * Check if a component is loaded
     * @param {string} componentName - Component name to check
     * @returns {boolean} Whether the component is loaded
     */
    isComponentLoaded(componentName) {
        return this.components.has(componentName);
    }

    /**
     * Get all loaded component names
     * @returns {string[]} Array of loaded component names
     */
    getLoadedComponents() {
        return Array.from(this.components.keys());
    }

    /**
     * Get component dependencies
     * @param {string} componentName - Component name
     * @returns {string[]} Array of dependency names
     */
    getComponentDependencies(componentName) {
        return this.dependencyGraph.get(componentName) || [];
    }

    /**
     * Get components that depend on a specific component
     * @param {string} componentName - Component name
     * @returns {string[]} Array of dependent component names
     */
    getComponentDependents(componentName) {
        const dependents = [];

        for (const [compName, dependencies] of this.dependencyGraph) {
            if (dependencies.includes(componentName)) {
                dependents.push(compName);
            }
        }

        return dependents;
    }

    /**
     * Get validation rules for a component
     * @param {string} componentName - Component name
     * @returns {Object|null} Validation rules or null if none exist
     */
    getValidationRules(componentName) {
        return this.validationRules.get(componentName) || null;
    }

    /**
     * Enable hot reloading for component configurations
     * @param {string} configsPath - Path to component configurations
     * @param {Function} onChange - Callback when component changes
     */
    enableHotReload(configsPath = 'src/config/components', onChange) {
        this.configLoader.enableHotReload(
            [path.join(configsPath, '*.config.js')],
            async (changedPath, newConfig) => {
                const componentName = path.basename(changedPath, '.config.js');

                try {
                    // Process inheritance and validation
                    const processedConfig = await this.processInheritance(newConfig, configsPath);
                    await this.validateComponentConfig(processedConfig, componentName);

                    // Update component cache
                    this.components.set(componentName, processedConfig);

                    // Update validation rules
                    if (processedConfig.validationRules) {
                        this.validationRules.set(componentName, processedConfig.validationRules);
                    }

                    // Notify callback
                    if (onChange) {
                        onChange(componentName, processedConfig);
                    }
                } catch (error) {
                    console.error(`Hot reload failed for component ${componentName}:`, error.message);
                }
            }
        );
    }

    /**
     * Clear all loaded components and reset state
     */
    clearComponents() {
        this.components.clear();
        this.dependencyGraph.clear();
        this.inheritanceChain.clear();
        this.validationRules.clear();
        this.configLoader.clearCache();
    }
}
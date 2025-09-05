// src/core/components/ComponentLoader.js
import ConfigurationLoader from '../ConfigurationLoader.js';

export class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.dependencies = new Map();
        this.configLoader = ConfigurationLoader;
        this.inheritanceCache = new Map();
    }

    /**
     * Load component configuration
     */
    async loadComponent(componentName, options = {}) {
        const { useCache = true, validate = true } = options;

        if (useCache && this.components.has(componentName)) {
            return this.components.get(componentName);
        }

        const configPath = `components/${componentName.toLowerCase()}.config.js`;

        try {
            const componentConfig = await this.configLoader.loadConfig(configPath, { validate });

            // Process inheritance if defined
            if (componentConfig.extends) {
                componentConfig.resolved = await this.resolveInheritance(componentConfig);
            } else {
                componentConfig.resolved = componentConfig;
            }

            // Process dependencies
            if (componentConfig.dependencies) {
                await this.loadDependencies(componentName, componentConfig.dependencies);
            }

            if (useCache) {
                this.components.set(componentName, componentConfig);
            }

            return componentConfig;
        } catch (error) {
            throw new Error(`Failed to load component ${componentName}: ${error.message}`);
        }
    }

    /**
     * Load multiple components
     */
    async loadComponents(componentNames, options = {}) {
        const components = {};

        for (const name of componentNames) {
            components[name] = await this.loadComponent(name, options);
        }

        return components;
    }

    /**
     * Resolve component inheritance
     */
    async resolveInheritance(componentConfig) {
        const cacheKey = JSON.stringify(componentConfig);

        if (this.inheritanceCache.has(cacheKey)) {
            return this.inheritanceCache.get(cacheKey);
        }

        if (!componentConfig.extends) {
            this.inheritanceCache.set(cacheKey, componentConfig);
            return componentConfig;
        }

        const parentConfig = await this.loadComponent(componentConfig.extends, { useCache: true });
        const resolvedParent = await this.resolveInheritance(parentConfig);

        const resolved = this.mergeConfigurations(resolvedParent.resolved || resolvedParent, componentConfig);

        this.inheritanceCache.set(cacheKey, resolved);
        return resolved;
    }

    /**
     * Merge parent and child configurations
     */
    mergeConfigurations(parent, child) {
        const merged = JSON.parse(JSON.stringify(parent)); // Deep clone

        // Merge props
        if (child.props) {
            merged.props = { ...merged.props, ...child.props };
        }

        // Merge events
        if (child.events) {
            merged.events = { ...merged.events, ...child.events };
        }

        // Merge slots
        if (child.slots) {
            merged.slots = [...(merged.slots || []), ...child.slots];
        }

        // Override other properties
        Object.keys(child).forEach(key => {
            if (!['props', 'events', 'slots', 'extends'].includes(key)) {
                merged[key] = child[key];
            }
        });

        return merged;
    }

    /**
     * Load component dependencies
     */
    async loadDependencies(componentName, dependencies) {
        const loadedDeps = [];

        for (const dep of dependencies) {
            if (!this.dependencies.has(dep)) {
                const depConfig = await this.loadComponent(dep);
                this.dependencies.set(dep, depConfig);
            }
            loadedDeps.push(this.dependencies.get(dep));
        }

        return loadedDeps;
    }

    /**
     * Get component configuration
     */
    async getComponent(componentName) {
        return await this.loadComponent(componentName);
    }

    /**
     * Get all loaded components
     */
    getAllComponents() {
        return Object.fromEntries(this.components);
    }

    /**
     * Validate component configuration
     */
    validateComponent(componentConfig) {
        const errors = [];

        // Check required fields
        const requiredFields = ['name', 'description', 'props'];
        for (const field of requiredFields) {
            if (!componentConfig[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate props
        if (componentConfig.props) {
            for (const [propName, propDef] of Object.entries(componentConfig.props)) {
                if (!propDef.type) {
                    errors.push(`Prop ${propName} missing type definition`);
                }
            }
        }

        // Run embedded validation if present
        if (componentConfig.validation) {
            try {
                this.configLoader.validateConfig(componentConfig, componentConfig.validation);
            } catch (error) {
                errors.push(error.message);
            }
        }

        if (errors.length > 0) {
            throw new Error(`Component validation failed:\n${errors.join('\n')}`);
        }

        return true;
    }

    /**
     * Get component dependencies tree
     */
    async getDependencyTree(componentName) {
        const visited = new Set();
        const tree = {};

        await this.buildDependencyTree(componentName, tree, visited);
        return tree;
    }

    /**
     * Build dependency tree recursively
     */
    async buildDependencyTree(componentName, tree, visited) {
        if (visited.has(componentName)) {
            return; // Circular dependency protection
        }

        visited.add(componentName);
        const component = await this.loadComponent(componentName);

        tree[componentName] = {
            config: component,
            dependencies: {}
        };

        if (component.dependencies) {
            for (const dep of component.dependencies) {
                await this.buildDependencyTree(dep, tree[componentName].dependencies, visited);
            }
        }
    }

    /**
     * Get component transformation rules
     */
    getTransformationRules(componentName) {
        const component = this.components.get(componentName);
        if (!component) {
            throw new Error(`Component ${componentName} not loaded`);
        }

        return component.resolved?.transformation || component.transformation || {};
    }

    /**
     * Get component TypeScript interfaces
     */
    getTypeScriptInterface(componentName) {
        const component = this.components.get(componentName);
        if (!component) {
            throw new Error(`Component ${componentName} not loaded`);
        }

        return component.resolved?.typescript || component.typescript || {};
    }

    /**
     * Clear component cache
     */
    clearCache(componentName = null) {
        if (componentName) {
            this.components.delete(componentName);
            this.dependencies.delete(componentName);
            this.inheritanceCache.clear(); // Clear inheritance cache when component changes
        } else {
            this.components.clear();
            this.dependencies.clear();
            this.inheritanceCache.clear();
        }
    }

    /**
     * Hot reload component configuration
     */
    async hotReload(componentName) {
        this.clearCache(componentName);
        this.configLoader.clearCache(`components/${componentName.toLowerCase()}.config.js`);
        return await this.loadComponent(componentName, { useCache: false });
    }

    /**
     * Get available components
     */
    async getAvailableComponents() {
        // This would scan the components directory for available configs
        const components = ['Button', 'Card', 'InputText', 'DataTable', 'Select'];
        const available = [];

        for (const component of components) {
            try {
                await this.loadComponent(component, { useCache: false, validate: false });
                available.push(component);
            } catch (error) {
                // Component not available
            }
        }

        return available;
    }

    /**
     * Search components by criteria
     */
    async searchComponents(criteria) {
        const allComponents = await this.getAvailableComponents();
        const results = [];

        for (const componentName of allComponents) {
            const component = await this.loadComponent(componentName);

            if (this.matchesCriteria(component, criteria)) {
                results.push({
                    name: componentName,
                    config: component
                });
            }
        }

        return results;
    }

    /**
     * Check if component matches search criteria
     */
    matchesCriteria(component, criteria) {
        if (criteria.category && component.category !== criteria.category) {
            return false;
        }

        if (criteria.tags && !criteria.tags.some(tag =>
            component.tags && component.tags.includes(tag)
        )) {
            return false;
        }

        if (criteria.hasProps && !criteria.hasProps.every(prop =>
            component.props && component.props[prop]
        )) {
            return false;
        }

        return true;
    }
}

export default new ComponentLoader();
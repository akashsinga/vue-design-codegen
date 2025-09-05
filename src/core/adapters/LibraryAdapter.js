// src/core/adapters/LibraryAdapter.js
export default class LibraryAdapter {
    constructor(libraryName, config) {
        this.libraryName = libraryName;
        this.config = config;
        this.validateConfig();
    }

    /**
     * Validate adapter configuration
     */
    validateConfig() {
        const requiredFields = ['name', 'version', 'components', 'imports'];

        for (const field of requiredFields) {
            if (!this.config[field]) {
                throw new Error(`Adapter config missing required field: ${field}`);
            }
        }

        if (this.config.validation) {
            this.runValidation();
        }
    }

    /**
     * Run embedded validation rules
     */
    runValidation() {
        const { validation } = this.config;

        if (validation.versionCheck) {
            this.validateVersion();
        }

        if (validation.componentIntegrity) {
            this.validateComponentIntegrity();
        }

        if (validation.custom) {
            for (const validator of validation.custom) {
                const result = validator(this.config);
                if (result !== true) {
                    throw new Error(`Adapter validation failed: ${result}`);
                }
            }
        }
    }

    /**
     * Validate library version compatibility
     */
    validateVersion() {
        const { supportedVersions } = this.config;
        if (!supportedVersions || !Array.isArray(supportedVersions)) {
            throw new Error('Supported versions not defined in adapter config');
        }
    }

    /**
     * Validate component integrity
     */
    validateComponentIntegrity() {
        const { components } = this.config;

        for (const [componentName, mapping] of Object.entries(components)) {
            if (!mapping.import) {
                throw new Error(`Component ${componentName} missing import definition`);
            }

            if (!mapping.props) {
                throw new Error(`Component ${componentName} missing props mapping`);
            }
        }
    }

    /**
     * Get component mapping
     */
    getComponentMapping(componentName) {
        const mapping = this.config.components[componentName];
        if (!mapping) {
            throw new Error(`Component ${componentName} not found in ${this.libraryName} adapter`);
        }
        return mapping;
    }

    /**
     * Get all component mappings
     */
    getAllMappings() {
        return this.config.components;
    }

    /**
     * Transform props according to adapter rules
     */
    transformProps(componentName, props) {
        const mapping = this.getComponentMapping(componentName);
        const transformed = {};

        for (const [propName, propValue] of Object.entries(props)) {
            const propMapping = mapping.props[propName];

            if (!propMapping) {
                // Direct mapping if no transformation defined
                transformed[propName] = propValue;
                continue;
            }

            if (propMapping.transform) {
                transformed[propMapping.name || propName] = this.applyTransformation(
                    propValue,
                    propMapping.transform,
                    componentName,
                    propName
                );
            } else {
                transformed[propMapping.name || propName] = propValue;
            }
        }

        return transformed;
    }

    /**
     * Apply transformation rules
     */
    applyTransformation(value, transform, componentName, propName) {
        switch (transform.type) {
            case 'direct':
                return value;

            case 'mapping':
                return transform.map[value] !== undefined ? transform.map[value] : value;

            case 'conditional':
                return transform.condition(value) ? transform.trueValue : transform.falseValue;

            case 'function':
                return transform.handler(value);

            case 'computed':
                return transform.compute(value, this.config);

            default:
                throw new Error(`Unknown transformation type: ${transform.type} for ${componentName}.${propName}`);
        }
    }

    /**
     * Transform events according to adapter rules
     */
    transformEvents(componentName, events) {
        const mapping = this.getComponentMapping(componentName);
        const transformed = {};

        for (const [eventName, handler] of Object.entries(events)) {
            const eventMapping = mapping.events && mapping.events[eventName];

            if (eventMapping) {
                const targetEventName = eventMapping.name || eventName;
                transformed[targetEventName] = eventMapping.transform
                    ? eventMapping.transform(handler)
                    : handler;
            } else {
                transformed[eventName] = handler;
            }
        }

        return transformed;
    }

    /**
     * Get import statements
     */
    getImports() {
        return this.config.imports;
    }

    /**
     * Get import statement for specific component
     */
    getComponentImport(componentName) {
        const mapping = this.getComponentMapping(componentName);
        return mapping.import;
    }

    /**
     * Get all required imports for components
     */
    getRequiredImports(componentNames) {
        const imports = new Set();

        // Add base imports
        if (this.config.imports.base) {
            this.config.imports.base.forEach(imp => imports.add(imp));
        }

        // Add component-specific imports
        for (const componentName of componentNames) {
            const mapping = this.getComponentMapping(componentName);
            if (mapping.import) {
                imports.add(mapping.import);
            }
        }

        return Array.from(imports);
    }

    /**
     * Validate compatibility with library version
     */
    validateCompatibility(version) {
        const { supportedVersions, compatibility } = this.config;

        if (!supportedVersions.includes(version) && !this.isVersionInRange(version, supportedVersions)) {
            return {
                compatible: false,
                reason: `Version ${version} not supported. Supported versions: ${supportedVersions.join(', ')}`
            };
        }

        if (compatibility && compatibility.check) {
            const compatibilityResult = compatibility.check(version);
            if (!compatibilityResult.compatible) {
                return compatibilityResult;
            }
        }

        return { compatible: true };
    }

    /**
     * Check if version is in supported range
     */
    isVersionInRange(version, supportedVersions) {
        // Implementation for semantic version range checking
        // This is a simplified version - in real implementation, use a library like semver
        return supportedVersions.some(supported => {
            if (supported.includes('x')) {
                const pattern = supported.replace(/x/g, '\\d+');
                return new RegExp(pattern).test(version);
            }
            return supported === version;
        });
    }

    /**
     * Get performance optimization hints
     */
    getPerformanceMetrics() {
        return this.config.performance || {
            bundleSize: 'unknown',
            treeShaking: true,
            ssr: false,
            asyncComponents: false
        };
    }

    /**
     * Get optimization hints for build process
     */
    getOptimizationHints() {
        return this.config.optimization || {};
    }

    /**
     * Get theme integration information
     */
    getThemeIntegration() {
        return this.config.theme || {};
    }

    /**
     * Get plugin configuration
     */
    getPluginConfig() {
        return this.config.plugin || {};
    }

    /**
     * Check if component supports specific feature
     */
    supportsFeature(componentName, feature) {
        const mapping = this.getComponentMapping(componentName);
        return mapping.features && mapping.features.includes(feature);
    }

    /**
     * Get component dependencies
     */
    getComponentDependencies(componentName) {
        const mapping = this.getComponentMapping(componentName);
        return mapping.dependencies || [];
    }

    /**
     * Generate component template
     */
    generateComponentTemplate(componentName, props, events, slots) {
        const mapping = this.getComponentMapping(componentName);
        const transformedProps = this.transformProps(componentName, props);
        const transformedEvents = this.transformEvents(componentName, events);

        return {
            tag: mapping.tag || componentName,
            props: transformedProps,
            events: transformedEvents,
            slots: slots,
            import: mapping.import
        };
    }
}
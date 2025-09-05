/**
 * Base adapter class that provides the interface and common functionality
 * for all UI library adapters. Each library-specific adapter extends this class.
 */
export class LibraryAdapter {
    constructor(config) {
        if (!config) {
            throw new Error('Adapter configuration is required');
        }

        this.config = config;
        this.name = config.name;
        this.version = config.version;
        this.componentMappings = config.componentMappings || {};
        this.propTransformations = config.propTransformations || {};
        this.eventMappings = config.eventMappings || {};
        this.slotMappings = config.slotMappings || {};
        this.imports = config.imports || [];
        this.performance = config.performance || {};
        this.compatibility = config.compatibility || {};

        // Initialize transformation cache
        this.transformationCache = new Map();

        // Validate configuration on instantiation
        this.validateConfiguration();
    }

    /**
     * Validate the adapter configuration
     * @throws {Error} If configuration is invalid
     */
    validateConfiguration() {
        const required = ['name', 'version', 'componentMappings'];

        for (const field of required) {
            if (!this.config[field]) {
                throw new Error(`Required field '${field}' missing in adapter configuration`);
            }
        }

        // Validate component mappings structure
        for (const [semanticName, mapping] of Object.entries(this.componentMappings)) {
            if (!mapping.component) {
                throw new Error(`Component mapping missing for semantic component: ${semanticName}`);
            }
        }
    }

    /**
     * Transform semantic component name to library-specific component
     * @param {string} semanticName - Semantic component name (e.g., 'Button')
     * @returns {Object} Library-specific component mapping
     */
    getComponentMapping(semanticName) {
        const mapping = this.componentMappings[semanticName];

        if (!mapping) {
            throw new Error(`No component mapping found for semantic component: ${semanticName}`);
        }

        return {
            component: mapping.component,
            import: mapping.import || null,
            props: mapping.props || {},
            events: mapping.events || {},
            slots: mapping.slots || {},
            conditions: mapping.conditions || null
        };
    }

    /**
     * Transform semantic props to library-specific props
     * @param {string} componentName - Semantic component name
     * @param {Object} semanticProps - Semantic props object
     * @returns {Object} Transformed library-specific props
     */
    transformProps(componentName, semanticProps) {
        const cacheKey = `${componentName}_${JSON.stringify(semanticProps)}`;

        // Check transformation cache
        if (this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        const mapping = this.getComponentMapping(componentName);
        const transformations = this.propTransformations[componentName] || {};
        const transformedProps = {};

        // Apply prop transformations
        for (const [semanticProp, semanticValue] of Object.entries(semanticProps)) {
            const transformation = transformations[semanticProp];

            if (transformation) {
                const result = this.applyPropTransformation(
                    transformation,
                    semanticValue,
                    semanticProps,
                    componentName
                );

                // Handle multiple prop outputs
                if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
                    Object.assign(transformedProps, result);
                } else {
                    const targetProp = transformation.target || semanticProp;
                    transformedProps[targetProp] = result;
                }
            } else {
                // Direct mapping if no transformation specified
                const targetProp = mapping.props[semanticProp] || semanticProp;
                transformedProps[targetProp] = semanticValue;
            }
        }

        // Apply default props from mapping
        if (mapping.props && mapping.props.defaults) {
            Object.assign(transformedProps, mapping.props.defaults);
        }

        // Cache the result
        this.transformationCache.set(cacheKey, transformedProps);

        return transformedProps;
    }

    /**
     * Apply individual prop transformation
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Semantic prop value
     * @param {Object} allProps - All semantic props for context
     * @param {string} componentName - Component name for context
     * @returns {*} Transformed value
     */
    applyPropTransformation(transformation, value, allProps, componentName) {
        switch (transformation.type) {
            case 'direct':
                return value;

            case 'conditional':
                return this.applyConditionalTransformation(transformation, value, allProps);

            case 'mapping':
                return this.applyMappingTransformation(transformation, value);

            case 'computed':
                return this.applyComputedTransformation(transformation, value, allProps);

            case 'multi-prop':
                return this.applyMultiPropTransformation(transformation, value, allProps);

            case 'custom':
                return this.applyCustomTransformation(transformation, value, allProps, componentName);

            default:
                return value;
        }
    }

    /**
     * Apply conditional transformation based on conditions
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Prop value
     * @param {Object} allProps - All props for condition evaluation
     * @returns {*} Transformed value
     */
    applyConditionalTransformation(transformation, value, allProps) {
        const conditions = transformation.conditions;

        for (const condition of conditions) {
            if (this.evaluateCondition(condition.if, value, allProps)) {
                return condition.then;
            }
        }

        return transformation.else || value;
    }

    /**
     * Apply value mapping transformation
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Prop value
     * @returns {*} Mapped value
     */
    applyMappingTransformation(transformation, value) {
        const mapping = transformation.mapping;
        return mapping[value] !== undefined ? mapping[value] : transformation.default || value;
    }

    /**
     * Apply computed transformation using a function
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Prop value
     * @param {Object} allProps - All props for computation
     * @returns {*} Computed value
     */
    applyComputedTransformation(transformation, value, allProps) {
        if (typeof transformation.compute === 'function') {
            return transformation.compute(value, allProps);
        }
        return value;
    }

    /**
     * Apply multi-prop transformation that affects multiple output props
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Prop value
     * @param {Object} allProps - All props for computation
     * @returns {Object} Object with multiple transformed props
     */
    applyMultiPropTransformation(transformation, value, allProps) {
        const result = {};

        if (typeof transformation.transform === 'function') {
            return transformation.transform(value, allProps);
        }

        return result;
    }

    /**
     * Apply custom transformation using library-specific logic
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Prop value
     * @param {Object} allProps - All props
     * @param {string} componentName - Component name
     * @returns {*} Transformed value
     */
    applyCustomTransformation(transformation, value, allProps, componentName) {
        if (typeof transformation.transform === 'function') {
            return transformation.transform(value, allProps, componentName, this);
        }
        return value;
    }

    /**
     * Evaluate a condition for conditional transformations
     * @param {*} condition - Condition to evaluate
     * @param {*} value - Current prop value
     * @param {Object} allProps - All props for context
     * @returns {boolean} Whether condition is met
     */
    evaluateCondition(condition, value, allProps) {
        if (typeof condition === 'function') {
            return condition(value, allProps);
        }

        if (typeof condition === 'object') {
            // Handle object-based conditions
            if (condition.prop) {
                const propValue = allProps[condition.prop];
                return this.compareValues(propValue, condition.operator || '===', condition.value);
            }

            if (condition.value !== undefined) {
                return this.compareValues(value, condition.operator || '===', condition.value);
            }
        }

        return Boolean(condition);
    }

    /**
     * Compare values using specified operator
     * @param {*} left - Left value
     * @param {string} operator - Comparison operator
     * @param {*} right - Right value
     * @returns {boolean} Comparison result
     */
    compareValues(left, operator, right) {
        switch (operator) {
            case '===': return left === right;
            case '!==': return left !== right;
            case '==': return left == right;
            case '!=': return left != right;
            case '>': return left > right;
            case '>=': return left >= right;
            case '<': return left < right;
            case '<=': return left <= right;
            case 'includes': return Array.isArray(left) && left.includes(right);
            case 'startsWith': return typeof left === 'string' && left.startsWith(right);
            case 'endsWith': return typeof left === 'string' && left.endsWith(right);
            default: return false;
        }
    }

    /**
     * Transform semantic events to library-specific events
     * @param {string} componentName - Semantic component name
     * @param {Object} semanticEvents - Semantic events object
     * @returns {Object} Transformed library-specific events
     */
    transformEvents(componentName, semanticEvents) {
        const mapping = this.getComponentMapping(componentName);
        const eventMappings = this.eventMappings[componentName] || {};
        const transformedEvents = {};

        for (const [semanticEvent, handler] of Object.entries(semanticEvents)) {
            const eventMapping = eventMappings[semanticEvent];

            if (eventMapping) {
                const targetEvent = eventMapping.target || semanticEvent;

                if (eventMapping.transform && typeof eventMapping.transform === 'function') {
                    transformedEvents[targetEvent] = eventMapping.transform(handler);
                } else {
                    transformedEvents[targetEvent] = handler;
                }
            } else {
                // Direct mapping
                const targetEvent = mapping.events[semanticEvent] || semanticEvent;
                transformedEvents[targetEvent] = handler;
            }
        }

        return transformedEvents;
    }

    /**
     * Transform semantic slots to library-specific slots
     * @param {string} componentName - Semantic component name
     * @param {Object} semanticSlots - Semantic slots object
     * @returns {Object} Transformed library-specific slots
     */
    transformSlots(componentName, semanticSlots) {
        const mapping = this.getComponentMapping(componentName);
        const slotMappings = this.slotMappings[componentName] || {};
        const transformedSlots = {};

        for (const [semanticSlot, content] of Object.entries(semanticSlots)) {
            const slotMapping = slotMappings[semanticSlot];

            if (slotMapping) {
                const targetSlot = slotMapping.target || semanticSlot;
                transformedSlots[targetSlot] = content;
            } else {
                // Direct mapping
                const targetSlot = mapping.slots[semanticSlot] || semanticSlot;
                transformedSlots[targetSlot] = content;
            }
        }

        return transformedSlots;
    }

    /**
     * Get import statements required for a component
     * @param {string} componentName - Semantic component name
     * @returns {Array} Array of import statements
     */
    getRequiredImports(componentName) {
        const mapping = this.getComponentMapping(componentName);
        const imports = [];

        // Add component-specific import if specified
        if (mapping.import) {
            imports.push(mapping.import);
        }

        // Add global imports
        imports.push(...this.imports);

        return imports;
    }

    /**
     * Get performance hints for a component
     * @param {string} componentName - Semantic component name
     * @returns {Object} Performance hints
     */
    getPerformanceHints(componentName) {
        return this.performance[componentName] || this.performance.default || {};
    }

    /**
     * Check if a component is supported by this adapter
     * @param {string} componentName - Semantic component name
     * @returns {boolean} Whether component is supported
     */
    isComponentSupported(componentName) {
        return componentName in this.componentMappings;
    }

    /**
     * Get list of all supported semantic components
     * @returns {string[]} Array of supported component names
     */
    getSupportedComponents() {
        return Object.keys(this.componentMappings);
    }

    /**
     * Clear transformation cache
     */
    clearCache() {
        this.transformationCache.clear();
    }

    /**
     * Get adapter information
     * @returns {Object} Adapter information
     */
    getInfo() {
        return {
            name: this.name,
            version: this.version,
            supportedComponents: this.getSupportedComponents(),
            compatibility: this.compatibility
        };
    }
}
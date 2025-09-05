/**
 * Core transformation engine that processes prop transformations,
 * conditional logic, value mappings, and computed properties using
 * configuration-defined transformation rules
 */
export class TransformationEngine {
    constructor() {
        this.transformationCache = new Map();
        this.transformationRegistry = new Map();
        this.computedCache = new Map();

        // Built-in transformation functions
        this.registerBuiltInTransformations();
    }

    /**
     * Transform semantic props to library-specific props using adapter rules
     * @param {string} componentName - Component name
     * @param {Object} semanticProps - Semantic props object
     * @param {Object} adapter - Current adapter with transformation rules
     * @param {Object} options - Transformation options
     * @returns {Promise<Object>} Transformed props
     */
    async transformProps(componentName, semanticProps, adapter, options = {}) {
        const cacheKey = this.generateCacheKey('props', componentName, semanticProps, adapter.name);

        // Check cache first
        if (options.useCache !== false && this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        try {
            // Get component mapping and transformations from adapter
            const componentMapping = adapter.getComponentMapping(componentName);
            const adapterTransformations = adapter.propTransformations[componentName] || {};

            const transformedProps = {};
            const transformationContext = {
                componentName,
                adapter: adapter.name,
                allProps: semanticProps,
                options
            };

            // Process each semantic prop
            for (const [propName, propValue] of Object.entries(semanticProps)) {
                const transformation = adapterTransformations[propName];

                if (transformation) {
                    // Apply configured transformation
                    const result = await this.applyTransformation(
                        transformation,
                        propValue,
                        transformationContext
                    );

                    // Handle result based on transformation type
                    await this.handleTransformationResult(
                        result,
                        propName,
                        transformation,
                        transformedProps
                    );
                } else {
                    // Direct mapping or default behavior
                    const targetProp = componentMapping.props?.[propName] || propName;
                    transformedProps[targetProp] = propValue;
                }
            }

            // Apply adapter-level prop defaults
            if (componentMapping.props?.defaults) {
                Object.assign(transformedProps, componentMapping.props.defaults);
            }

            // Apply post-processing transformations
            const finalProps = await this.applyPostProcessing(
                transformedProps,
                componentName,
                adapter,
                transformationContext
            );

            // Cache the result
            this.transformationCache.set(cacheKey, finalProps);

            return finalProps;
        } catch (error) {
            throw new Error(`Props transformation failed for ${componentName}: ${error.message}`);
        }
    }

    /**
     * Transform semantic events to library-specific events
     * @param {string} componentName - Component name
     * @param {Object} semanticEvents - Semantic events object
     * @param {Object} adapter - Current adapter
     * @param {Object} options - Transformation options
     * @returns {Promise<Object>} Transformed events
     */
    async transformEvents(componentName, semanticEvents, adapter, options = {}) {
        const cacheKey = this.generateCacheKey('events', componentName, semanticEvents, adapter.name);

        if (options.useCache !== false && this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        try {
            const componentMapping = adapter.getComponentMapping(componentName);
            const eventTransformations = adapter.eventMappings?.[componentName] || {};
            const transformedEvents = {};

            for (const [eventName, eventHandler] of Object.entries(semanticEvents)) {
                const transformation = eventTransformations[eventName];

                if (transformation) {
                    const transformedHandler = await this.transformEventHandler(
                        eventHandler,
                        transformation,
                        {
                            componentName,
                            eventName,
                            adapter: adapter.name,
                            options
                        }
                    );

                    const targetEvent = transformation.target || eventName;
                    transformedEvents[targetEvent] = transformedHandler;
                } else {
                    // Direct mapping
                    const targetEvent = componentMapping.events?.[eventName] || eventName;
                    transformedEvents[targetEvent] = eventHandler;
                }
            }

            this.transformationCache.set(cacheKey, transformedEvents);
            return transformedEvents;
        } catch (error) {
            throw new Error(`Events transformation failed for ${componentName}: ${error.message}`);
        }
    }

    /**
     * Transform semantic slots to library-specific slots
     * @param {string} componentName - Component name
     * @param {Object} semanticSlots - Semantic slots object
     * @param {Object} adapter - Current adapter
     * @param {Object} options - Transformation options
     * @returns {Promise<Object>} Transformed slots
     */
    async transformSlots(componentName, semanticSlots, adapter, options = {}) {
        const cacheKey = this.generateCacheKey('slots', componentName, semanticSlots, adapter.name);

        if (options.useCache !== false && this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        try {
            const componentMapping = adapter.getComponentMapping(componentName);
            const slotTransformations = adapter.slotMappings?.[componentName] || {};
            const transformedSlots = {};

            for (const [slotName, slotContent] of Object.entries(semanticSlots)) {
                const transformation = slotTransformations[slotName];

                if (transformation) {
                    const transformedContent = await this.transformSlotContent(
                        slotContent,
                        transformation,
                        {
                            componentName,
                            slotName,
                            adapter: adapter.name,
                            options
                        }
                    );

                    const targetSlot = transformation.target || slotName;
                    transformedSlots[targetSlot] = transformedContent;
                } else {
                    // Direct mapping
                    const targetSlot = componentMapping.slots?.[slotName] || slotName;
                    transformedSlots[targetSlot] = slotContent;
                }
            }

            this.transformationCache.set(cacheKey, transformedSlots);
            return transformedSlots;
        } catch (error) {
            throw new Error(`Slots transformation failed for ${componentName}: ${error.message}`);
        }
    }

    /**
     * Apply a single transformation based on its configuration
     * @param {Object} transformation - Transformation configuration
     * @param {*} value - Value to transform
     * @param {Object} context - Transformation context
     * @returns {Promise<*>} Transformed value
     */
    async applyTransformation(transformation, value, context) {
        const transformationType = transformation.type || 'direct';

        switch (transformationType) {
            case 'direct':
                return this.applyDirectTransformation(transformation, value, context);

            case 'conditional':
                return this.applyConditionalTransformation(transformation, value, context);

            case 'mapping':
                return this.applyMappingTransformation(transformation, value, context);

            case 'computed':
                return this.applyComputedTransformation(transformation, value, context);

            case 'multi-prop':
                return this.applyMultiPropTransformation(transformation, value, context);

            case 'custom':
                return this.applyCustomTransformation(transformation, value, context);

            case 'chain':
                return this.applyChainTransformation(transformation, value, context);

            case 'template':
                return this.applyTemplateTransformation(transformation, value, context);

            default:
                throw new Error(`Unknown transformation type: ${transformationType}`);
        }
    }

    /**
     * Apply direct transformation (simple value pass-through with optional target)
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {*} Transformed value
     */
    applyDirectTransformation(transformation, value, context) {
        return transformation.transform ? transformation.transform(value, context) : value;
    }

    /**
     * Apply conditional transformation based on conditions
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {Promise<*>} Transformed value
     */
    async applyConditionalTransformation(transformation, value, context) {
        const conditions = transformation.conditions || [];

        for (const condition of conditions) {
            const conditionMet = await this.evaluateCondition(condition.if, value, context);

            if (conditionMet) {
                if (condition.transform) {
                    return this.applyTransformation(condition.transform, value, context);
                }
                return condition.then !== undefined ? condition.then : value;
            }
        }

        // No conditions met, return else value or original
        if (transformation.else !== undefined) {
            if (typeof transformation.else === 'object' && transformation.else.transform) {
                return this.applyTransformation(transformation.else, value, context);
            }
            return transformation.else;
        }

        return value;
    }

    /**
     * Apply mapping transformation using value lookup
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {*} Mapped value
     */
    applyMappingTransformation(transformation, value, context) {
        const mapping = transformation.mapping || {};

        if (value in mapping) {
            const mappedValue = mapping[value];

            // If mapped value is a transformation, apply it
            if (typeof mappedValue === 'object' && mappedValue.transform) {
                return this.applyTransformation(mappedValue, value, context);
            }

            return mappedValue;
        }

        return transformation.default !== undefined ? transformation.default : value;
    }

    /**
     * Apply computed transformation using functions
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {Promise<*>} Computed value
     */
    async applyComputedTransformation(transformation, value, context) {
        const computeKey = `${context.componentName}_${transformation.id || 'default'}_${JSON.stringify(value)}`;

        // Check computed cache
        if (transformation.cache !== false && this.computedCache.has(computeKey)) {
            return this.computedCache.get(computeKey);
        }

        let result;

        if (typeof transformation.compute === 'function') {
            result = await transformation.compute(value, context.allProps, context);
        } else if (typeof transformation.compute === 'string') {
            // Handle string-based expressions
            result = this.evaluateExpression(transformation.compute, value, context);
        } else {
            result = value;
        }

        // Cache computed result
        if (transformation.cache !== false) {
            this.computedCache.set(computeKey, result);
        }

        return result;
    }

    /**
     * Apply multi-prop transformation that affects multiple output props
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {Promise<Object>} Object with multiple props
     */
    async applyMultiPropTransformation(transformation, value, context) {
        if (typeof transformation.transform === 'function') {
            return transformation.transform(value, context.allProps, context);
        }

        if (transformation.mapping && typeof transformation.mapping === 'object') {
            const result = {};

            for (const [targetProp, targetValue] of Object.entries(transformation.mapping)) {
                if (typeof targetValue === 'function') {
                    result[targetProp] = targetValue(value, context.allProps, context);
                } else if (typeof targetValue === 'object' && targetValue.transform) {
                    result[targetProp] = await this.applyTransformation(targetValue, value, context);
                } else {
                    result[targetProp] = targetValue;
                }
            }

            return result;
        }

        throw new Error('Multi-prop transformation requires transform function or mapping object');
    }

    /**
     * Apply custom transformation using registered functions
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {Promise<*>} Transformed value
     */
    async applyCustomTransformation(transformation, value, context) {
        const customFunction = transformation.function;

        if (typeof customFunction === 'function') {
            return customFunction(value, context.allProps, context);
        }

        if (typeof customFunction === 'string') {
            const registeredFunction = this.transformationRegistry.get(customFunction);
            if (registeredFunction) {
                return registeredFunction(value, context.allProps, context);
            }
            throw new Error(`Custom transformation function not found: ${customFunction}`);
        }

        throw new Error('Custom transformation requires function or registered function name');
    }

    /**
     * Apply chain transformation (multiple transformations in sequence)
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {Promise<*>} Final transformed value
     */
    async applyChainTransformation(transformation, value, context) {
        const chain = transformation.chain || [];
        let currentValue = value;

        for (const chainStep of chain) {
            currentValue = await this.applyTransformation(chainStep, currentValue, context);
        }

        return currentValue;
    }

    /**
     * Apply template transformation using string templates
     * @param {Object} transformation - Transformation config
     * @param {*} value - Value to transform
     * @param {Object} context - Context
     * @returns {string} Templated string
     */
    applyTemplateTransformation(transformation, value, context) {
        const template = transformation.template || '';

        // Simple template substitution
        return template
            .replace(/\$\{value\}/g, value)
            .replace(/\$\{(\w+)\}/g, (match, propName) => {
                return context.allProps[propName] || '';
            });
    }

    /**
     * Handle transformation result and assign to target props
     * @param {*} result - Transformation result
     * @param {string} sourceProp - Source prop name
     * @param {Object} transformation - Transformation config
     * @param {Object} targetProps - Target props object
     * @returns {Promise<void>}
     */
    async handleTransformationResult(result, sourceProp, transformation, targetProps) {
        if (transformation.type === 'multi-prop' && typeof result === 'object' && result !== null) {
            // Multi-prop result - merge all properties
            Object.assign(targetProps, result);
        } else {
            // Single prop result
            const targetProp = transformation.target || sourceProp;
            targetProps[targetProp] = result;
        }
    }

    /**
     * Transform event handler with event-specific transformations
     * @param {Function} handler - Event handler function
     * @param {Object} transformation - Event transformation config
     * @param {Object} context - Context
     * @returns {Promise<Function>} Transformed handler
     */
    async transformEventHandler(handler, transformation, context) {
        if (transformation.wrap && typeof transformation.wrap === 'function') {
            return transformation.wrap(handler, context);
        }

        if (transformation.debounce) {
            const delay = transformation.debounce === true ? 300 : transformation.debounce;
            return this.createDebouncedHandler(handler, delay);
        }

        if (transformation.throttle) {
            const delay = transformation.throttle === true ? 300 : transformation.throttle;
            return this.createThrottledHandler(handler, delay);
        }

        return handler;
    }

    /**
     * Transform slot content with slot-specific transformations
     * @param {*} content - Slot content
     * @param {Object} transformation - Slot transformation config
     * @param {Object} context - Context
     * @returns {Promise<*>} Transformed content
     */
    async transformSlotContent(content, transformation, context) {
        if (transformation.wrap && typeof transformation.wrap === 'function') {
            return transformation.wrap(content, context);
        }

        if (transformation.template) {
            return this.applyTemplateTransformation(transformation, content, context);
        }

        return content;
    }

    /**
     * Apply post-processing transformations to final props
     * @param {Object} props - Transformed props
     * @param {string} componentName - Component name
     * @param {Object} adapter - Current adapter
     * @param {Object} context - Context
     * @returns {Promise<Object>} Post-processed props
     */
    async applyPostProcessing(props, componentName, adapter, context) {
        const postProcessors = adapter.propTransformations[componentName]?.postProcess || [];
        let processedProps = { ...props };

        for (const processor of postProcessors) {
            if (typeof processor === 'function') {
                processedProps = await processor(processedProps, context);
            } else if (typeof processor === 'object') {
                processedProps = await this.applyTransformation(processor, processedProps, context);
            }
        }

        return processedProps;
    }

    /**
     * Evaluate a condition for conditional transformations
     * @param {*} condition - Condition to evaluate
     * @param {*} value - Current value
     * @param {Object} context - Context with all props
     * @returns {Promise<boolean>} Whether condition is met
     */
    async evaluateCondition(condition, value, context) {
        if (typeof condition === 'function') {
            return condition(value, context.allProps, context);
        }

        if (typeof condition === 'boolean') {
            return condition;
        }

        if (typeof condition === 'object' && condition !== null) {
            return this.evaluateObjectCondition(condition, value, context);
        }

        return Boolean(condition);
    }

    /**
     * Evaluate object-based condition
     * @param {Object} condition - Condition object
     * @param {*} value - Current value
     * @param {Object} context - Context
     * @returns {boolean} Evaluation result
     */
    evaluateObjectCondition(condition, value, context) {
        if (condition.prop) {
            const propValue = context.allProps[condition.prop];
            return this.compareValues(propValue, condition.operator || '===', condition.value);
        }

        if (condition.value !== undefined) {
            return this.compareValues(value, condition.operator || '===', condition.value);
        }

        if (condition.and) {
            return condition.and.every(cond => this.evaluateCondition(cond, value, context));
        }

        if (condition.or) {
            return condition.or.some(cond => this.evaluateCondition(cond, value, context));
        }

        if (condition.not) {
            return !this.evaluateCondition(condition.not, value, context);
        }

        return false;
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
            case 'includes':
                return Array.isArray(left) ? left.includes(right) :
                    typeof left === 'string' ? left.includes(right) : false;
            case 'startsWith':
                return typeof left === 'string' && left.startsWith(right);
            case 'endsWith':
                return typeof left === 'string' && left.endsWith(right);
            case 'matches':
                return typeof left === 'string' && new RegExp(right).test(left);
            case 'exists':
                return left !== undefined && left !== null;
            case 'empty':
                return !left || (Array.isArray(left) && left.length === 0) ||
                    (typeof left === 'object' && Object.keys(left).length === 0);
            default:
                return false;
        }
    }

    /**
     * Evaluate string expression (simple expression evaluator)
     * @param {string} expression - Expression to evaluate
     * @param {*} value - Current value
     * @param {Object} context - Context
     * @returns {*} Evaluation result
     */
    evaluateExpression(expression, value, context) {
        // Simple expression evaluator - replace with more robust implementation if needed
        const variables = {
            value,
            props: context.allProps,
            ...context.allProps
        };

        try {
            // Basic variable substitution
            let processedExpression = expression;
            for (const [varName, varValue] of Object.entries(variables)) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                processedExpression = processedExpression.replace(regex, JSON.stringify(varValue));
            }

            // Evaluate the expression (Note: In production, use a safer expression evaluator)
            return Function('"use strict"; return (' + processedExpression + ')')();
        } catch (error) {
            console.warn(`Expression evaluation failed: ${expression}`, error);
            return value;
        }
    }

    /**
     * Create debounced event handler
     * @param {Function} handler - Original handler
     * @param {number} delay - Debounce delay in ms
     * @returns {Function} Debounced handler
     */
    createDebouncedHandler(handler, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler.apply(this, args), delay);
        };
    }

    /**
     * Create throttled event handler
     * @param {Function} handler - Original handler
     * @param {number} delay - Throttle delay in ms
     * @returns {Function} Throttled handler
     */
    createThrottledHandler(handler, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                handler.apply(this, args);
            }
        };
    }

    /**
     * Register built-in transformation functions
     */
    registerBuiltInTransformations() {
        // String transformations
        this.transformationRegistry.set('uppercase', (value) =>
            typeof value === 'string' ? value.toUpperCase() : value
        );

        this.transformationRegistry.set('lowercase', (value) =>
            typeof value === 'string' ? value.toLowerCase() : value
        );

        this.transformationRegistry.set('capitalize', (value) =>
            typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value
        );

        // Number transformations
        this.transformationRegistry.set('toString', (value) => String(value));
        this.transformationRegistry.set('toNumber', (value) => Number(value));

        // Array transformations
        this.transformationRegistry.set('join', (value, allProps, context) =>
            Array.isArray(value) ? value.join(context.separator || ',') : value
        );

        this.transformationRegistry.set('split', (value, allProps, context) =>
            typeof value === 'string' ? value.split(context.separator || ',') : value
        );

        // Boolean transformations
        this.transformationRegistry.set('negate', (value) => !value);
        this.transformationRegistry.set('toBoolean', (value) => Boolean(value));
    }

    /**
     * Register custom transformation function
     * @param {string} name - Function name
     * @param {Function} fn - Transformation function
     */
    registerTransformation(name, fn) {
        this.transformationRegistry.set(name, fn);
    }

    /**
     * Generate cache key for transformations
     * @param {string} type - Transformation type
     * @param {string} componentName - Component name
     * @param {Object} data - Data to transform
     * @param {string} adapterName - Adapter name
     * @returns {string} Cache key
     */
    generateCacheKey(type, componentName, data, adapterName) {
        const dataHash = JSON.stringify(data);
        return `${type}:${componentName}:${adapterName}:${dataHash}`;
    }

    /**
     * Clear all transformation caches
     */
    clearCache() {
        this.transformationCache.clear();
        this.computedCache.clear();
    }

    /**
     * Get transformation statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            cacheSize: this.transformationCache.size,
            computedCacheSize: this.computedCache.size,
            registeredTransformations: this.transformationRegistry.size
        };
    }
}
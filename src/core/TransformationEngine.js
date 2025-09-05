// src/core/TransformationEngine.js
export class TransformationEngine {
    constructor() {
        this.transformationCache = new Map();
        this.customTransformers = new Map();
    }

    /**
     * Transform props according to configuration rules
     */
    async transformProps(sourceProps, transformationRules, adapter, componentName) {
        const cacheKey = this.getCacheKey('props', sourceProps, transformationRules, adapter.libraryName);

        if (this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        const transformed = {};
        const adapterMapping = adapter.getComponentMapping(componentName);

        for (const [propName, propValue] of Object.entries(sourceProps)) {
            const transformationRule = transformationRules[propName];
            const adapterPropMapping = adapterMapping.props[propName];

            if (transformationRule) {
                // Use component-specific transformation rule
                transformed[propName] = await this.applyTransformationRule(
                    propValue,
                    transformationRule,
                    adapter,
                    { componentName, propName }
                );
            } else if (adapterPropMapping) {
                // Use adapter-specific transformation
                transformed[adapterPropMapping.name || propName] = await this.applyAdapterTransformation(
                    propValue,
                    adapterPropMapping,
                    adapter,
                    { componentName, propName }
                );
            } else {
                // Direct mapping
                transformed[propName] = propValue;
            }
        }

        this.transformationCache.set(cacheKey, transformed);
        return transformed;
    }

    /**
     * Transform events according to configuration rules
     */
    async transformEvents(sourceEvents, transformationRules, adapter, componentName) {
        const cacheKey = this.getCacheKey('events', sourceEvents, transformationRules, adapter.libraryName);

        if (this.transformationCache.has(cacheKey)) {
            return this.transformationCache.get(cacheKey);
        }

        const transformed = {};
        const adapterMapping = adapter.getComponentMapping(componentName);

        for (const [eventName, eventHandler] of Object.entries(sourceEvents)) {
            const transformationRule = transformationRules[eventName];
            const adapterEventMapping = adapterMapping.events && adapterMapping.events[eventName];

            if (transformationRule) {
                // Use component-specific transformation rule
                transformed[eventName] = await this.applyTransformationRule(
                    eventHandler,
                    transformationRule,
                    adapter,
                    { componentName, eventName }
                );
            } else if (adapterEventMapping) {
                // Use adapter-specific transformation
                const targetEventName = adapterEventMapping.name || eventName;
                transformed[targetEventName] = adapterEventMapping.transform
                    ? adapterEventMapping.transform(eventHandler)
                    : eventHandler;
            } else {
                // Direct mapping
                transformed[eventName] = eventHandler;
            }
        }

        this.transformationCache.set(cacheKey, transformed);
        return transformed;
    }

    /**
     * Apply transformation rule based on rule type
     */
    async applyTransformationRule(value, rule, adapter, context) {
        switch (rule.type) {
            case 'direct':
                return value;

            case 'mapping':
                return this.applyMappingTransformation(value, rule, context);

            case 'conditional':
                return this.applyConditionalTransformation(value, rule, context);

            case 'function':
                return this.applyFunctionTransformation(value, rule, context);

            case 'computed':
                return this.applyComputedTransformation(value, rule, adapter, context);

            case 'library-specific':
                return this.applyLibrarySpecificTransformation(value, rule, adapter, context);

            case 'multi-prop':
                return this.applyMultiPropTransformation(value, rule, adapter, context);

            case 'custom':
                return this.applyCustomTransformation(value, rule, adapter, context);

            default:
                throw new Error(`Unknown transformation type: ${rule.type} in ${context.componentName}.${context.propName || context.eventName}`);
        }
    }

    /**
     * Apply adapter-specific transformation
     */
    async applyAdapterTransformation(value, mapping, adapter, context) {
        if (!mapping.transform) {
            return value;
        }

        return adapter.applyTransformation(
            value,
            mapping.transform,
            context.componentName,
            context.propName
        );
    }

    /**
     * Apply mapping transformation
     */
    applyMappingTransformation(value, rule, context) {
        if (!rule.mapping) {
            throw new Error(`Mapping transformation missing mapping table in ${context.componentName}`);
        }

        const mapped = rule.mapping[value];
        return mapped !== undefined ? mapped : (rule.fallback !== undefined ? rule.fallback : value);
    }

    /**
     * Apply conditional transformation
     */
    applyConditionalTransformation(value, rule, context) {
        if (!rule.condition) {
            throw new Error(`Conditional transformation missing condition in ${context.componentName}`);
        }

        try {
            const conditionResult = typeof rule.condition === 'function'
                ? rule.condition(value, context)
                : this.evaluateCondition(rule.condition, value, context);

            return conditionResult ? rule.trueValue : rule.falseValue;
        } catch (error) {
            throw new Error(`Conditional transformation failed in ${context.componentName}: ${error.message}`);
        }
    }

    /**
     * Apply function transformation
     */
    applyFunctionTransformation(value, rule, context) {
        if (!rule.handler || typeof rule.handler !== 'function') {
            throw new Error(`Function transformation missing handler in ${context.componentName}`);
        }

        try {
            return rule.handler(value, context);
        } catch (error) {
            throw new Error(`Function transformation failed in ${context.componentName}: ${error.message}`);
        }
    }

    /**
     * Apply computed transformation
     */
    applyComputedTransformation(value, rule, adapter, context) {
        if (!rule.compute || typeof rule.compute !== 'function') {
            throw new Error(`Computed transformation missing compute function in ${context.componentName}`);
        }

        try {
            return rule.compute(value, {
                adapter: adapter.config,
                context,
                library: adapter.libraryName
            });
        } catch (error) {
            throw new Error(`Computed transformation failed in ${context.componentName}: ${error.message}`);
        }
    }

    /**
     * Apply library-specific transformation
     */
    applyLibrarySpecificTransformation(value, rule, adapter, context) {
        if (!rule.rules) {
            throw new Error(`Library-specific transformation missing rules in ${context.componentName}`);
        }

        const libraryRule = rule.rules[adapter.libraryName];
        if (!libraryRule) {
            // No rule for this library, return original value or fallback
            return rule.fallback !== undefined ? rule.fallback : value;
        }

        if (libraryRule.mapping) {
            return this.applyMappingTransformation(value, { mapping: libraryRule.mapping }, context);
        }

        if (libraryRule.transform && typeof libraryRule.transform === 'function') {
            return libraryRule.transform(value, context);
        }

        if (libraryRule.target) {
            // Simple target property mapping
            return { [libraryRule.target]: value };
        }

        return value;
    }

    /**
     * Apply multi-prop transformation
     */
    applyMultiPropTransformation(value, rule, adapter, context) {
        if (!rule.sources || !Array.isArray(rule.sources)) {
            throw new Error(`Multi-prop transformation missing sources array in ${context.componentName}`);
        }

        // This would need access to all props, not just the current value
        // Implementation would depend on having access to the full props object
        const allProps = context.allProps || {};
        const sourceValues = rule.sources.map(source => allProps[source]);

        if (rule.combiner && typeof rule.combiner === 'function') {
            return rule.combiner(sourceValues, context);
        }

        // Default combination strategy
        return sourceValues.filter(v => v !== undefined);
    }

    /**
     * Apply custom transformation
     */
    applyCustomTransformation(value, rule, adapter, context) {
        if (!rule.name) {
            throw new Error(`Custom transformation missing name in ${context.componentName}`);
        }

        const customTransformer = this.customTransformers.get(rule.name);
        if (!customTransformer) {
            throw new Error(`Custom transformer '${rule.name}' not found`);
        }

        return customTransformer(value, rule.options || {}, adapter, context);
    }

    /**
     * Evaluate condition string or object
     */
    evaluateCondition(condition, value, context) {
        if (typeof condition === 'string') {
            // Simple condition evaluation
            return this.evaluateConditionString(condition, value, context);
        }

        if (typeof condition === 'object') {
            // Complex condition evaluation
            return this.evaluateConditionObject(condition, value, context);
        }

        return false;
    }

    /**
     * Evaluate condition string
     */
    evaluateConditionString(conditionStr, value, context) {
        // Simple condition parsing (in production, use a proper expression parser)
        const operators = {
            '===': (a, b) => a === b,
            '!==': (a, b) => a !== b,
            '==': (a, b) => a == b,
            '!=': (a, b) => a != b,
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
            'includes': (a, b) => String(a).includes(b),
            'startsWith': (a, b) => String(a).startsWith(b),
            'endsWith': (a, b) => String(a).endsWith(b)
        };

        for (const [op, fn] of Object.entries(operators)) {
            if (conditionStr.includes(op)) {
                const [left, right] = conditionStr.split(op).map(s => s.trim());
                const leftValue = left === 'value' ? value : left.replace(/['"]/g, '');
                const rightValue = right.replace(/['"]/g, '');
                return fn(leftValue, rightValue);
            }
        }

        return false;
    }

    /**
     * Evaluate condition object
     */
    evaluateConditionObject(condition, value, context) {
        if (condition.and) {
            return condition.and.every(subCondition =>
                this.evaluateCondition(subCondition, value, context)
            );
        }

        if (condition.or) {
            return condition.or.some(subCondition =>
                this.evaluateCondition(subCondition, value, context)
            );
        }

        if (condition.not) {
            return !this.evaluateCondition(condition.not, value, context);
        }

        return false;
    }

    /**
     * Register custom transformer
     */
    registerCustomTransformer(name, transformer) {
        if (typeof transformer !== 'function') {
            throw new Error('Custom transformer must be a function');
        }

        this.customTransformers.set(name, transformer);
    }

    /**
     * Transform slots configuration
     */
    async transformSlots(sourceSlots, transformationRules, adapter, componentName) {
        const transformed = {};
        const adapterMapping = adapter.getComponentMapping(componentName);

        for (const [slotName, slotConfig] of Object.entries(sourceSlots)) {
            const transformationRule = transformationRules[slotName];
            const adapterSlotMapping = adapterMapping.slots && adapterMapping.slots[slotName];

            if (transformationRule) {
                transformed[slotName] = await this.applyTransformationRule(
                    slotConfig,
                    transformationRule,
                    adapter,
                    { componentName, slotName }
                );
            } else if (adapterSlotMapping) {
                const targetSlotName = adapterSlotMapping.name || slotName;
                transformed[targetSlotName] = adapterSlotMapping.transform
                    ? adapterSlotMapping.transform(slotConfig)
                    : slotConfig;
            } else {
                transformed[slotName] = slotConfig;
            }
        }

        return transformed;
    }

    /**
     * Generate cache key for transformations
     */
    getCacheKey(type, source, rules, libraryName) {
        return `${type}-${JSON.stringify(source)}-${JSON.stringify(rules)}-${libraryName}`;
    }

    /**
     * Clear transformation cache
     */
    clearCache(type = null) {
        if (type) {
            for (const key of this.transformationCache.keys()) {
                if (key.startsWith(`${type}-`)) {
                    this.transformationCache.delete(key);
                }
            }
        } else {
            this.transformationCache.clear();
        }
    }

    /**
     * Get transformation statistics
     */
    getTransformationStats() {
        const stats = {
            totalTransformations: this.transformationCache.size,
            customTransformers: this.customTransformers.size,
            byType: {}
        };

        for (const key of this.transformationCache.keys()) {
            const type = key.split('-')[0];
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        }

        return stats;
    }

    /**
     * Validate transformation rules
     */
    validateTransformationRules(rules, componentName) {
        const errors = [];

        for (const [ruleName, rule] of Object.entries(rules)) {
            if (!rule.type) {
                errors.push(`Transformation rule '${ruleName}' missing type in ${componentName}`);
                continue;
            }

            switch (rule.type) {
                case 'mapping':
                    if (!rule.mapping) {
                        errors.push(`Mapping transformation '${ruleName}' missing mapping table`);
                    }
                    break;

                case 'conditional':
                    if (!rule.condition) {
                        errors.push(`Conditional transformation '${ruleName}' missing condition`);
                    }
                    break;

                case 'function':
                    if (!rule.handler || typeof rule.handler !== 'function') {
                        errors.push(`Function transformation '${ruleName}' missing or invalid handler`);
                    }
                    break;

                case 'library-specific':
                    if (!rule.rules) {
                        errors.push(`Library-specific transformation '${ruleName}' missing rules`);
                    }
                    break;
            }
        }

        if (errors.length > 0) {
            throw new Error(`Transformation validation failed:\n${errors.join('\n')}`);
        }

        return true;
    }
}

export default new TransformationEngine();
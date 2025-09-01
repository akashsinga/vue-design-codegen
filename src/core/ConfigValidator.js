/**
 * Configuration Validation System
 * Validates component configurations before generation
 */
export class ConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate a component configuration
     * @param {Object} config - Component configuration
     * @returns {Object} Validation result with errors and warnings
     */
    validate(config) {
        this.errors = [];
        this.warnings = [];

        this.validateRequired(config);
        this.validateProps(config);
        this.validatePropMappings(config);
        this.validateEvents(config);
        this.validateSlots(config);
        this.validatePerformance(config);

        return {
            valid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings]
        };
    }

    /**
     * Validate required fields
     */
    validateRequired(config) {
        if (!config.name) {
            this.addError('Component name is required');
        }

        if (!config.baseComponent) {
            this.addError('Base component is required');
        }

        if (config.name && !/^[A-Z][a-zA-Z0-9]*$/.test(config.name)) {
            this.addError('Component name must be PascalCase and start with capital letter');
        }
    }

    /**
     * Validate props configuration
     */
    validateProps(config) {
        if (!config.props) return;

        if (!Array.isArray(config.props)) {
            this.addError('Props must be an array');
            return;
        }

        const propNames = new Set();

        config.props.forEach((prop, index) => {
            if (!prop.name) {
                this.addError(`Prop at index ${index} is missing name`);
                return;
            }

            if (propNames.has(prop.name)) {
                this.addError(`Duplicate prop name: ${prop.name}`);
            }
            propNames.add(prop.name);

            if (!prop.type) {
                this.addWarning(`Prop '${prop.name}' is missing type definition`);
            }

            const validTypes = ['string', 'number', 'boolean', 'array', 'object', 'function'];
            if (prop.type && !validTypes.includes(prop.type)) {
                this.addWarning(`Prop '${prop.name}' has unknown type: ${prop.type}`);
            }

            if (prop.options && !Array.isArray(prop.options)) {
                this.addError(`Prop '${prop.name}' options must be an array`);
            }

            if (prop.required === undefined) {
                this.addWarning(`Prop '${prop.name}' missing required field`);
            }
        });
    }

    /**
     * Validate prop mappings
     */
    validatePropMappings(config) {
        if (!config.propMappings) return;

        if (!Array.isArray(config.propMappings)) {
            this.addError('PropMappings must be an array');
            return;
        }

        const propNames = config.props ? config.props.map(p => p.name) : [];
        const targetNames = new Set();

        config.propMappings.forEach((mapping, index) => {
            if (!mapping.target) {
                this.addError(`Prop mapping at index ${index} is missing target`);
                return;
            }

            if (!mapping.type) {
                this.addError(`Prop mapping at index ${index} is missing type`);
                return;
            }

            const validMappingTypes = ['direct', 'value', 'conditional', 'transform', 'multiProp', 'nested', 'computed', 'librarySpecific'];
            if (!validMappingTypes.includes(mapping.type)) {
                this.addError(`Prop mapping '${mapping.target}' has invalid type: ${mapping.type}`);
            }

            // Validate based on mapping type
            switch (mapping.type) {
                case 'direct':
                case 'value':
                case 'conditional':
                    if (!mapping.source) {
                        this.addError(`${mapping.type} mapping at index ${index} is missing source`);
                        return;
                    }
                    if (propNames.length > 0 && !propNames.includes(mapping.source)) {
                        this.addWarning(`Prop mapping source '${mapping.source}' not found in props definition`);
                    }
                    break;

                case 'multiProp':
                    if (!mapping.sources || !Array.isArray(mapping.sources)) {
                        this.addError(`multiProp mapping at index ${index} is missing sources array`);
                    } else {
                        mapping.sources.forEach(source => {
                            if (propNames.length > 0 && !propNames.includes(source)) {
                                this.addWarning(`MultiProp mapping source '${source}' not found in props definition`);
                            }
                        });
                    }
                    break;

                case 'nested':
                    if (!mapping.properties || !Array.isArray(mapping.properties)) {
                        this.addError(`nested mapping at index ${index} is missing properties array`);
                    } else {
                        mapping.properties.forEach(prop => {
                            if (!prop.key) {
                                this.addError(`nested mapping property missing key`);
                            }
                            if (!prop.source) {
                                this.addError(`nested mapping property missing source`);
                            }
                        });
                    }
                    break;

                case 'computed':
                    if (!mapping.computation) {
                        this.addError(`computed mapping at index ${index} is missing computation`);
                    }
                    break;

                case 'librarySpecific':
                    if (!mapping.library) {
                        this.addError(`librarySpecific mapping at index ${index} is missing library`);
                    }
                    if (!mapping.transform) {
                        this.addError(`librarySpecific mapping at index ${index} is missing transform`);
                    }
                    break;
            }

            if (targetNames.has(mapping.target)) {
                this.addError(`Duplicate prop mapping target: ${mapping.target}`);
            }
            targetNames.add(mapping.target);

            // Validate conditional mappings
            if (mapping.type === 'conditional') {
                if (!mapping.condition) {
                    this.addError(`Conditional mapping '${mapping.source}' is missing condition`);
                }
                if (mapping.fallback === undefined) {
                    this.addWarning(`Conditional mapping '${mapping.source}' is missing fallback value`);
                }
            }

            // Validate transform mappings
            if (mapping.type === 'value' && !mapping.transform) {
                this.addError(`Value mapping '${mapping.source}' is missing transform function`);
            }
        });
    }

    /**
     * Validate events configuration
     */
    validateEvents(config) {
        if (!config.events) return;

        if (!Array.isArray(config.events)) {
            this.addError('Events must be an array');
            return;
        }

        const eventNames = new Set();

        config.events.forEach((event, index) => {
            if (!event.name) {
                this.addError(`Event at index ${index} is missing name`);
                return;
            }

            if (eventNames.has(event.name)) {
                this.addError(`Duplicate event name: ${event.name}`);
            }
            eventNames.add(event.name);

            if (!event.emit) {
                this.addWarning(`Event '${event.name}' is missing emit name`);
            }
        });
    }

    /**
     * Validate slots configuration
     */
    validateSlots(config) {
        if (!config.slots) return;

        if (!Array.isArray(config.slots)) {
            this.addError('Slots must be an array');
            return;
        }

        const slotNames = new Set();

        config.slots.forEach((slot, index) => {
            if (!slot.name) {
                this.addError(`Slot at index ${index} is missing name`);
                return;
            }

            if (slotNames.has(slot.name)) {
                this.addError(`Duplicate slot name: ${slot.name}`);
            }
            slotNames.add(slot.name);
        });
    }

    /**
     * Validate performance configuration
     */
    validatePerformance(config) {
        if (!config.performance) return;

        const performance = config.performance;

        if (performance.memoize !== undefined && typeof performance.memoize !== 'boolean') {
            this.addError('Performance.memoize must be a boolean');
        }

        if (performance.lazyLoad !== undefined && typeof performance.lazyLoad !== 'boolean') {
            this.addError('Performance.lazyLoad must be a boolean');
        }

        if (performance.treeshake !== undefined && typeof performance.treeshake !== 'boolean') {
            this.addError('Performance.treeshake must be a boolean');
        }
    }

    /**
     * Add an error to the validation result
     */
    addError(message) {
        this.errors.push(message);
    }

    /**
     * Add a warning to the validation result
     */
    addWarning(message) {
        this.warnings.push(message);
    }

    /**
     * Generate a validation report
     */
    generateReport(config, result) {
        let report = `\n=== Validation Report for ${config.name || 'Unknown'} ===\n`;

        if (result.valid) {
            report += '✅ Configuration is valid!\n';
        } else {
            report += '❌ Configuration has errors:\n';
            result.errors.forEach(error => {
                report += `  • ${error}\n`;
            });
        }

        if (result.warnings.length > 0) {
            report += '\n⚠️  Warnings:\n';
            result.warnings.forEach(warning => {
                report += `  • ${warning}\n`;
            });
        }

        report += '\n' + '='.repeat(50) + '\n';
        return report;
    }
}
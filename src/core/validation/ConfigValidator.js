/**
 * Configuration Validation System
 * Validates component configurations before generation
 * 
 * File: src/core/validation/ConfigValidator.js
 */
export class ConfigValidator {
    constructor() {
        this.errors = []
        this.warnings = []
    }

    /**
     * Validate a component configuration
     * @param {Object} config - Component configuration
     * @returns {Object} Validation result with errors and warnings
     */
    validate(config) {
        this.errors = []
        this.warnings = []

        this.validateCore(config)
        this.validateMappingIntegrity(config)
        this.validateCircularDependencies(config)

        return {
            valid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings]
        }
    }

    /**
     * Validate core required fields
     */
    validateCore(config) {
        if (!config.name) {
            this.addError('Component name is required')
        }

        if (!config.baseComponent) {
            this.addError('Base component is required')
        }

        if (config.name && !/^[A-Z][a-zA-Z0-9]*$/.test(config.name)) {
            this.addError('Component name must be PascalCase')
        }
    }

    /**
     * Validate prop mapping integrity
     */
    validateMappingIntegrity(config) {
        if (!config.propMappings) return

        const propNames = config.props ? config.props.map(p => p.name) : []
        const targetNames = new Set()

        config.propMappings.forEach((mapping, index) => {
            // Check required fields
            if (!mapping.target) {
                this.addError(`Prop mapping at index ${index} missing target`)
                return
            }

            if (!mapping.type) {
                this.addError(`Prop mapping at index ${index} missing type`)
                return
            }

            // Check for duplicate targets
            if (targetNames.has(mapping.target)) {
                this.addError(`Duplicate prop mapping target: ${mapping.target}`)
            }
            targetNames.add(mapping.target)

            // Validate mapping types (supports 5 types including value)
            this.validateMappingType(mapping, propNames, index)
        })
    }

    /**
     * Validate specific mapping type requirements
     */
    validateMappingType(mapping, propNames, index) {
        const validTypes = ['direct', 'conditional', 'value', 'computed', 'librarySpecific']

        if (!validTypes.includes(mapping.type)) {
            this.addError(`Invalid mapping type '${mapping.type}' at index ${index}. Valid types: ${validTypes.join(', ')}`)
            return
        }

        switch (mapping.type) {
            case 'direct':
                if (!mapping.source) {
                    this.addError(`Direct mapping at index ${index} missing source`)
                }
                if (propNames.length > 0 && mapping.source && !propNames.includes(mapping.source)) {
                    this.addWarning(`Source '${mapping.source}' not found in props definition`)
                }
                break

            case 'conditional':
                if (!mapping.source) {
                    this.addError(`Conditional mapping at index ${index} missing source`)
                }
                if (!mapping.condition) {
                    this.addError(`Conditional mapping at index ${index} missing condition`)
                }
                if (propNames.length > 0 && mapping.source && !propNames.includes(mapping.source)) {
                    this.addWarning(`Source '${mapping.source}' not found in props definition`)
                }
                break

            case 'value':
                if (!mapping.source) {
                    this.addError(`Value mapping at index ${index} missing source`)
                }
                if (!mapping.transform) {
                    this.addError(`Value mapping at index ${index} missing transform function`)
                }
                if (propNames.length > 0 && mapping.source && !propNames.includes(mapping.source)) {
                    this.addWarning(`Source '${mapping.source}' not found in props definition`)
                }
                break

            case 'computed':
                if (!mapping.computedRef) {
                    this.addError(`Computed mapping at index ${index} missing computedRef`)
                }
                if (!mapping.computation) {
                    this.addError(`Computed mapping at index ${index} missing computation`)
                }
                break

            case 'librarySpecific':
                if (!mapping.library) {
                    this.addError(`LibrarySpecific mapping at index ${index} missing library`)
                }
                if (!mapping.transform) {
                    this.addError(`LibrarySpecific mapping at index ${index} missing transform`)
                }
                break
        }
    }

    /**
     * Check for circular dependencies in computed properties
     */
    validateCircularDependencies(config) {
        if (!config.propMappings) return

        const computedMappings = config.propMappings.filter(m => m.type === 'computed')
        if (computedMappings.length === 0) return

        const dependencies = new Map()

        // Build dependency graph
        computedMappings.forEach(mapping => {
            const deps = this.extractDependencies(mapping.computation)
            dependencies.set(mapping.computedRef, deps)
        })

        // Check for circular dependencies
        dependencies.forEach((deps, computedRef) => {
            if (this.hasCircularDependency(computedRef, deps, dependencies, new Set())) {
                this.addError(`Circular dependency detected in computed property: ${computedRef}`)
            }
        })
    }

    /**
     * Extract prop dependencies from computation code
     */
    extractDependencies(computation) {
        const propPattern = /this\.(\w+)/g
        const dependencies = []
        let match

        while ((match = propPattern.exec(computation)) !== null) {
            dependencies.push(match[1])
        }

        return dependencies
    }

    /**
     * Check for circular dependency using DFS
     */
    hasCircularDependency(current, deps, dependencyMap, visited) {
        if (visited.has(current)) {
            return true
        }

        visited.add(current)

        for (const dep of deps) {
            if (dependencyMap.has(dep)) {
                if (this.hasCircularDependency(dep, dependencyMap.get(dep), dependencyMap, visited)) {
                    return true
                }
            }
        }

        visited.delete(current)
        return false
    }

    /**
     * Add validation error
     */
    addError(message) {
        this.errors.push(message)
    }

    /**
     * Add validation warning
     */
    addWarning(message) {
        this.warnings.push(message)
    }

    /**
     * Generate concise validation report
     */
    generateReport(config, result) {
        if (result.valid && result.warnings.length === 0) {
            return `✅ ${config.name || 'Configuration'} is valid`
        }

        let report = `\n=== ${config.name || 'Configuration'} Validation ===\n`

        if (!result.valid) {
            report += '❌ Errors:\n'
            result.errors.forEach(error => report += `  • ${error}\n`)
        }

        if (result.warnings.length > 0) {
            report += '⚠️  Warnings:\n'
            result.warnings.forEach(warning => report += `  • ${warning}\n`)
        }

        return report
    }
}
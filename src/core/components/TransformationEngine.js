/**
 * Streamlined Transformation Engine
 * Zero-overhead prop transformation through static code generation
 * 
 * File: src/core/components/TransformationEngine.js
 */
export class TransformationEngine {
    constructor(libraryAdapter = null) {
        this.libraryAdapter = libraryAdapter
    }

    /**
     * Generate static prop bindings for template (zero runtime overhead)
     * @param {Array} propMappings - Array of prop mapping configurations
     * @returns {string} Static template prop bindings
     */
    generateTemplatePropBindings(propMappings) {
        if (!propMappings || propMappings.length === 0) {
            return ''
        }

        const bindings = []

        for (const mapping of propMappings) {
            const binding = this.generateSingleBinding(mapping)
            if (binding) {
                bindings.push(binding)
            }
        }

        return bindings.length > 0 ? '\n    ' + bindings.join('\n    ') : ''
    }

    /**
     * Generate single prop binding based on type
     */
    generateSingleBinding(mapping) {
        switch (mapping.type) {
            case 'direct':
                return this.generateDirectBinding(mapping)

            case 'conditional':
                return this.generateConditionalBinding(mapping)

            case 'value':
                return this.generateValueBinding(mapping)

            case 'computed':
                return this.generateComputedBinding(mapping)

            case 'librarySpecific':
                if (this.libraryAdapter && this.libraryAdapter.name === mapping.library) {
                    return this.generateLibrarySpecificBinding(mapping)
                }
                return null

            default:
                console.warn(`Unknown mapping type: ${mapping.type}`)
                return null
        }
    }

    /**
     * Generate direct prop binding (zero overhead)
     */
    generateDirectBinding(mapping) {
        return `:${mapping.target}="${mapping.source}"`
    }

    /**
     * Generate conditional prop binding (resolved at template compile time)
     */
    generateConditionalBinding(mapping) {
        const condition = this.processCondition(mapping.condition, mapping.source)
        const fallback = mapping.fallback || 'undefined'

        // Properly escape quotes in template bindings
        const escapedCondition = condition.replace(/"/g, "'")
        const escapedFallback = fallback.replace(/"/g, "'")

        return `:${mapping.target}="${escapedCondition} ? ${mapping.source} : ${escapedFallback}"`
    }

    /**
     * Generate value transformation binding (uses computed property)
     */
    generateValueBinding(mapping) {
        // For value transformations, we need to create a computed property
        const computedName = `computed${mapping.target.charAt(0).toUpperCase() + mapping.target.slice(1)}`
        return `:${mapping.target}="${computedName}"`
    }

    /**
     * Generate computed prop binding (static computed property reference)
     */
    generateComputedBinding(mapping) {
        return `:${mapping.target}="${mapping.computedRef}"`
    }

    /**
     * Generate library-specific binding
     */
    generateLibrarySpecificBinding(mapping) {
        return `:${mapping.target}="${mapping.transform}"`
    }

    /**
     * Process condition strings to handle prop references correctly
     */
    processCondition(condition, sourceProp) {
        if (!condition) return 'true'

        // Replace standalone variable names with prop references, but preserve operators and literals
        return condition.replace(/\b(\w+)\b/g, (match) => {
            // Don't replace operators, booleans, or quoted strings
            if (['===', '!==', '&&', '||', 'true', 'false', 'null', 'undefined'].includes(match)) {
                return match
            }

            // Don't replace if already prefixed with props.
            if (condition.includes(`props.${match}`)) {
                return match
            }

            // Replace variable names that appear to be props
            return match
        })
    }

    /**
     * Generate static props definition for script section (zero runtime overhead)
     * @param {Array} props - Component props configuration
     * @returns {string} Static props object code
     */
    generatePropsDefinition(props) {
        if (!props || props.length === 0) {
            return 'props: {}'
        }

        const lines = []
        lines.push('props: {')

        props.forEach((prop, index) => {
            const propLines = []
            propLines.push(`${prop.name}: {`)
            propLines.push(`  type: ${this.getVueType(prop.type)},`)

            if (prop.default !== undefined) {
                propLines.push(`  default: ${this.formatDefaultValue(prop.default, prop.type)},`)
            }

            if (prop.required !== undefined) {
                propLines.push(`  required: ${prop.required}`)
            }

            const isLast = index === props.length - 1
            propLines.push(`}${isLast ? '' : ','}`)

            // Indent each line
            const indentedProps = propLines.map(line => `    ${line}`)
            lines.push(...indentedProps)
        })

        lines.push('  }')
        return lines.join('\n  ')
    }

    /**
     * Generate static computed properties for script section (zero runtime overhead)
     * @param {Array} propMappings - Array of prop mapping configurations
     * @returns {string} Static computed properties code
     */
    generateComputedProperties(propMappings) {
        if (!propMappings || propMappings.length === 0) {
            return ''
        }

        const computedProps = propMappings.filter(mapping =>
            mapping.type === 'computed' || mapping.type === 'value'
        )

        if (computedProps.length === 0) {
            return ''
        }

        const lines = []
        lines.push(',')
        lines.push('  computed: {')

        computedProps.forEach((mapping, index) => {
            if (mapping.type === 'computed') {
                lines.push(`    ${mapping.computedRef}() {`)
                lines.push(`      ${mapping.computation}`)
            } else if (mapping.type === 'value') {
                const computedName = `computed${mapping.target.charAt(0).toUpperCase() + mapping.target.slice(1)}`
                lines.push(`    ${computedName}() {`)
                // Fix the value transformation syntax
                lines.push(`      return (${mapping.transform})(this.${mapping.source})`)
            }

            const isLast = index === computedProps.length - 1
            lines.push(`    }${isLast ? '' : ','}`)
        })

        lines.push('  }')
        return lines.join('\n')
    }

    /**
     * Generate static event bindings (zero overhead)
     * @param {Array} events - Event configuration array
     * @returns {string} Static event bindings
     */
    generateEventBindings(events) {
        if (!events || events.length === 0) {
            return ''
        }

        const bindings = events.map(event =>
            `@${event.name}="$emit('${event.emit || event.name}', $event)"`
        )

        return '\n    ' + bindings.join('\n    ')
    }

    /**
     * Convert JavaScript type to Vue prop type
     */
    getVueType(jsType) {
        const typeMap = {
            'string': 'String',
            'number': 'Number',
            'boolean': 'Boolean',
            'array': 'Array',
            'object': 'Object',
            'function': 'Function'
        }
        return typeMap[jsType] || 'String'
    }

    /**
     * Format default value based on type
     */
    formatDefaultValue(value, type) {
        if (type === 'string') {
            return `'${value}'`
        }
        if (type === 'array' || type === 'object') {
            return `() => (${JSON.stringify(value)})`
        }
        return value
    }

    /**
     * Validate transformation maintains zero-overhead principle
     */
    validateTransformation(mapping) {
        const errors = []

        // Ensure no runtime transformation functions
        if (mapping.type === 'computed' && !mapping.computedRef) {
            errors.push(`Computed mapping '${mapping.target}' missing computedRef - would create runtime overhead`)
        }

        if (mapping.type === 'value' && !mapping.transform) {
            errors.push(`Value mapping '${mapping.target}' missing transform function`)
        }

        // Ensure conditional mappings are template-resolvable
        if (mapping.type === 'conditional' && mapping.condition && mapping.condition.includes('function')) {
            errors.push(`Conditional mapping '${mapping.target}' contains function - must be template expression`)
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    /**
     * Get available transformation types
     */
    static getTransformationTypes() {
        return {
            direct: {
                description: 'Direct prop mapping with zero overhead',
                example: { type: 'direct', source: 'variant', target: 'severity' }
            },
            conditional: {
                description: 'Template-time conditional prop mapping',
                example: {
                    type: 'conditional',
                    source: 'iconPosition',
                    target: 'iconPos',
                    condition: 'iconPosition === "right"',
                    fallback: '"left"'
                }
            },
            value: {
                description: 'Transform prop value using function (generates computed property)',
                example: {
                    type: 'value',
                    source: 'rounded',
                    target: 'rounded',
                    transform: '(val) => val ? "xl" : false'
                }
            },
            computed: {
                description: 'Static computed property reference',
                example: {
                    type: 'computed',
                    target: 'combinedClass',
                    computedRef: 'computedClass',
                    computation: 'return `btn-${this.variant}-${this.size}`'
                }
            },
            librarySpecific: {
                description: 'Library-specific static transformation',
                example: {
                    type: 'librarySpecific',
                    library: 'Vuetify',
                    target: 'density',
                    transform: 'dense ? "compact" : "default"'
                }
            }
        }
    }
}
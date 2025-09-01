/**
 * Complex Prop Transformation Engine
 * Handles advanced prop transformations for Phase 2
 */
export class TransformationEngine {
    constructor(libraryAdapter = null) {
        this.libraryAdapter = libraryAdapter;
    }

    /**
     * Process all prop mappings with advanced transformations
     * @param {Array} propMappings - Array of prop mapping configurations
     * @param {Array} props - Component props definition
     * @returns {string} Generated transformation code
     */
    generateTransformations(propMappings, props) {
        if (!propMappings || propMappings.length === 0) {
            return 'const transformedProps = { ...props };';
        }

        let transformCode = 'const transformedProps = {\n';
        const processedSources = new Set();

        propMappings.forEach(mapping => {
            switch (mapping.type) {
                case 'direct':
                    transformCode += this.generateDirectMapping(mapping);
                    processedSources.add(mapping.source);
                    break;

                case 'conditional':
                    transformCode += this.generateConditionalMapping(mapping);
                    processedSources.add(mapping.source);
                    break;

                case 'value':
                    transformCode += this.generateValueMapping(mapping);
                    processedSources.add(mapping.source);
                    break;

                case 'multiProp':
                    transformCode += this.generateMultiPropMapping(mapping);
                    mapping.sources.forEach(source => processedSources.add(source));
                    break;

                case 'nested':
                    transformCode += this.generateNestedMapping(mapping);
                    mapping.properties.forEach(prop => processedSources.add(prop.source));
                    break;

                case 'computed':
                    transformCode += this.generateComputedMapping(mapping);
                    break;

                case 'librarySpecific':
                    if (this.libraryAdapter && this.libraryAdapter.name === mapping.library) {
                        transformCode += this.generateLibrarySpecificMapping(mapping);
                        processedSources.add(mapping.source);
                    }
                    break;

                default:
                    transformCode += this.generateDirectMapping(mapping);
                    processedSources.add(mapping.source);
            }
        });

        // Add remaining unprocessed props
        if (props) {
            const unprocessedProps = props
                .map(p => p.name)
                .filter(name => !processedSources.has(name));

            if (unprocessedProps.length > 0) {
                transformCode += '      // Pass through unprocessed props\n';
                unprocessedProps.forEach(propName => {
                    transformCode += `      ${propName}: props.${propName},\n`;
                });
            }
        }

        transformCode += '    };\n';
        return transformCode;
    }

    /**
     * Generate direct prop mapping
     */
    generateDirectMapping(mapping) {
        return `      ${mapping.target}: props.${mapping.source},\n`;
    }

    /**
     * Generate conditional prop mapping
     */
    generateConditionalMapping(mapping) {
        let condition = this.processCondition(mapping.condition);
        let transform = mapping.transform || `props.${mapping.source}`;
        let fallback = mapping.fallback || 'undefined';

        // Handle complex transforms
        if (typeof transform === 'string' && transform.startsWith('[')) {
            // Array literal transform
            transform = transform;
        } else if (typeof transform === 'string' && transform.startsWith('"')) {
            // String literal transform
            transform = transform;
        } else if (typeof transform === 'string' && transform.startsWith('{')) {
            // Object literal transform
            transform = `(${transform})`;
        } else if (!transform.includes('props.')) {
            // Simple value transform
            transform = transform;
        }

        return `      ${mapping.target}: ${condition} ? ${transform} : ${fallback},\n`;
    }

    /**
     * Generate value transformation mapping
     */
    generateValueMapping(mapping) {
        const transform = mapping.transform;

        if (typeof transform === 'string' && transform.includes('=>')) {
            // Arrow function transformation
            return `      ${mapping.target}: (${transform})(props.${mapping.source}),\n`;
        } else if (typeof transform === 'string') {
            // Simple function name
            return `      ${mapping.target}: ${transform}(props.${mapping.source}),\n`;
        } else {
            // Fallback to direct mapping
            return `      ${mapping.target}: props.${mapping.source},\n`;
        }
    }

    /**
     * Generate multi-prop combination mapping
     */
    generateMultiPropMapping(mapping) {
        const sources = mapping.sources.map(source => `props.${source}`);

        if (mapping.transform) {
            // Custom transform function
            const transformCode = mapping.transform
                .replace(/\$\{(\w+)\}/g, (match, propName) => `\${props.${propName}}`);
            return `      ${mapping.target}: \`${transformCode.replace(/`/g, '')}\`,\n`;
        } else {
            // Default: concatenate with spaces
            return `      ${mapping.target}: [${sources.join(', ')}].filter(Boolean).join(' '),\n`;
        }
    }

    /**
     * Generate nested object mapping
     */
    generateNestedMapping(mapping) {
        let nestedCode = `      ${mapping.target}: {\n`;

        mapping.properties.forEach(prop => {
            if (prop.transform) {
                const transform = prop.transform.replace(/\b(\w+)\b/g, (match, word) => {
                    // Replace variable names with props references
                    return prop.source === word ? `props.${word}` : word;
                });
                nestedCode += `        ${prop.key}: ${transform},\n`;
            } else {
                nestedCode += `        ${prop.key}: props.${prop.source},\n`;
            }
        });

        nestedCode += '      },\n';
        return nestedCode;
    }

    /**
     * Generate computed property mapping
     */
    generateComputedMapping(mapping) {
        return `      ${mapping.target}: (() => {
        ${mapping.computation}
      })(),\n`;
    }

    /**
     * Generate library-specific mapping
     */
    generateLibrarySpecificMapping(mapping) {
        return `      ${mapping.target}: ${mapping.transform},\n`;
    }

    /**
     * Process condition strings to replace variable references
     */
    processCondition(condition) {
        if (!condition) return 'true';

        // Replace variable names with props references
        return condition.replace(/\b(?!props\.)(\w+)(?=\s*[=!<>]|\s*$)/g, 'props.$1');
    }

    /**
     * Validate transformation configuration
     */
    validateTransformation(mapping) {
        const errors = [];

        if (!mapping.type) {
            errors.push('Transformation type is required');
        }

        if (!mapping.target) {
            errors.push('Target property is required');
        }

        switch (mapping.type) {
            case 'direct':
            case 'conditional':
            case 'value':
                if (!mapping.source) {
                    errors.push(`${mapping.type} transformation requires a source property`);
                }
                break;

            case 'multiProp':
                if (!mapping.sources || !Array.isArray(mapping.sources)) {
                    errors.push('multiProp transformation requires sources array');
                }
                break;

            case 'nested':
                if (!mapping.properties || !Array.isArray(mapping.properties)) {
                    errors.push('nested transformation requires properties array');
                }
                break;

            case 'computed':
                if (!mapping.computation) {
                    errors.push('computed transformation requires computation code');
                }
                break;

            case 'librarySpecific':
                if (!mapping.library) {
                    errors.push('librarySpecific transformation requires library name');
                }
                if (!mapping.transform) {
                    errors.push('librarySpecific transformation requires transform code');
                }
                break;
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get transformation type info for documentation
     */
    static getTransformationTypes() {
        return {
            direct: {
                description: 'Direct prop mapping with no transformation',
                example: { type: 'direct', source: 'color', target: 'color' }
            },
            conditional: {
                description: 'Conditional prop mapping based on condition',
                example: {
                    type: 'conditional',
                    source: 'iconPosition',
                    target: 'prependIcon',
                    condition: 'iconPosition === "left"',
                    transform: 'props.icon',
                    fallback: 'undefined'
                }
            },
            value: {
                description: 'Transform prop value using function',
                example: {
                    type: 'value',
                    source: 'rounded',
                    target: 'rounded',
                    transform: '(val) => val ? "xl" : false'
                }
            },
            multiProp: {
                description: 'Combine multiple props into one',
                example: {
                    type: 'multiProp',
                    sources: ['variant', 'color'],
                    target: 'class',
                    transform: '`btn-${variant}-${color}`'
                }
            },
            nested: {
                description: 'Create nested object from flat props',
                example: {
                    type: 'nested',
                    target: 'style',
                    properties: [
                        { key: 'width', source: 'block', transform: 'block ? "100%" : "auto"' }
                    ]
                }
            },
            computed: {
                description: 'Computed property with custom logic',
                example: {
                    type: 'computed',
                    target: 'computedValue',
                    computation: 'return props.a + props.b * 2;'
                }
            },
            librarySpecific: {
                description: 'Library-specific transformation',
                example: {
                    type: 'librarySpecific',
                    library: 'Vuetify',
                    source: 'density',
                    target: 'density',
                    transform: 'props.dense ? "compact" : "default"'
                }
            }
        };
    }
}
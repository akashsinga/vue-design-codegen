/**
 * Spacing generator that creates consistent spacing scales,
 * semantic spacing tokens, and responsive spacing systems
 */
export class SpacingGenerator {
    constructor() {
        this.cache = new Map();
        this.defaultOptions = {
            generateScale: true,
            generateSemantics: true,
            generateResponsive: true,
            baseUnit: 4,
            scaleSteps: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64],
            unit: 'px'
        };
    }

    /**
     * Generate spacing tokens from configuration
     * @param {Object} spacingConfig - Spacing configuration
     * @param {Object} context - Generation context
     * @returns {Promise<Object>} Generated spacing tokens
     */
    async generate(spacingConfig, context = {}) {
        const options = { ...this.defaultOptions, ...context };
        const cacheKey = this.generateCacheKey(spacingConfig, options);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const spacing = {};

        // Process base spacing
        if (spacingConfig.base) {
            Object.assign(spacing, await this.processBaseSpacing(spacingConfig.base, options));
        }

        // Generate spacing scale
        if (options.generateScale) {
            Object.assign(spacing, await this.generateSpacingScale(spacingConfig.scale || {}, options));
        }

        // Generate semantic spacing
        if (options.generateSemantics && spacingConfig.semantic) {
            Object.assign(spacing, await this.generateSemanticSpacing(spacingConfig.semantic, options));
        }

        // Generate responsive spacing
        if (options.generateResponsive) {
            Object.assign(spacing, await this.generateResponsiveSpacing(spacing, options));
        }

        this.cache.set(cacheKey, spacing);
        return spacing;
    }

    /**
     * Process base spacing definitions
     * @param {Object} baseSpacing - Base spacing definitions
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed spacing
     */
    async processBaseSpacing(baseSpacing, options) {
        const processed = {};

        for (const [spacingName, spacingValue] of Object.entries(baseSpacing)) {
            if (typeof spacingValue === 'number') {
                processed[spacingName] = `${spacingValue}${options.unit}`;
            } else if (typeof spacingValue === 'string') {
                processed[spacingName] = spacingValue;
            } else if (typeof spacingValue === 'object') {
                processed[spacingName] = await this.processSpacingObject(spacingValue, options);
            }
        }

        return processed;
    }

    /**
     * Generate spacing scale
     * @param {Object} scaleConfig - Scale configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated spacing scale
     */
    async generateSpacingScale(scaleConfig, options) {
        const scale = {};
        const baseUnit = scaleConfig.baseUnit || options.baseUnit;
        const steps = scaleConfig.steps || options.scaleSteps;
        const unit = scaleConfig.unit || options.unit;

        // Generate numeric scale
        for (const step of steps) {
            const value = baseUnit * step;
            scale[step] = `${value}${unit}`;
        }

        // Generate named scale
        const namedSteps = {
            none: 0,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 6,
            xl: 8,
            '2xl': 12,
            '3xl': 16,
            '4xl': 24,
            '5xl': 32,
            '6xl': 40,
            '7xl': 48,
            '8xl': 56,
            '9xl': 64
        };

        for (const [name, step] of Object.entries(namedSteps)) {
            const value = baseUnit * step;
            scale[name] = `${value}${unit}`;
        }

        return { scale };
    }

    /**
     * Generate semantic spacing tokens
     * @param {Object} semanticConfig - Semantic spacing configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Semantic spacing
     */
    async generateSemanticSpacing(semanticConfig, options) {
        const semantics = {};

        // Container spacing
        if (semanticConfig.container) {
            semantics.container = await this.generateContainerSpacing(semanticConfig.container, options);
        }

        // Component spacing
        if (semanticConfig.component) {
            semantics.component = await this.generateComponentSpacing(semanticConfig.component, options);
        }

        // Layout spacing
        if (semanticConfig.layout) {
            semantics.layout = await this.generateLayoutSpacing(semanticConfig.layout, options);
        }

        // Content spacing
        if (semanticConfig.content) {
            semantics.content = await this.generateContentSpacing(semanticConfig.content, options);
        }

        return semantics;
    }

    /**
     * Generate container spacing
     * @param {Object} containerConfig - Container spacing configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Container spacing
     */
    async generateContainerSpacing(containerConfig, options) {
        const baseUnit = options.baseUnit;

        return {
            padding: {
                xs: `${baseUnit * 2}${options.unit}`,
                sm: `${baseUnit * 3}${options.unit}`,
                md: `${baseUnit * 4}${options.unit}`,
                lg: `${baseUnit * 6}${options.unit}`,
                xl: `${baseUnit * 8}${options.unit}`
            },
            margin: {
                xs: `${baseUnit * 2}${options.unit}`,
                sm: `${baseUnit * 3}${options.unit}`,
                md: `${baseUnit * 4}${options.unit}`,
                lg: `${baseUnit * 6}${options.unit}`,
                xl: `${baseUnit * 8}${options.unit}`
            },
            gap: {
                xs: `${baseUnit * 1}${options.unit}`,
                sm: `${baseUnit * 2}${options.unit}`,
                md: `${baseUnit * 3}${options.unit}`,
                lg: `${baseUnit * 4}${options.unit}`,
                xl: `${baseUnit * 6}${options.unit}`
            }
        };
    }

    /**
     * Generate component spacing
     * @param {Object} componentConfig - Component spacing configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Component spacing
     */
    async generateComponentSpacing(componentConfig, options) {
        const baseUnit = options.baseUnit;

        return {
            button: {
                padding: {
                    sm: `${baseUnit * 2}${options.unit} ${baseUnit * 3}${options.unit}`,
                    md: `${baseUnit * 3}${options.unit} ${baseUnit * 4}${options.unit}`,
                    lg: `${baseUnit * 4}${options.unit} ${baseUnit * 6}${options.unit}`
                },
                gap: `${baseUnit * 2}${options.unit}`
            },
            input: {
                padding: {
                    sm: `${baseUnit * 2}${options.unit} ${baseUnit * 3}${options.unit}`,
                    md: `${baseUnit * 3}${options.unit} ${baseUnit * 4}${options.unit}`,
                    lg: `${baseUnit * 4}${options.unit} ${baseUnit * 6}${options.unit}`
                }
            },
            card: {
                padding: {
                    sm: `${baseUnit * 4}${options.unit}`,
                    md: `${baseUnit * 6}${options.unit}`,
                    lg: `${baseUnit * 8}${options.unit}`
                },
                gap: `${baseUnit * 4}${options.unit}`
            },
            list: {
                gap: `${baseUnit * 2}${options.unit}`,
                padding: `${baseUnit * 1}${options.unit}`
            }
        };
    }

    /**
     * Generate layout spacing
     * @param {Object} layoutConfig - Layout spacing configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Layout spacing
     */
    async generateLayoutSpacing(layoutConfig, options) {
        const baseUnit = options.baseUnit;

        return {
            section: {
                margin: {
                    sm: `${baseUnit * 8}${options.unit}`,
                    md: `${baseUnit * 12}${options.unit}`,
                    lg: `${baseUnit * 16}${options.unit}`,
                    xl: `${baseUnit * 24}${options.unit}`
                },
                padding: {
                    sm: `${baseUnit * 6}${options.unit}`,
                    md: `${baseUnit * 8}${options.unit}`,
                    lg: `${baseUnit * 12}${options.unit}`,
                    xl: `${baseUnit * 16}${options.unit}`
                }
            },
            grid: {
                gap: {
                    sm: `${baseUnit * 4}${options.unit}`,
                    md: `${baseUnit * 6}${options.unit}`,
                    lg: `${baseUnit * 8}${options.unit}`,
                    xl: `${baseUnit * 12}${options.unit}`
                }
            },
            stack: {
                gap: {
                    xs: `${baseUnit * 1}${options.unit}`,
                    sm: `${baseUnit * 2}${options.unit}`,
                    md: `${baseUnit * 4}${options.unit}`,
                    lg: `${baseUnit * 6}${options.unit}`,
                    xl: `${baseUnit * 8}${options.unit}`
                }
            }
        };
    }

    /**
     * Generate content spacing
     * @param {Object} contentConfig - Content spacing configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Content spacing
     */
    async generateContentSpacing(contentConfig, options) {
        const baseUnit = options.baseUnit;

        return {
            paragraph: {
                marginBottom: `${baseUnit * 4}${options.unit}`
            },
            heading: {
                marginTop: `${baseUnit * 6}${options.unit}`,
                marginBottom: `${baseUnit * 3}${options.unit}`
            },
            list: {
                marginBottom: `${baseUnit * 4}${options.unit}`,
                itemGap: `${baseUnit * 1}${options.unit}`
            },
            blockquote: {
                margin: `${baseUnit * 6}${options.unit} 0`,
                padding: `${baseUnit * 4}${options.unit} ${baseUnit * 6}${options.unit}`
            },
            codeBlock: {
                margin: `${baseUnit * 4}${options.unit} 0`,
                padding: `${baseUnit * 4}${options.unit}`
            }
        };
    }

    /**
     * Generate responsive spacing
     * @param {Object} spacing - Base spacing
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Responsive spacing
     */
    async generateResponsiveSpacing(spacing, options) {
        if (!options.generateResponsive) {
            return {};
        }

        const responsive = {};
        const breakpoints = ['sm', 'md', 'lg', 'xl'];

        for (const breakpoint of breakpoints) {
            responsive[breakpoint] = await this.generateResponsiveScale(spacing, breakpoint, options);
        }

        return { responsive };
    }

    /**
     * Generate responsive scale for specific breakpoint
     * @param {Object} spacing - Base spacing
     * @param {string} breakpoint - Breakpoint name
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Responsive scale
     */
    async generateResponsiveScale(spacing, breakpoint, options) {
        const multiplier = this.getBreakpointMultiplier(breakpoint);
        const scale = {};

        // Scale existing spacing for breakpoint
        if (spacing.scale) {
            scale.scale = {};
            for (const [sizeName, sizeValue] of Object.entries(spacing.scale)) {
                scale.scale[sizeName] = this.scaleSpacing(sizeValue, multiplier);
            }
        }

        return scale;
    }

    /**
     * Get multiplier for breakpoint
     * @param {string} breakpoint - Breakpoint name
     * @returns {number} Multiplier
     */
    getBreakpointMultiplier(breakpoint) {
        const multipliers = {
            sm: 0.75,
            md: 1,
            lg: 1.25,
            xl: 1.5
        };

        return multipliers[breakpoint] || 1;
    }

    /**
     * Scale spacing value
     * @param {string} spacingValue - Spacing value to scale
     * @param {number} multiplier - Scale multiplier
     * @returns {string} Scaled spacing value
     */
    scaleSpacing(spacingValue, multiplier) {
        if (typeof spacingValue !== 'string') {
            return spacingValue;
        }

        const match = spacingValue.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)$/);
        if (match) {
            const [, value, unit] = match;
            const scaledValue = parseFloat(value) * multiplier;
            return `${scaledValue}${unit}`;
        }

        return spacingValue;
    }

    /**
     * Process spacing object
     * @param {Object} spacingObject - Spacing object definition
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed spacing object
     */
    async processSpacingObject(spacingObject, options) {
        if (spacingObject.scale) {
            return await this.generateSpacingScale(spacingObject, options);
        }

        if (spacingObject.responsive) {
            const responsive = {};
            for (const [breakpoint, value] of Object.entries(spacingObject.responsive)) {
                responsive[breakpoint] = typeof value === 'number' ?
                    `${value}${options.unit}` : value;
            }
            return responsive;
        }

        return spacingObject;
    }

    /**
     * Generate directional spacing (top, right, bottom, left)
     * @param {string|Object} spacing - Spacing value or object
     * @returns {Object} Directional spacing
     */
    generateDirectionalSpacing(spacing) {
        if (typeof spacing === 'string') {
            return {
                top: spacing,
                right: spacing,
                bottom: spacing,
                left: spacing,
                x: spacing, // horizontal
                y: spacing  // vertical
            };
        }

        if (typeof spacing === 'object') {
            return {
                top: spacing.top || spacing.y || spacing.all || '0',
                right: spacing.right || spacing.x || spacing.all || '0',
                bottom: spacing.bottom || spacing.y || spacing.all || '0',
                left: spacing.left || spacing.x || spacing.all || '0',
                x: spacing.x || spacing.all || '0',
                y: spacing.y || spacing.all || '0'
            };
        }

        return spacing;
    }

    /**
     * Generate spacing utilities
     * @param {Object} spacing - Spacing configuration
     * @param {Object} options - Generation options
     * @returns {Object} Spacing utilities
     */
    generateSpacingUtilities(spacing, options) {
        const utilities = {};

        // Generate margin utilities
        utilities.margin = this.generateMarginUtilities(spacing, options);

        // Generate padding utilities
        utilities.padding = this.generatePaddingUtilities(spacing, options);

        // Generate gap utilities
        utilities.gap = this.generateGapUtilities(spacing, options);

        return utilities;
    }

    /**
     * Generate margin utilities
     * @param {Object} spacing - Spacing configuration
     * @param {Object} options - Generation options
     * @returns {Object} Margin utilities
     */
    generateMarginUtilities(spacing, options) {
        const margins = {};

        if (spacing.scale) {
            for (const [key, value] of Object.entries(spacing.scale)) {
                margins[key] = this.generateDirectionalSpacing(value);
            }
        }

        return margins;
    }

    /**
     * Generate padding utilities
     * @param {Object} spacing - Spacing configuration
     * @param {Object} options - Generation options
     * @returns {Object} Padding utilities
     */
    generatePaddingUtilities(spacing, options) {
        const paddings = {};

        if (spacing.scale) {
            for (const [key, value] of Object.entries(spacing.scale)) {
                paddings[key] = this.generateDirectionalSpacing(value);
            }
        }

        return paddings;
    }

    /**
     * Generate gap utilities
     * @param {Object} spacing - Spacing configuration
     * @param {Object} options - Generation options
     * @returns {Object} Gap utilities
     */
    generateGapUtilities(spacing, options) {
        const gaps = {};

        if (spacing.scale) {
            for (const [key, value] of Object.entries(spacing.scale)) {
                gaps[key] = value;
            }
        }

        return gaps;
    }

    /**
     * Generate cache key
     * @param {Object} config - Spacing configuration
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(config, options) {
        return JSON.stringify({ config, options });
    }

    /**
     * Clear spacing generator cache
     */
    clearCache() {
        this.cache.clear();
    }
}
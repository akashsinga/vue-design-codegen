/**
 * Typography generator that creates type scales, font definitions,
 * and responsive typography tokens
 */
export class TypographyGenerator {
    constructor() {
        this.cache = new Map();
        this.defaultOptions = {
            generateScale: true,
            generateResponsive: true,
            generateSemantics: true,
            baseSize: 16,
            scaleRatio: 1.25,
            breakpoints: ['sm', 'md', 'lg', 'xl']
        };
    }

    /**
     * Generate typography tokens from configuration
     * @param {Object} typographyConfig - Typography configuration
     * @param {Object} context - Generation context
     * @returns {Promise<Object>} Generated typography tokens
     */
    async generate(typographyConfig, context = {}) {
        const options = { ...this.defaultOptions, ...context };
        const cacheKey = this.generateCacheKey(typographyConfig, options);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const typography = {};

        // Process base typography
        if (typographyConfig.base) {
            Object.assign(typography, await this.processBaseTypography(typographyConfig.base, options));
        }

        // Generate type scale
        if (options.generateScale && typographyConfig.scale) {
            Object.assign(typography, await this.generateTypeScale(typographyConfig.scale, options));
        }

        // Generate semantic typography
        if (options.generateSemantics && typographyConfig.semantic) {
            Object.assign(typography, await this.generateSemanticTypography(typographyConfig.semantic, options));
        }

        // Generate responsive typography
        if (options.generateResponsive) {
            Object.assign(typography, await this.generateResponsiveTypography(typography, options));
        }

        this.cache.set(cacheKey, typography);
        return typography;
    }

    /**
     * Process base typography definitions
     * @param {Object} baseTypography - Base typography definitions
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed typography
     */
    async processBaseTypography(baseTypography, options) {
        const processed = {};

        // Font families
        if (baseTypography.fontFamilies) {
            processed.fontFamilies = await this.processFontFamilies(baseTypography.fontFamilies, options);
        }

        // Font weights
        if (baseTypography.fontWeights) {
            processed.fontWeights = baseTypography.fontWeights;
        }

        // Line heights
        if (baseTypography.lineHeights) {
            processed.lineHeights = baseTypography.lineHeights;
        }

        // Letter spacing
        if (baseTypography.letterSpacing) {
            processed.letterSpacing = baseTypography.letterSpacing;
        }

        return processed;
    }

    /**
     * Process font family definitions
     * @param {Object} fontFamilies - Font family definitions
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed font families
     */
    async processFontFamilies(fontFamilies, options) {
        const processed = {};

        for (const [familyName, familyDefinition] of Object.entries(fontFamilies)) {
            if (typeof familyDefinition === 'string') {
                processed[familyName] = familyDefinition;
            } else if (typeof familyDefinition === 'object') {
                processed[familyName] = await this.processFontFamily(familyDefinition, options);
            }
        }

        return processed;
    }

    /**
     * Process individual font family
     * @param {Object} familyDefinition - Font family definition
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Processed font family
     */
    async processFontFamily(familyDefinition, options) {
        if (familyDefinition.stack) {
            return familyDefinition.stack.join(', ');
        }

        if (familyDefinition.primary) {
            const fallbacks = familyDefinition.fallbacks || [];
            return [familyDefinition.primary, ...fallbacks].join(', ');
        }

        return familyDefinition.value || '';
    }

    /**
     * Generate type scale from configuration
     * @param {Object} scaleConfig - Scale configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated type scale
     */
    async generateTypeScale(scaleConfig, options) {
        const scale = {};
        const baseSize = scaleConfig.baseSize || options.baseSize;
        const ratio = scaleConfig.ratio || options.scaleRatio;

        // Generate scale steps
        const steps = scaleConfig.steps || [
            { name: 'xs', multiplier: Math.pow(ratio, -2) },
            { name: 'sm', multiplier: Math.pow(ratio, -1) },
            { name: 'md', multiplier: 1 },
            { name: 'lg', multiplier: ratio },
            { name: 'xl', multiplier: Math.pow(ratio, 2) },
            { name: '2xl', multiplier: Math.pow(ratio, 3) },
            { name: '3xl', multiplier: Math.pow(ratio, 4) },
            { name: '4xl', multiplier: Math.pow(ratio, 5) }
        ];

        for (const step of steps) {
            const fontSize = baseSize * step.multiplier;
            const lineHeight = this.calculateLineHeight(fontSize);

            scale[step.name] = {
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}`,
                letterSpacing: this.calculateLetterSpacing(fontSize)
            };
        }

        return { scale };
    }

    /**
     * Generate semantic typography definitions
     * @param {Object} semanticConfig - Semantic typography configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Semantic typography
     */
    async generateSemanticTypography(semanticConfig, options) {
        const semantics = {};

        // Headings
        if (semanticConfig.headings) {
            semantics.headings = await this.generateHeadings(semanticConfig.headings, options);
        }

        // Body text
        if (semanticConfig.body) {
            semantics.body = await this.generateBodyText(semanticConfig.body, options);
        }

        // Display text
        if (semanticConfig.display) {
            semantics.display = await this.generateDisplayText(semanticConfig.display, options);
        }

        // Code text
        if (semanticConfig.code) {
            semantics.code = await this.generateCodeText(semanticConfig.code, options);
        }

        return semantics;
    }

    /**
     * Generate heading typography
     * @param {Object} headingsConfig - Headings configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Heading typography
     */
    async generateHeadings(headingsConfig, options) {
        const headings = {};
        const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const sizeMultiplier = Math.pow(1.2, levels.length - i - 1);

            headings[level] = {
                fontSize: `${options.baseSize * sizeMultiplier}px`,
                fontWeight: headingsConfig.fontWeight || '600',
                lineHeight: this.calculateLineHeight(options.baseSize * sizeMultiplier, 'heading'),
                letterSpacing: this.calculateLetterSpacing(options.baseSize * sizeMultiplier),
                marginBottom: `${options.baseSize * 0.5}px`
            };
        }

        return headings;
    }

    /**
     * Generate body text typography
     * @param {Object} bodyConfig - Body text configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Body typography
     */
    async generateBodyText(bodyConfig, options) {
        return {
            default: {
                fontSize: `${options.baseSize}px`,
                fontWeight: bodyConfig.fontWeight || '400',
                lineHeight: this.calculateLineHeight(options.baseSize, 'body'),
                letterSpacing: this.calculateLetterSpacing(options.baseSize)
            },
            large: {
                fontSize: `${options.baseSize * 1.125}px`,
                fontWeight: bodyConfig.fontWeight || '400',
                lineHeight: this.calculateLineHeight(options.baseSize * 1.125, 'body'),
                letterSpacing: this.calculateLetterSpacing(options.baseSize * 1.125)
            },
            small: {
                fontSize: `${options.baseSize * 0.875}px`,
                fontWeight: bodyConfig.fontWeight || '400',
                lineHeight: this.calculateLineHeight(options.baseSize * 0.875, 'body'),
                letterSpacing: this.calculateLetterSpacing(options.baseSize * 0.875)
            }
        };
    }

    /**
     * Generate display text typography
     * @param {Object} displayConfig - Display text configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Display typography
     */
    async generateDisplayText(displayConfig, options) {
        const sizes = ['sm', 'md', 'lg', 'xl'];
        const display = {};

        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const sizeMultiplier = Math.pow(1.5, i + 2);

            display[size] = {
                fontSize: `${options.baseSize * sizeMultiplier}px`,
                fontWeight: displayConfig.fontWeight || '700',
                lineHeight: this.calculateLineHeight(options.baseSize * sizeMultiplier, 'display'),
                letterSpacing: this.calculateLetterSpacing(options.baseSize * sizeMultiplier, 'tight')
            };
        }

        return display;
    }

    /**
     * Generate code text typography
     * @param {Object} codeConfig - Code text configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Code typography
     */
    async generateCodeText(codeConfig, options) {
        return {
            inline: {
                fontSize: `${options.baseSize * 0.875}px`,
                fontFamily: codeConfig.fontFamily || 'monospace',
                fontWeight: codeConfig.fontWeight || '400',
                lineHeight: '1',
                letterSpacing: '0'
            },
            block: {
                fontSize: `${options.baseSize * 0.875}px`,
                fontFamily: codeConfig.fontFamily || 'monospace',
                fontWeight: codeConfig.fontWeight || '400',
                lineHeight: this.calculateLineHeight(options.baseSize * 0.875, 'code'),
                letterSpacing: '0'
            }
        };
    }

    /**
     * Generate responsive typography
     * @param {Object} typography - Base typography
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Responsive typography
     */
    async generateResponsiveTypography(typography, options) {
        if (!options.generateResponsive) {
            return {};
        }

        const responsive = {};
        const breakpoints = options.breakpoints;

        // Generate responsive scales for each breakpoint
        for (const breakpoint of breakpoints) {
            responsive[breakpoint] = await this.generateResponsiveScale(typography, breakpoint, options);
        }

        return { responsive };
    }

    /**
     * Generate responsive scale for specific breakpoint
     * @param {Object} typography - Base typography
     * @param {string} breakpoint - Breakpoint name
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Responsive scale
     */
    async generateResponsiveScale(typography, breakpoint, options) {
        const scale = {};
        const multiplier = this.getBreakpointMultiplier(breakpoint);

        // Scale existing typography for breakpoint
        if (typography.scale) {
            scale.scale = {};
            for (const [sizeName, sizeValue] of Object.entries(typography.scale)) {
                scale.scale[sizeName] = await this.scaleTypography(sizeValue, multiplier);
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
            sm: 0.875,
            md: 1,
            lg: 1.125,
            xl: 1.25
        };

        return multipliers[breakpoint] || 1;
    }

    /**
     * Scale typography values
     * @param {Object} typography - Typography definition
     * @param {number} multiplier - Scale multiplier
     * @returns {Promise<Object>} Scaled typography
     */
    async scaleTypography(typography, multiplier) {
        const scaled = { ...typography };

        if (scaled.fontSize) {
            const fontSize = parseFloat(scaled.fontSize);
            scaled.fontSize = `${fontSize * multiplier}px`;
        }

        if (scaled.lineHeight && !isNaN(parseFloat(scaled.lineHeight))) {
            const lineHeight = parseFloat(scaled.lineHeight);
            scaled.lineHeight = `${lineHeight * multiplier}`;
        }

        return scaled;
    }

    /**
     * Calculate optimal line height for font size
     * @param {number} fontSize - Font size in pixels
     * @param {string} type - Typography type ('body', 'heading', 'display', 'code')
     * @returns {string} Line height value
     */
    calculateLineHeight(fontSize, type = 'body') {
        const ratios = {
            body: 1.5,
            heading: 1.2,
            display: 1.1,
            code: 1.4
        };

        const ratio = ratios[type] || ratios.body;

        // Adjust ratio based on font size
        let adjustedRatio = ratio;
        if (fontSize > 24) {
            adjustedRatio = ratio * 0.9; // Tighter line height for larger text
        } else if (fontSize < 14) {
            adjustedRatio = ratio * 1.1; // Looser line height for smaller text
        }

        return adjustedRatio.toString();
    }

    /**
     * Calculate letter spacing for font size
     * @param {number} fontSize - Font size in pixels
     * @param {string} type - Spacing type ('normal', 'tight', 'wide')
     * @returns {string} Letter spacing value
     */
    calculateLetterSpacing(fontSize, type = 'normal') {
        const baseSpacing = {
            tight: -0.025,
            normal: 0,
            wide: 0.025
        };

        const spacing = baseSpacing[type] || baseSpacing.normal;

        // Scale spacing with font size
        const scaledSpacing = spacing * (fontSize / 16);

        if (scaledSpacing === 0) {
            return 'normal';
        }

        return `${scaledSpacing}em`;
    }

    /**
     * Generate cache key
     * @param {Object} config - Typography configuration
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(config, options) {
        return JSON.stringify({ config, options });
    }

    /**
     * Clear typography generator cache
     */
    clearCache() {
        this.cache.clear();
    }
}
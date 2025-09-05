/**
 * Shadow generator that creates consistent shadow scales,
 * elevation systems, and contextual shadow tokens
 */
export class ShadowGenerator {
    constructor() {
        this.cache = new Map();
        this.defaultOptions = {
            generateElevation: true,
            generateContextual: true,
            generateColors: true,
            baseColor: 'rgba(0, 0, 0, 0.1)',
            elevationSteps: [0, 1, 2, 3, 4, 5],
            ambientLight: 0.4,
            directLight: 0.6
        };
    }

    /**
     * Generate shadow tokens from configuration
     * @param {Object} shadowConfig - Shadow configuration
     * @param {Object} context - Generation context
     * @returns {Promise<Object>} Generated shadow tokens
     */
    async generate(shadowConfig, context = {}) {
        const options = { ...this.defaultOptions, ...context };
        const cacheKey = this.generateCacheKey(shadowConfig, options);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const shadows = {};

        // Process base shadows
        if (shadowConfig.base) {
            Object.assign(shadows, await this.processBaseShadows(shadowConfig.base, options));
        }

        // Generate elevation system
        if (options.generateElevation) {
            Object.assign(shadows, await this.generateElevationSystem(shadowConfig.elevation || {}, options));
        }

        // Generate contextual shadows
        if (options.generateContextual && shadowConfig.contextual) {
            Object.assign(shadows, await this.generateContextualShadows(shadowConfig.contextual, options));
        }

        // Generate colored shadows
        if (options.generateColors && shadowConfig.colors) {
            Object.assign(shadows, await this.generateColoredShadows(shadowConfig.colors, options));
        }

        this.cache.set(cacheKey, shadows);
        return shadows;
    }

    /**
     * Process base shadow definitions
     * @param {Object} baseShadows - Base shadow definitions
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed shadows
     */
    async processBaseShadows(baseShadows, options) {
        const processed = {};

        for (const [shadowName, shadowValue] of Object.entries(baseShadows)) {
            if (typeof shadowValue === 'string') {
                processed[shadowName] = shadowValue;
            } else if (typeof shadowValue === 'object') {
                processed[shadowName] = await this.processShadowObject(shadowValue, options);
            }
        }

        return processed;
    }

    /**
     * Generate elevation system based on Material Design principles
     * @param {Object} elevationConfig - Elevation configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Elevation shadows
     */
    async generateElevationSystem(elevationConfig, options) {
        const elevation = {};
        const steps = elevationConfig.steps || options.elevationSteps;
        const baseColor = elevationConfig.baseColor || options.baseColor;

        for (const step of steps) {
            elevation[step] = this.generateElevationShadow(step, baseColor, options);
        }

        // Generate named elevations
        const namedElevations = {
            none: 0,
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5,
            '2xl': 6
        };

        for (const [name, step] of Object.entries(namedElevations)) {
            if (steps.includes(step)) {
                elevation[name] = elevation[step];
            }
        }

        return { elevation };
    }

    /**
     * Generate single elevation shadow
     * @param {number} level - Elevation level
     * @param {string} baseColor - Base shadow color
     * @param {Object} options - Generation options
     * @returns {string} Shadow CSS value
     */
    generateElevationShadow(level, baseColor, options) {
        if (level === 0) {
            return 'none';
        }

        const shadows = [];

        // Ambient shadow (soft, larger spread)
        const ambientBlur = level * 2;
        const ambientSpread = level * 0.5;
        const ambientOpacity = options.ambientLight * (level / 5);
        const ambientColor = this.adjustShadowColor(baseColor, ambientOpacity);

        shadows.push(`0 ${level}px ${ambientBlur}px ${ambientSpread}px ${ambientColor}`);

        // Direct shadow (sharper, smaller spread)
        const directOffsetY = level * 1.5;
        const directBlur = level * 1.5;
        const directOpacity = options.directLight * (level / 5);
        const directColor = this.adjustShadowColor(baseColor, directOpacity);

        shadows.push(`0 ${directOffsetY}px ${directBlur}px 0 ${directColor}`);

        return shadows.join(', ');
    }

    /**
     * Generate contextual shadows for different use cases
     * @param {Object} contextualConfig - Contextual shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Contextual shadows
     */
    async generateContextualShadows(contextualConfig, options) {
        const contextual = {};

        // Button shadows
        if (contextualConfig.button !== false) {
            contextual.button = await this.generateButtonShadows(contextualConfig.button || {}, options);
        }

        // Card shadows
        if (contextualConfig.card !== false) {
            contextual.card = await this.generateCardShadows(contextualConfig.card || {}, options);
        }

        // Modal shadows
        if (contextualConfig.modal !== false) {
            contextual.modal = await this.generateModalShadows(contextualConfig.modal || {}, options);
        }

        // Dropdown shadows
        if (contextualConfig.dropdown !== false) {
            contextual.dropdown = await this.generateDropdownShadows(contextualConfig.dropdown || {}, options);
        }

        // Focus shadows
        if (contextualConfig.focus !== false) {
            contextual.focus = await this.generateFocusShadows(contextualConfig.focus || {}, options);
        }

        return contextual;
    }

    /**
     * Generate button-specific shadows
     * @param {Object} buttonConfig - Button shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Button shadows
     */
    async generateButtonShadows(buttonConfig, options) {
        return {
            default: '0 2px 4px rgba(0, 0, 0, 0.1)',
            hover: '0 4px 8px rgba(0, 0, 0, 0.15)',
            active: '0 1px 2px rgba(0, 0, 0, 0.1)',
            disabled: 'none'
        };
    }

    /**
     * Generate card-specific shadows
     * @param {Object} cardConfig - Card shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Card shadows
     */
    async generateCardShadows(cardConfig, options) {
        return {
            default: '0 2px 8px rgba(0, 0, 0, 0.1)',
            hover: '0 4px 16px rgba(0, 0, 0, 0.15)',
            active: '0 1px 4px rgba(0, 0, 0, 0.1)'
        };
    }

    /**
     * Generate modal-specific shadows
     * @param {Object} modalConfig - Modal shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Modal shadows
     */
    async generateModalShadows(modalConfig, options) {
        return {
            backdrop: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            content: '0 8px 32px rgba(0, 0, 0, 0.3)'
        };
    }

    /**
     * Generate dropdown-specific shadows
     * @param {Object} dropdownConfig - Dropdown shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Dropdown shadows
     */
    async generateDropdownShadows(dropdownConfig, options) {
        return {
            default: '0 4px 16px rgba(0, 0, 0, 0.15)',
            large: '0 8px 32px rgba(0, 0, 0, 0.2)'
        };
    }

    /**
     * Generate focus-specific shadows
     * @param {Object} focusConfig - Focus shadow configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Focus shadows
     */
    async generateFocusShadows(focusConfig, options) {
        return {
            default: '0 0 0 3px rgba(59, 130, 246, 0.3)',
            error: '0 0 0 3px rgba(239, 68, 68, 0.3)',
            success: '0 0 0 3px rgba(34, 197, 94, 0.3)',
            warning: '0 0 0 3px rgba(245, 158, 11, 0.3)'
        };
    }

    /**
     * Generate colored shadows
     * @param {Object} colorsConfig - Colors configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Colored shadows
     */
    async generateColoredShadows(colorsConfig, options) {
        const coloredShadows = {};

        for (const [colorName, colorValue] of Object.entries(colorsConfig)) {
            coloredShadows[colorName] = await this.generateColorShadowVariants(colorValue, options);
        }

        return { colored: coloredShadows };
    }

    /**
     * Generate shadow variants for a specific color
     * @param {string} color - Base color
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Color shadow variants
     */
    async generateColorShadowVariants(color, options) {
        const variants = {};
        const opacities = [0.1, 0.2, 0.3, 0.4, 0.5];

        for (const opacity of opacities) {
            const shadowColor = this.adjustShadowColor(color, opacity);
            variants[`${Math.round(opacity * 100)}`] = `0 4px 16px ${shadowColor}`;
        }

        return variants;
    }

    /**
     * Process shadow object definition
     * @param {Object} shadowObject - Shadow object
     * @param {Object} options - Generation options
     * @returns {Promise<string|Object>} Processed shadow
     */
    async processShadowObject(shadowObject, options) {
        if (shadowObject.elevation !== undefined) {
            return this.generateElevationShadow(shadowObject.elevation, shadowObject.color || options.baseColor, options);
        }

        if (shadowObject.layers && Array.isArray(shadowObject.layers)) {
            return this.combineShadowLayers(shadowObject.layers);
        }

        if (shadowObject.x !== undefined || shadowObject.y !== undefined) {
            return this.buildShadowFromComponents(shadowObject);
        }

        return shadowObject;
    }

    /**
     * Combine multiple shadow layers
     * @param {Array} layers - Shadow layer definitions
     * @returns {string} Combined shadow CSS
     */
    combineShadowLayers(layers) {
        const shadowStrings = layers.map(layer => {
            if (typeof layer === 'string') {
                return layer;
            }
            return this.buildShadowFromComponents(layer);
        });

        return shadowStrings.join(', ');
    }

    /**
     * Build shadow from individual components
     * @param {Object} components - Shadow components
     * @returns {string} Shadow CSS value
     */
    buildShadowFromComponents(components) {
        const {
            x = 0,
            y = 0,
            blur = 0,
            spread = 0,
            color = 'rgba(0, 0, 0, 0.1)',
            inset = false
        } = components;

        const insetKeyword = inset ? 'inset ' : '';
        return `${insetKeyword}${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    /**
     * Adjust shadow color with opacity
     * @param {string} color - Base color
     * @param {number} opacity - Opacity value (0-1)
     * @returns {string} Adjusted color
     */
    adjustShadowColor(color, opacity) {
        // Handle rgba colors
        if (color.startsWith('rgba(')) {
            const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (rgbaMatch) {
                const [, r, g, b] = rgbaMatch;
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
        }

        // Handle rgb colors
        if (color.startsWith('rgb(')) {
            const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const [, r, g, b] = rgbMatch;
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
        }

        // Handle hex colors
        if (color.startsWith('#')) {
            const rgb = this.hexToRgb(color);
            if (rgb) {
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
            }
        }

        // Fallback to original color
        return color;
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color
     * @returns {Object|null} RGB object or null
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Generate inner shadows (inset)
     * @param {Object} config - Inner shadow configuration
     * @param {Object} options - Generation options
     * @returns {Object} Inner shadows
     */
    generateInnerShadows(config, options) {
        const innerShadows = {};

        const variants = {
            sm: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
            md: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
            lg: 'inset 0 4px 8px rgba(0, 0, 0, 0.1)'
        };

        Object.assign(innerShadows, variants);

        return { inner: innerShadows };
    }

    /**
     * Generate text shadows
     * @param {Object} config - Text shadow configuration
     * @param {Object} options - Generation options
     * @returns {Object} Text shadows
     */
    generateTextShadows(config, options) {
        const textShadows = {};

        const variants = {
            sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
            md: '0 2px 4px rgba(0, 0, 0, 0.5)',
            lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
            outline: '-1px -1px 0 rgba(0, 0, 0, 0.5), 1px -1px 0 rgba(0, 0, 0, 0.5), -1px 1px 0 rgba(0, 0, 0, 0.5), 1px 1px 0 rgba(0, 0, 0, 0.5)'
        };

        Object.assign(textShadows, variants);

        return { text: textShadows };
    }

    /**
     * Generate glow effects
     * @param {Object} config - Glow configuration
     * @param {Object} options - Generation options
     * @returns {Object} Glow effects
     */
    generateGlowEffects(config, options) {
        const glowEffects = {};

        const variants = {
            sm: '0 0 5px currentColor',
            md: '0 0 10px currentColor',
            lg: '0 0 20px currentColor',
            xl: '0 0 40px currentColor'
        };

        Object.assign(glowEffects, variants);

        return { glow: glowEffects };
    }

    /**
     * Generate shadow transitions
     * @param {Object} shadows - Shadow configuration
     * @param {Object} options - Generation options
     * @returns {Object} Shadow transitions
     */
    generateShadowTransitions(shadows, options) {
        return {
            default: 'box-shadow 0.2s ease-in-out',
            fast: 'box-shadow 0.1s ease-in-out',
            slow: 'box-shadow 0.3s ease-in-out'
        };
    }

    /**
     * Validate shadow configuration
     * @param {Object} shadowConfig - Shadow configuration
     * @returns {boolean} Whether configuration is valid
     */
    validateShadowConfig(shadowConfig) {
        if (!shadowConfig || typeof shadowConfig !== 'object') {
            return false;
        }

        // Validate shadow values
        for (const [key, value] of Object.entries(shadowConfig)) {
            if (typeof value === 'string') {
                if (!this.isValidShadowValue(value)) {
                    console.warn(`Invalid shadow value for ${key}: ${value}`);
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if shadow value is valid CSS
     * @param {string} value - Shadow value
     * @returns {boolean} Whether value is valid
     */
    isValidShadowValue(value) {
        // Basic validation for shadow CSS values
        const shadowRegex = /^(inset\s+)?(-?\d+px\s+){2,4}(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)(\s*,\s*(inset\s+)?(-?\d+px\s+){2,4}(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+))*$|^none$/;
        return shadowRegex.test(value.trim());
    }

    /**
     * Generate cache key
     * @param {Object} config - Shadow configuration
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(config, options) {
        return JSON.stringify({ config, options });
    }

    /**
     * Clear shadow generator cache
     */
    clearCache() {
        this.cache.clear();
    }
}
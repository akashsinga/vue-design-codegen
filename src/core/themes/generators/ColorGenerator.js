/**
 * Color generator that creates color scales, variants, and semantic color tokens
 * with accessibility compliance and dynamic palette generation
 */
export class ColorGenerator {
    constructor() {
        this.cache = new Map();
        this.defaultOptions = {
            generatePalette: true,
            generateSemantics: true,
            generateAccessibility: true,
            paletteSteps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
            contrastRatio: 4.5,
            darkMode: false
        };
    }

    /**
     * Generate color tokens from configuration
     * @param {Object} colorConfig - Color configuration
     * @param {Object} context - Generation context
     * @returns {Promise<Object>} Generated color tokens
     */
    async generate(colorConfig, context = {}) {
        const options = { ...this.defaultOptions, ...context };
        const cacheKey = this.generateCacheKey(colorConfig, options);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const colors = {};

        // Process base colors
        if (colorConfig.base) {
            Object.assign(colors, await this.processBaseColors(colorConfig.base, options));
        }

        // Generate color palettes
        if (options.generatePalette && colorConfig.palette) {
            Object.assign(colors, await this.generateColorPalettes(colorConfig.palette, options));
        }

        // Generate semantic colors
        if (options.generateSemantics && colorConfig.semantic) {
            Object.assign(colors, await this.generateSemanticColors(colorConfig.semantic, options));
        }

        // Generate accessibility variants
        if (options.generateAccessibility) {
            Object.assign(colors, await this.generateAccessibilityColors(colors, options));
        }

        // Apply color transformations
        if (colorConfig.transformations) {
            await this.applyColorTransformations(colors, colorConfig.transformations, options);
        }

        this.cache.set(cacheKey, colors);
        return colors;
    }

    /**
     * Process base color definitions
     * @param {Object} baseColors - Base color definitions
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed base colors
     */
    async processBaseColors(baseColors, options) {
        const processed = {};

        for (const [colorName, colorValue] of Object.entries(baseColors)) {
            if (typeof colorValue === 'string') {
                processed[colorName] = colorValue;
            } else if (typeof colorValue === 'object') {
                processed[colorName] = await this.processColorObject(colorValue, options);
            }
        }

        return processed;
    }

    /**
     * Generate color palettes from base colors
     * @param {Object} paletteConfig - Palette configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated color palettes
     */
    async generateColorPalettes(paletteConfig, options) {
        const palettes = {};

        for (const [paletteName, baseColor] of Object.entries(paletteConfig)) {
            palettes[paletteName] = await this.generateColorScale(baseColor, options);
        }

        return palettes;
    }

    /**
     * Generate a color scale from a base color
     * @param {string} baseColor - Base color value
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Color scale
     */
    async generateColorScale(baseColor, options) {
        const scale = {};
        const steps = options.paletteSteps;

        for (const step of steps) {
            const lightness = this.calculateLightness(step);
            scale[step] = this.adjustColorLightness(baseColor, lightness);
        }

        return scale;
    }

    /**
     * Generate semantic color tokens
     * @param {Object} semanticConfig - Semantic color configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Semantic colors
     */
    async generateSemanticColors(semanticConfig, options) {
        const semantics = {};

        // Standard semantic colors
        const semanticTypes = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

        for (const type of semanticTypes) {
            if (semanticConfig[type]) {
                semantics[type] = await this.generateSemanticVariants(
                    semanticConfig[type],
                    type,
                    options
                );
            }
        }

        // Custom semantic colors
        for (const [semanticName, semanticValue] of Object.entries(semanticConfig)) {
            if (!semanticTypes.includes(semanticName)) {
                semantics[semanticName] = await this.generateSemanticVariants(
                    semanticValue,
                    semanticName,
                    options
                );
            }
        }

        return semantics;
    }

    /**
     * Generate semantic color variants
     * @param {string} baseColor - Base semantic color
     * @param {string} semanticType - Type of semantic color
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Semantic color variants
     */
    async generateSemanticVariants(baseColor, semanticType, options) {
        const variants = {
            base: baseColor,
            light: this.lightenColor(baseColor, 0.2),
            lighter: this.lightenColor(baseColor, 0.4),
            dark: this.darkenColor(baseColor, 0.2),
            darker: this.darkenColor(baseColor, 0.4)
        };

        // Add contrast variants for accessibility
        variants.contrast = await this.generateContrastColor(baseColor, options.contrastRatio);
        variants.onColor = await this.generateOnColor(baseColor, options);

        return variants;
    }

    /**
     * Generate accessibility-compliant colors
     * @param {Object} colors - Existing colors
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Accessibility colors
     */
    async generateAccessibilityColors(colors, options) {
        const accessibility = {};

        // Generate high contrast variants
        for (const [colorName, colorValue] of Object.entries(colors)) {
            if (typeof colorValue === 'string') {
                accessibility[`${colorName}HighContrast`] = await this.ensureContrast(
                    colorValue,
                    options.contrastRatio
                );
            }
        }

        return accessibility;
    }

    /**
     * Apply color transformations
     * @param {Object} colors - Color object to transform
     * @param {Object} transformations - Transformation definitions
     * @param {Object} options - Generation options
     * @returns {Promise<void>}
     */
    async applyColorTransformations(colors, transformations, options) {
        for (const [transformName, transformation] of Object.entries(transformations)) {
            if (typeof transformation === 'function') {
                const result = transformation(colors, options);
                if (result) {
                    Object.assign(colors, result);
                }
            }
        }
    }

    /**
     * Process color object with variants
     * @param {Object} colorObject - Color object definition
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Processed color object
     */
    async processColorObject(colorObject, options) {
        if (colorObject.base) {
            // Generate variants from base color
            return await this.generateSemanticVariants(colorObject.base, 'custom', options);
        }

        if (colorObject.palette) {
            // Generate palette from base
            return await this.generateColorScale(colorObject.palette, options);
        }

        return colorObject;
    }

    /**
     * Calculate lightness value for palette step
     * @param {number} step - Palette step (0-900)
     * @returns {number} Lightness value (0-1)
     */
    calculateLightness(step) {
        // Convert step to lightness value
        // 50 = lightest, 900 = darkest
        const normalized = step / 900;
        return 1 - normalized;
    }

    /**
     * Adjust color lightness
     * @param {string} color - Base color
     * @param {number} lightness - Target lightness (0-1)
     * @returns {string} Adjusted color
     */
    adjustColorLightness(color, lightness) {
        // Simple HSL lightness adjustment
        // In production, use a proper color manipulation library
        const hsl = this.hexToHsl(color);
        if (hsl) {
            hsl.l = lightness;
            return this.hslToHex(hsl);
        }
        return color;
    }

    /**
     * Lighten a color by percentage
     * @param {string} color - Color to lighten
     * @param {number} amount - Amount to lighten (0-1)
     * @returns {string} Lightened color
     */
    lightenColor(color, amount) {
        const hsl = this.hexToHsl(color);
        if (hsl) {
            hsl.l = Math.min(1, hsl.l + amount);
            return this.hslToHex(hsl);
        }
        return color;
    }

    /**
     * Darken a color by percentage
     * @param {string} color - Color to darken
     * @param {number} amount - Amount to darken (0-1)
     * @returns {string} Darkened color
     */
    darkenColor(color, amount) {
        const hsl = this.hexToHsl(color);
        if (hsl) {
            hsl.l = Math.max(0, hsl.l - amount);
            return this.hslToHex(hsl);
        }
        return color;
    }

    /**
     * Generate contrast color for accessibility
     * @param {string} baseColor - Base color
     * @param {number} contrastRatio - Required contrast ratio
     * @returns {Promise<string>} Contrast color
     */
    async generateContrastColor(baseColor, contrastRatio) {
        const luminance = this.calculateLuminance(baseColor);

        if (luminance > 0.5) {
            // Light background, use dark text
            return this.findContrastColor(baseColor, contrastRatio, 'dark');
        } else {
            // Dark background, use light text
            return this.findContrastColor(baseColor, contrastRatio, 'light');
        }
    }

    /**
     * Generate on-color (text color for backgrounds)
     * @param {string} backgroundColor - Background color
     * @param {Object} options - Generation options
     * @returns {Promise<string>} On-color
     */
    async generateOnColor(backgroundColor, options) {
        const luminance = this.calculateLuminance(backgroundColor);

        if (luminance > 0.5) {
            return options.darkMode ? '#ffffff' : '#000000';
        } else {
            return options.darkMode ? '#000000' : '#ffffff';
        }
    }

    /**
     * Ensure color meets contrast requirements
     * @param {string} color - Color to check
     * @param {number} contrastRatio - Required contrast ratio
     * @returns {Promise<string>} Contrast-compliant color
     */
    async ensureContrast(color, contrastRatio) {
        // Simplified contrast enforcement
        // In production, implement proper WCAG contrast calculation
        const luminance = this.calculateLuminance(color);

        if (luminance < 0.5) {
            return this.lightenColor(color, 0.3);
        } else {
            return this.darkenColor(color, 0.3);
        }
    }

    /**
     * Find color that meets contrast ratio
     * @param {string} baseColor - Base color
     * @param {number} contrastRatio - Required contrast ratio
     * @param {string} direction - 'light' or 'dark'
     * @returns {string} Contrast color
     */
    findContrastColor(baseColor, contrastRatio, direction) {
        // Simplified contrast color finding
        if (direction === 'dark') {
            return '#000000';
        } else {
            return '#ffffff';
        }
    }

    /**
     * Calculate color luminance
     * @param {string} color - Color value
     * @returns {number} Luminance value (0-1)
     */
    calculateLuminance(color) {
        // Simplified luminance calculation
        const rgb = this.hexToRgb(color);
        if (!rgb) return 0.5;

        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color
     * @returns {Object|null} RGB object or null
     */
    hexToRgb(hex) {
        if (!hex || !hex.startsWith('#')) return null;

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert hex color to HSL
     * @param {string} hex - Hex color
     * @returns {Object|null} HSL object or null
     */
    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return null;

        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h, s, l };
    }

    /**
     * Convert HSL to hex color
     * @param {Object} hsl - HSL object
     * @returns {string} Hex color
     */
    hslToHex({ h, s, l }) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        const toHex = c => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Generate cache key
     * @param {Object} config - Color configuration
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(config, options) {
        return JSON.stringify({ config, options });
    }

    /**
     * Clear color generator cache
     */
    clearCache() {
        this.cache.clear();
    }
}
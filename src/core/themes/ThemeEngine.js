import { ColorGenerator } from './generators/ColorGenerator.js';
import { TypographyGenerator } from './generators/TypographyGenerator.js';
import { SpacingGenerator } from './generators/SpacingGenerator.js';
import { ShadowGenerator } from './generators/ShadowGenerator.js';
import { ThemeCompiler } from './generators/ThemeCompiler.js';

/**
 * Theme engine that processes theme configurations and generates
 * design tokens, CSS variables, and optimized theme styles
 */
export class ThemeEngine {
    constructor() {
        // Initialize generators
        this.colorGenerator = new ColorGenerator();
        this.typographyGenerator = new TypographyGenerator();
        this.spacingGenerator = new SpacingGenerator();
        this.shadowGenerator = new ShadowGenerator();
        this.themeCompiler = new ThemeCompiler();

        // Token cache for performance
        this.tokenCache = new Map();
        this.cssCache = new Map();
        this.generationCache = new Map();

        // Generator registry for extensibility
        this.generators = new Map([
            ['colors', this.colorGenerator],
            ['typography', this.typographyGenerator],
            ['spacing', this.spacingGenerator],
            ['shadows', this.shadowGenerator]
        ]);

        // Processing statistics
        this.stats = {
            tokensGenerated: 0,
            cssGenerated: 0,
            cacheHits: 0,
            cacheMisses: 0,
            generationTime: 0
        };

        // Configuration
        this.options = {
            cache: true,
            optimization: true,
            sourcemaps: false,
            minify: false
        };
    }

    /**
     * Generate complete theme tokens from theme configuration
     * @param {Object} themeConfig - Theme configuration
     * @param {Object} options - Generation options
     * @returns {Promise<Map>} Generated theme tokens
     */
    async generateThemeTokens(themeConfig, options = {}) {
        const startTime = Date.now();

        try {
            const cacheKey = this.generateCacheKey('tokens', themeConfig, options);

            // Check cache first
            if (this.options.cache && this.tokenCache.has(cacheKey)) {
                this.stats.cacheHits++;
                return this.tokenCache.get(cacheKey);
            }

            this.stats.cacheMisses++;

            // Generate tokens for each category
            const tokens = new Map();
            const processingOptions = { ...this.options, ...options };

            // Process base tokens first
            if (themeConfig.tokens) {
                await this.processBaseTokens(themeConfig.tokens, tokens, processingOptions);
            }

            // Generate category-specific tokens
            for (const [category, generator] of this.generators) {
                if (themeConfig[category] || themeConfig.tokens?.[category]) {
                    const categoryTokens = await this.generateCategoryTokens(
                        category,
                        themeConfig,
                        tokens,
                        processingOptions
                    );

                    if (categoryTokens && Object.keys(categoryTokens).length > 0) {
                        tokens.set(category, categoryTokens);
                    }
                }
            }

            // Process computed tokens
            await this.processComputedTokens(themeConfig, tokens, processingOptions);

            // Apply token transformations
            await this.applyTokenTransformations(tokens, themeConfig, processingOptions);

            // Cache the result
            if (this.options.cache) {
                this.tokenCache.set(cacheKey, tokens);
            }

            this.stats.tokensGenerated += this.countTokens(tokens);
            this.stats.generationTime += Date.now() - startTime;

            return tokens;
        } catch (error) {
            throw new Error(`Theme token generation failed: ${error.message}`);
        }
    }

    /**
     * Process base tokens from theme configuration
     * @param {Object} baseTokens - Base token definitions
     * @param {Map} tokens - Tokens map to populate
     * @param {Object} options - Processing options
     * @returns {Promise<void>}
     */
    async processBaseTokens(baseTokens, tokens, options) {
        for (const [category, categoryTokens] of Object.entries(baseTokens)) {
            if (typeof categoryTokens === 'object' && categoryTokens !== null) {
                const processedTokens = await this.processTokenCategory(
                    category,
                    categoryTokens,
                    tokens,
                    options
                );

                tokens.set(category, processedTokens);
            }
        }
    }

    /**
     * Process a single token category
     * @param {string} category - Token category name
     * @param {Object} categoryTokens - Category token definitions
     * @param {Map} allTokens - All tokens for reference resolution
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processed tokens
     */
    async processTokenCategory(category, categoryTokens, allTokens, options) {
        const processed = {};

        for (const [tokenName, tokenValue] of Object.entries(categoryTokens)) {
            processed[tokenName] = await this.processTokenValue(
                tokenValue,
                category,
                tokenName,
                allTokens,
                options
            );
        }

        return processed;
    }

    /**
     * Process individual token value with reference resolution
     * @param {*} tokenValue - Token value to process
     * @param {string} category - Token category
     * @param {string} tokenName - Token name
     * @param {Map} allTokens - All tokens for reference resolution
     * @param {Object} options - Processing options
     * @returns {Promise<*>} Processed token value
     */
    async processTokenValue(tokenValue, category, tokenName, allTokens, options) {
        // Handle token references
        if (typeof tokenValue === 'string' && tokenValue.startsWith('$')) {
            return this.resolveTokenReference(tokenValue, allTokens);
        }

        // Handle computed tokens
        if (typeof tokenValue === 'function') {
            return tokenValue(allTokens, { category, tokenName, options });
        }

        // Handle object with compute function
        if (typeof tokenValue === 'object' && tokenValue !== null && tokenValue.compute) {
            return tokenValue.compute(allTokens, { category, tokenName, options });
        }

        // Handle token transformations
        if (typeof tokenValue === 'object' && tokenValue !== null && tokenValue.transform) {
            const baseValue = await this.processTokenValue(
                tokenValue.value,
                category,
                tokenName,
                allTokens,
                options
            );
            return this.applyTokenTransformation(baseValue, tokenValue.transform, options);
        }

        return tokenValue;
    }

    /**
     * Generate category-specific tokens using generators
     * @param {string} category - Token category
     * @param {Object} themeConfig - Theme configuration
     * @param {Map} existingTokens - Existing tokens
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated category tokens
     */
    async generateCategoryTokens(category, themeConfig, existingTokens, options) {
        const generator = this.generators.get(category);

        if (!generator) {
            return themeConfig[category] || themeConfig.tokens?.[category] || {};
        }

        try {
            // Get base configuration for the category
            const baseConfig = themeConfig[category] || themeConfig.tokens?.[category] || {};

            // Generate tokens using the specific generator
            const generatedTokens = await generator.generate(baseConfig, {
                themeConfig,
                existingTokens,
                category,
                ...options
            });

            return generatedTokens;
        } catch (error) {
            console.warn(`Category token generation failed for ${category}:`, error.message);
            return themeConfig[category] || themeConfig.tokens?.[category] || {};
        }
    }

    /**
     * Process computed tokens that depend on other tokens
     * @param {Object} themeConfig - Theme configuration
     * @param {Map} tokens - Generated tokens
     * @param {Object} options - Processing options
     * @returns {Promise<void>}
     */
    async processComputedTokens(themeConfig, tokens, options) {
        if (!themeConfig.computed) return;

        const computedTokens = {};

        for (const [tokenName, computation] of Object.entries(themeConfig.computed)) {
            try {
                if (typeof computation === 'function') {
                    computedTokens[tokenName] = computation(tokens, themeConfig, options);
                } else if (typeof computation === 'object' && computation.compute) {
                    computedTokens[tokenName] = computation.compute(tokens, themeConfig, options);
                }
            } catch (error) {
                console.warn(`Computed token '${tokenName}' generation failed:`, error.message);
            }
        }

        if (Object.keys(computedTokens).length > 0) {
            tokens.set('computed', computedTokens);
        }
    }

    /**
     * Apply token transformations
     * @param {Map} tokens - Token map
     * @param {Object} themeConfig - Theme configuration
     * @param {Object} options - Processing options
     * @returns {Promise<void>}
     */
    async applyTokenTransformations(tokens, themeConfig, options) {
        if (!themeConfig.transformations) return;

        for (const [category, transformations] of Object.entries(themeConfig.transformations)) {
            const categoryTokens = tokens.get(category);
            if (!categoryTokens) continue;

            for (const [tokenName, transformation] of Object.entries(transformations)) {
                if (categoryTokens[tokenName] !== undefined) {
                    categoryTokens[tokenName] = await this.applyTokenTransformation(
                        categoryTokens[tokenName],
                        transformation,
                        options
                    );
                }
            }
        }
    }

    /**
     * Apply a single token transformation
     * @param {*} value - Token value
     * @param {*} transformation - Transformation to apply
     * @param {Object} options - Processing options
     * @returns {Promise<*>} Transformed value
     */
    async applyTokenTransformation(value, transformation, options) {
        if (typeof transformation === 'function') {
            return transformation(value, options);
        }

        if (typeof transformation === 'object' && transformation !== null) {
            if (transformation.type === 'scale') {
                return this.scaleValue(value, transformation.factor || 1);
            }

            if (transformation.type === 'darken') {
                return this.darkenColor(value, transformation.amount || 0.1);
            }

            if (transformation.type === 'lighten') {
                return this.lightenColor(value, transformation.amount || 0.1);
            }

            if (transformation.type === 'alpha') {
                return this.setAlpha(value, transformation.alpha || 1);
            }
        }

        return value;
    }

    /**
     * Generate CSS from theme tokens
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated CSS
     */
    async generateCSS(tokens, options = {}) {
        const startTime = Date.now();

        try {
            const cacheKey = this.generateCacheKey('css', tokens, options);

            // Check CSS cache
            if (this.options.cache && this.cssCache.has(cacheKey)) {
                this.stats.cacheHits++;
                return this.cssCache.get(cacheKey);
            }

            this.stats.cacheMisses++;

            // Use theme compiler to generate CSS
            const css = await this.themeCompiler.compile(tokens, {
                minify: options.minify || this.options.minify,
                sourcemap: options.sourcemap || this.options.sourcemaps,
                prefix: options.prefix || 'ds',
                theme: options.theme,
                ...options
            });

            // Cache the result
            if (this.options.cache) {
                this.cssCache.set(cacheKey, css);
            }

            this.stats.cssGenerated++;
            this.stats.generationTime += Date.now() - startTime;

            return css;
        } catch (error) {
            throw new Error(`CSS generation failed: ${error.message}`);
        }
    }

    /**
     * Resolve token reference
     * @param {string} reference - Token reference (e.g., "$colors.primary")
     * @param {Map} tokens - All available tokens
     * @returns {*} Resolved token value
     */
    resolveTokenReference(reference, tokens) {
        const path = reference.slice(1).split('.');
        let current = tokens;

        for (const segment of path) {
            if (current instanceof Map) {
                current = current.get(segment);
            } else if (typeof current === 'object' && current !== null) {
                current = current[segment];
            } else {
                return undefined;
            }

            if (current === undefined) {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Scale a numeric value
     * @param {*} value - Value to scale
     * @param {number} factor - Scale factor
     * @returns {*} Scaled value
     */
    scaleValue(value, factor) {
        if (typeof value === 'number') {
            return value * factor;
        }

        if (typeof value === 'string') {
            const match = value.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)$/);
            if (match) {
                const [, num, unit] = match;
                return `${parseFloat(num) * factor}${unit}`;
            }
        }

        return value;
    }

    /**
     * Darken a color value
     * @param {string} color - Color to darken
     * @param {number} amount - Darken amount (0-1)
     * @returns {string} Darkened color
     */
    darkenColor(color, amount) {
        // Simple darkening implementation
        // In production, would use a proper color manipulation library
        if (typeof color === 'string' && color.startsWith('#')) {
            const hex = color.slice(1);
            const num = parseInt(hex, 16);
            const amt = Math.round(2.55 * amount * 100);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
        }

        return color;
    }

    /**
     * Lighten a color value
     * @param {string} color - Color to lighten
     * @param {number} amount - Lighten amount (0-1)
     * @returns {string} Lightened color
     */
    lightenColor(color, amount) {
        // Simple lightening implementation
        if (typeof color === 'string' && color.startsWith('#')) {
            const hex = color.slice(1);
            const num = parseInt(hex, 16);
            const amt = Math.round(2.55 * amount * 100);
            const R = Math.min(255, (num >> 16) + amt);
            const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
            const B = Math.min(255, (num & 0x0000FF) + amt);
            return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
        }

        return color;
    }

    /**
     * Set alpha transparency on a color
     * @param {string} color - Color to modify
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} Color with alpha
     */
    setAlpha(color, alpha) {
        // Convert to rgba format
        if (typeof color === 'string' && color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        return color;
    }

    /**
     * Register a custom generator
     * @param {string} category - Category name
     * @param {Object} generator - Generator instance
     */
    registerGenerator(category, generator) {
        this.generators.set(category, generator);
    }

    /**
     * Unregister a generator
     * @param {string} category - Category name
     */
    unregisterGenerator(category) {
        this.generators.delete(category);
    }

    /**
     * Count total number of tokens in token map
     * @param {Map} tokens - Token map
     * @returns {number} Total token count
     */
    countTokens(tokens) {
        let count = 0;

        for (const categoryTokens of tokens.values()) {
            if (typeof categoryTokens === 'object' && categoryTokens !== null) {
                count += Object.keys(categoryTokens).length;
            }
        }

        return count;
    }

    /**
     * Generate cache key for caching
     * @param {string} type - Cache type ('tokens' or 'css')
     * @param {*} data - Data to cache
     * @param {Object} options - Options object
     * @returns {string} Cache key
     */
    generateCacheKey(type, data, options) {
        const dataHash = JSON.stringify(data);
        const optionsHash = JSON.stringify(options);
        return `${type}:${dataHash}:${optionsHash}`;
    }

    /**
     * Get theme engine statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.tokenCache.size + this.cssCache.size,
            registeredGenerators: this.generators.size
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.tokenCache.clear();
        this.cssCache.clear();
        this.generationCache.clear();

        // Clear generator caches
        for (const generator of this.generators.values()) {
            if (generator.clearCache) {
                generator.clearCache();
            }
        }
    }

    /**
     * Configure theme engine options
     * @param {Object} options - Configuration options
     */
    configure(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Reset theme engine statistics
     */
    resetStats() {
        this.stats = {
            tokensGenerated: 0,
            cssGenerated: 0,
            cacheHits: 0,
            cacheMisses: 0,
            generationTime: 0
        };
    }
}
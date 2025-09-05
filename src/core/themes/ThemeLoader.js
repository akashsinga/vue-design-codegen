import { ConfigurationLoader } from '../ConfigurationLoader.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Theme loader that manages dynamic loading of theme configurations
 * with validation, inheritance, and token generation
 */
export class ThemeLoader {
    constructor() {
        this.configLoader = new ConfigurationLoader();
        this.themes = new Map();
        this.themeCache = new Map();
        this.inheritanceChain = new Map();
        this.validationRules = new Map();
        this.availableThemes = new Set();

        // Theme metadata
        this.themeMetadata = new Map();

        // Generation statistics
        this.stats = {
            loaded: 0,
            generated: 0,
            cached: 0,
            errors: 0
        };
    }

    /**
     * Load a single theme configuration with validation and inheritance
     * @param {string} themeName - Name of the theme to load
     * @param {string} configsPath - Path to theme configurations directory
     * @returns {Promise<Object>} Loaded theme configuration
     */
    async loadTheme(themeName, configsPath = 'src/config/themes') {
        try {
            const themeConfigPath = path.join(configsPath, `${themeName}.config.js`);

            // Check if theme config exists
            if (!await fs.pathExists(themeConfigPath)) {
                throw new Error(`Theme configuration not found: ${themeName}`);
            }

            // Load theme configuration with validation
            const themeConfig = await this.configLoader.loadConfig(themeConfigPath);

            // Process inheritance if specified
            const processedConfig = await this.processThemeInheritance(themeConfig, configsPath);

            // Validate theme configuration
            await this.validateThemeConfig(processedConfig, themeName);

            // Cache the theme
            this.themes.set(themeName, processedConfig);
            this.availableThemes.add(themeName);

            // Store theme metadata
            this.themeMetadata.set(themeName, {
                name: themeName,
                config: processedConfig,
                loaded: true,
                extends: processedConfig.extends || null,
                category: processedConfig.category || 'custom',
                description: processedConfig.description || '',
                version: processedConfig.version || '1.0.0',
                author: processedConfig.author || 'Unknown',
                variants: processedConfig.variants || []
            });

            this.stats.loaded++;

            return processedConfig;
        } catch (error) {
            this.stats.errors++;
            throw new Error(`Failed to load theme ${themeName}: ${error.message}`);
        }
    }

    /**
     * Load multiple theme configurations
     * @param {string[]} themeNames - Array of theme names to load
     * @param {string} configsPath - Path to theme configurations directory
     * @returns {Promise<Map>} Map of theme names to configurations
     */
    async loadThemes(themeNames, configsPath = 'src/config/themes') {
        const loadPromises = themeNames.map(name =>
            this.loadTheme(name, configsPath)
        );

        await Promise.all(loadPromises);
        return this.themes;
    }

    /**
     * Load all themes from the configurations directory
     * @param {string} configsPath - Path to theme configurations directory
     * @returns {Promise<Map>} Map of all loaded themes
     */
    async loadAllThemes(configsPath = 'src/config/themes') {
        try {
            const configFiles = await fs.readdir(configsPath);
            const themeFiles = configFiles.filter(file =>
                file.endsWith('.config.js') && !file.startsWith('.')
            );

            const themeNames = themeFiles.map(file =>
                path.basename(file, '.config.js')
            );

            return await this.loadThemes(themeNames, configsPath);
        } catch (error) {
            throw new Error(`Failed to load all themes: ${error.message}`);
        }
    }

    /**
     * Process theme inheritance hierarchy
     * @param {Object} themeConfig - Theme configuration
     * @param {string} configsPath - Path to configurations directory
     * @returns {Promise<Object>} Processed configuration with inheritance applied
     */
    async processThemeInheritance(themeConfig, configsPath) {
        if (!themeConfig.extends) {
            return themeConfig;
        }

        const parentName = themeConfig.extends;
        const inheritanceKey = `${themeConfig.name || 'unknown'}_${parentName}`;

        // Check for circular inheritance
        if (this.inheritanceChain.has(inheritanceKey)) {
            throw new Error(`Circular inheritance detected: ${inheritanceKey}`);
        }

        this.inheritanceChain.set(inheritanceKey, true);

        try {
            // Load parent configuration
            const parentConfig = await this.loadTheme(parentName, configsPath);

            // Merge configurations with child overriding parent
            const mergedConfig = this.mergeThemeConfigurations(parentConfig, themeConfig);

            this.inheritanceChain.delete(inheritanceKey);
            return mergedConfig;
        } catch (error) {
            this.inheritanceChain.delete(inheritanceKey);
            throw new Error(`Failed to process inheritance from ${parentName}: ${error.message}`);
        }
    }

    /**
     * Merge parent and child theme configurations
     * @param {Object} parentConfig - Parent theme configuration
     * @param {Object} childConfig - Child theme configuration
     * @returns {Object} Merged configuration
     */
    mergeThemeConfigurations(parentConfig, childConfig) {
        const merged = { ...parentConfig };

        // Merge design tokens with deep merge
        if (childConfig.tokens) {
            merged.tokens = this.deepMergeTokens(
                merged.tokens || {},
                childConfig.tokens
            );
        }

        // Merge color scales
        if (childConfig.colors) {
            merged.colors = {
                ...merged.colors,
                ...childConfig.colors
            };
        }

        // Merge typography
        if (childConfig.typography) {
            merged.typography = {
                ...merged.typography,
                ...childConfig.typography
            };
        }

        // Merge spacing
        if (childConfig.spacing) {
            merged.spacing = {
                ...merged.spacing,
                ...childConfig.spacing
            };
        }

        // Merge shadows
        if (childConfig.shadows) {
            merged.shadows = {
                ...merged.shadows,
                ...childConfig.shadows
            };
        }

        // Merge animations
        if (childConfig.animations) {
            merged.animations = {
                ...merged.animations,
                ...childConfig.animations
            };
        }

        // Override other properties
        const overrideFields = [
            'name', 'description', 'category', 'version', 'author',
            'variants', 'breakpoints', 'zIndex', 'borderRadius'
        ];

        for (const field of overrideFields) {
            if (childConfig[field] !== undefined) {
                merged[field] = childConfig[field];
            }
        }

        // Combine variants
        if (childConfig.variants) {
            merged.variants = [
                ...(merged.variants || []),
                ...childConfig.variants
            ].filter((variant, index, arr) => arr.indexOf(variant) === index); // Remove duplicates
        }

        return merged;
    }

    /**
     * Deep merge design tokens
     * @param {Object} parentTokens - Parent tokens
     * @param {Object} childTokens - Child tokens
     * @returns {Object} Merged tokens
     */
    deepMergeTokens(parentTokens, childTokens) {
        const merged = { ...parentTokens };

        for (const [category, categoryTokens] of Object.entries(childTokens)) {
            if (typeof categoryTokens === 'object' && categoryTokens !== null) {
                if (merged[category] && typeof merged[category] === 'object') {
                    merged[category] = {
                        ...merged[category],
                        ...categoryTokens
                    };
                } else {
                    merged[category] = categoryTokens;
                }
            } else {
                merged[category] = categoryTokens;
            }
        }

        return merged;
    }

    /**
     * Validate theme configuration using embedded validation rules
     * @param {Object} themeConfig - Theme configuration to validate
     * @param {string} themeName - Theme name for error reporting
     * @returns {Promise<void>}
     */
    async validateThemeConfig(themeConfig, themeName) {
        // Required theme fields
        const requiredFields = ['name', 'tokens'];

        for (const field of requiredFields) {
            if (!(field in themeConfig)) {
                throw new Error(`Required field '${field}' missing in theme ${themeName}`);
            }
        }

        // Validate tokens structure
        if (!themeConfig.tokens || typeof themeConfig.tokens !== 'object') {
            throw new Error(`Invalid tokens structure in theme ${themeName}`);
        }

        // Validate token categories
        await this.validateTokenCategories(themeConfig.tokens, themeName);

        // Validate colors if present
        if (themeConfig.colors) {
            await this.validateColors(themeConfig.colors, themeName);
        }

        // Validate typography if present
        if (themeConfig.typography) {
            await this.validateTypography(themeConfig.typography, themeName);
        }

        // Validate spacing if present
        if (themeConfig.spacing) {
            await this.validateSpacing(themeConfig.spacing, themeName);
        }

        // Run theme-specific validation if provided
        if (themeConfig.validate && typeof themeConfig.validate === 'function') {
            const validationResult = await themeConfig.validate(themeConfig);
            if (validationResult !== true) {
                throw new Error(`Theme validation failed for ${themeName}: ${validationResult}`);
            }
        }

        // Store validation rules for runtime use
        if (themeConfig.validationRules) {
            this.validationRules.set(themeName, themeConfig.validationRules);
        }
    }

    /**
     * Validate token categories
     * @param {Object} tokens - Tokens object
     * @param {string} themeName - Theme name for error reporting
     * @returns {Promise<void>}
     */
    async validateTokenCategories(tokens, themeName) {
        const validCategories = [
            'colors', 'typography', 'spacing', 'shadows', 'borders',
            'animations', 'zIndex', 'breakpoints', 'opacity'
        ];

        for (const [category, categoryTokens] of Object.entries(tokens)) {
            if (!validCategories.includes(category)) {
                console.warn(`Unknown token category '${category}' in theme ${themeName}`);
            }

            if (typeof categoryTokens !== 'object' || categoryTokens === null) {
                throw new Error(`Invalid token category '${category}' in theme ${themeName}`);
            }
        }
    }

    /**
     * Validate color definitions
     * @param {Object} colors - Colors object
     * @param {string} themeName - Theme name for error reporting
     * @returns {Promise<void>}
     */
    async validateColors(colors, themeName) {
        for (const [colorName, colorValue] of Object.entries(colors)) {
            if (typeof colorValue === 'object') {
                // Color palette with variants
                for (const [variant, value] of Object.entries(colorValue)) {
                    if (!this.isValidColor(value)) {
                        throw new Error(`Invalid color value '${value}' for ${colorName}.${variant} in theme ${themeName}`);
                    }
                }
            } else {
                // Single color value
                if (!this.isValidColor(colorValue)) {
                    throw new Error(`Invalid color value '${colorValue}' for ${colorName} in theme ${themeName}`);
                }
            }
        }
    }

    /**
     * Validate typography definitions
     * @param {Object} typography - Typography object
     * @param {string} themeName - Theme name for error reporting
     * @returns {Promise<void>}
     */
    async validateTypography(typography, themeName) {
        const requiredTypographyFields = ['fontFamily', 'fontSize', 'lineHeight'];

        for (const [typographyName, typographyValue] of Object.entries(typography)) {
            if (typeof typographyValue === 'object') {
                for (const field of requiredTypographyFields) {
                    if (!(field in typographyValue)) {
                        console.warn(`Missing typography field '${field}' for ${typographyName} in theme ${themeName}`);
                    }
                }
            }
        }
    }

    /**
     * Validate spacing definitions
     * @param {Object} spacing - Spacing object
     * @param {string} themeName - Theme name for error reporting
     * @returns {Promise<void>}
     */
    async validateSpacing(spacing, themeName) {
        for (const [spacingName, spacingValue] of Object.entries(spacing)) {
            if (!this.isValidSize(spacingValue)) {
                throw new Error(`Invalid spacing value '${spacingValue}' for ${spacingName} in theme ${themeName}`);
            }
        }
    }

    /**
     * Check if a color value is valid
     * @param {string} color - Color value to validate
     * @returns {boolean} Whether color is valid
     */
    isValidColor(color) {
        // Basic color validation - could be enhanced with more sophisticated checks
        const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+).*$/;
        return typeof color === 'string' && colorRegex.test(color);
    }

    /**
     * Check if a size value is valid
     * @param {string} size - Size value to validate
     * @returns {boolean} Whether size is valid
     */
    isValidSize(size) {
        // Basic size validation
        const sizeRegex = /^(\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax)|0)$/;
        return typeof size === 'string' && sizeRegex.test(size);
    }

    /**
     * Get theme configuration by name
     * @param {string} themeName - Theme name
     * @returns {Object|null} Theme configuration or null if not loaded
     */
    getTheme(themeName) {
        return this.themes.get(themeName) || null;
    }

    /**
     * Check if a theme is loaded
     * @param {string} themeName - Theme name to check
     * @returns {boolean} Whether the theme is loaded
     */
    isThemeLoaded(themeName) {
        return this.themes.has(themeName);
    }

    /**
     * Get all loaded theme names
     * @returns {string[]} Array of loaded theme names
     */
    getLoadedThemes() {
        return Array.from(this.themes.keys());
    }

    /**
     * Get all available theme names
     * @returns {string[]} Array of available theme names
     */
    getAvailableThemes() {
        return Array.from(this.availableThemes);
    }

    /**
     * Get theme metadata
     * @param {string} themeName - Theme name
     * @returns {Object|null} Theme metadata or null if not found
     */
    getThemeMetadata(themeName) {
        return this.themeMetadata.get(themeName) || null;
    }

    /**
     * Get themes by category
     * @param {string} category - Theme category
     * @returns {string[]} Theme names in category
     */
    getThemesByCategory(category) {
        const themes = [];

        for (const [name, metadata] of this.themeMetadata) {
            if (metadata.category === category) {
                themes.push(name);
            }
        }

        return themes;
    }

    /**
     * Get all theme categories
     * @returns {string[]} Available categories
     */
    getCategories() {
        const categories = new Set();

        for (const metadata of this.themeMetadata.values()) {
            categories.add(metadata.category);
        }

        return Array.from(categories);
    }

    /**
     * Get theme imports required for a theme
     * @param {string} themeName - Theme name
     * @returns {Array} Array of import statements
     */
    getThemeImports(themeName) {
        const theme = this.getTheme(themeName);
        return theme?.imports || [];
    }

    /**
     * Generate theme tokens for a component
     * @param {string} componentName - Component name
     * @param {Object} props - Component props
     * @param {Object} themeConfig - Theme configuration
     * @returns {Promise<Object>} Generated theme tokens
     */
    async generateThemeTokens(componentName, props, themeConfig) {
        if (!themeConfig || !themeConfig.tokens) {
            return {};
        }

        try {
            const tokens = {};

            // Generate component-specific tokens
            if (themeConfig.componentTokens && themeConfig.componentTokens[componentName]) {
                const componentTokens = themeConfig.componentTokens[componentName];

                for (const [tokenName, tokenValue] of Object.entries(componentTokens)) {
                    tokens[tokenName] = this.resolveTokenValue(tokenValue, themeConfig, props);
                }
            }

            // Generate tokens from global theme tokens
            for (const [category, categoryTokens] of Object.entries(themeConfig.tokens)) {
                if (!tokens[category]) {
                    tokens[category] = {};
                }

                for (const [tokenName, tokenValue] of Object.entries(categoryTokens)) {
                    tokens[category][tokenName] = this.resolveTokenValue(tokenValue, themeConfig, props);
                }
            }

            this.stats.generated++;
            return tokens;
        } catch (error) {
            this.stats.errors++;
            throw new Error(`Theme token generation failed: ${error.message}`);
        }
    }

    /**
     * Resolve token value with references and computations
     * @param {*} tokenValue - Token value to resolve
     * @param {Object} themeConfig - Theme configuration
     * @param {Object} props - Component props for context
     * @returns {*} Resolved token value
     */
    resolveTokenValue(tokenValue, themeConfig, props = {}) {
        if (typeof tokenValue === 'string' && tokenValue.startsWith('$')) {
            // Token reference - resolve from theme
            const referencePath = tokenValue.slice(1).split('.');
            return this.getNestedValue(themeConfig.tokens, referencePath);
        }

        if (typeof tokenValue === 'function') {
            // Computed token - execute with context
            return tokenValue(themeConfig, props);
        }

        if (typeof tokenValue === 'object' && tokenValue !== null && tokenValue.compute) {
            // Object with compute function
            return tokenValue.compute(themeConfig, props);
        }

        return tokenValue;
    }

    /**
     * Get nested value from object using array path
     * @param {Object} obj - Object to search
     * @param {Array} path - Array path
     * @returns {*} Found value or undefined
     */
    getNestedValue(obj, path) {
        return path.reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Enable hot reloading for theme configurations
     * @param {string} configsPath - Path to theme configurations
     * @param {Function} onChange - Callback when theme changes
     */
    enableHotReload(configsPath = 'src/config/themes', onChange) {
        this.configLoader.enableHotReload(
            [path.join(configsPath, '*.config.js')],
            async (changedPath, newConfig) => {
                const themeName = path.basename(changedPath, '.config.js');

                try {
                    // Process inheritance and validation
                    const processedConfig = await this.processThemeInheritance(newConfig, configsPath);
                    await this.validateThemeConfig(processedConfig, themeName);

                    // Update theme cache
                    this.themes.set(themeName, processedConfig);

                    // Update metadata
                    const metadata = this.themeMetadata.get(themeName);
                    if (metadata) {
                        metadata.config = processedConfig;
                        metadata.lastUpdated = new Date().toISOString();
                    }

                    // Notify callback
                    if (onChange) {
                        onChange(themeName, processedConfig);
                    }
                } catch (error) {
                    console.error(`Hot reload failed for theme ${themeName}:`, error.message);
                }
            }
        );
    }

    /**
     * Get theme loader statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            available: this.availableThemes.size,
            loaded: this.themes.size,
            cached: this.themeCache.size
        };
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.themeCache.clear();
        this.configLoader.clearCache();
    }

    /**
     * Clear all loaded themes and reset state
     */
    clearThemes() {
        this.themes.clear();
        this.themeCache.clear();
        this.inheritanceChain.clear();
        this.validationRules.clear();
        this.availableThemes.clear();
        this.themeMetadata.clear();
        this.configLoader.clearCache();

        // Reset statistics
        this.stats = {
            loaded: 0,
            generated: 0,
            cached: 0,
            errors: 0
        };
    }
}
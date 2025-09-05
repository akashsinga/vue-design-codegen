/**
 * Theme compiler that converts theme tokens into optimized CSS
 * with custom properties, utility classes, and component styles
 */
export class ThemeCompiler {
    constructor() {
        this.cache = new Map();
        this.defaultOptions = {
            minify: false,
            sourcemap: false,
            prefix: 'ds',
            generateUtilities: true,
            generateComponents: true,
            customProperties: true,
            rootSelector: ':root'
        };
    }

    /**
     * Compile theme tokens into CSS
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Compiled CSS
     */
    async compile(tokens, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const cacheKey = this.generateCacheKey(tokens, opts);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const cssBlocks = [];

        // Generate CSS custom properties
        if (opts.customProperties) {
            cssBlocks.push(await this.generateCustomProperties(tokens, opts));
        }

        // Generate utility classes
        if (opts.generateUtilities) {
            cssBlocks.push(await this.generateUtilityClasses(tokens, opts));
        }

        // Generate component styles
        if (opts.generateComponents) {
            cssBlocks.push(await this.generateComponentStyles(tokens, opts));
        }

        // Combine and process CSS
        let css = cssBlocks.filter(Boolean).join('\n\n');

        // Apply post-processing
        css = await this.postProcessCSS(css, opts);

        this.cache.set(cacheKey, css);
        return css;
    }

    /**
     * Generate CSS custom properties from tokens
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} CSS custom properties
     */
    async generateCustomProperties(tokens, options) {
        const properties = [];
        const prefix = options.prefix;

        for (const [category, categoryTokens] of tokens) {
            if (typeof categoryTokens === 'object' && categoryTokens !== null) {
                for (const [tokenName, tokenValue] of Object.entries(categoryTokens)) {
                    const propertyName = this.generatePropertyName(category, tokenName, prefix);
                    const propertyValue = this.processTokenValue(tokenValue);
                    properties.push(`  ${propertyName}: ${propertyValue};`);
                }
            }
        }

        if (properties.length === 0) {
            return '';
        }

        return `${options.rootSelector} {\n${properties.join('\n')}\n}`;
    }

    /**
     * Generate utility classes from tokens
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Utility CSS classes
     */
    async generateUtilityClasses(tokens, options) {
        const utilities = [];

        // Color utilities
        if (tokens.has('colors')) {
            utilities.push(await this.generateColorUtilities(tokens.get('colors'), options));
        }

        // Spacing utilities
        if (tokens.has('spacing')) {
            utilities.push(await this.generateSpacingUtilities(tokens.get('spacing'), options));
        }

        // Typography utilities
        if (tokens.has('typography')) {
            utilities.push(await this.generateTypographyUtilities(tokens.get('typography'), options));
        }

        // Shadow utilities
        if (tokens.has('shadows')) {
            utilities.push(await this.generateShadowUtilities(tokens.get('shadows'), options));
        }

        return utilities.filter(Boolean).join('\n\n');
    }

    /**
     * Generate component styles from tokens
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Component CSS styles
     */
    async generateComponentStyles(tokens, options) {
        const components = [];

        // Button components
        components.push(await this.generateButtonStyles(tokens, options));

        // Card components
        components.push(await this.generateCardStyles(tokens, options));

        // Input components
        components.push(await this.generateInputStyles(tokens, options));

        return components.filter(Boolean).join('\n\n');
    }

    /**
     * Generate color utility classes
     * @param {Object} colors - Color tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Color utility CSS
     */
    async generateColorUtilities(colors, options) {
        const utilities = [];
        const prefix = options.prefix;

        // Text color utilities
        for (const [colorName, colorValue] of Object.entries(colors)) {
            if (typeof colorValue === 'string') {
                utilities.push(`.${prefix}-text-${colorName} { color: var(--${prefix}-colors-${colorName}); }`);
            } else if (typeof colorValue === 'object') {
                for (const [variant, variantValue] of Object.entries(colorValue)) {
                    utilities.push(`.${prefix}-text-${colorName}-${variant} { color: var(--${prefix}-colors-${colorName}-${variant}); }`);
                }
            }
        }

        // Background color utilities
        for (const [colorName, colorValue] of Object.entries(colors)) {
            if (typeof colorValue === 'string') {
                utilities.push(`.${prefix}-bg-${colorName} { background-color: var(--${prefix}-colors-${colorName}); }`);
            } else if (typeof colorValue === 'object') {
                for (const [variant, variantValue] of Object.entries(colorValue)) {
                    utilities.push(`.${prefix}-bg-${colorName}-${variant} { background-color: var(--${prefix}-colors-${colorName}-${variant}); }`);
                }
            }
        }

        // Border color utilities
        for (const [colorName, colorValue] of Object.entries(colors)) {
            if (typeof colorValue === 'string') {
                utilities.push(`.${prefix}-border-${colorName} { border-color: var(--${prefix}-colors-${colorName}); }`);
            } else if (typeof colorValue === 'object') {
                for (const [variant, variantValue] of Object.entries(colorValue)) {
                    utilities.push(`.${prefix}-border-${colorName}-${variant} { border-color: var(--${prefix}-colors-${colorName}-${variant}); }`);
                }
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate spacing utility classes
     * @param {Object} spacing - Spacing tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Spacing utility CSS
     */
    async generateSpacingUtilities(spacing, options) {
        const utilities = [];
        const prefix = options.prefix;

        if (spacing.scale) {
            for (const [sizeName, sizeValue] of Object.entries(spacing.scale)) {
                // Margin utilities
                utilities.push(`.${prefix}-m-${sizeName} { margin: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-mx-${sizeName} { margin-left: var(--${prefix}-spacing-scale-${sizeName}); margin-right: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-my-${sizeName} { margin-top: var(--${prefix}-spacing-scale-${sizeName}); margin-bottom: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-mt-${sizeName} { margin-top: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-mr-${sizeName} { margin-right: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-mb-${sizeName} { margin-bottom: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-ml-${sizeName} { margin-left: var(--${prefix}-spacing-scale-${sizeName}); }`);

                // Padding utilities
                utilities.push(`.${prefix}-p-${sizeName} { padding: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-px-${sizeName} { padding-left: var(--${prefix}-spacing-scale-${sizeName}); padding-right: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-py-${sizeName} { padding-top: var(--${prefix}-spacing-scale-${sizeName}); padding-bottom: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-pt-${sizeName} { padding-top: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-pr-${sizeName} { padding-right: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-pb-${sizeName} { padding-bottom: var(--${prefix}-spacing-scale-${sizeName}); }`);
                utilities.push(`.${prefix}-pl-${sizeName} { padding-left: var(--${prefix}-spacing-scale-${sizeName}); }`);

                // Gap utilities
                utilities.push(`.${prefix}-gap-${sizeName} { gap: var(--${prefix}-spacing-scale-${sizeName}); }`);
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate typography utility classes
     * @param {Object} typography - Typography tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Typography utility CSS
     */
    async generateTypographyUtilities(typography, options) {
        const utilities = [];
        const prefix = options.prefix;

        // Font size utilities
        if (typography.scale) {
            for (const [sizeName, sizeConfig] of Object.entries(typography.scale)) {
                utilities.push(`.${prefix}-text-${sizeName} {`);
                utilities.push(`  font-size: var(--${prefix}-typography-scale-${sizeName}-fontSize);`);
                utilities.push(`  line-height: var(--${prefix}-typography-scale-${sizeName}-lineHeight);`);
                if (sizeConfig.letterSpacing) {
                    utilities.push(`  letter-spacing: var(--${prefix}-typography-scale-${sizeName}-letterSpacing);`);
                }
                utilities.push(`}`);
            }
        }

        // Font weight utilities
        if (typography.fontWeights) {
            for (const [weightName, weightValue] of Object.entries(typography.fontWeights)) {
                utilities.push(`.${prefix}-font-${weightName} { font-weight: var(--${prefix}-typography-fontWeights-${weightName}); }`);
            }
        }

        // Font family utilities
        if (typography.fontFamilies) {
            for (const [familyName, familyValue] of Object.entries(typography.fontFamilies)) {
                utilities.push(`.${prefix}-font-${familyName} { font-family: var(--${prefix}-typography-fontFamilies-${familyName}); }`);
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate shadow utility classes
     * @param {Object} shadows - Shadow tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Shadow utility CSS
     */
    async generateShadowUtilities(shadows, options) {
        const utilities = [];
        const prefix = options.prefix;

        if (shadows.elevation) {
            for (const [level, shadowValue] of Object.entries(shadows.elevation)) {
                utilities.push(`.${prefix}-shadow-${level} { box-shadow: var(--${prefix}-shadows-elevation-${level}); }`);
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate button component styles
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Button component CSS
     */
    async generateButtonStyles(tokens, options) {
        const prefix = options.prefix;
        const styles = [];

        styles.push(`.${prefix}-button {`);
        styles.push(`  display: inline-flex;`);
        styles.push(`  align-items: center;`);
        styles.push(`  justify-content: center;`);
        styles.push(`  padding: var(--${prefix}-spacing-component-button-padding-md, 12px 16px);`);
        styles.push(`  border: 1px solid transparent;`);
        styles.push(`  border-radius: var(--${prefix}-borderRadius-md, 6px);`);
        styles.push(`  font-size: var(--${prefix}-typography-scale-md-fontSize, 16px);`);
        styles.push(`  font-weight: var(--${prefix}-typography-fontWeights-medium, 500);`);
        styles.push(`  line-height: 1;`);
        styles.push(`  cursor: pointer;`);
        styles.push(`  transition: all 0.2s ease-in-out;`);
        styles.push(`}`);

        // Button variants
        const colors = tokens.get('colors');
        if (colors) {
            for (const [colorName, colorValue] of Object.entries(colors)) {
                if (typeof colorValue === 'object' && colorValue.base) {
                    styles.push(`.${prefix}-button--${colorName} {`);
                    styles.push(`  background-color: var(--${prefix}-colors-${colorName}-base);`);
                    styles.push(`  color: var(--${prefix}-colors-${colorName}-onColor, white);`);
                    styles.push(`  border-color: var(--${prefix}-colors-${colorName}-base);`);
                    styles.push(`}`);

                    styles.push(`.${prefix}-button--${colorName}:hover {`);
                    styles.push(`  background-color: var(--${prefix}-colors-${colorName}-dark);`);
                    styles.push(`  border-color: var(--${prefix}-colors-${colorName}-dark);`);
                    styles.push(`}`);
                }
            }
        }

        return styles.join('\n');
    }

    /**
     * Generate card component styles
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Card component CSS
     */
    async generateCardStyles(tokens, options) {
        const prefix = options.prefix;
        const styles = [];

        styles.push(`.${prefix}-card {`);
        styles.push(`  background-color: var(--${prefix}-colors-surface, white);`);
        styles.push(`  border: 1px solid var(--${prefix}-colors-border, #e5e7eb);`);
        styles.push(`  border-radius: var(--${prefix}-borderRadius-lg, 8px);`);
        styles.push(`  padding: var(--${prefix}-spacing-component-card-padding-md, 24px);`);
        styles.push(`  box-shadow: var(--${prefix}-shadows-elevation-2);`);
        styles.push(`}`);

        styles.push(`.${prefix}-card:hover {`);
        styles.push(`  box-shadow: var(--${prefix}-shadows-elevation-3);`);
        styles.push(`}`);

        return styles.join('\n');
    }

    /**
     * Generate input component styles
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Input component CSS
     */
    async generateInputStyles(tokens, options) {
        const prefix = options.prefix;
        const styles = [];

        styles.push(`.${prefix}-input {`);
        styles.push(`  display: block;`);
        styles.push(`  width: 100%;`);
        styles.push(`  padding: var(--${prefix}-spacing-component-input-padding-md, 12px 16px);`);
        styles.push(`  border: 1px solid var(--${prefix}-colors-border, #d1d5db);`);
        styles.push(`  border-radius: var(--${prefix}-borderRadius-md, 6px);`);
        styles.push(`  font-size: var(--${prefix}-typography-scale-md-fontSize, 16px);`);
        styles.push(`  line-height: var(--${prefix}-typography-scale-md-lineHeight, 1.5);`);
        styles.push(`  background-color: var(--${prefix}-colors-surface, white);`);
        styles.push(`  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;`);
        styles.push(`}`);

        styles.push(`.${prefix}-input:focus {`);
        styles.push(`  outline: none;`);
        styles.push(`  border-color: var(--${prefix}-colors-primary-base);`);
        styles.push(`  box-shadow: var(--${prefix}-shadows-focus-default);`);
        styles.push(`}`);

        return styles.join('\n');
    }

    /**
     * Generate CSS custom property name
     * @param {string} category - Token category
     * @param {string} tokenName - Token name
     * @param {string} prefix - CSS prefix
     * @returns {string} CSS custom property name
     */
    generatePropertyName(category, tokenName, prefix) {
        const kebabCategory = this.camelToKebab(category);
        const kebabToken = this.camelToKebab(tokenName);
        return `--${prefix}-${kebabCategory}-${kebabToken}`;
    }

    /**
     * Process token value for CSS output
     * @param {*} value - Token value
     * @returns {string} Processed CSS value
     */
    processTokenValue(value) {
        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number') {
            return value.toString();
        }

        if (typeof value === 'object' && value !== null) {
            // Handle complex token values
            if (value.value !== undefined) {
                return this.processTokenValue(value.value);
            }

            // Convert object to CSS value (e.g., for complex shadows)
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Post-process CSS (minification, autoprefixing, etc.)
     * @param {string} css - Input CSS
     * @param {Object} options - Processing options
     * @returns {Promise<string>} Processed CSS
     */
    async postProcessCSS(css, options) {
        let processedCSS = css;

        // Minification
        if (options.minify) {
            processedCSS = this.minifyCSS(processedCSS);
        }

        // Add sourcemap comment
        if (options.sourcemap) {
            processedCSS += '\n/*# sourceMappingURL=theme.css.map */';
        }

        return processedCSS;
    }

    /**
     * Minify CSS
     * @param {string} css - Input CSS
     * @returns {string} Minified CSS
     */
    minifyCSS(css) {
        return css
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/\s*{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/:\s*/g, ':')
            .replace(/,\s*/g, ',')
            .replace(/\s*>\s*/g, '>')
            .replace(/\s*\+\s*/g, '+')
            .replace(/\s*~\s*/g, '~')
            .trim();
    }

    /**
     * Convert camelCase to kebab-case
     * @param {string} str - Input string
     * @returns {string} kebab-case string
     */
    camelToKebab(str) {
        return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    }

    /**
     * Generate responsive CSS
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Responsive CSS
     */
    async generateResponsiveCSS(tokens, options) {
        const breakpoints = {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px'
        };

        const responsiveCSS = [];

        for (const [breakpoint, minWidth] of Object.entries(breakpoints)) {
            const mediaQuery = `@media (min-width: ${minWidth})`;
            const breakpointCSS = [];

            // Generate responsive utilities for this breakpoint
            if (tokens.has('spacing')) {
                const spacing = tokens.get('spacing');
                if (spacing.responsive && spacing.responsive[breakpoint]) {
                    breakpointCSS.push(
                        await this.generateBreakpointSpacingUtilities(
                            spacing.responsive[breakpoint],
                            breakpoint,
                            options
                        )
                    );
                }
            }

            if (tokens.has('typography')) {
                const typography = tokens.get('typography');
                if (typography.responsive && typography.responsive[breakpoint]) {
                    breakpointCSS.push(
                        await this.generateBreakpointTypographyUtilities(
                            typography.responsive[breakpoint],
                            breakpoint,
                            options
                        )
                    );
                }
            }

            if (breakpointCSS.length > 0) {
                responsiveCSS.push(`${mediaQuery} {\n${breakpointCSS.join('\n')}\n}`);
            }
        }

        return responsiveCSS.join('\n\n');
    }

    /**
     * Generate breakpoint-specific spacing utilities
     * @param {Object} spacing - Spacing tokens for breakpoint
     * @param {string} breakpoint - Breakpoint name
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Breakpoint spacing CSS
     */
    async generateBreakpointSpacingUtilities(spacing, breakpoint, options) {
        const utilities = [];
        const prefix = options.prefix;

        if (spacing.scale) {
            for (const [sizeName, sizeValue] of Object.entries(spacing.scale)) {
                utilities.push(`  .${prefix}-${breakpoint}\\:m-${sizeName} { margin: ${sizeValue}; }`);
                utilities.push(`  .${prefix}-${breakpoint}\\:p-${sizeName} { padding: ${sizeValue}; }`);
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate breakpoint-specific typography utilities
     * @param {Object} typography - Typography tokens for breakpoint
     * @param {string} breakpoint - Breakpoint name
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Breakpoint typography CSS
     */
    async generateBreakpointTypographyUtilities(typography, breakpoint, options) {
        const utilities = [];
        const prefix = options.prefix;

        if (typography.scale) {
            for (const [sizeName, sizeConfig] of Object.entries(typography.scale)) {
                utilities.push(`  .${prefix}-${breakpoint}\\:text-${sizeName} {`);
                utilities.push(`    font-size: ${sizeConfig.fontSize};`);
                utilities.push(`    line-height: ${sizeConfig.lineHeight};`);
                utilities.push(`  }`);
            }
        }

        return utilities.join('\n');
    }

    /**
     * Generate dark mode CSS
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Dark mode CSS
     */
    async generateDarkModeCSS(tokens, options) {
        const darkModeCSS = [];
        const prefix = options.prefix;

        // Dark mode color overrides
        const darkModeSelector = '[data-theme="dark"], .dark';

        darkModeCSS.push(`${darkModeSelector} {`);

        // Override color custom properties for dark mode
        if (tokens.has('colors')) {
            const colors = tokens.get('colors');
            for (const [colorName, colorValue] of Object.entries(colors)) {
                if (typeof colorValue === 'object' && colorValue.dark) {
                    const propertyName = this.generatePropertyName('colors', colorName, prefix);
                    darkModeCSS.push(`  ${propertyName}: ${colorValue.dark};`);
                }
            }
        }

        darkModeCSS.push(`}`);

        return darkModeCSS.join('\n');
    }

    /**
     * Generate animation CSS
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Animation CSS
     */
    async generateAnimationCSS(tokens, options) {
        const animationCSS = [];
        const prefix = options.prefix;

        if (tokens.has('animations')) {
            const animations = tokens.get('animations');

            // Generate keyframes
            if (animations.keyframes) {
                for (const [animationName, keyframes] of Object.entries(animations.keyframes)) {
                    animationCSS.push(`@keyframes ${prefix}-${animationName} {`);
                    for (const [percentage, styles] of Object.entries(keyframes)) {
                        animationCSS.push(`  ${percentage} {`);
                        for (const [property, value] of Object.entries(styles)) {
                            animationCSS.push(`    ${this.camelToKebab(property)}: ${value};`);
                        }
                        animationCSS.push(`  }`);
                    }
                    animationCSS.push(`}`);
                }
            }

            // Generate animation utilities
            if (animations.utilities) {
                for (const [utilityName, animationProps] of Object.entries(animations.utilities)) {
                    animationCSS.push(`.${prefix}-animate-${utilityName} {`);
                    animationCSS.push(`  animation: ${animationProps};`);
                    animationCSS.push(`}`);
                }
            }
        }

        return animationCSS.join('\n');
    }

    /**
     * Generate print styles
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Print CSS
     */
    async generatePrintCSS(tokens, options) {
        const printCSS = [];

        printCSS.push(`@media print {`);
        printCSS.push(`  .${options.prefix}-no-print { display: none !important; }`);
        printCSS.push(`  .${options.prefix}-print-only { display: block !important; }`);

        // Override colors for print
        if (tokens.has('colors')) {
            printCSS.push(`  * {`);
            printCSS.push(`    color: black !important;`);
            printCSS.push(`    background: white !important;`);
            printCSS.push(`  }`);
        }

        printCSS.push(`}`);

        return printCSS.join('\n');
    }

    /**
     * Generate CSS reset/normalize
     * @param {Object} options - Compilation options
     * @returns {string} Reset CSS
     */
    generateResetCSS(options) {
        return `
/* Design System Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

#root, #__next {
  isolation: isolate;
}
        `.trim();
    }

    /**
     * Generate complete theme CSS with all features
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {Promise<string>} Complete theme CSS
     */
    async generateCompleteCSS(tokens, options = {}) {
        const opts = { ...this.defaultOptions, ...options };
        const cssBlocks = [];

        // CSS Reset (optional)
        if (opts.includeReset) {
            cssBlocks.push(this.generateResetCSS(opts));
        }

        // Custom properties
        if (opts.customProperties) {
            cssBlocks.push(await this.generateCustomProperties(tokens, opts));
        }

        // Utility classes
        if (opts.generateUtilities) {
            cssBlocks.push(await this.generateUtilityClasses(tokens, opts));
        }

        // Component styles
        if (opts.generateComponents) {
            cssBlocks.push(await this.generateComponentStyles(tokens, opts));
        }

        // Responsive utilities
        if (opts.generateResponsive) {
            cssBlocks.push(await this.generateResponsiveCSS(tokens, opts));
        }

        // Dark mode
        if (opts.generateDarkMode) {
            cssBlocks.push(await this.generateDarkModeCSS(tokens, opts));
        }

        // Animations
        if (opts.generateAnimations && tokens.has('animations')) {
            cssBlocks.push(await this.generateAnimationCSS(tokens, opts));
        }

        // Print styles
        if (opts.generatePrint) {
            cssBlocks.push(await this.generatePrintCSS(tokens, opts));
        }

        // Combine and process
        let css = cssBlocks.filter(Boolean).join('\n\n');
        css = await this.postProcessCSS(css, opts);

        return css;
    }

    /**
     * Generate cache key for compilation caching
     * @param {Map} tokens - Theme tokens
     * @param {Object} options - Compilation options
     * @returns {string} Cache key
     */
    generateCacheKey(tokens, options) {
        const tokensHash = JSON.stringify([...tokens]);
        const optionsHash = JSON.stringify(options);
        return `${tokensHash}:${optionsHash}`;
    }

    /**
     * Clear compilation cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get compilation statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
        };
    }
}
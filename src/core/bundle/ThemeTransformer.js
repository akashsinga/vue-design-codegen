// src/core/bundle/ThemeTransformer.js
/**
 * Theme Transformer
 * Converts universal design tokens to library-specific theme configurations
 */

export class ThemeTransformer {
    constructor(libraryName) {
        this.libraryName = libraryName
    }

    /**
     * Transform universal design tokens to library-specific theme
     * @param {Object} designTokens - Universal design tokens
     * @returns {Object} Library-specific theme configuration
     */
    transform(designTokens) {
        const transformedThemes = {}

        Object.keys(designTokens).forEach(themeName => {
            const themeData = designTokens[themeName]
            transformedThemes[themeName] = this.transformTheme(themeData, themeName)
        })

        return transformedThemes
    }

    /**
     * Transform single theme to library format
     * @param {Object} themeData - Universal theme data
     * @param {String} themeName - Theme name (light/dark)
     * @returns {Object} Library-specific theme configuration
     */
    transformTheme(themeData, themeName) {
        return {
            dark: themeName === 'dark',
            colors: themeData.colors || {},
            typography: themeData.typography || {},
            spacing: themeData.spacing || {},
            shadows: themeData.shadows || {},
            borders: themeData.borders || {},
            motion: themeData.motion || {}
        }
    }

    /**
     * Extract CSS variables from theme data
     * @param {Object} themeData - Theme data
     * @returns {Object} CSS variables object
     */
    extractCSSVariables(themeData) {
        const cssVars = {}

        // Extract color variables
        if (themeData.colors) {
            Object.entries(themeData.colors).forEach(([key, value]) => {
                cssVars[`--ds-color-${key}`] = value
            })
        }

        // Extract spacing variables  
        if (themeData.spacing) {
            Object.entries(themeData.spacing).forEach(([key, value]) => {
                cssVars[`--ds-spacing-${key}`] = value
            })
        }

        // Extract typography variables
        if (themeData.typography) {
            Object.entries(themeData.typography).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        cssVars[`--ds-typography-${key}-${subKey}`] = subValue
                    })
                } else {
                    cssVars[`--ds-typography-${key}`] = value
                }
            })
        }

        // Extract shadow variables
        if (themeData.shadows) {
            Object.entries(themeData.shadows).forEach(([key, value]) => {
                cssVars[`--ds-shadow-${key}`] = value
            })
        }

        // Extract border variables
        if (themeData.borders) {
            Object.entries(themeData.borders).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        cssVars[`--ds-border-${key}-${subKey}`] = subValue
                    })
                } else {
                    cssVars[`--ds-border-${key}`] = value
                }
            })
        }

        return cssVars
    }

    /**
     * Generate CSS variables string
     * @param {Object} cssVars - CSS variables object
     * @returns {String} CSS variables string
     */
    generateCSSVariablesString(cssVars) {
        const lines = []

        Object.entries(cssVars).forEach(([property, value]) => {
            lines.push(`  ${property}: ${value};`)
        })

        return lines.join('\n')
    }
}
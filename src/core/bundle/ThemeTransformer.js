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
            motion: themeData.motion || {},
            variables: themeData.variables || {}
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
                cssVars[`--opc-color-${key}`] = value
            })
        }

        // Extract spacing variables  
        if (themeData.spacing) {
            Object.entries(themeData.spacing).forEach(([key, value]) => {
                cssVars[`--opc-spacing-${key}`] = value
            })
        }

        // Extract typography variables
        if (themeData.typography) {
            Object.entries(themeData.typography).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        cssVars[`--opc-typography-${key}-${subKey}`] = subValue
                    })
                } else {
                    cssVars[`--opc-typography-${key}`] = value
                }
            })
        }

        // Extract shadow variables
        if (themeData.shadows) {
            Object.entries(themeData.shadows).forEach(([key, value]) => {
                cssVars[`--opc-shadow-${key}`] = value
            })
        }

        // Extract border variables
        if (themeData.borders) {
            Object.entries(themeData.borders).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        cssVars[`--opc-border-${key}-${subKey}`] = subValue
                    })
                } else {
                    cssVars[`--opc-border-${key}`] = value
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
// src/core/plugins/ThemeProvider.js
import { ref, reactive } from 'vue';

export class ThemeProvider {
    constructor() {
        this.currentTheme = ref('light');
        this.themeConfig = reactive({});
        this.customTokens = reactive({});
        this.targetLibrary = null;
    }

    /**
     * Initialize theme provider
     */
    async initialize(themeConfig = {}, options = {}) {
        this.targetLibrary = options.targetLibrary;

        // Set up theme configuration
        Object.assign(this.themeConfig, {
            name: themeConfig.name || 'default',
            tokens: themeConfig.tokens || {},
            customization: themeConfig.customization || {},
            ...themeConfig
        });

        // Set up custom tokens
        if (options.customTokens) {
            Object.assign(this.customTokens, options.customTokens);
        }

        // Apply initial theme
        this.applyThemeTokens();
    }

    /**
     * Apply theme to Vue app
     */
    applyTheme(app) {
        // Provide theme reactively
        app.provide('theme', this.currentTheme);
        app.provide('themeConfig', this.themeConfig);
        app.provide('customTokens', this.customTokens);

        // Add global theme utilities
        app.config.globalProperties.$theme = {
            current: this.currentTheme,
            config: this.themeConfig,
            tokens: this.customTokens,
            setTheme: this.setTheme.bind(this),
            getToken: this.getToken.bind(this),
            setToken: this.setToken.bind(this)
        };
    }

    /**
     * Apply theme tokens to CSS variables
     */
    applyThemeTokens() {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        // Apply color tokens
        if (this.themeConfig.tokens?.colors) {
            Object.entries(this.themeConfig.tokens.colors).forEach(([key, value]) => {
                root.style.setProperty(`--ds-color-${key}`, value);
            });
        }

        // Apply spacing tokens
        if (this.themeConfig.tokens?.spacing) {
            Object.entries(this.themeConfig.tokens.spacing).forEach(([key, value]) => {
                root.style.setProperty(`--ds-spacing-${key}`, value);
            });
        }

        // Apply typography tokens
        if (this.themeConfig.tokens?.typography) {
            const typography = this.themeConfig.tokens.typography;

            if (typography.fontFamily) {
                Object.entries(typography.fontFamily).forEach(([key, value]) => {
                    const fontValue = Array.isArray(value) ? value.join(', ') : value;
                    root.style.setProperty(`--ds-font-family-${key}`, fontValue);
                });
            }

            if (typography.fontSize) {
                Object.entries(typography.fontSize).forEach(([key, value]) => {
                    root.style.setProperty(`--ds-font-size-${key}`, value);
                });
            }

            if (typography.fontWeight) {
                Object.entries(typography.fontWeight).forEach(([key, value]) => {
                    root.style.setProperty(`--ds-font-weight-${key}`, value);
                });
            }
        }

        // Apply border radius tokens
        if (this.themeConfig.tokens?.borderRadius) {
            Object.entries(this.themeConfig.tokens.borderRadius).forEach(([key, value]) => {
                root.style.setProperty(`--ds-border-radius-${key}`, value);
            });
        }

        // Apply shadow tokens
        if (this.themeConfig.tokens?.shadows) {
            Object.entries(this.themeConfig.tokens.shadows).forEach(([key, value]) => {
                root.style.setProperty(`--ds-shadow-${key}`, value);
            });
        }

        // Apply custom tokens
        Object.entries(this.customTokens).forEach(([key, value]) => {
            root.style.setProperty(`--ds-custom-${key}`, value);
        });
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        this.currentTheme.value = themeName;
        this.applyThemeTokens();

        // Emit theme change event
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: themeName, provider: this }
            }));
        }
    }

    /**
     * Get theme token value
     */
    getToken(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.themeConfig.tokens);
    }

    /**
     * Set theme token
     */
    setToken(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.themeConfig.tokens);

        target[lastKey] = value;
        this.applyThemeTokens();
    }

    /**
     * Get theme utilities for global access
     */
    getThemeUtilities() {
        return {
            current: this.currentTheme,
            set: this.setTheme.bind(this),
            get: this.getToken.bind(this),
            setToken: this.setToken.bind(this),
            config: this.themeConfig
        };
    }

    /**
     * Get reactive theme object
     */
    getReactiveTheme() {
        return {
            current: this.currentTheme,
            config: this.themeConfig,
            tokens: this.customTokens
        };
    }

    /**
     * Get current theme name
     */
    getCurrentTheme() {
        return this.currentTheme.value;
    }

    /**
     * Get theme info
     */
    getThemeInfo() {
        return {
            current: this.currentTheme.value,
            available: ['light', 'dark'],
            tokens: Object.keys(this.themeConfig.tokens || {}),
            customTokens: Object.keys(this.customTokens),
            targetLibrary: this.targetLibrary
        };
    }

    /**
     * Get token count
     */
    getTokenCount() {
        const tokenCount = Object.keys(this.themeConfig.tokens || {}).reduce((count, category) => {
            const categoryTokens = this.themeConfig.tokens[category];
            return count + (typeof categoryTokens === 'object' ? Object.keys(categoryTokens).length : 1);
        }, 0);

        return tokenCount + Object.keys(this.customTokens).length;
    }

    /**
     * Migrate theme to new library
     */
    async migrate(newLibrary) {
        const previousLibrary = this.targetLibrary;
        this.targetLibrary = newLibrary;

        // Library-specific theme adjustments
        if (newLibrary === 'vuetify') {
            // Adjust tokens for Vuetify Material Design
            this.adjustTokensForVuetify();
        } else if (newLibrary === 'primevue') {
            // Adjust tokens for PrimeVue
            this.adjustTokensForPrimeVue();
        }

        this.applyThemeTokens();

        return {
            success: true,
            previousLibrary,
            newLibrary,
            adjustments: `Theme adjusted for ${newLibrary}`
        };
    }

    /**
     * Adjust tokens for Vuetify
     */
    adjustTokensForVuetify() {
        // Ensure Material Design color naming
        if (this.themeConfig.tokens?.colors) {
            const colors = this.themeConfig.tokens.colors;
            if (colors.danger && !colors.error) {
                colors.error = colors.danger;
            }
        }
    }

    /**
     * Adjust tokens for PrimeVue
     */
    adjustTokensForPrimeVue() {
        // PrimeVue specific adjustments
        if (this.themeConfig.tokens?.colors) {
            const colors = this.themeConfig.tokens.colors;
            if (colors.error && !colors.danger) {
                colors.danger = colors.error;
            }
        }
    }

    /**
     * Cleanup theme provider
     */
    cleanup() {
        this.currentTheme.value = 'light';
        Object.keys(this.themeConfig).forEach(key => delete this.themeConfig[key]);
        Object.keys(this.customTokens).forEach(key => delete this.customTokens[key]);
        this.targetLibrary = null;
    }
}

export default new ThemeProvider();
import { ThemeLoader } from '../themes/ThemeLoader.js';
import { ThemeEngine } from '../themes/ThemeEngine.js';

/**
 * Theme provider that manages theme application, switching, and CSS injection
 * with reactive updates and seamless theme transitions
 */
export class ThemeProvider {
    constructor(options = {}) {
        this.options = {
            theme: 'light',
            injectCSS: true,
            cssVariables: true,
            transitions: true,
            persistence: 'localStorage', // 'localStorage', 'sessionStorage', or 'none'
            storageKey: 'designSystem.theme',
            development: false,
            ...options
        };

        // Initialize core services
        this.themeLoader = new ThemeLoader();
        this.themeEngine = new ThemeEngine();

        // Theme state
        this.currentTheme = null;
        this.currentThemeConfig = null;
        this.appliedTokens = new Map();
        this.subscribers = new Set();

        // DOM elements for CSS injection
        this.styleElements = new Map();
        this.rootElement = null;

        // Theme switching state
        this.switching = false;
        this.switchQueue = [];

        // CSS custom properties cache
        this.cssPropertiesCache = new Map();

        // Statistics
        this.stats = {
            themesLoaded: 0,
            switches: 0,
            cssInjections: 0,
            tokensGenerated: 0
        };

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the theme provider
     */
    async initialize() {
        try {
            // Set root element
            this.rootElement = document.documentElement;

            // Load theme from persistence if available
            const persistedTheme = this.loadPersistedTheme();
            if (persistedTheme) {
                this.options.theme = persistedTheme;
            }

            // Load initial theme
            await this.setTheme(this.options.theme);

            // Setup theme change listeners
            this.setupThemeChangeListeners();

            if (this.options.development) {
                console.log(`Theme provider initialized with theme: ${this.currentTheme}`);
            }
        } catch (error) {
            console.error('Theme provider initialization failed:', error);
            throw error;
        }
    }

    /**
     * Set the current theme
     * @param {string} themeName - Theme name to set
     * @returns {Promise<void>}
     */
    async setTheme(themeName) {
        if (this.currentTheme === themeName) {
            return;
        }

        try {
            // Load theme configuration
            const themeConfig = await this.themeLoader.loadTheme(themeName);

            if (!themeConfig) {
                throw new Error(`Theme '${themeName}' not found`);
            }

            const previousTheme = this.currentTheme;

            // Update state
            this.currentTheme = themeName;
            this.currentThemeConfig = themeConfig;

            // Apply theme
            await this.applyTheme();

            // Persist theme preference
            this.persistTheme(themeName);

            // Notify subscribers
            this.notifyThemeChange(themeName, previousTheme);

            this.stats.themesLoaded++;

            if (this.options.development) {
                console.log(`Theme set to: ${themeName}`);
            }
        } catch (error) {
            throw new Error(`Failed to set theme '${themeName}': ${error.message}`);
        }
    }

    /**
     * Switch theme with transition effects
     * @param {string} themeName - Target theme name
     * @param {Object} options - Switch options
     * @returns {Promise<void>}
     */
    async switchTheme(themeName, options = {}) {
        if (this.switching) {
            // Queue the switch if already switching
            this.switchQueue.push({ themeName, options });
            return;
        }

        this.switching = true;

        try {
            const switchOptions = {
                transition: this.options.transitions,
                duration: 300,
                easing: 'ease-in-out',
                ...options
            };

            // Start transition if enabled
            if (switchOptions.transition) {
                await this.startThemeTransition(switchOptions);
            }

            // Switch theme
            await this.setTheme(themeName);

            // Complete transition
            if (switchOptions.transition) {
                await this.completeThemeTransition(switchOptions);
            }

            this.stats.switches++;
        } finally {
            this.switching = false;

            // Process queued switches
            if (this.switchQueue.length > 0) {
                const next = this.switchQueue.shift();
                await this.switchTheme(next.themeName, next.options);
            }
        }
    }

    /**
     * Apply the current theme to the DOM
     * @returns {Promise<void>}
     */
    async applyTheme() {
        if (!this.currentThemeConfig) {
            throw new Error('No theme configuration loaded');
        }

        try {
            // Generate theme tokens
            const tokens = await this.themeEngine.generateThemeTokens(
                this.currentThemeConfig,
                this.options
            );

            this.appliedTokens = tokens;
            this.stats.tokensGenerated += Object.keys(tokens).length;

            // Apply CSS custom properties
            if (this.options.cssVariables) {
                this.applyCSSCustomProperties(tokens);
            }

            // Inject theme CSS
            if (this.options.injectCSS) {
                await this.injectThemeCSS(tokens);
            }

            // Apply theme classes
            this.applyThemeClasses();

            if (this.options.development) {
                console.log(`Applied theme: ${this.currentTheme}`, tokens);
            }
        } catch (error) {
            throw new Error(`Theme application failed: ${error.message}`);
        }
    }

    /**
     * Apply CSS custom properties to the root element
     * @param {Map} tokens - Theme tokens
     */
    applyCSSCustomProperties(tokens) {
        const properties = new Map();

        // Convert tokens to CSS custom properties
        for (const [category, categoryTokens] of tokens) {
            if (typeof categoryTokens === 'object' && categoryTokens !== null) {
                for (const [tokenName, tokenValue] of Object.entries(categoryTokens)) {
                    const propertyName = this.generateCSSPropertyName(category, tokenName);
                    properties.set(propertyName, tokenValue);
                }
            }
        }

        // Apply properties to root element
        for (const [property, value] of properties) {
            this.rootElement.style.setProperty(property, value);
        }

        // Cache applied properties
        this.cssPropertiesCache = properties;

        if (this.options.development) {
            console.log(`Applied ${properties.size} CSS custom properties`);
        }
    }

    /**
     * Generate CSS custom property name
     * @param {string} category - Token category
     * @param {string} tokenName - Token name
     * @returns {string} CSS property name
     */
    generateCSSPropertyName(category, tokenName) {
        const kebabCategory = this.camelToKebab(category);
        const kebabToken = this.camelToKebab(tokenName);
        return `--ds-${kebabCategory}-${kebabToken}`;
    }

    /**
     * Inject theme CSS into the document
     * @param {Map} tokens - Theme tokens
     * @returns {Promise<void>}
     */
    async injectThemeCSS(tokens) {
        try {
            // Generate CSS from tokens
            const css = await this.themeEngine.generateCSS(tokens, {
                theme: this.currentTheme,
                minify: !this.options.development,
                sourcemap: this.options.development
            });

            // Create or update style element
            const styleId = `design-system-theme-${this.currentTheme}`;
            let styleElement = this.styleElements.get(styleId);

            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                styleElement.setAttribute('data-theme', this.currentTheme);
                document.head.appendChild(styleElement);
                this.styleElements.set(styleId, styleElement);
            }

            styleElement.textContent = css;
            this.stats.cssInjections++;

            if (this.options.development) {
                console.log(`Injected CSS for theme: ${this.currentTheme}`);
            }
        } catch (error) {
            throw new Error(`CSS injection failed: ${error.message}`);
        }
    }

    /**
     * Apply theme classes to the root element
     */
    applyThemeClasses() {
        // Remove existing theme classes
        const existingClasses = Array.from(this.rootElement.classList)
            .filter(className => className.startsWith('theme-'));

        existingClasses.forEach(className => {
            this.rootElement.classList.remove(className);
        });

        // Add current theme class
        this.rootElement.classList.add(`theme-${this.currentTheme}`);

        // Add theme variant classes if specified
        if (this.currentThemeConfig.variants) {
            for (const variant of this.currentThemeConfig.variants) {
                this.rootElement.classList.add(`theme-variant-${variant}`);
            }
        }
    }

    /**
     * Start theme transition animation
     * @param {Object} options - Transition options
     * @returns {Promise<void>}
     */
    async startThemeTransition(options) {
        return new Promise((resolve) => {
            // Add transition classes
            this.rootElement.classList.add('theme-transitioning');

            // Set transition properties
            this.rootElement.style.transition = `all ${options.duration}ms ${options.easing}`;

            // Small delay to ensure transition is set up
            setTimeout(resolve, 50);
        });
    }

    /**
     * Complete theme transition animation
     * @param {Object} options - Transition options
     * @returns {Promise<void>}
     */
    async completeThemeTransition(options) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Remove transition classes and styles
                this.rootElement.classList.remove('theme-transitioning');
                this.rootElement.style.transition = '';
                resolve();
            }, options.duration);
        });
    }

    /**
     * Get current theme name
     * @returns {string|null} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get current theme configuration
     * @returns {Object|null} Current theme configuration
     */
    getCurrentThemeConfig() {
        return this.currentThemeConfig;
    }

    /**
     * Get current theme tokens
     * @returns {Map} Applied theme tokens
     */
    getThemeTokens() {
        return this.appliedTokens;
    }

    /**
     * Get available themes
     * @returns {Promise<string[]>} Available theme names
     */
    async getAvailableThemes() {
        return this.themeLoader.getAvailableThemes();
    }

    /**
     * Check if theme is available
     * @param {string} themeName - Theme name to check
     * @returns {Promise<boolean>} Whether theme is available
     */
    async isThemeAvailable(themeName) {
        const availableThemes = await this.getAvailableThemes();
        return availableThemes.includes(themeName);
    }

    /**
     * Subscribe to theme changes
     * @param {Function} callback - Change callback
     * @returns {Function} Unsubscribe function
     */
    onThemeChange(callback) {
        this.subscribers.add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Notify subscribers of theme change
     * @param {string} newTheme - New theme name
     * @param {string|null} oldTheme - Previous theme name
     */
    notifyThemeChange(newTheme, oldTheme) {
        for (const callback of this.subscribers) {
            try {
                callback(newTheme, oldTheme, this.appliedTokens);
            } catch (error) {
                console.error('Theme change subscriber error:', error);
            }
        }
    }

    /**
     * Setup theme change listeners (for system theme changes, etc.)
     */
    setupThemeChangeListeners() {
        // Listen for system theme changes
        if (window.matchMedia && this.options.followSystem) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                const systemTheme = e.matches ? 'dark' : 'light';
                if (this.options.autoSwitchOnSystemChange) {
                    this.switchTheme(systemTheme);
                }
            };

            mediaQuery.addEventListener('change', handleSystemThemeChange);

            // Initial check
            handleSystemThemeChange(mediaQuery);
        }

        // Listen for storage changes (theme sync across tabs)
        if (this.options.persistence !== 'none') {
            window.addEventListener('storage', (e) => {
                if (e.key === this.options.storageKey && e.newValue) {
                    const newTheme = e.newValue;
                    if (newTheme !== this.currentTheme) {
                        this.switchTheme(newTheme);
                    }
                }
            });
        }
    }

    /**
     * Load persisted theme from storage
     * @returns {string|null} Persisted theme name
     */
    loadPersistedTheme() {
        if (this.options.persistence === 'none') {
            return null;
        }

        try {
            const storage = this.options.persistence === 'localStorage'
                ? localStorage
                : sessionStorage;

            return storage.getItem(this.options.storageKey);
        } catch (error) {
            console.warn('Failed to load persisted theme:', error);
            return null;
        }
    }

    /**
     * Persist theme to storage
     * @param {string} themeName - Theme name to persist
     */
    persistTheme(themeName) {
        if (this.options.persistence === 'none') {
            return;
        }

        try {
            const storage = this.options.persistence === 'localStorage'
                ? localStorage
                : sessionStorage;

            storage.setItem(this.options.storageKey, themeName);
        } catch (error) {
            console.warn('Failed to persist theme:', error);
        }
    }

    /**
     * Remove all theme CSS from document
     */
    removeThemeCSS() {
        for (const [styleId, styleElement] of this.styleElements) {
            if (styleElement.parentNode) {
                styleElement.parentNode.removeChild(styleElement);
            }
        }
        this.styleElements.clear();
    }

    /**
     * Remove all CSS custom properties
     */
    removeCSSCustomProperties() {
        for (const propertyName of this.cssPropertiesCache.keys()) {
            this.rootElement.style.removeProperty(propertyName);
        }
        this.cssPropertiesCache.clear();
    }

    /**
     * Reload current theme (for HMR)
     * @returns {Promise<void>}
     */
    async reloadTheme() {
        if (!this.currentTheme) return;

        try {
            // Clear theme loader cache
            this.themeLoader.clearCache();

            // Reload current theme
            await this.setTheme(this.currentTheme);

            if (this.options.development) {
                console.log(`Theme reloaded: ${this.currentTheme}`);
            }
        } catch (error) {
            console.error('Theme reload failed:', error);
        }
    }

    /**
     * Get theme-specific token value
     * @param {string} category - Token category
     * @param {string} tokenName - Token name
     * @returns {*} Token value or undefined
     */
    getToken(category, tokenName) {
        const categoryTokens = this.appliedTokens.get(category);
        return categoryTokens ? categoryTokens[tokenName] : undefined;
    }

    /**
     * Get CSS custom property value
     * @param {string} category - Token category
     * @param {string} tokenName - Token name
     * @returns {string} CSS custom property name
     */
    getCSSProperty(category, tokenName) {
        return this.generateCSSPropertyName(category, tokenName);
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
     * Get theme provider statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            currentTheme: this.currentTheme,
            appliedTokens: this.appliedTokens.size,
            cssProperties: this.cssPropertiesCache.size,
            styleElements: this.styleElements.size,
            subscribers: this.subscribers.size
        };
    }

    /**
     * Destroy the theme provider and cleanup
     */
    destroy() {
        // Remove all theme CSS and properties
        this.removeThemeCSS();
        this.removeCSSCustomProperties();

        // Remove theme classes
        const themeClasses = Array.from(this.rootElement.classList)
            .filter(className => className.startsWith('theme-'));
        themeClasses.forEach(className => {
            this.rootElement.classList.remove(className);
        });

        // Clear subscribers
        this.subscribers.clear();

        // Clear caches
        this.appliedTokens.clear();
        this.cssPropertiesCache.clear();
        this.styleElements.clear();
        this.switchQueue.length = 0;

        // Reset state
        this.currentTheme = null;
        this.currentThemeConfig = null;
        this.switching = false;

        // Reset statistics
        this.stats = {
            themesLoaded: 0,
            switches: 0,
            cssInjections: 0,
            tokensGenerated: 0
        };
    }
}
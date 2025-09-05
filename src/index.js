// Zero-Overhead Design System - Main Entry Point
import { createDesignSystemPlugin } from './core/plugins/DesignSystemPlugin.js';
import { ComponentRegistry } from './core/plugins/ComponentRegistry.js';
import { ThemeProvider } from './core/plugins/ThemeProvider.js';
import { LibraryManager } from './core/plugins/LibraryManager.js';

// Core generators
import { ComponentGenerator } from './core/components/ComponentGenerator.js';
import { ComponentLoader } from './core/components/ComponentLoader.js';
import { AdapterLoader } from './core/adapters/AdapterLoader.js';
import { ThemeLoader } from './core/themes/ThemeLoader.js';
import { ThemeEngine } from './core/themes/ThemeEngine.js';
import { TransformationEngine } from './core/TransformationEngine.js';
import { TemplateEngine } from './core/templates/TemplateEngine.js';

// Theme generators
import { ColorGenerator } from './core/themes/generators/ColorGenerator.js';
import { TypographyGenerator } from './core/themes/generators/TypographyGenerator.js';
import { SpacingGenerator } from './core/themes/generators/SpacingGenerator.js';
import { ShadowGenerator } from './core/themes/generators/ShadowGenerator.js';
import { ThemeCompiler } from './core/themes/generators/ThemeCompiler.js';

// Base adapter class
import { LibraryAdapter } from './core/adapters/LibraryAdapter.js';

/**
 * Main plugin factory function
 * @param {Object} options - Plugin options
 * @returns {Object} Vue plugin
 */
export function createDesignSystem(options = {}) {
    return createDesignSystemPlugin(options);
}

/**
 * Default Vue plugin export
 */
export default {
    install(app, options = {}) {
        const plugin = createDesignSystemPlugin(options);
        plugin.install(app, options);
        return plugin;
    }
};

// Named exports for advanced usage
export {
    // Main plugin
    createDesignSystemPlugin,

    // Core plugins
    ComponentRegistry,
    ThemeProvider,
    LibraryManager,

    // Core generators and loaders
    ComponentGenerator,
    ComponentLoader,
    AdapterLoader,
    ThemeLoader,
    ThemeEngine,
    TransformationEngine,
    TemplateEngine,

    // Theme generators
    ColorGenerator,
    TypographyGenerator,
    SpacingGenerator,
    ShadowGenerator,
    ThemeCompiler,

    // Base classes for extension
    LibraryAdapter
};

// Version information
export const version = '1.0.0';

// Utility functions for component registration
export const utils = {
    /**
     * Register a custom library adapter
     * @param {string} libraryName - Library name
     * @param {Object} adapterConfig - Adapter configuration
     */
    registerAdapter(libraryName, adapterConfig) {
        // Implementation would register adapter with global registry
        console.warn('Custom adapter registration not yet implemented');
    },

    /**
     * Register a custom theme generator
     * @param {string} generatorName - Generator name
     * @param {Object} generator - Generator instance
     */
    registerThemeGenerator(generatorName, generator) {
        // Implementation would register generator with theme engine
        console.warn('Custom theme generator registration not yet implemented');
    },

    /**
     * Create a component configuration helper
     * @param {Object} config - Base configuration
     * @returns {Object} Configuration helper
     */
    createComponentConfig(config) {
        return {
            ...config,
            // Add validation helpers
            validate: config.validate || (() => true),
            // Add transformation helpers
            transform: config.transform || ((value) => value)
        };
    },

    /**
     * Create a theme configuration helper
     * @param {Object} config - Base theme configuration
     * @returns {Object} Theme configuration helper
     */
    createThemeConfig(config) {
        return {
            ...config,
            // Add token generation helpers
            generateTokens: config.generateTokens || (() => ({})),
            // Add validation helpers
            validate: config.validate || (() => true)
        };
    }
};
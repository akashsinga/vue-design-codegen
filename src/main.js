/**
 * Zero-Overhead Design System
 * Main entry point for the design system generator
 */

// Core exports
export { ComponentGenerator } from './core/ComponentGenerator.js'

// Library adapters
export { LibraryAdapter, PrimeVueAdapter, VuetifyAdapter } from './adapters/LibraryAdapter.js'

// Utility functions for creating configurations
export const createComponentConfig = (options) => {
    return {
        name: options.name,
        category: options.category || 'general',
        description: options.description || '',
        baseComponent: options.baseComponent,
        props: options.props || [],
        propMappings: options.propMappings || [],
        events: options.events || [],
        slots: options.slots || [],
        performance: {
            memoize: true,
            lazyLoad: false,
            treeshake: true,
            ...options.performance
        },
        styles: options.styles || ''
    }
}

// Quick setup function for common use cases
export const createDesignSystem = (options = {}) => {
    const {
        outputDir = 'generated',
        templateType = 'both',
        library = 'primevue',
        performanceMode = true
    } = options

    const generator = new ComponentGenerator({
        outputDir,
        templateType,
        performanceMode
    })

    // Set up library adapter based on option
    switch (library.toLowerCase()) {
        case 'primevue':
            generator.setLibraryAdapter(new PrimeVueAdapter())
            break
        case 'vuetify':
            generator.setLibraryAdapter(new VuetifyAdapter())
            break
        default:
            console.warn(`Library "${library}" not supported yet. Using PrimeVue as default.`)
            generator.setLibraryAdapter(new PrimeVueAdapter())
    }

    return generator
}

// Library switching utility
export const switchLibrary = (generator, libraryName) => {
    switch (libraryName.toLowerCase()) {
        case 'primevue':
            generator.setLibraryAdapter(new PrimeVueAdapter())
            break
        case 'vuetify':
            generator.setLibraryAdapter(new VuetifyAdapter())
            break
        default:
            throw new Error(`Library "${libraryName}" is not supported`)
    }

    return generator
}

// Version info
export const version = '0.2.0'
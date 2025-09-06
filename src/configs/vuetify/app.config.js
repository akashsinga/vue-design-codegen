/**
 * Configuration for Vuetify App Component.
 * File: src/configs/vuetify/app.config.js
 */

export default {
    name: 'App',
    category: 'Parent',
    description: 'Parent Component',
    baseComponent: 'VApp',
    props: [],
    propMappings: [],
    events: [],
    slots: [
        { name: 'default', description: 'App Content' },
    ],
    performance: {
        memoize: true, lazyLoad: false, treeshake: true, vuetifyOptimizations: { useDirectives: true, optimizeClasses: true }
    }
}
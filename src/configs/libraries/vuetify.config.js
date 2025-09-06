/**
 * Vuetify Library Configuration
 * Minimal configuration for library setup and initialization
 */

export default {
    name: 'vuetify',
    version: '3.7.2',

    // Setup configuration
    setup: {
        // Import statements needed for library setup
        imports: [
            "import { createVuetify } from 'vuetify'",
            "import * as components from 'vuetify/components'",
            "import * as directives from 'vuetify/directives'",
            "import 'vuetify/styles'"
        ],

        // Library initialization code
        initialization: `
            const vuetify = createVuetify({
                components,
                directives,
                theme: {
                    defaultTheme: options.theme || 'light',
                    themes: themeConfig
                }
            })
            app.use(vuetify)
        `,

        // How to apply theme configuration to the library
        themeApplication: `
            if (vuetify && vuetify.theme) {
                Object.keys(themeConfig).forEach(themeName => {
                    vuetify.theme.themes.value[themeName] = themeConfig[themeName]
                })
            }
        `,

        // Utility functions specific to this library
        utilities: `
            useTheme() {
                return vuetify?.theme
            },
            switchLibraryTheme(themeName) {
                if (vuetify?.theme) {
                    vuetify.theme.global.name.value = themeName
                }
            }
        `
    },

    // Bundle-specific settings
    bundle: {
        // External dependencies that should remain external
        external: ['vue', 'vuetify'],

        // Globals for UMD build
        globals: {
            'vue': 'Vue',
            'vuetify': 'Vuetify'
        },

        // CSS imports to include
        cssImports: [
            'vuetify/styles'
        ]
    }
}
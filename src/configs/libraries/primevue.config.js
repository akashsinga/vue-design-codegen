/**
 * PrimeVue Library Configuration  
 * Minimal configuration for library setup and initialization
 */

export default {
    name: 'primevue',
    version: '3.53.1',

    // Setup configuration
    setup: {
        // Import statements needed for library setup
        imports: [
            "import PrimeVue from 'primevue/config'",
            "import ToastService from 'primevue/toastservice'",
            "import ConfirmationService from 'primevue/confirmationservice'",
            "import 'primevue/resources/themes/aura-light-blue/theme.css'",
            "import 'primevue/resources/primevue.min.css'",
            "import 'primeicons/primeicons.css'"
        ],

        // Library initialization code
        initialization: `
            app.use(PrimeVue, {
                theme: 'none' // We'll handle theming through CSS variables
            })
            app.use(ToastService)
            app.use(ConfirmationService)
        `,

        // How to apply theme configuration to the library
        themeApplication: `
            // Apply theme through CSS custom properties
            const root = document.documentElement
            const theme = themeConfig[options.theme || 'light']
            
            if (theme && theme.colors) {
                // Map design tokens to PrimeVue CSS variables
                root.style.setProperty('--p-primary-color', theme.colors.primary)
                root.style.setProperty('--p-primary-contrast-color', theme.colors['on-primary'])
                root.style.setProperty('--p-surface-0', theme.colors.surface)
                root.style.setProperty('--p-surface-50', theme.colors['surface-variant'])
                root.style.setProperty('--p-surface-100', theme.colors['surface-container'])
                root.style.setProperty('--p-surface-200', theme.colors['surface-container-high'])
                root.style.setProperty('--p-content-color', theme.colors['on-surface'])
                root.style.setProperty('--p-content-muted-color', theme.colors['on-surface-variant'])
            }
        `,

        // Utility functions specific to this library
        utilities: `
            showToast(severity, summary, detail) {
                if (app.config.globalProperties.$toast) {
                    app.config.globalProperties.$toast.add({
                        severity,
                        summary,
                        detail,
                        life: 3000
                    })
                }
            },
            confirm(options) {
                if (app.config.globalProperties.$confirm) {
                    app.config.globalProperties.$confirm.require(options)
                }
            }
        `
    },

    // Bundle-specific settings
    bundle: {
        // External dependencies that should remain external
        external: ['vue', 'primevue'],

        // Globals for UMD build
        globals: {
            'vue': 'Vue',
            'primevue': 'PrimeVue'
        },

        // CSS imports to include
        cssImports: [
            'primevue/resources/themes/aura-light-blue/theme.css',
            'primevue/resources/primevue.min.css',
            'primeicons/primeicons.css'
        ]
    }
}
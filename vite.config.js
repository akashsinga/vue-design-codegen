import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'vuedesigncodegen',
            fileName: (format) => `vue-design-codegen.${format}.js`
        },
        rollupOptions: {
            external: ['vue', 'primevue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 3000,
        open: true
    }
})
/**
 * Adapter Implementation for Vuetify.
 * Extends LibraryAdapter
 * 
 * File: src/core/adapters/VuetifyAdapter.js
 */

import { LibraryAdapter } from './LibraryAdapter.js'
import { readdirSync, existsSync, readdir } from 'fs'
import chalk from 'chalk'
import path from 'path'

export class VuetifyAdapter extends LibraryAdapter {
    constructor(version = '3.6.1') {
        super('vuetify', version)
        this.configsLoaded = false
        this.configDir = path.resolve()
    }

    /**
     * Returns import statement for the given component.
     * @param {Object} config
     * @returns {String}
     */
    getImportStatement(config) {
        this.ensureConfigsLoaded()
        const actualComponent = config.baseComponent
        return `import { ${actualComponent} } from vuetify/components`
    }

    /**
     * Returns library component name
     * @param {String} semanticName
     * @returns {String}
     */
    getComponent(semanticName) {
        this.ensureConfigsLoaded()
        return super.getComponent(semanticName)
    }

    /**
     * Lazy load confiugrations when first needed.
     */
    ensureConfigsLoaded() {
        if (this.configsLoaded) return

        if (!existsSync(this.configDir)) {
            console.log(chalk.yellow(`Vuetify config directory not found: ${this.configDir}`))
            this.configsLoaded = true
            return
        }

        try {
            const configFiles = readdirSync(this.configDir).filter(file => file.endsWith('.config.js'))

            for (const configFile of configFiles) {
                const configPath = path.join(this.configDir, configFile)
                this.loadConfigFileSync(configPath)
            }

            this.configsLoaded = true
        } catch (error) {
            console.log(chalk.yellow(`Error loading Vuetify configurations: ${error.message}`))
            this.configsLoaded = true
        }
    }

    /**
     * Load config file synchronously
     * @param {String} configPath
     */
    loadConfigFileSync(configPath) {
        try {
            delete require.cache[require.resolve(configPath)]
            const config = require(configPath).default || require(configPath)

            if (config && config.baseComponent) {
                this.registerComponent(config.name, config.baseComponent)
            }
        } catch (error) {
            console.log(chalk.yellow(`Failed to load config file ${configPath}: ${error.message}`))
        }
    }
}
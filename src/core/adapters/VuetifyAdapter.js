/**
 * Adapter Implementation for Vuetify.
 * Extends LibraryAdapter with sync interface
 * 
 * File: src/core/adapters/VuetifyAdapter.js
 */

import { LibraryAdapter } from './LibraryAdapter.js'
import { readdirSync, existsSync } from 'fs'
import chalk from 'chalk'
import path from 'path'

export class VuetifyAdapter extends LibraryAdapter {
    constructor(version = '3.6.1') {
        super('vuetify', version)
        this.configsLoaded = false
        this.configDir = path.resolve('./src/configs/vuetify')
        this.configPromise = null
    }

    /**
     * Returns import statement for the given component.
     * @param {String} componentName - Component name
     * @returns {String}
     */
    getImportStatement(componentName) {
        this.ensureConfigsLoaded()
        const actualComponent = this.getComponent(componentName)
        return `import { ${actualComponent} } from 'vuetify/components'`
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
     * Check if component is registered
     * @param {String} semanticName
     * @returns {Boolean}
     */
    hasComponent(semanticName) {
        this.ensureConfigsLoaded()
        return super.hasComponent(semanticName)
    }

    /**
     * Synchronously ensure configs are loaded (blocks if needed)
     */
    ensureConfigsLoaded() {
        if (this.configsLoaded) return

        if (!this.configPromise) {
            this.configPromise = this.loadConfigurations()
        }

        // Block until configs are loaded
        // Note: This requires the config loading to be completed before first use
        if (!this.configsLoaded) {
            throw new Error('Vuetify adapter configs not loaded. Call await adapter.initialize() first.')
        }
    }

    /**
     * Initialize adapter asynchronously (must be called before use)
     */
    async initialize() {
        if (!this.configsLoaded) {
            await this.loadConfigurations()
        }
        return this
    }

    /**
     * Load configurations asynchronously
     */
    async loadConfigurations() {
        if (this.configsLoaded) return

        if (!existsSync(this.configDir)) {
            console.log(chalk.yellow(`Vuetify config directory not found: ${this.configDir}`))
            this.configsLoaded = true
            return
        }

        try {
            const configFiles = readdirSync(this.configDir).filter(file => file.endsWith('.config.js'))

            // Load all configs in parallel
            await Promise.all(
                configFiles.map(configFile => {
                    const configPath = path.join(this.configDir, configFile)
                    return this.loadConfigFileAsync(configPath)
                })
            )

            this.configsLoaded = true
            console.log(chalk.green(`Loaded ${configFiles.length} Vuetify component configs`))
        } catch (error) {
            console.log(chalk.yellow(`Error loading Vuetify configurations: ${error.message}`))
            this.configsLoaded = true
        }
    }

    /**
     * Load config file using ES module imports
     * @param {String} configPath
     */
    async loadConfigFileAsync(configPath) {
        try {
            // Use dynamic import with cache busting for development
            const module = await import(`${configPath}?t=${Date.now()}`)
            const config = module.default || module

            if (config && config.baseComponent) {
                this.registerComponent(config.name, config.baseComponent)
            }
        } catch (error) {
            console.log(chalk.yellow(`Failed to load config file ${configPath}: ${error.message}`))
        }
    }
}
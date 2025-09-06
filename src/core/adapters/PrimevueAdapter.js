/**
 * Adapter Implementation for PrimeVue.
 * Extends LibraryAdapter with sync interface and Windows path support
 * 
 * File: src/core/adapters/PrimeVueAdapter.js
 */

import { LibraryAdapter } from './LibraryAdapter.js'
import { readdirSync, existsSync } from 'fs'
import { pathToFileURL } from 'url'
import chalk from 'chalk'
import path from 'path'

export class PrimeVueAdapter extends LibraryAdapter {
    constructor(version = '3.45.0') {
        super('PrimeVue', version)
        this.configsLoaded = false
        this.configDir = path.resolve('./src/configs/primevue')
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
        // PrimeVue uses lowercase component names in import paths
        const importPath = actualComponent.toLowerCase()
        return `import ${actualComponent} from 'primevue/${importPath}';`
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

        if (!this.configsLoaded) {
            throw new Error('PrimeVue adapter configs not loaded. Call await adapter.initialize() first.')
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
            console.log(chalk.yellow(`PrimeVue config directory not found: ${this.configDir}`))
            this.configsLoaded = true
            return
        }

        try {
            const configFiles = readdirSync(this.configDir).filter(file =>
                file.endsWith('.config.js')
            )

            await Promise.all(
                configFiles.map(configFile => {
                    const configPath = path.join(this.configDir, configFile)
                    return this.loadConfigFileAsync(configPath)
                })
            )

            this.configsLoaded = true
            console.log(chalk.green(`Loaded ${configFiles.length} PrimeVue component configs`))
        } catch (error) {
            console.log(chalk.yellow(`Error loading PrimeVue configurations: ${error.message}`))
            this.configsLoaded = true
        }
    }

    /**
     * Load config file using ES module imports with Windows path support
     * @param {String} configPath
     */
    async loadConfigFileAsync(configPath) {
        try {
            // Convert Windows path to proper file:// URL for ES module import
            const fileUrl = path.resolve(configPath)
            const module = await import(pathToFileURL(fileUrl).href)
            const config = module.default || module

            if (config && config.baseComponent) {
                this.registerComponent(config.name, config.baseComponent)
            }
        } catch (error) {
            console.log(chalk.yellow(`Failed to load config file ${configPath}: ${error.message}`))
        }
    }
}
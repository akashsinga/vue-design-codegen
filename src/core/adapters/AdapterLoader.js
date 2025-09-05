/**
 * Dynamic adapter loader that manage library-specific configurations and provides
 * library compatibility checking with embedded validations.
 */

import { ConfigurationLoader } from '../ConfigurationLoader.js'
import path from 'path'
import fs from 'fs-extra'

export class AdapterLoader {
    constructor() {
        this.configLoader = new ConfigurationLoader()
        this.adapters = new Map()
        this.currentLibrary = null
        this.compatibilityMatrix = new Map()
    }

    /**
     * Load adapter configuration for a specific UI library
     * @param {String} libraryName - Name of the UI library
     * @param {String} configsPath - Path to adapter configurations directory
     * @returns {Promise<Object>}
     */
    async loadAdapter(libraryName, configsPath = 'src/core/adapters/configs') {
        try {
            const adapterConfigPath = path.join(configsPath, `${libraryName}.config.js`)

            // Check if adapter config exists
            if (!await fs.pathExists(adapterConfigPath)) {
                throw new Error(`Adapter configuration not found for library: ${libraryName}`)
            }

            const adapterConfig = await this.configLoader.loadConfig(adapterConfigPath)

            await this.validateAdapterConfig(adapterConfig, libraryName)

            this.adapters.set(libraryName, adapterConfig)

            await this.buildCompatibilityMatrix(adapterConfig, libraryName)

            return adapterConfig
        } catch (error) {
            throw new Error(`Failed to load adapter for ${libraryName}: ${error.message}`)
        }
    }

    /**
     * Load all available adapters from the configs directory.
     * @param {String} configsPath - Path to adapter configurations directory
     * @returns {Promise<Map>} Map of the library names to adapter configurations
     */
    async loadAllAdapters(configsPath = 'src/core/adapters/configs') {
        try {
            const configFiles = await fs.readdir(configsPath)
            const adapterFiles = configFiles.filter(file => file.endsWith(`.config.js`) && !file.startsWith('.'))

            const loadPromises = adapterFiles.map(async (file) => {
                const libraryName = path.basename(file, '.config.js')
                return this.loadAdapter(libraryName, configsPath)
            })

            await Promise.all(loadPromises)
            return this.adapters
        } catch (error) {
            throw new Error(`Failed to load adapters: ${error.message}`)
        }
    }

    /**
     * Set the current active library and validate compatibility.
     * @param {String} libraryName - Name of the library to activate
     * @returns {Promise<Object>} Active adapter configuration
     */
    async setCurrentLibrary(libraryName) {
        if (!this.adapters.has(libraryName)) {
            await this.loadAdapter(libraryName)
        }

        const adapter = this.adapters.get(libraryName)

        if (adapter.compatibility && adapter.compatibility.versions) {
            await this.checkVersionCompatibility(adapter, libraryName)
        }

        this.currentLibrary = libraryName
        return adapter
    }

    /**
     * Get the current active adapter configurations
     * @returns {Object|null}
     */
    getCurrentAdapter() {
        if (!this.currentLibrary || !this.adapters.has(this.currentLibrary)) {
            return null
        }

        return this.adapters.get(this.currentLibrary)
    }

    /**
     * Check if a library adapter is loaded
     * @param {String} libraryName - Name of the library to check
     * @returns {Boolean} Whether the adapter is loaded
     */
    isAdapterLoaded(libraryName) {
        return this.adapters.has(libraryName)
    }

    /**
     * Validate adapter configurations with embedded validation rules
     * @param {Object} adapterConfig - Adapter configuration to validate
     * @param {String} libraryName - Library name for error reporting
     * @returns {Promise<void>}
     */
    async validateAdapterConfig(adapterConfig, libraryName) {
        const requiredFields = ['name', 'version', 'componentMappings', 'propTransformations', 'imports']

        for (const field of requiredFields) {
            if (!(field in adapterConfig)) {
                throw new Error(`Required field '${field}' missing in ${libraryName} adapter`)
            }
        }

        if (!adapterConfig.componentMappings || typeof adapterConfig.componentMappings !== 'object') {
            throw new Error(`Invalid componentMappings in ${libraryName} adapter`)
        }

        if (!adapterConfig.propTransformations || typeof adapterConfig.propTransformations !== 'object') {
            throw new Error(`Invalid propTransformations in ${libraryName} adapter`)
        }

        if (!adapterConfig.imports || !Array.isArray(adapterConfig.imports)) {
            throw new Error(`Invalid imports configuration in ${libraryName} adapter`)
        }

        if (adapterConfig.validateAdapter && typeof adapterConfig.validateAdapter === 'function') {
            const validationResult = await adapterConfig.validateAdapter(adapterConfig)
            if (validationResult !== true) {
                throw new Error(`Adapter validation failed for ${libraryName}: ${validationResult}`)
            }
        }
    }

    /**
     * Build compatibility matrix for version and feature checking
     * @param {Object} adapterConfig - Adapter configuration
     * @param {string} libraryName - Library name
     * @returns {Promise<void>}
     */
    async buildCompatibilityMatrix(adapterConfig, libraryName) {
        const matrix = {
            supportedVersions: adapterConfig.compatibility?.versions || [],
            supportedFeatures: adapterConfig.compatibility?.features || [],
            breakingChanges: adapterConfig.compatibility?.breakingChanges || [],
            migrationPath: adapterConfig.compatibility?.migrationPath || null
        }

        this.compatibilityMatrix.set(libraryName, matrix)
    }

    /**
     * Check version compatibility for a library
     * @param {Object} adapterConfig - Adapter configuration
     * @param {string} libraryName - Library name
     * @returns {Promise<void>}
     */
    async checkVersionCompatibility(adapterConfig, libraryName) {
        const compatibility = adapterConfig.compatibility

        if (compatibility.checkVersion && typeof compatibility.checkVersion === 'function') {
            const isCompatible = await compatibility.checkVersion()
            if (!isCompatible) {
                const supportedVersions = compatibility.versions?.join(', ') || 'unknown';
                throw new Error(
                    `Version compatibility check failed for ${libraryName}. ` +
                    `Supported versions: ${supportedVersions}`
                )
            }
        }
    }

    /**
     * Get compatibility information for a library
     * @param {string} libraryName - Library name
     * @returns {Object|null} Compatibility matrix or null if not available
     */
    getCompatibilityMatrix(libraryName) {
        return this.compatibilityMatrix.get(libraryName) || null
    }

    /**
     * Check if migration is possible between two libraries
     * @param {string} fromLibrary - Source library
     * @param {string} toLibrary - Target library  
     * @returns {Object} Migration compatibility information
     */
    checkMigrationCompatibility(fromLibrary, toLibrary) {
        const fromMatrix = this.getCompatibilityMatrix(fromLibrary)
        const toMatrix = this.getCompatibilityMatrix(toLibrary)

        if (!fromMatrix || !toMatrix) {
            return { possible: false, reason: 'Compatibility matrix not available' }
        }

        // Check for common features
        const fromFeatures = new Set(fromMatrix.supportedFeatures)
        const toFeatures = new Set(toMatrix.supportedFeatures)
        const commonFeatures = [...fromFeatures].filter(feature => toFeatures.has(feature))

        const coveragePercentage = (commonFeatures.length / fromFeatures.size) * 100

        return { possible: coveragePercentage >= 80, coveragePercentage, commonFeatures, missingFeatures: [...fromFeatures].filter(feature => !toFeatures.has(feature)), migrationPath: toMatrix.migrationPath }
    }

    /**
     * Enable hot reloading for adapter configurations
     * @param {string} configsPath - Path to adapter configurations
     * @param {Function} onChange - Callback when adapter changes
     */
    enableHotReload(configsPath = 'src/core/adapters/configs', onChange) {
        this.configLoader.enableHotReload(
            [path.join(configsPath, '*.config.js')],
            async (changedPath, newConfig) => {
                const libraryName = path.basename(changedPath, '.config.js')

                this.adapters.set(libraryName, newConfig)

                await this.buildCompatibilityMatrix(newConfig, libraryName)

                onChange && onChange(libraryName, newConfig)
            }
        )
    }

    /**
     * Get list of all loaded adapter names
     * @returns {string[]} Array of loaded adapter names
     */
    getLoadedAdapters() {
        return Array.from(this.adapters.keys())
    }

    /**
     * Clear all loaded adapters and reset state
     */
    clearAdapters() {
        this.adapters.clear()
        this.compatibilityMatrix.clear()
        this.currentLibrary = null
        this.configLoader.clearCache()
    }
}
/**
 * Core configuration loader that handles dyanmic loading and validation of all configuration files with embedded validation rules.
 */

import fs from 'fs-extra'
import path from 'path'
import { pathToFileURL } from 'url'

export class ConfigurationLoader {
    constructor() {
        this.cache = new Map()
        this.watchMode = false
        this.watchers = new Map()
    }

    /**
     * Load configuration from a file path with embedded validation
     * @param {String} configPath - Path to the configuration file
     * @param {Boolean} useCache - Whether to use cached version
     * @returns {Promise<Object>} - Loaded and validated configuration
     */
    async loadConfig(configPath, useCache = true) {
        const absolutePath = path.resolve(configPath)

        if (useCache && this.cache.has(absolutePath)) {
            return this.cache.get(absolutePath)
        }

        try {
            await fs.access(absolutePath)

            const fileURL = pathToFileURL(absolutePath).href
            const cacheBuster = this.watchMode ? `t=${Date.now()}` : ''

            const module = await import(fileURL + cacheBuster)
            const config = module.default || module

            const validatedConfig = await this.validateConfig(config, absolutePath)

            this.cache.set(absolutePath, validatedConfig)

            return validatedConfig
        } catch (error) {
            throw new Error(`Failed to load configuration from ${configPath}:  ${error.message}`)
        }
    }

    /**
     * Validate configuration using its embedded validation rules.
     * @param {Object} config - Configuration object to validate
     * @param {String} configPath - Path for error reporting
     * @returns {Promise<Object>} Validated Configuration
     */
    async validateConfig(config, configPath) {
        if (!config) {
            throw new Error(`Configuration is empty or undefined: ${configPath}`)
        }

        // Check for embedded validation rules 
        if (config.validation && typeof config.validation === 'function') {
            try {
                const validationResult = await config.validation(config)
                if (validationResult !== true) {
                    throw new Error(`Validation failed: ${validationResult}`)
                }
            } catch (error) {
                throw new Error(`Validation error in ${configPath}: ${error.message}`)
            }
        }

        // Run embedded constraints if they exist
        if (config.constraints && Array.isArray(config.constraints)) {
            for (const constraint of config.constraints) {
                if (typeof constraint === 'function') {
                    const result = await constraint(config)
                    if (result !== true) {
                        throw new Error(`Constraint failed in ${configPath}: ${result}`)
                    }
                }
            }
        }

        // Validate required fields if specified
        if (config.required && Array.isArray(config.required)) {
            for (const field of config.required) {
                if (!field in config) {
                    throw new Error(`Required field '${field}' missing in ${configPath}`)
                }
            }
        }

        return config
    }

    /**
     * Resolve dependencies between configurations.
     * @param {Object[]} configs - Array of configurations
     * @returns {Object[]} Configurations with resolved dependencies
     */
    resolveDependencies(configs) {
        const resolved = new Map()
        const resolving = new Set()

        const resolve = (config, index) => {
            if (resolved.has(index)) {
                return resolved.get(index)
            }

            if (resolving.has(index)) {
                throw new Error(`Circular dependency detected in configuration ${index}`)
            }

            resolving.add(index)

            // Process dependencies if they exist
            if (config.dependencies && Array.isArray(config.dependencies)) {
                for (const depIndex of config.dependencies) {
                    if (depIndex < configs.length) {
                        resolve(configs[depIndex], depIndex)
                    }
                }
            }

            resolving.delete(index)
            resolved.set(index, config)

            return config
        }

        return configs.map((config, index) => resolve(config, index))
    }

    /**
     * Enable hot reloading for configuration files.
     * @param {String[]} configPaths - Paths to watch for changes
     * @param {Function} onChange - Callback when configuration changes.
     */
    enableHotReload(configPaths, onChange) {
        this.watchMode = true

        // Only import chokidar when needed for hot reload.
        import('chokidar').then(({ default: chokidar }) => {
            for (const configPath of configPaths) {
                const absolutePath = path.resolve(configPath)

                const watcher = chokidar.watch(absolutePath, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 10 } })

                watcher.on('change', async () => {
                    try {
                        // Clear cache for this file
                        this.cache.delete(absolutePath)

                        // Reloading configuration
                        const newConfig = await this.loadConfig(absolutePath, false)

                        onChange && onChange(absolutePath, newConfig)

                    } catch (error) {
                        console.error(`Hot reload failed for ${absolutePath}: ${error.message}`)
                    }
                })

                this.watchers.set(absolutePath, watcher)
            }
        })
    }

    /**
     * Disable hot reloading and cleanup watchers
     */
    disableHotReload() {
        this.watchMode = false

        for (const [path, watcher] of this.watchers) {
            watcher.close()
        }

        this.watchers.clear()
    }

    /**
     * Clear all cached configurations
     */
    clearCache() {
        this.cache.clear()
    }

    /**
     * Get cached configuration paths
     * @returns {String[]} Array of cached configuration paths
     */
    getCachedPaths() {
        return Array.from(this.cache.keys())
    }

    /**
     * Check if a configuration is cached
     * @param {String} configPath - Path to check
     * @returns {Boolean} Whether the configuration is cached or not.
     */
    isCached(configPath) {
        const absolutePath = path.resolve(configPath)
        return this.cache.has(absolutePath)
    }
}
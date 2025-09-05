// src/core/ConfigurationLoader.js
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ConfigurationLoader {
    constructor() {
        this.cache = new Map();
        this.watchers = new Map();
        this.validationCache = new Map();
    }

    /**
     * Load configuration with embedded validation
     */
    async loadConfig(configPath, options = {}) {
        const { useCache = true, validate = true } = options;

        const fullPath = this.resolvePath(configPath);

        if (useCache && this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }

        if (!existsSync(fullPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }

        try {
            // Dynamic import for ES modules
            const configModule = await import(`file://${fullPath}?t=${Date.now()}`);
            const config = configModule.default || configModule;

            if (validate && config.validation) {
                this.validateConfig(config, config.validation);
            }

            if (useCache) {
                this.cache.set(fullPath, config);
            }

            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration ${configPath}: ${error.message}`);
        }
    }

    /**
     * Load multiple configurations
     */
    async loadConfigs(configPaths, options = {}) {
        const configs = {};

        for (const [key, path] of Object.entries(configPaths)) {
            configs[key] = await this.loadConfig(path, options);
        }

        return configs;
    }

    /**
     * Validate configuration using embedded validation rules
     */
    validateConfig(config, validationRules) {
        const cacheKey = JSON.stringify({ config, validationRules });

        if (this.validationCache.has(cacheKey)) {
            return this.validationCache.get(cacheKey);
        }

        const errors = [];

        // Type validation
        if (validationRules.type && typeof config !== validationRules.type) {
            errors.push(`Expected type ${validationRules.type}, got ${typeof config}`);
        }

        // Required fields validation
        if (validationRules.required) {
            for (const field of validationRules.required) {
                if (!(field in config)) {
                    errors.push(`Required field missing: ${field}`);
                }
            }
        }

        // Schema validation for objects
        if (validationRules.schema && typeof config === 'object') {
            this.validateSchema(config, validationRules.schema, errors);
        }

        // Custom validation functions
        if (validationRules.custom) {
            for (const validator of validationRules.custom) {
                const result = validator(config);
                if (result !== true) {
                    errors.push(result || 'Custom validation failed');
                }
            }
        }

        if (errors.length > 0) {
            const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
            this.validationCache.set(cacheKey, errorMessage);
            throw new Error(errorMessage);
        }

        this.validationCache.set(cacheKey, true);
        return true;
    }

    /**
     * Validate object schema recursively
     */
    validateSchema(obj, schema, errors, path = '') {
        for (const [key, rule] of Object.entries(schema)) {
            const fullPath = path ? `${path}.${key}` : key;
            const value = obj[key];

            if (rule.required && value === undefined) {
                errors.push(`Required field missing: ${fullPath}`);
                continue;
            }

            if (value !== undefined) {
                if (rule.type && typeof value !== rule.type) {
                    errors.push(`${fullPath}: expected ${rule.type}, got ${typeof value}`);
                }

                if (rule.enum && !rule.enum.includes(value)) {
                    errors.push(`${fullPath}: must be one of ${rule.enum.join(', ')}`);
                }

                if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
                    errors.push(`${fullPath}: does not match pattern ${rule.pattern}`);
                }

                if (rule.schema && typeof value === 'object') {
                    this.validateSchema(value, rule.schema, errors, fullPath);
                }

                if (rule.items && Array.isArray(value)) {
                    value.forEach((item, index) => {
                        if (rule.items.type && typeof item !== rule.items.type) {
                            errors.push(`${fullPath}[${index}]: expected ${rule.items.type}, got ${typeof item}`);
                        }
                        if (rule.items.schema && typeof item === 'object') {
                            this.validateSchema(item, rule.items.schema, errors, `${fullPath}[${index}]`);
                        }
                    });
                }
            }
        }
    }

    /**
     * Resolve configuration file path
     */
    resolvePath(configPath) {
        if (configPath.startsWith('./') || configPath.startsWith('../')) {
            return resolve(process.cwd(), configPath);
        }
        if (configPath.startsWith('/')) {
            return configPath;
        }
        return resolve(process.cwd(), 'src/config', configPath);
    }

    /**
     * Clear cache for specific config or all configs
     */
    clearCache(configPath = null) {
        if (configPath) {
            const fullPath = this.resolvePath(configPath);
            this.cache.delete(fullPath);
            this.validationCache.clear(); // Clear validation cache when config changes
        } else {
            this.cache.clear();
            this.validationCache.clear();
        }
    }

    /**
     * Get cached configuration
     */
    getCached(configPath) {
        const fullPath = this.resolvePath(configPath);
        return this.cache.get(fullPath);
    }

    /**
     * Check if configuration is cached
     */
    isCached(configPath) {
        const fullPath = this.resolvePath(configPath);
        return this.cache.has(fullPath);
    }
}

export default new ConfigurationLoader();
#!/usr/bin/env node

/**
 * Generate Script for Component Generation
 * Usage: node src/scripts/generate.js generate <config-file> [library]
 */

import { ComponentGenerator } from '../core/components/ComponentGenerator.js'
import { VuetifyAdapter } from '../core/adapters/VuetifyAdapter.js'
import { PrimeVueAdapter } from '../core/adapters/PrimeVueAdapter.js'
import { ConfigValidator } from '../core/validation/ConfigValidator.js'
import { readFileSync, existsSync } from 'fs'
import { pathToFileURL } from 'url'
import chalk from 'chalk'
import path from 'path'

class GenerateScript {
    constructor() {
        this.generator = new ComponentGenerator({
            outputDir: 'dist/components',
            templateType: 'sfc'
        })
        this.validator = new ConfigValidator()
        this.adapters = {
            'primevue': () => new PrimeVueAdapter(),
            'vuetify': () => new VuetifyAdapter()
        }
    }

    async run() {
        const args = process.argv.slice(2)

        if (args.length === 0) {
            this.showHelp()
            return
        }

        const command = args[0]

        try {
            switch (command) {
                case 'generate':
                    await this.generate(args[1], args[2])
                    break
                case 'validate':
                    await this.validate(args[1])
                    break
                case 'migrate':
                    await this.migrate(args[1], args[2], args[3])
                    break
                default:
                    console.log(chalk.red(`Unknown command: ${command}`))
                    this.showHelp()
            }
        } catch (error) {
            console.error(chalk.red('Error:'), error.message)
            process.exit(1)
        }
    }

    /**
     * Generate component from configuration
     */
    async generate(configPath, library = 'vuetify') {
        if (!configPath) {
            throw new Error('Configuration file path is required')
        }

        if (!existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`)
        }

        console.log(chalk.blue('🚀 Starting component generation...'))

        // Set library adapter
        await this.setLibrary(library)

        // Load and validate configuration
        const config = await this.loadConfig(configPath)
        console.log(chalk.cyan(`📝 Loaded configuration for: ${config.name}`))

        const validation = this.validator.validate(config)

        if (!validation.valid) {
            console.log(chalk.red('❌ Configuration validation failed:'))
            validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)))
            return
        }

        if (validation.warnings.length > 0) {
            console.log(chalk.yellow('⚠️  Warnings:'))
            validation.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)))
        }

        // Generate component
        const result = await this.generator.generateComponent(config)

        console.log(chalk.green(`✅ Generated ${config.name} successfully`))
        console.log(chalk.cyan(`📁 Output: ${result.path}`))
        console.log(chalk.cyan(`📚 Library: ${result.metadata.library}`))
        console.log(chalk.cyan(`⏰ Generated at: ${result.metadata.generatedAt}`))
    }

    /**
     * Validate configuration file
     */
    async validate(configPath) {
        if (!configPath) {
            throw new Error('Configuration file path is required')
        }

        if (!existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`)
        }

        const config = await this.loadConfig(configPath)
        const validation = this.validator.validate(config)

        console.log(this.validator.generateReport(config, validation))
    }

    /**
     * Migrate components between libraries
     */
    async migrate(fromLibrary, toLibrary, configDir) {
        if (!fromLibrary || !toLibrary || !configDir) {
            throw new Error('Migration requires: from-library, to-library, and config-directory')
        }

        if (!this.adapters[fromLibrary] || !this.adapters[toLibrary]) {
            throw new Error(`Unsupported library. Available: ${Object.keys(this.adapters).join(', ')}`)
        }

        if (!existsSync(configDir)) {
            throw new Error(`Configuration directory not found: ${configDir}`)
        }

        console.log(chalk.blue(`🔄 Migrating from ${fromLibrary} to ${toLibrary}...`))

        // Set target library
        await this.setLibrary(toLibrary)

        // Get all config files
        const { globSync } = await import('glob')
        const configFiles = globSync(`${configDir}/**/*.js`)

        if (configFiles.length === 0) {
            console.log(chalk.yellow('No configuration files found'))
            return
        }

        let successful = 0
        let failed = 0

        // Process each config file
        for (const configFile of configFiles) {
            try {
                const config = await this.loadConfig(configFile)
                await this.generator.generateComponent(config)
                successful++
                console.log(chalk.green(`✅ Migrated ${config.name}`))
            } catch (error) {
                failed++
                console.log(chalk.red(`❌ Failed to migrate ${path.basename(configFile)}: ${error.message}`))
            }
        }

        console.log(chalk.cyan(`\n📊 Migration complete:`))
        console.log(chalk.green(`  ✅ Successful: ${successful}`))
        if (failed > 0) {
            console.log(chalk.red(`  ❌ Failed: ${failed}`))
        }
    }

    /**
     * Set library adapter
     */
    async setLibrary(libraryName) {
        if (!this.adapters[libraryName]) {
            throw new Error(`Unsupported library: ${libraryName}. Available: ${Object.keys(this.adapters).join(', ')}`)
        }

        const adapter = this.adapters[libraryName]()

        // Initialize adapter (load configs)
        console.log(chalk.blue(`📚 Initializing ${adapter.name} adapter...`))
        await adapter.initialize()

        this.generator.setLibraryAdapter(adapter)

        const componentCount = adapter.getAllComponents().length
        console.log(chalk.green(`✅ Using ${adapter.name} v${adapter.version} (${componentCount} components loaded)`))
    }

    /**
     * Load configuration file
     */
    async loadConfig(configPath) {
        const ext = path.extname(configPath)

        if (ext === '.js') {
            const absolutePath = path.resolve(configPath)
            const fileUrl = pathToFileURL(absolutePath)
            const module = await import(fileUrl)
            return module.default || module
        } else if (ext === '.json') {
            return JSON.parse(readFileSync(configPath, 'utf8'))
        } else {
            throw new Error(`Unsupported config format: ${ext}. Use .js or .json`)
        }
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(chalk.bold('\n🎨 Zero-Overhead Design System Generator\n'))

        console.log(chalk.cyan('Usage:'))
        console.log('  node src/scripts/generate.js generate <config-file> [library]')
        console.log('  node src/scripts/generate.js validate <config-file>')
        console.log('  node src/scripts/generate.js migrate <from> <to> <config-dir>')
        console.log('')

        console.log(chalk.cyan('Libraries:'))
        console.log('  primevue    PrimeVue components')
        console.log('  vuetify     Vuetify 3 components (default)')
        console.log('')

        console.log(chalk.cyan('Examples:'))
        console.log('  npm run generate src/configs/vuetify/button.config.js')
        console.log('  npm run generate src/configs/vuetify/button.config.js vuetify')
        console.log('  node src/scripts/generate.js validate src/configs/vuetify/button.config.js')
        console.log('  node src/scripts/generate.js migrate primevue vuetify src/configs/')
        console.log('')
    }
}

// Run the script
const script = new GenerateScript()
script.run().catch(error => {
    console.error(chalk.red('Script Error:'), error.message)
    process.exit(1)
})
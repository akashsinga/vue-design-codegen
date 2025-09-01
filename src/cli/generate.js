#!/usr/bin/env node

import { ComponentGenerator } from '../core/ComponentGenerator.js'
import { PrimeVueAdapter } from '../adapters/PrimeVueAdapter.js'
import { VuetifyAdapter } from '../adapters/VuetifyAdapter.js'
import { ConfigValidator } from '../core/ConfigValidator.js'
import chalk from 'chalk'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

/**
 * CLI tool for generating components from configuration files
 * Phase 2: Advanced Transformation Capabilities with Multi-Library Support
 */
class GenerateCLI {
    constructor() {
        this.generator = new ComponentGenerator({
            outputDir: 'generated',
            templateType: 'both',
            performanceMode: true
        })

        this.validator = new ConfigValidator()

        // Set default adapter to PrimeVue
        this.setLibrary('primevue')
    }

    async run() {
        const args = process.argv.slice(2)

        if (args.length === 0) {
            this.showHelp()
            return
        }

        const command = args[0]

        switch (command) {
            case 'component':
                await this.generateComponent(args[1], args[2]) // Second arg for library
                break
            case 'config':
                await this.generateFromConfig(args[1])
                break
            case 'switch-library':
                await this.switchLibrary(args[1])
                break
            case 'help':
                this.showHelp()
                break
            default:
                console.log(chalk.red(`Unknown command: ${command}`))
                this.showHelp()
        }
    }

    async generateComponent(configPath, libraryName) {
        if (!configPath) {
            console.log(chalk.red('Please provide a configuration file path'))
            return
        }

        if (!existsSync(configPath)) {
            console.log(chalk.red(`Configuration file not found: ${configPath}`))
            return
        }

        try {
            // Switch library if specified
            if (libraryName) {
                this.setLibrary(libraryName)
            }

            console.log(chalk.blue('🚀 Starting component generation...'))
            console.log(chalk.cyan(`📚 Using library: ${this.generator.libraryAdapter.name} v${this.generator.libraryAdapter.version}`))

            // Load configuration
            const config = await this.loadConfig(configPath)
            console.log(chalk.green(`✓ Loaded configuration for: ${config.name}`))

            // Validate configuration
            console.log(chalk.blue('🔍 Validating configuration...'))
            const validation = this.validator.validate(config)

            if (!validation.valid) {
                console.log(chalk.red('❌ Configuration validation failed:'))
                validation.errors.forEach(error => {
                    console.log(chalk.red(`  • ${error}`))
                })
                return
            }

            if (validation.warnings.length > 0) {
                console.log(chalk.yellow('⚠️  Configuration warnings:'))
                validation.warnings.forEach(warning => {
                    console.log(chalk.yellow(`  • ${warning}`))
                })
            }

            console.log(chalk.green('✓ Configuration validated successfully'))

            // Show transformation info
            if (config.propMappings && config.propMappings.length > 0) {
                console.log(chalk.blue('🔧 Processing advanced transformations...'))
                const transformTypes = [...new Set(config.propMappings.map(m => m.type))]
                console.log(chalk.gray(`  Transformation types: ${transformTypes.join(', ')}`))
            }

            // Generate component
            const result = await this.generator.generateComponent(config)

            console.log(chalk.green('✅ Component generated successfully!'))
            console.log(chalk.cyan('📁 Generated files:'))

            if (result.paths.sfc) {
                console.log(chalk.gray(`  SFC: ${result.paths.sfc}`))
            }

            if (result.paths.jsx) {
                console.log(chalk.gray(`  JSX: ${result.paths.jsx}`))
            }

            console.log(chalk.cyan(`📊 Metadata:`))
            console.log(chalk.gray(`  Library: ${result.metadata.library}`))
            console.log(chalk.gray(`  Performance optimized: ${result.metadata.performanceOptimized}`))
            console.log(chalk.gray(`  Generated at: ${result.metadata.generatedAt}`))

            // Show next steps
            console.log(chalk.blue('\n🎯 Next steps:'))
            console.log(chalk.gray('  1. Import the generated component in your Vue app'))
            console.log(chalk.gray('  2. Use it like any other Vue component'))
            console.log(chalk.gray('  3. Enjoy zero-overhead performance!'))

        } catch (error) {
            console.log(chalk.red('❌ Generation failed:'))
            console.log(chalk.red(error.message))
            console.log(chalk.gray(error.stack))
        }
    }

    async switchLibrary(libraryName) {
        if (!libraryName) {
            console.log(chalk.red('Please specify a library name'))
            console.log(chalk.cyan('Available libraries: primevue, vuetify'))
            return
        }

        try {
            this.setLibrary(libraryName)
            console.log(chalk.green(`✓ Switched to ${this.generator.libraryAdapter.name} v${this.generator.libraryAdapter.version}`))
            console.log(chalk.gray('  All future generations will use this library'))
        } catch (error) {
            console.log(chalk.red(`❌ Failed to switch library: ${error.message}`))
        }
    }

    setLibrary(libraryName) {
        switch (libraryName.toLowerCase()) {
            case 'primevue':
                this.generator.setLibraryAdapter(new PrimeVueAdapter())
                break
            case 'vuetify':
                this.generator.setLibraryAdapter(new VuetifyAdapter())
                break
            default:
                throw new Error(`Library "${libraryName}" is not supported. Available: primevue, vuetify`)
        }
    }

    async generateFromConfig(configDir) {
        if (!configDir) {
            console.log(chalk.red('Please provide a configuration directory path'))
            return
        }

        if (!existsSync(configDir)) {
            console.log(chalk.red(`Configuration directory not found: ${configDir}`))
            return
        }

        try {
            const { globSync } = await import('glob')
            const configFiles = globSync(`${configDir}/**/*.js`)

            if (configFiles.length === 0) {
                console.log(chalk.yellow('No configuration files found in directory'))
                return
            }

            console.log(chalk.blue(`🚀 Starting batch generation for ${configFiles.length} configurations...`))

            const results = []
            for (const configFile of configFiles) {
                try {
                    const config = await this.loadConfig(configFile)
                    const result = await this.generator.generateComponent(config)
                    results.push({ success: true, name: config.name, ...result })
                    console.log(chalk.green(`✓ Generated ${config.name}`))
                } catch (error) {
                    results.push({ success: false, file: configFile, error: error.message })
                    console.log(chalk.red(`✗ Failed to generate ${configFile}: ${error.message}`))
                }
            }

            // Summary
            const successful = results.filter(r => r.success).length
            const failed = results.filter(r => !r.success).length

            console.log(chalk.cyan(`\n📊 Batch generation complete:`))
            console.log(chalk.green(`  ✓ Successful: ${successful}`))
            if (failed > 0) {
                console.log(chalk.red(`  ✗ Failed: ${failed}`))
            }

        } catch (error) {
            console.log(chalk.red('❌ Batch generation failed:'))
            console.log(chalk.red(error.message))
        }
    }

    async loadConfig(configPath) {
        const ext = path.extname(configPath)

        if (ext === '.js') {
            // Use pathToFileURL for proper cross-platform ES module loading
            const absolutePath = path.resolve(configPath)
            const fileUrl = pathToFileURL(absolutePath)
            const module = await import(fileUrl)
            return module.default || module
        } else if (ext === '.json') {
            return JSON.parse(readFileSync(configPath, 'utf8'))
        } else {
            throw new Error(`Unsupported config file format: ${ext}. Supported: .js, .json`)
        }
    }

    showHelp() {
        console.log(chalk.bold('\n🎨 Zero-Overhead Design System Generator v2.0\n'))

        console.log(chalk.cyan('Usage:'))
        console.log('  npm run generate component <config-file> [library]     Generate single component')
        console.log('  npm run generate config <config-dir>                  Generate all components from directory')
        console.log('  npm run generate switch-library <library-name>        Switch default UI library')
        console.log('  npm run generate help                                 Show this help\n')

        console.log(chalk.cyan('Supported Libraries:'))
        console.log('  primevue    - PrimeVue components (default)')
        console.log('  vuetify     - Vuetify 3 components\n')

        console.log(chalk.cyan('Examples:'))
        console.log('  npm run generate component configs/Button.js')
        console.log('  npm run generate component configs/Button.js vuetify')
        console.log('  npm run generate component configs/ButtonVuetify.js vuetify')
        console.log('  npm run generate config configs/')
        console.log('  npm run generate switch-library vuetify\n')

        console.log(chalk.cyan('Phase 2 Features:'))
        console.log('  ✅ Multi-library support (PrimeVue + Vuetify)')
        console.log('  ✅ Advanced prop transformations (7 types)')
        console.log('  ✅ Complex mapping engine')
        console.log('  ✅ Library-specific optimizations')
        console.log('  ✅ Batch component generation')
        console.log('  ✅ Runtime library switching\n')

        console.log(chalk.cyan('Transformation Types:'))
        console.log('  • direct        - Direct prop mapping')
        console.log('  • conditional   - Conditional prop based on logic')
        console.log('  • value         - Transform prop value with function')
        console.log('  • multiProp     - Combine multiple props into one')
        console.log('  • nested        - Create nested objects from flat props')
        console.log('  • computed      - Computed properties with custom logic')
        console.log('  • librarySpecific - Library-conditional transformations\n')
    }
}

// Run CLI
const cli = new GenerateCLI()
cli.run().catch(error => {
    console.error(chalk.red('CLI Error:'), error.message)
    process.exit(1)
})
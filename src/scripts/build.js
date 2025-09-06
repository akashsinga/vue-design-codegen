#!/usr/bin/env node

/**
 * Enhanced Build Script for Self-Contained Design System Package
 * Creates standalone Vue plugin with bundled UI library and design tokens
 * 
 * Usage: node src/scripts/build.js --library=vuetify --bundle=treeshake
 */

import { ComponentGenerator } from '../core/components/ComponentGenerator.js'
import { BundleGenerator } from '../core/bundle/BundleGenerator.js'
import { VuetifyAdapter } from '../core/adapters/VuetifyAdapter.js'
import { PrimeVueAdapter } from '../core/adapters/PrimeVueAdapter.js'
import { ConfigValidator } from '../core/validation/ConfigValidator.js'
import { existsSync, mkdirSync, cpSync, rmSync, readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { glob } from 'glob'
import chalk from 'chalk'
import path from 'path'

class DesignSystemBuilder {
    constructor() {
        this.validator = new ConfigValidator()
        this.adapters = {
            'vuetify': () => new VuetifyAdapter(),
            'primevue': () => new PrimeVueAdapter()
        }
        this.generatedComponents = []
        this.buildOptions = {}
        this.designTokens = {}
    }

    async run() {
        const args = process.argv.slice(2)
        this.buildOptions = this.parseArguments(args)

        console.log(chalk.bold.blue('\n🚀 Design System Build Starting...\n'))

        try {
            await this.validateEnvironment()
            await this.loadDesignTokens()
            await this.generateComponents()
            await this.createBundle()

            console.log(chalk.bold.green('\n✅ Design System Build Complete!\n'))
            this.printBuildSummary()

        } catch (error) {
            console.error(chalk.red('\n❌ Build failed:'), error.message)
            if (error.stack && this.buildOptions.verbose) {
                console.error(chalk.gray(error.stack))
            }
            process.exit(1)
        }
    }

    parseArguments(args) {
        const options = {
            library: 'vuetify',
            bundle: 'treeshake',
            output: 'dist',
            verbose: false
        }

        args.forEach(arg => {
            if (arg.startsWith('--library=')) {
                options.library = arg.split('=')[1]
            } else if (arg.startsWith('--bundle=')) {
                options.bundle = arg.split('=')[1]
            } else if (arg.startsWith('--output=')) {
                options.output = arg.split('=')[1]
            } else if (arg === '--verbose') {
                options.verbose = true
            }
        })

        return options
    }

    async validateEnvironment() {
        console.log(chalk.cyan('📋 Validating environment...'))

        if (!this.adapters[this.buildOptions.library]) {
            throw new Error(`Unsupported library: ${this.buildOptions.library}. Supported: ${Object.keys(this.adapters).join(', ')}`)
        }

        const configDir = path.resolve(`./src/configs/${this.buildOptions.library}`)
        if (!existsSync(configDir)) {
            throw new Error(`Component configuration directory not found: ${configDir}`)
        }

        const libraryConfigPath = path.resolve(`./src/configs/libraries/${this.buildOptions.library}.config.js`)
        if (!existsSync(libraryConfigPath)) {
            throw new Error(`Library configuration not found: ${libraryConfigPath}`)
        }

        const themesDir = path.resolve('./src/themes')
        if (!existsSync(themesDir)) {
            throw new Error(`Themes directory not found: ${themesDir}. Please create theme files (light.theme.js, dark.theme.js)`)
        }

        const outputDir = path.resolve(this.buildOptions.output)
        if (existsSync(outputDir)) {
            rmSync(outputDir, { recursive: true, force: true })
        }
        mkdirSync(outputDir, { recursive: true })

        console.log(chalk.green('✅ Environment validated'))
    }

    async loadDesignTokens() {
        console.log(chalk.cyan('🎨 Loading design tokens...'))

        try {
            const themesDir = path.resolve('./src/themes')
            const themeFiles = glob.sync('*.theme.js', { cwd: themesDir })

            if (themeFiles.length === 0) {
                throw new Error(`No theme files found in ${themesDir}. Expected files: light.theme.js, dark.theme.js`)
            }

            for (const file of themeFiles) {
                const themeName = path.basename(file, '.theme.js')
                const themePath = path.join(themesDir, file)
                const module = await import(pathToFileURL(themePath).href)

                this.designTokens[themeName] = module.default ||
                    module[`${themeName}Theme`] ||
                    module[themeName] ||
                    module

                if (this.buildOptions.verbose) {
                    console.log(chalk.blue(`  📄 Loaded ${themeName} theme from ${file}`))
                }
            }

            console.log(chalk.green(`✅ Loaded ${Object.keys(this.designTokens).length} themes: ${Object.keys(this.designTokens).join(', ')}`))

        } catch (error) {
            throw new Error(`Failed to load design tokens: ${error.message}`)
        }
    }

    async generateComponents() {
        console.log(chalk.cyan(`🏗️  Generating components for ${this.buildOptions.library}...`))

        const adapter = this.adapters[this.buildOptions.library]()
        await adapter.initialize()

        // Generate components with DS prefix directly to final location
        const componentsDir = path.join(this.buildOptions.output, 'components')
        mkdirSync(componentsDir, { recursive: true })

        const generator = new ComponentGenerator({
            libraryAdapter: adapter,
            outputDir: componentsDir,
            templateType: 'sfc',
            bundleMode: true,
            componentPrefix: 'DS'
        })

        const configDir = path.resolve(`./src/configs/${this.buildOptions.library}`)
        const configFiles = glob.sync('*.config.js', { cwd: configDir })

        if (configFiles.length === 0) {
            throw new Error(`No component configurations found in ${configDir}`)
        }

        for (const configFile of configFiles) {
            const configPath = path.join(configDir, configFile)
            const config = await this.loadConfig(configPath)

            const validation = this.validator.validate(config)
            if (!validation.valid) {
                console.log(chalk.red(`❌ Validation failed for ${configFile}:`))
                validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)))
                continue
            }

            if (validation.warnings.length > 0 && this.buildOptions.verbose) {
                console.log(chalk.yellow(`⚠️  Warnings for ${configFile}:`))
                validation.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)))
            }

            const result = await generator.generateComponent(config)
            this.generatedComponents.push(result)

            console.log(chalk.green(`  ✅ Generated ${result.name}`))
        }

        console.log(chalk.green(`✅ Generated ${this.generatedComponents.length} components with DS prefix`))
    }

    async createBundle() {
        console.log(chalk.cyan('📦 Creating bundle...'))

        const adapter = this.adapters[this.buildOptions.library]()
        await adapter.initialize()

        const bundleGenerator = new BundleGenerator({
            library: this.buildOptions.library,
            outputDir: this.buildOptions.output,
            bundleMode: this.buildOptions.bundle,
            designTokens: this.designTokens,
            generatedComponents: this.generatedComponents,
            adapter: adapter
        })

        await bundleGenerator.generateBundle()

        console.log(chalk.green('✅ Bundle created'))
    }

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

    printBuildSummary() {
        console.log(chalk.bold('📊 Build Summary:'))
        console.log(chalk.cyan(`  Library: ${this.buildOptions.library}`))
        console.log(chalk.cyan(`  Bundle Mode: ${this.buildOptions.bundle}`))
        console.log(chalk.cyan(`  Components: ${this.generatedComponents.length}`))

        this.generatedComponents.forEach(comp => {
            console.log(chalk.gray(`    • ${comp.name} (from ${comp.originalName})`))
        })

        console.log(chalk.cyan(`  Themes: ${Object.keys(this.designTokens).length}`))
        Object.keys(this.designTokens).forEach(themeName => {
            console.log(chalk.gray(`    • ${themeName}`))
        })

        console.log(chalk.cyan(`  Output: ${path.resolve(this.buildOptions.output)}`))
        console.log('')
        console.log(chalk.bold.green('🎉 Ready for distribution!'))
        console.log('')
        console.log(chalk.gray('Next steps:'))
        console.log(chalk.gray('1. Test the bundle: cd dist && npm pack'))
        console.log(chalk.gray('2. Install in consumer app: npm install /path/to/dist'))
        console.log(chalk.gray('3. Use in consumer: app.use(DesignSystem, { theme: "light" })'))

        this.generatedComponents.forEach(comp => {
            console.log(chalk.gray(`4. Use components: <${comp.name}>, etc.`))
        })
        console.log('')
    }

    showHelp() {
        console.log(chalk.bold('\n🎨 Design System Builder\n'))
        console.log(chalk.cyan('Usage:'))
        console.log('  node src/scripts/build.js [options]')
        console.log('')
        console.log(chalk.cyan('Options:'))
        console.log('  --library=<name>     UI library to use (vuetify, primevue)')
        console.log('  --bundle=<mode>      Bundle mode (treeshake, full)')
        console.log('  --output=<dir>       Output directory (default: dist)')
        console.log('  --verbose            Show detailed output')
        console.log('')
        console.log(chalk.cyan('Examples:'))
        console.log('  node src/scripts/build.js --library=vuetify')
        console.log('  node src/scripts/build.js --library=primevue --verbose')
        console.log('')
    }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    const builder = new DesignSystemBuilder()
    builder.showHelp()
    process.exit(0)
}

const builder = new DesignSystemBuilder()
builder.run().catch(error => {
    console.error(chalk.red('Build Error:'), error.message)
    process.exit(1)
})
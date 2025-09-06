#!/usr/bin/env node

/**
 * Enhanced Build Script for Self-Contained Design System Package
 * Creates standalone Vue plugin with bundled UI library and design tokens
 * 
 * Usage: node src/scripts/build.js --library=vuetify --bundle=treeshake
 */

import { ComponentGenerator } from '../core/components/ComponentGenerator.js'
import { VuetifyAdapter } from '../core/adapters/VuetifyAdapter.js'
import { PrimeVueAdapter } from '../core/adapters/PrimeVueAdapter.js'
import { ConfigValidator } from '../core/validation/ConfigValidator.js'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import fsExtra from 'fs-extra'
const { ensureDirSync, copySync, removeSync } = fsExtra
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
            await this.generatePlugin()
            await this.createPackageStructure()
            await this.generatePackageJson()

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

    /**
     * Parse command line arguments
     */
    parseArguments(args) {
        const options = {
            library: 'vuetify',
            bundle: 'treeshake',
            output: 'dist',
            verbose: false
        }

        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            if (arg.startsWith('--library=')) {
                options.library = arg.split('=')[1]
            } else if (arg.startsWith('--bundle=')) {
                options.bundle = arg.split('=')[1]
            } else if (arg.startsWith('--output=')) {
                options.output = arg.split('=')[1]
            } else if (arg === '--verbose') {
                options.verbose = true
            }
        }

        return options
    }

    /**
     * Validate build environment and prerequisites
     */
    async validateEnvironment() {
        console.log(chalk.cyan('📋 Validating environment...'))

        // Check if library is supported
        if (!this.adapters[this.buildOptions.library]) {
            throw new Error(`Unsupported library: ${this.buildOptions.library}. Supported: ${Object.keys(this.adapters).join(', ')}`)
        }

        // Check if config directory exists
        const configDir = path.resolve(`./src/configs/${this.buildOptions.library}`)
        if (!existsSync(configDir)) {
            throw new Error(`Configuration directory not found: ${configDir}`)
        }

        // Check if design tokens exist
        const tokensDir = path.resolve('./src/design-tokens')
        if (!existsSync(tokensDir)) {
            console.log(chalk.yellow('⚠️  Design tokens directory not found, creating basic structure...'))
            await this.createBasicTokens()
        }

        // Clean output directory
        const outputDir = path.resolve(this.buildOptions.output)
        if (existsSync(outputDir)) {
            removeSync(outputDir)
        }
        ensureDirSync(outputDir)

        console.log(chalk.green('✅ Environment validated'))
    }

    /**
     * Create basic design tokens for POC
     */
    async createBasicTokens() {
        const tokensDir = path.resolve('./src/design-tokens')
        ensureDirSync(tokensDir)

        // Basic color tokens
        const colorTokens = `export default {
  primary: '#1976d2',
  secondary: '#424242', 
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  success: '#4caf50',
  surface: '#ffffff',
  background: '#fafafa'
}`

        // Basic spacing tokens
        const spacingTokens = `export default {
  xs: '4px',
  sm: '8px',
  md: '16px', 
  lg: '24px',
  xl: '32px',
  xxl: '48px'
}`

        writeFileSync(path.join(tokensDir, 'colors.tokens.js'), colorTokens)
        writeFileSync(path.join(tokensDir, 'spacing.tokens.js'), spacingTokens)

        console.log(chalk.green('✅ Created basic design tokens'))
    }

    /**
     * Load design tokens from source
     */
    async loadDesignTokens() {
        console.log(chalk.cyan('🎨 Loading design tokens...'))

        try {
            const tokensDir = path.resolve('./src/design-tokens')
            const tokenFiles = glob.sync('*.tokens.js', { cwd: tokensDir })

            for (const file of tokenFiles) {
                const tokenType = path.basename(file, '.tokens.js')
                const tokenPath = path.join(tokensDir, file)
                const module = await import(pathToFileURL(tokenPath).href)
                this.designTokens[tokenType] = module.default || module
            }

            console.log(chalk.green(`✅ Loaded ${Object.keys(this.designTokens).length} token sets: ${Object.keys(this.designTokens).join(', ')}`))
        } catch (error) {
            throw new Error(`Failed to load design tokens: ${error.message}`)
        }
    }

    /**
     * Generate components in bundle mode
     */
    async generateComponents() {
        console.log(chalk.cyan(`🏗️  Generating components for ${this.buildOptions.library}...`))

        // Initialize adapter
        const adapter = this.adapters[this.buildOptions.library]()
        await adapter.initialize()

        // Initialize component generator in bundle mode
        const generator = new ComponentGenerator({
            libraryAdapter: adapter,
            outputDir: path.join(this.buildOptions.output, 'temp'),
            templateType: 'sfc',
            bundleMode: true,
            componentPrefix: 'DS',
            internalLibraryPath: '../lib/design-system.js',
            designTokens: this.designTokens
        })

        // Get component configurations
        const configDir = path.resolve(`./src/configs/${this.buildOptions.library}`)
        const configFiles = glob.sync('*.config.js', { cwd: configDir })

        if (configFiles.length === 0) {
            throw new Error(`No component configurations found in ${configDir}`)
        }

        // For POC, limit to specific components
        const pocComponents = ['button.config.js', 'card.config.js']
        const filteredConfigs = configFiles.filter(file => pocComponents.includes(file))

        if (filteredConfigs.length === 0) {
            console.log(chalk.yellow(`⚠️  POC components not found, using first 2 available: ${configFiles.slice(0, 2).join(', ')}`))
            filteredConfigs.push(...configFiles.slice(0, 2))
        }

        // Generate components
        for (const configFile of filteredConfigs) {
            const configPath = path.join(configDir, configFile)
            const config = await this.loadConfig(configPath)

            // Validate configuration
            const validation = this.validator.validate(config)
            if (!validation.valid) {
                console.log(chalk.red(`❌ Validation failed for ${configFile}:`))
                validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)))
                continue
            }

            // Generate component
            const result = await generator.generateComponent(config)
            this.generatedComponents.push(result)

            console.log(chalk.green(`  ✅ Generated ${result.name}`))
        }

        // Generate component index
        const indexPath = generator.generateComponentIndex(this.generatedComponents)
        console.log(chalk.green(`✅ Generated ${this.generatedComponents.length} components and index file`))
    }

    /**
     * Create bundle with UI library and generated components
     */
    async createBundle() {
        console.log(chalk.cyan('📦 Creating bundle...'))

        // For POC, create a simple bundle structure
        // This is where we would integrate Rollup/Vite bundling
        // For now, create the expected structure

        const bundleDir = path.join(this.buildOptions.output, 'lib')
        ensureDirSync(bundleDir)

        // Create a simple bundle file that exports components with library dependencies
        const bundleContent = this.createBundleContent()
        writeFileSync(path.join(bundleDir, 'design-system.js'), bundleContent)

        // Copy component files to bundle structure
        const tempDir = path.join(this.buildOptions.output, 'temp')
        const finalComponentsDir = path.join(this.buildOptions.output, 'components')

        if (existsSync(tempDir)) {
            copySync(tempDir, finalComponentsDir)
            removeSync(tempDir)
        }

        console.log(chalk.green('✅ Bundle created'))
    }

    /**
     * Create bundle content (POC version)
     */
    createBundleContent() {
        const library = this.buildOptions.library
        const components = this.generatedComponents.map(comp => comp.originalName)

        // This is a simplified version - in full implementation, 
        // this would be generated by Rollup/Vite
        return `// Design System Bundle (POC)
// Generated for ${library}
// Components: ${components.join(', ')}

// NOTE: This is a POC placeholder
// In full implementation, this file would contain:
// - Bundled ${library} components
// - Your generated DS components  
// - Design tokens integration
// - All dependencies resolved

console.warn('POC Bundle - Not fully functional yet')

// Export placeholder for POC testing
export const VBtn = { name: 'VBtn-placeholder' }
export const VCard = { name: 'VCard-placeholder' }
export const VTextField = { name: 'VTextField-placeholder' }

// Design tokens
export const designTokens = ${JSON.stringify(this.designTokens, null, 2)}
`
    }

    /**
     * Generate Vue plugin
     */
    async generatePlugin() {
        console.log(chalk.cyan('🔌 Generating Vue plugin...'))

        const pluginContent = this.createPluginContent()
        writeFileSync(path.join(this.buildOptions.output, 'index.js'), pluginContent)

        // Generate design token files
        await this.generateDesignTokenFiles()

        // Generate basic theme management
        await this.generateThemeFiles()

        console.log(chalk.green('✅ Vue plugin generated'))
    }

    /**
     * Create Vue plugin content
     */
    createPluginContent() {
        const componentImports = this.generatedComponents.map(comp =>
            `import ${comp.name} from './components/${comp.name}.vue'`
        ).join('\n')

        const componentRegistrations = this.generatedComponents.map(comp =>
            `    app.component('${comp.name}', ${comp.name})`
        ).join('\n')

        const componentList = this.generatedComponents.map(comp => comp.name).join(', ')

        return `// Design System Vue Plugin
// Generated for ${this.buildOptions.library}
${componentImports}
import { designTokens } from './lib/design-system.js'
import './assets/styles.css'

export default {
  install(app, options = {}) {
    // Register components globally
${componentRegistrations}

    // Provide design tokens
    app.provide('$dsTokens', designTokens)
    app.config.globalProperties.$dsTokens = designTokens

    // Basic theme management (POC)
    const themeManager = {
      currentTheme: options.theme || 'light',
      switchTheme(theme) {
        this.currentTheme = theme
        document.documentElement.setAttribute('data-theme', theme)
      },
      injectStyles() {
        // Inject CSS variables
        const style = document.createElement('style')
        style.textContent = this.generateTokenCSS()
        document.head.appendChild(style)
      },
      generateTokenCSS() {
        return Object.entries(designTokens).map(([category, tokens]) =>
          Object.entries(tokens).map(([key, value]) =>
            \`  --ds-\${category}-\${key}: \${value};\`
          ).join('\\n')
        ).join('\\n')
      }
    }

    app.provide('$dsTheme', themeManager)
    app.config.globalProperties.$dsTheme = themeManager

    // Initialize
    themeManager.injectStyles()
  }
}

// Named exports
export { ${componentList} }
export { designTokens }
`
    }

    /**
     * Generate design token files
     */
    async generateDesignTokenFiles() {
        const tokensDir = path.join(this.buildOptions.output, 'tokens')
        ensureDirSync(tokensDir)

        // CSS Variables
        const cssVariables = this.generateCSSVariables()
        writeFileSync(path.join(tokensDir, 'css-variables.css'), cssVariables)

        // JS tokens
        const jsTokens = `export const designTokens = ${JSON.stringify(this.designTokens, null, 2)}

export default designTokens
`
        writeFileSync(path.join(tokensDir, 'design-tokens.js'), jsTokens)
    }

    /**
     * Generate CSS variables from design tokens
     */
    generateCSSVariables() {
        let css = ':root {\n'

        Object.entries(this.designTokens).forEach(([category, tokens]) => {
            Object.entries(tokens).forEach(([key, value]) => {
                css += `  --ds-${category}-${key}: ${value};\n`
            })
        })

        css += '}\n'
        return css
    }

    /**
     * Generate basic theme files
     */
    async generateThemeFiles() {
        const themesDir = path.join(this.buildOptions.output, 'themes')
        ensureDirSync(themesDir)

        // Basic theme manager
        const themeManager = `export class ThemeManager {
  constructor(initialTheme = 'light') {
    this.currentTheme = initialTheme
  }

  switchTheme(theme) {
    this.currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
  }

  getCurrentTheme() {
    return this.currentTheme
  }
}

export default ThemeManager
`
        writeFileSync(path.join(themesDir, 'theme-manager.js'), themeManager)
    }

    /**
     * Create package structure with assets
     */
    async createPackageStructure() {
        console.log(chalk.cyan('📁 Creating package structure...'))

        // Create assets directory with basic CSS
        const assetsDir = path.join(this.buildOptions.output, 'assets')
        ensureDirSync(assetsDir)

        // Basic styles (POC)
        const basicStyles = `/* Design System Styles (POC) */
/* Generated for ${this.buildOptions.library} */

/* Design token CSS variables */
${this.generateCSSVariables()}

/* Basic component styles - POC placeholder */
.ds-button {
  background-color: var(--ds-colors-primary);
  color: white;
  border: none;
  padding: var(--ds-spacing-sm) var(--ds-spacing-md);
  border-radius: 4px;
  cursor: pointer;
}

.ds-card {
  background-color: var(--ds-colors-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: var(--ds-spacing-md);
}

/* Theme variations */
[data-theme="dark"] {
  --ds-colors-surface: #1e1e1e;
  --ds-colors-background: #121212;
}
`
        writeFileSync(path.join(assetsDir, 'styles.css'), basicStyles)

        console.log(chalk.green('✅ Package structure created'))
    }

    /**
     * Generate package.json for distribution
     */
    async generatePackageJson() {
        console.log(chalk.cyan('📄 Generating package.json...'))

        const packageJson = {
            name: "internal-design-system",
            version: "0.1.0-poc",
            description: `Self-contained design system built with ${this.buildOptions.library}`,
            main: "index.js",
            type: "module",
            files: [
                "index.js",
                "lib/",
                "components/",
                "assets/",
                "tokens/",
                "themes/"
            ],
            peerDependencies: {
                vue: "^3.5.0"
            },
            keywords: [
                "design-system",
                "vue",
                "components",
                this.buildOptions.library
            ],
            author: "Design System Team",
            license: "MIT",
            repository: {
                type: "git",
                url: "internal"
            },
            buildInfo: {
                generatedAt: new Date().toISOString(),
                library: this.buildOptions.library,
                bundleMode: this.buildOptions.bundle,
                components: this.generatedComponents.map(c => c.name),
                designTokens: Object.keys(this.designTokens)
            }
        }

        writeFileSync(
            path.join(this.buildOptions.output, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        )

        console.log(chalk.green('✅ Package.json generated'))
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
     * Print build summary
     */
    printBuildSummary() {
        console.log(chalk.bold('📊 Build Summary:'))
        console.log(chalk.cyan(`  Library: ${this.buildOptions.library}`))
        console.log(chalk.cyan(`  Bundle Mode: ${this.buildOptions.bundle}`))
        console.log(chalk.cyan(`  Components: ${this.generatedComponents.length}`))

        this.generatedComponents.forEach(comp => {
            console.log(chalk.gray(`    • ${comp.name} (${comp.originalName})`))
        })

        console.log(chalk.cyan(`  Design Tokens: ${Object.keys(this.designTokens).length} sets`))
        Object.keys(this.designTokens).forEach(tokenSet => {
            const count = Object.keys(this.designTokens[tokenSet]).length
            console.log(chalk.gray(`    • ${tokenSet}: ${count} tokens`))
        })

        console.log(chalk.cyan(`  Output: ${path.resolve(this.buildOptions.output)}`))

        // File sizes (basic calculation)
        const bundleFile = path.join(this.buildOptions.output, 'lib/design-system.js')
        const stylesFile = path.join(this.buildOptions.output, 'assets/styles.css')

        if (existsSync(bundleFile)) {
            const bundleSize = (readFileSync(bundleFile).length / 1024).toFixed(1)
            console.log(chalk.cyan(`  Bundle Size: ${bundleSize}KB`))
        }

        if (existsSync(stylesFile)) {
            const stylesSize = (readFileSync(stylesFile).length / 1024).toFixed(1)
            console.log(chalk.cyan(`  Styles Size: ${stylesSize}KB`))
        }

        console.log('\n' + chalk.bold.green('🎉 Ready for testing!'))
        console.log(chalk.gray('Next steps:'))
        console.log(chalk.gray('1. Create test consumer project'))
        console.log(chalk.gray('2. npm install ' + path.resolve(this.buildOptions.output)))
        console.log(chalk.gray('3. Add to main.js: app.use(DesignSystem)'))
        console.log(chalk.gray('4. Use components: <DSButton>, <DSCard>'))
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log(chalk.bold('\n🎨 Design System Builder (POC)\n'))

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
        console.log('  node src/scripts/build.js --library=vuetify --bundle=treeshake')
        console.log('  node src/scripts/build.js --library=primevue --output=build')
        console.log('')
    }
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    const builder = new DesignSystemBuilder()
    builder.showHelp()
    process.exit(0)
}

// Run the build
const builder = new DesignSystemBuilder()
builder.run().catch(error => {
    console.error(chalk.red('Build Error:'), error.message)
    process.exit(1)
})
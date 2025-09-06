// src/core/bundle/BundleGenerator.js
/**
 * Bundle Generator - Creates self-contained design system packages
 * Generates library-agnostic bundles with auto-registration and theme configuration
 */

import { writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from 'fs'
import { rollup } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { pathToFileURL } from 'url'
import chalk from 'chalk'
import path from 'path'

export class BundleGenerator {
    constructor(options = {}) {
        this.libraryName = options.library
        this.outputDir = options.outputDir || 'dist'
        this.bundleMode = options.bundleMode || 'treeshake'
        this.designTokens = options.designTokens || {}
        this.generatedComponents = options.generatedComponents || []
        this.adapter = options.adapter
        this.libraryConfig = null
    }

    async generateBundle() {
        console.log(chalk.cyan(`📦 Generating ${this.libraryName} bundle...`))

        await this.loadLibraryConfig()
        this.createDirectories()
        await this.generateCoreFiles()
        await this.generateVuePlugin()
        await this.generateAssets()
        await this.createBuilds()

        console.log(chalk.green('✅ Bundle generation complete'))
        this.printSummary()
    }

    async loadLibraryConfig() {
        const configPath = path.resolve(`./src/configs/libraries/${this.libraryName}.config.js`)

        try {
            const module = await import(pathToFileURL(configPath).href)
            this.libraryConfig = module.default || module
            console.log(chalk.green(`✅ Loaded ${this.libraryName} library configuration`))
        } catch (error) {
            throw new Error(`Library configuration not found: ${configPath}`)
        }
    }

    createDirectories() {
        const dirs = ['lib', 'themes', 'assets', 'types']

        dirs.forEach(dir => {
            mkdirSync(path.join(this.outputDir, dir), { recursive: true })
        })

        console.log(chalk.blue('📁 Bundle structure created'))
    }

    async generateCoreFiles() {
        const coreContent = this.createCoreLibrary()
        writeFileSync(path.join(this.outputDir, 'lib', 'core.js'), coreContent)

        await this.copyThemeTransformer()

        console.log(chalk.green('✅ Core files generated'))
    }

    createCoreLibrary() {
        const lines = []
        const { setup } = this.libraryConfig

        lines.push('// Design System Core Library')
        lines.push(`// Auto-configures ${this.libraryName} with design tokens`)
        lines.push('')

        lines.push('// Library imports')
        setup.imports.forEach(importLine => lines.push(importLine))
        lines.push('')

        lines.push('// Internal imports')
        lines.push("import { ThemeTransformer } from './ThemeTransformer.js'")
        lines.push('')

        lines.push('// Design tokens')
        lines.push(`export const designTokens = ${JSON.stringify(this.designTokens, null, 2)}`)
        lines.push('')

        lines.push('// Component re-exports')
        this.generatedComponents.forEach(comp => {
            const baseComponent = this.adapter.getComponent(comp.originalName)
            const importStatement = this.adapter.getImportStatement(comp.originalName)
            const importPath = importStatement.match(/'([^']+)'/)?.[1] || 'vue'
            lines.push(`export { ${baseComponent} } from '${importPath}'`)
        })
        lines.push('')

        lines.push('// Library setup function')
        lines.push('export function setupLibrary(app, options = {}) {')
        lines.push('  // Initialize theme transformer')
        lines.push(`  const transformer = new ThemeTransformer('${this.libraryName}')`)
        lines.push('  const transformedThemes = transformer.transform(designTokens)')
        lines.push('')
        lines.push('  // Setup library with transformed themes')
        lines.push('  const themeConfig = transformedThemes')
        lines.push('')
        lines.push('  // Initialize library')
        lines.push(`  ${setup.initialization}`)
        lines.push('')
        lines.push('  // Apply theme configuration')
        lines.push(`  ${setup.themeApplication}`)
        lines.push('')
        lines.push('  // Add utilities')
        lines.push('  app.config.globalProperties.$dsUtils = {')
        lines.push(`    ${setup.utilities}`)
        lines.push('  }')
        lines.push('')
        lines.push('  return { themeConfig, transformer }')
        lines.push('}')

        return lines.join('\n')
    }

    async copyThemeTransformer() {
        const srcPath = path.resolve('./src/core/bundle/ThemeTransformer.js')
        const destPath = path.join(this.outputDir, 'lib', 'ThemeTransformer.js')

        if (existsSync(srcPath)) {
            cpSync(srcPath, destPath)
            console.log(chalk.green('✅ ThemeTransformer copied'))
        } else {
            throw new Error(`ThemeTransformer not found at: ${srcPath}`)
        }
    }

    async generateVuePlugin() {
        const pluginContent = this.createVuePlugin()
        writeFileSync(path.join(this.outputDir, 'index.js'), pluginContent)

        console.log(chalk.green('✅ Vue plugin generated'))
    }

    createVuePlugin() {
        const lines = []

        lines.push('// Design System Vue Plugin')
        lines.push(`// Library-agnostic design system built on ${this.libraryName}`)
        lines.push('')

        lines.push('// Component imports')
        this.generatedComponents.forEach(comp => {
            lines.push(`import ${comp.name} from './components/${comp.name}.vue'`)
        })
        lines.push('')

        lines.push('// Core imports')
        lines.push("import { setupLibrary, designTokens } from './lib/core.js'")
        lines.push("import { ThemeTransformer } from './lib/ThemeTransformer.js'")
        lines.push("import './assets/styles.css'")
        lines.push('')

        lines.push('// Vue plugin')
        lines.push('export default {')
        lines.push('  install(app, options = {}) {')
        lines.push('    // Setup library')
        lines.push('    const { themeConfig, transformer } = setupLibrary(app, options)')
        lines.push('')

        lines.push('    // Register components')
        this.generatedComponents.forEach(comp => {
            lines.push(`    app.component('${comp.name}', ${comp.name})`)
        })
        lines.push('')

        lines.push('    // Provide design tokens')
        lines.push('    app.provide("$dsTokens", designTokens)')
        lines.push('    app.config.globalProperties.$dsTokens = designTokens')
        lines.push('')

        lines.push('    // Theme manager')
        lines.push('    const themeManager = this.createThemeManager(designTokens, transformer, app, options)')
        lines.push('')
        lines.push('    // Provide theme manager')
        lines.push('    app.provide("$dsTheme", themeManager)')
        lines.push('    app.config.globalProperties.$dsTheme = themeManager')
        lines.push('')
        lines.push('    // Initialize theme')
        lines.push('    themeManager.initialize()')
        lines.push('  },')
        lines.push('')

        lines.push('  createThemeManager(designTokens, transformer, app, options) {')
        lines.push('    return {')
        lines.push('      currentTheme: options.theme || "light",')
        lines.push('      themes: designTokens,')
        lines.push('      transformer,')
        lines.push('')
        lines.push('      switchTheme(themeName) {')
        lines.push('        if (!this.themes[themeName]) {')
        lines.push('          console.warn(`Theme "${themeName}" not found`)')
        lines.push('          return')
        lines.push('        }')
        lines.push('        this.currentTheme = themeName')
        lines.push('        this.applyTheme(themeName)')
        lines.push('      },')
        lines.push('')
        lines.push('      applyTheme(themeName) {')
        lines.push('        if (app.config.globalProperties.$dsUtils?.switchLibraryTheme) {')
        lines.push('          app.config.globalProperties.$dsUtils.switchLibraryTheme(themeName)')
        lines.push('        }')
        lines.push('')
        lines.push('        this.updateCSSVariables(themeName)')
        lines.push('        document.documentElement.setAttribute("data-theme", themeName)')
        lines.push('      },')
        lines.push('')
        lines.push('      updateCSSVariables(themeName) {')
        lines.push('        const theme = this.themes[themeName]')
        lines.push('        const cssVars = this.transformer.extractCSSVariables(theme)')
        lines.push('        const root = document.documentElement')
        lines.push('')
        lines.push('        Object.entries(cssVars).forEach(([property, value]) => {')
        lines.push('          root.style.setProperty(property, value)')
        lines.push('        })')
        lines.push('      },')
        lines.push('')
        lines.push('      initialize() {')
        lines.push('        this.applyTheme(this.currentTheme)')
        lines.push('      }')
        lines.push('    }')
        lines.push('  }')
        lines.push('}')
        lines.push('')

        lines.push('// Named exports')
        this.generatedComponents.forEach(comp => {
            lines.push(`export { ${comp.name} }`)
        })
        lines.push('')
        lines.push('// Design tokens export')
        lines.push('export { designTokens }')
        lines.push('')
        lines.push('// Component list')
        const componentNames = this.generatedComponents.map(comp => `'${comp.name}'`)
        lines.push(`export const components = [${componentNames.join(', ')}]`)

        return lines.join('\n')
    }

    async generateAssets() {
        await this.generateThemes()
        await this.generateComponentIndex()
        await this.generateStylesheet()
        await this.generateTypes()
        await this.generatePackageJson()
        await this.generateDocs()

        console.log(chalk.green('✅ Assets generated'))
    }

    async generateThemes() {
        const themesDir = path.join(this.outputDir, 'themes')

        Object.entries(this.designTokens).forEach(([themeName, themeData]) => {
            const content = this.createThemeFile(themeName, themeData)
            writeFileSync(path.join(themesDir, `${themeName}.js`), content)
        })

        const indexContent = this.createThemeIndex()
        writeFileSync(path.join(themesDir, 'index.js'), indexContent)
    }

    createThemeFile(themeName, themeData) {
        const lines = []
        lines.push(`// ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme`)
        lines.push(`// Generated for ${this.libraryName}`)
        lines.push('')
        lines.push(`export const ${themeName}Theme = ${JSON.stringify(themeData, null, 2)}`)
        lines.push('')
        lines.push(`export default ${themeName}Theme`)
        return lines.join('\n')
    }

    createThemeIndex() {
        const lines = []
        const themeNames = Object.keys(this.designTokens)

        lines.push('// Theme Index')
        lines.push('')
        themeNames.forEach(name => lines.push(`import ${name}Theme from './${name}.js'`))
        lines.push('')
        lines.push('export const themes = {')
        themeNames.forEach(name => lines.push(`  ${name}: ${name}Theme,`))
        lines.push('}')
        lines.push('')
        lines.push('export default themes')

        return lines.join('\n')
    }

    async generateComponentIndex() {
        const lines = []

        lines.push('// Component Index')
        lines.push('')
        this.generatedComponents.forEach(comp => {
            lines.push(`import ${comp.name} from './${comp.name}.vue'`)
        })
        lines.push('')
        lines.push('export default {')
        this.generatedComponents.forEach(comp => lines.push(`  ${comp.name},`))
        lines.push('}')
        lines.push('')
        this.generatedComponents.forEach(comp => lines.push(`export { ${comp.name} }`))

        writeFileSync(path.join(this.outputDir, 'components', 'index.js'), lines.join('\n'))
    }

    async generateStylesheet() {
        const lines = []

        lines.push('/* Design System Styles */')
        lines.push(`/* Generated for ${this.libraryName} */`)
        lines.push('')
        lines.push(':root {')
        lines.push('  /* CSS variables will be injected by JavaScript */')
        lines.push('}')
        lines.push('')

        Object.keys(this.designTokens).forEach(themeName => {
            lines.push(`/* ${themeName} theme */`)
            lines.push(`[data-theme="${themeName}"] {`)
            lines.push('  /* Theme-specific overrides */')
            lines.push('}')
            lines.push('')
        })

        writeFileSync(path.join(this.outputDir, 'assets', 'styles.css'), lines.join('\n'))
    }

    async generateTypes() {
        const lines = []

        lines.push('// Design System Type Definitions')
        lines.push('')
        lines.push("import { App } from 'vue'")
        lines.push('')
        lines.push('export interface DesignSystemOptions {')
        lines.push('  theme?: string')
        lines.push('  [key: string]: any')
        lines.push('}')
        lines.push('')

        this.generatedComponents.forEach(comp => {
            lines.push(`export declare const ${comp.name}: any`)
        })
        lines.push('')

        lines.push('declare const DesignSystem: {')
        lines.push('  install(app: App, options?: DesignSystemOptions): void')
        lines.push('}')
        lines.push('')
        lines.push('export default DesignSystem')

        writeFileSync(path.join(this.outputDir, 'types', 'index.d.ts'), lines.join('\n'))
    }

    async generatePackageJson() {
        const packageData = {
            name: "@company/design-system",
            version: "1.0.0",
            description: `Design system built on ${this.libraryName}`,
            main: "index.js",
            type: "module",
            files: ["index.js", "lib/", "components/", "themes/", "assets/", "types/"],
            exports: {
                ".": { import: "./index.js", types: "./types/index.d.ts" },
                "./components": "./components/index.js",
                "./themes": "./themes/index.js"
            },
            peerDependencies: { vue: "^3.3.0" },
            keywords: ["design-system", "vue", "components", this.libraryName],
            buildInfo: {
                library: this.libraryName,
                generatedAt: new Date().toISOString(),
                components: this.generatedComponents.map(c => c.name),
                bundleMode: this.bundleMode
            }
        }

        writeFileSync(
            path.join(this.outputDir, 'package.json'),
            JSON.stringify(packageData, null, 2)
        )
    }

    async generateDocs() {
        const lines = []

        lines.push(`# Design System`)
        lines.push('')
        lines.push(`Library-agnostic design system built on ${this.libraryName}.`)
        lines.push('')
        lines.push('## Installation')
        lines.push('```bash')
        lines.push('npm install @company/design-system')
        lines.push('```')
        lines.push('')
        lines.push('## Usage')
        lines.push('```javascript')
        lines.push("import { createApp } from 'vue'")
        lines.push("import DesignSystem from '@company/design-system'")
        lines.push('')
        lines.push('const app = createApp({})')
        lines.push('app.use(DesignSystem, { theme: "light" })')
        lines.push('```')
        lines.push('')
        lines.push('## Components')
        this.generatedComponents.forEach(comp => {
            lines.push(`- \`<${comp.name}>\` - ${comp.originalName} component`)
        })

        writeFileSync(path.join(this.outputDir, 'README.md'), lines.join('\n'))
    }

    async createBuilds() {
        if (this.bundleMode === 'treeshake') {
            await this.createTreeShakeableBuilds()
        }
        console.log(chalk.green('✅ Production builds created'))
    }

    async createTreeShakeableBuilds() {
        const inputFile = path.join(this.outputDir, 'index.js')

        const bundle = await rollup({
            input: inputFile,
            external: ['vue', ...this.libraryConfig.bundle.external],
            plugins: [
                resolve({ preferBuiltins: false, browser: true }),
                commonjs(),
                terser({ format: { comments: false } })
            ]
        })

        await bundle.write({
            file: path.join(this.outputDir, 'lib', 'design-system.esm.js'),
            format: 'es'
        })

        await bundle.write({
            file: path.join(this.outputDir, 'lib', 'design-system.umd.js'),
            format: 'umd',
            name: 'DesignSystem',
            globals: this.libraryConfig.bundle.globals
        })
    }

    printSummary() {
        console.log(chalk.bold('\n📊 Bundle Summary:'))
        console.log(chalk.cyan(`  Library: ${this.libraryName}`))
        console.log(chalk.cyan(`  Components: ${this.generatedComponents.length}`))
        this.generatedComponents.forEach(comp => {
            console.log(chalk.gray(`    • ${comp.name}.vue`))
        })
        console.log(chalk.cyan(`  Themes: ${Object.keys(this.designTokens).length}`))
        console.log(chalk.cyan(`  Output: ${path.resolve(this.outputDir)}`))
        console.log('')
        console.log(chalk.bold.green('🎉 Bundle ready for distribution!'))
    }
}
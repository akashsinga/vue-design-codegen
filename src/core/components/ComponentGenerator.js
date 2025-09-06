/**
 * Core Component Generation Engine.
 * Transforms configuration objects into optimized Vue Components.
 * Enhanced with bundle mode support for self-contained packages.
 * 
 * File: src/core/components/ComponentGenerator.js
 */

import { ensureDirSync } from 'fs-extra'
import { writeFileSync } from 'fs'
import chalk from 'chalk'
import path from 'path'
import { TransformationEngine } from './TransformationEngine.js'

export class ComponentGenerator {
    constructor(options = {}) {
        this.libraryAdapter = options.libraryAdapter || null
        this.outputDir = options.outputDir || 'dist/components'
        this.templateType = options.templateType || 'sfc'
        this.transformationEngine = new TransformationEngine(this.libraryAdapter)
        this.templateCache = new Map()

        // Bundle mode options
        this.bundleMode = options.bundleMode || false
        this.componentPrefix = options.componentPrefix || (this.bundleMode ? 'OPC' : '')
        this.internalLibraryPath = options.internalLibraryPath || '../lib/design-system.js'
        this.designTokens = options.designTokens || null
    }

    /**
     * Generate Component using unified pipeline
     * @param {Object} config - Component configuration object
     * @returns {Object} Generation result with paths and metadata
     */
    async generateComponent(config) {
        this.validateConfig(config)

        // Initialize adapter if needed
        if (this.libraryAdapter && typeof this.libraryAdapter.initialize === 'function') {
            await this.libraryAdapter.initialize()
        }

        const templateData = this.buildTemplateData(config)
        const componentCode = this.renderTemplate(templateData)
        const componentName = this.getComponentName(config.name)
        const outputPath = this.writeComponent(componentName, componentCode)

        return {
            name: componentName,
            originalName: config.name,
            path: outputPath,
            metadata: {
                generatedAt: new Date().toISOString(),
                library: this.libraryAdapter?.name || 'generic',
                templateType: this.templateType,
                bundleMode: this.bundleMode
            }
        }
    }

    /**
     * Build all template data in single pass.
     * @param {Object} config
     * @returns {Object} All data.
     */
    buildTemplateData(config) {
        const baseComponent = this.getBaseComponent(config)
        const importStatement = this.getImportStatement(config)
        const componentName = this.getComponentName(config.name)

        return {
            componentName,
            baseComponent,
            importStatement,
            propsDefinition: this.transformationEngine.generatePropsDefinition(config.props),
            templateProps: this.generateAllTemplatePropBindings(config),
            templateEvents: this.transformationEngine.generateEventBindings(config.events),
            computedProperties: this.transformationEngine.generateComputedProperties(config.propMappings),
            emitsArray: this.buildEmitsArray(config.events),
            slots: this.buildSlots(config.slots),
            styles: this.buildStyles(config)
        }
    }

    /**
     * Get component name with prefix for bundle mode
     * @param {String} name - Original component name
     * @returns {String} - Component name with prefix if in bundle mode
     */
    getComponentName(name) {
        return this.bundleMode && this.componentPrefix
            ? `${this.componentPrefix}${name}`
            : name
    }

    /**
     * Generate template prop bindings including unmapped props
     * @param {Object} config - Component configuration
     * @returns {string} All template prop bindings
     */
    generateAllTemplatePropBindings(config) {
        const mappedBindings = this.transformationEngine.generateTemplatePropBindings(config.propMappings)

        // Find props that don't have explicit mappings and add direct bindings for them
        const mappedSources = config.propMappings ? config.propMappings.map(m => m.source).filter(Boolean) : []
        const unmappedProps = config.props ? config.props.filter(prop => !mappedSources.includes(prop.name)) : []

        const unmappedBindings = unmappedProps.map(prop => `:${prop.name}="${prop.name}"`).join('\n    ')

        const allBindings = [mappedBindings, unmappedBindings].filter(Boolean)

        return allBindings.length > 0 ? '   ' + allBindings.join('\n    ') : ''
    }

    /**
     * Render component using template substitution.
     * @param {Object} data
     * @return {String} - To write to file
     */
    renderTemplate(data) {
        const template = this.getTemplate(this.templateType)

        return template.replace(/\{\{componentName\}\}/g, data.componentName)
            .replace(/\{\{baseComponent\}\}/g, data.baseComponent)
            .replace(/\{\{importStatement\}\}/g, data.importStatement)
            .replace(/\{\{propsDefinition\}\}/g, data.propsDefinition)
            .replace(/\{\{templateProps\}\}/g, data.templateProps)
            .replace(/\{\{templateEvents\}\}/g, data.templateEvents)
            .replace(/\{\{computedProperties\}\}/g, data.computedProperties)
            .replace(/\{\{emitsArray\}\}/g, data.emitsArray)
            .replace(/\{\{slots\}\}/g, data.slots)
            .replace(/\{\{styles\}\}/g, data.styles)
    }

    /**
     * Get template string (cached for performance)
     * @param {String} type
     * @returns {String}
     */
    getTemplate(type) {
        const cacheKey = `${type}-${this.bundleMode ? 'bundle' : 'dev'}`

        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey)
        }

        const template = type === 'sfc' ? this.getSFCTemplate() : this.getJSXTemplate()
        this.templateCache.set(cacheKey, template)
        return template
    }

    /**
     * Returns SFC Template String.
     * @returns {String}
     */
    getSFCTemplate() {
        const lines = []
        lines.push('<template>')
        lines.push('  <{{baseComponent}}{{templateProps}}{{templateEvents}}>')
        lines.push('{{slots}}')
        lines.push('  </{{baseComponent}}>')
        lines.push('</template>')
        lines.push('')
        lines.push('<script>')
        lines.push('{{importStatement}}')
        lines.push('')
        lines.push('export default {')
        lines.push('  name: \'{{componentName}}\',')
        lines.push('  components: { {{baseComponent}} },')
        lines.push('  {{propsDefinition}},')
        lines.push('  emits: [{{emitsArray}}]{{computedProperties}}')
        lines.push('}')
        lines.push('</script>')
        lines.push('')
        lines.push('<style scoped>')
        lines.push('{{styles}}')
        lines.push('</style>')

        return lines.join('\n')
    }

    /**
     * Returns JSX Template String
     * @returns {String} 
     */
    getJSXTemplate() {
        const lines = []
        lines.push('{{importStatement}}')
        lines.push('')
        lines.push('export default {')
        lines.push('  name: \'{{componentName}}\',')
        lines.push('  {{propsDefinition}},')
        lines.push('  emits: [{{emitsArray}}]{{computedProperties}}')
        lines.push('  setup(props, { emit, slots }) {')
        lines.push('    return () => (')
        lines.push('      <{{baseComponent}}{{templateProps}}{{templateEvents}}>')
        lines.push('        {slots.default?.()}')
        lines.push('{{slots}}')
        lines.push('      </{{baseComponent}}>')
        lines.push('    )')
        lines.push('  }')
        lines.push('}')

        return lines.join('\n')
    }

    /**
     * Write component to file system.
     * @param {String} name
     * @param {String} code
     */
    writeComponent(name, code) {
        const extension = this.templateType === 'sfc' ? 'vue' : 'jsx'
        const outputPath = path.join(this.outputDir, `${name}.${extension}`)
        ensureDirSync(path.dirname(outputPath))
        writeFileSync(outputPath, code)

        return outputPath
    }

    /**
     * Gets base component from adapter.
     * @param {Object} config
     * @returns {String}
     */
    getBaseComponent(config) {
        if (this.libraryAdapter && this.libraryAdapter.hasComponent(config.baseComponent)) {
            return this.libraryAdapter.getComponent(config.baseComponent)
        }

        return config.baseComponent || 'div'
    }

    /**
     * Gets import statement from adapter with bundle mode support.
     * @param {Object} config
     * @returns {String}
     */
    getImportStatement(config) {
        const baseComponent = this.getBaseComponent(config)

        if (this.bundleMode) {
            // In bundle mode, import directly from the library instead of internal path
            // This avoids the circular dependency issue
            if (this.libraryAdapter && this.libraryAdapter.hasComponent(config.name)) {
                return this.libraryAdapter.getImportStatement(config.name)
            }
            console.log(chalk.yellow(`Component ${config.baseComponent} not found in ${this.libraryAdapter?.name || 'adapter'}, using fallback import`))
            return `// WARNING: Import for ${config.baseComponent} not found`
        }

        // Development mode - use adapter import statements
        if (this.libraryAdapter && this.libraryAdapter.hasComponent(config.name)) {
            return this.libraryAdapter.getImportStatement(config.name)
        }

        console.log(chalk.yellow(`Component ${config.baseComponent} not found in ${this.libraryAdapter?.name || 'adapter'}, using fallback import`))
        return `// WARNING: Import for ${config.baseComponent} not found`
    }

    /**
     * Build emits array string.
     * @param {Object[]} events
     * @returns {String}
     */
    buildEmitsArray(events) {
        if (!events || !events.length) return ''
        return events.map(event => `'${event.emit || event.name}'`).join(', ')
    }

    /**
     * Build slots content with scoped slot support.
     * @param {Object[]} slots
     * @returns {String}
     */
    buildSlots(slots) {
        if (!slots || slots.length === 0) {
            return '    <slot />'
        }

        const slotContent = slots.map(slot => {
            if (slot.name === 'default') {
                if (slot.props && slot.props.length > 0) {
                    // Scoped default slot
                    const slotProps = slot.props.map(p => `:${p}="${p}"`).join(' ')
                    return `    <slot ${slotProps} />`
                }
                return '    <slot />'
            } else {
                if (slot.props && slot.props.length > 0) {
                    // Named scoped slot
                    const slotProps = slot.props.map(p => `:${p}="${p}"`).join(' ')
                    return `    <template #${slot.name}>
      <slot name="${slot.name}" ${slotProps} />
    </template>`
                } else {
                    // Named slot without props
                    return `    <template #${slot.name}>
      <slot name="${slot.name}" />
    </template>`
                }
            }
        }).join('\n')

        return slotContent
    }

    /**
     * Build styles with design token integration
     * @param {Object} config - Component configuration
     * @returns {String} - CSS styles
     */
    buildStyles(config) {
        let styles = config.styles || ''

        // In bundle mode, integrate design tokens if available
        if (this.bundleMode && this.designTokens) {
            styles += this.generateTokenStyles()
        }

        return styles
    }

    /**
     * Generate CSS styles using design tokens
     * @returns {String} - CSS with design token variables
     */
    generateTokenStyles() {
        if (!this.designTokens) return ''

        // Add CSS that uses design token variables
        return `
/* Design system token integration */
:root {
  /* Colors will be injected by design system */
}
`
    }

    /**
     * Generate component index file for exports
     * @param {Array} components - Array of generated component results
     * @param {String} outputPath - Path to write index file
     */
    generateComponentIndex(components, outputPath = null) {
        const indexPath = outputPath || path.join(this.outputDir, 'index.js')

        const imports = components.map(comp =>
            `import ${comp.name} from './${comp.name}.vue'`
        ).join('\n')

        const exports = components.map(comp => comp.name).join(', ')

        const namedExports = components.map(comp =>
            `export { default as ${comp.name} } from './${comp.name}.vue'`
        ).join('\n')

        const indexContent = `${imports}

// Default export object for bulk registration
export default {
  ${exports}
}

// Named exports for individual imports
${namedExports}

// Component list for programmatic access
export const componentList = [${exports}]
`

        ensureDirSync(path.dirname(indexPath))
        writeFileSync(indexPath, indexContent)

        return indexPath
    }

    /**
    * Validate component configuration
    */
    validateConfig(config) {
        if (!config.name) {
            throw new Error('Component configuration must have a name')
        }

        if (!config.baseComponent) {
            throw new Error('Component configuration must specify a baseComponent')
        }

        return true
    }

    /**
     * Set library adapter and update transformation engine
     */
    setLibraryAdapter(adapter) {
        this.libraryAdapter = adapter
        this.transformationEngine = new TransformationEngine(adapter)
        this.templateCache.clear()
    }

    /**
     * Set design tokens for bundle mode
     */
    setDesignTokens(tokens) {
        this.designTokens = tokens
    }

    /**
     * Get bundle mode status
     */
    isBundleMode() {
        return this.bundleMode
    }

    /**
     * Get generated component names (useful for bundling)
     */
    getGeneratedComponentNames(configs) {
        return configs.map(config => this.getComponentName(config.name))
    }
}
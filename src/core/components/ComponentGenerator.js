/**
 * Core Component Generation Engine.
 * Transforms configuration objects into optimized Vue Components.
 * 
 * File: src/core/components/ComponentGenerator.js
 */

import { ensureDirSync, writeFileSync } from "fs"
import chalk from 'chalk'

import { TransformationEngine } from './TransformationEngine.js'

export class ComponentGenerator {
    constructor(options = {}) {
        this.libraryAdapter = options.libraryAdapter || null
        this.outputDir = options.outputDir || 'dist/components'
        this.templateType = options.templateType || 'sfc'
        this.transformationEngine = new TransformationEngine(this.libraryAdapter)
        this.templateCache = new Map()
    }

    /**
     * Generate Component using unified pipeline
     * @param {Object} config - Component configuration object
     * @returns {Object} Generation result with paths and metadata
     */
    async generateComponent(config) {
        this.validateConfiig(config)

        const templateData = this.buildTemplateData(config)
        const componentCode = this.renderTemplate(templateData)
        const outputPath = this.writeComponent(config.name, componentCode)

        return { name: config.name, path: outputPath, metadata: { generatedAt: new Date().toISOString(), library: this.libraryAdapter?.name || 'generic', templateType: this.templateType } }
    }

    /**
     * Build all template data in single pass.
     * @param {Object} config
     * @returns {Object} All data.
     */
    buildTemplateData(config) {
        const baseComponent = this.getBaseComponent(config)
        const importStatement = this.getImportStatement(config)

        return {
            componentName: config.name,
            baseComponent,
            importStatement,
            propsDefinition: this.transformationEngine.generatePropsDefinition(config.props),
            templateProps: this.transformationEngine.generateTemplatePropBindings(config.propMappings),
            templateEvents: this.transformationEngine.generateEventBindings(config.events),
            computedProperties: this.transformationEngine.generateComputedProperties(config.propMappings),
            emitsArray: this.buildEmitsArray(config.events),
            slots: this.buildSlots(config.slots),
            styles: config.styles || ''
        }
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
        if (this.templateCache.has(type)) {
            return this.templateCache.get(type)
        }

        const template = type === 'sfc' ? this.getSFCTemplate() : this.getJSXTemplate()
        this.templateCache.set(type, template)
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
     * Gets import statement from adapter.
     * @param {Object} config
     * @returns {String}
     */
    getImportStatement(config) {
        if (this.libraryAdapter && this.libraryAdapter.hasComponent(config.baseComponent)) {
            return this.libraryAdapter.getImportStatement(config.baseComponent)
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
    * Validate component configuration
    */
    validateConfig(config) {
        if (!config.name) {
            throw new Error('Component configuration must have a name')
        }

        if (!config.baseComponent) {
            throw new Error('Component configuration must specify a baseComponent')
        }

        // Warn if using adapter but component not registered
        if (this.libraryAdapter && !this.libraryAdapter.hasComponent(config.baseComponent)) {
            console.warn(`Component '${config.baseComponent}' not registered in ${this.libraryAdapter.name} adapter`)
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
}
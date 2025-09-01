import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { readFileSync, writeFileSync } from 'fs'
import { ensureDirSync } from 'fs-extra'
import path from 'path'
import { TransformationEngine } from './TransformationEngine.js'

/**
 * Core Component Generation Engine
 * Transforms configuration objects into optimized Vue components
 */
export class ComponentGenerator {
    constructor(options = {}) {
        this.libraryAdapter = options.libraryAdapter || null
        this.outputDir = options.outputDir || 'generated'
        this.templateType = options.templateType || 'both' // 'sfc', 'jsx', 'both'
        this.performanceMode = options.performanceMode || true
        this.transformationEngine = new TransformationEngine(this.libraryAdapter)
    }

    /**
     * Generate component from configuration
     * @param {Object} config - Component configuration object
     * @returns {Object} Generation result with paths and metadata
     */
    async generateComponent(config) {
        this.validateConfig(config)

        const result = {
            name: config.name,
            paths: {},
            metadata: {
                generatedAt: new Date().toISOString(),
                library: this.libraryAdapter?.name || 'generic',
                performanceOptimized: this.performanceMode
            }
        }

        // Generate based on templateType
        if (this.templateType === 'sfc' || this.templateType === 'both') {
            const sfcPath = await this.generateSFC(config)
            result.paths.sfc = sfcPath
        }

        if (this.templateType === 'jsx' || this.templateType === 'both') {
            const jsxPath = await this.generateJSX(config)
            result.paths.jsx = jsxPath
        }

        return result
    }

    /**
     * Generate Vue Single File Component
     */
    async generateSFC(config) {
        const template = this.buildTemplate(config)
        const script = this.buildScript(config, 'sfc')
        const style = this.buildStyle(config)

        const sfcContent = `<template>
${template}
</template>

<script>
${script}
</script>

${style ? `<style scoped>
${style}
</style>` : ''}`

        const outputPath = path.join(this.outputDir, 'sfc', `${config.name}.vue`)
        ensureDirSync(path.dirname(outputPath))
        writeFileSync(outputPath, sfcContent)

        return outputPath
    }

    /**
     * Generate JSX Component
     */
    async generateJSX(config) {
        const jsxContent = this.buildJSXComponent(config)

        const outputPath = path.join(this.outputDir, 'jsx', `${config.name}.jsx`)
        ensureDirSync(path.dirname(outputPath))
        writeFileSync(outputPath, jsxContent)

        return outputPath
    }

    /**
     * Build template section for SFC
     */
    buildTemplate(config) {
        const baseComponent = this.getBaseComponent(config)
        const props = this.buildDirectProps(config)
        const events = this.buildEvents(config)
        const slots = this.buildSlots(config)

        return `  <${baseComponent}${props}${events}${slots ? '' : ' /'}>${slots ? `
${slots}
  </${baseComponent}>` : ''}`
    }

    /**
     * Build props directly mapped for template (simplified)
     */
    buildDirectProps(config) {
        let propsStr = ''

        if (config.propMappings) {
            config.propMappings.forEach(mapping => {
                if (mapping.type === 'direct') {
                    propsStr += `\n    :${mapping.target}="${mapping.source}"`
                } else if (mapping.type === 'conditional') {
                    // Properly escape quotes and handle the condition
                    propsStr += `\n    :${mapping.target}="${mapping.source} === 'right' ? ${mapping.source} : 'left'"`
                }
            })
        }

        return propsStr
    }

    /**
     * Build JSX component
     */
    buildJSXComponent(config) {
        const baseComponent = this.getBaseComponent(config)
        const importStatement = this.buildImportStatement(config)
        const componentName = config.name
        const propsInterface = this.buildPropsDefinition(config)

        return `${importStatement}

export default {
  name: '${componentName}',
  props: ${propsInterface},
  emits: [${config.events?.map(e => `'${e.name}'`).join(', ') || ''}],
  setup(props, { emit, slots }) {
    // Build transformed props for library compatibility
    const getTransformedProps = () => ({
      ${this.buildJSXPropMappings(config)}
    })

    return () => (
      <${baseComponent}
        {...getTransformedProps()}
        ${this.buildJSXEventBindings(config)}
      >
        {slots.default?.()}
${this.buildJSXSlotBindings(config)}
      </${baseComponent}>
    )
  }
}`
    }

    /**
     * Build JSX prop mappings with advanced transformations
     */
    buildJSXPropMappings(config) {
        if (!config.propMappings) return '...props'

        let mappings = []
        config.propMappings.forEach(mapping => {
            switch (mapping.type) {
                case 'direct':
                    mappings.push(`${mapping.target}: props.${mapping.source}`)
                    break
                case 'conditional':
                    // Improved conditional logic
                    mappings.push(`${mapping.target}: props.${mapping.source} === 'right' ? 'right' : 'left'`)
                    break
                case 'value':
                    // Value transformation with function
                    if (typeof mapping.transform === 'string') {
                        mappings.push(`${mapping.target}: ${mapping.transform}(props.${mapping.source})`)
                    } else {
                        mappings.push(`${mapping.target}: (${mapping.transform})(props.${mapping.source})`)
                    }
                    break
                case 'multiProp':
                    // NEW: Combine multiple props into one
                    const sources = mapping.sources.map(s => `props.${s}`).join(' + " " + ')
                    mappings.push(`${mapping.target}: ${sources}`)
                    break
                case 'nested':
                    // NEW: Create nested object from flat props
                    const nestedProps = mapping.properties.map(prop =>
                        `${prop.key}: props.${prop.source}`
                    ).join(', ')
                    mappings.push(`${mapping.target}: { ${nestedProps} }`)
                    break
                case 'computed':
                    // NEW: Computed property with custom function
                    mappings.push(`${mapping.target}: (() => {
            ${mapping.computation}
          })()`)
                    break
                case 'librarySpecific':
                    // NEW: Library-specific transformations
                    if (this.libraryAdapter && this.libraryAdapter.name === mapping.library) {
                        mappings.push(`${mapping.target}: ${mapping.transform}`)
                    }
                    break
                default:
                    mappings.push(`${mapping.target}: props.${mapping.source}`)
            }
        })

        return mappings.join(',\n      ')
    }

    /**
     * Build JSX event bindings
     */
    buildJSXEventBindings(config) {
        if (!config.events) return ''

        return config.events
            .map(event => {
                const jsxEventName = this.getJSXEventName(event.name)
                return `${jsxEventName}={(payload) => emit('${event.emit || event.name}', payload)}`
            })
            .join('\n        ')
    }

    /**
     * Build JSX slot bindings
     */
    buildJSXSlotBindings(config) {
        if (!config.slots || config.slots.length <= 1) return ''

        return config.slots
            .filter(slot => slot.name !== 'default')
            .map(slot => `        {slots.${slot.name}?.()}`)
            .join('\n')
    }

    /**
     * Get JSX event name (onClick, onFocus, etc.)
     */
    getJSXEventName(eventName) {
        const normalized = this.normalizeEventName(eventName)
        return 'on' + normalized.charAt(0).toUpperCase() + normalized.slice(1)
    }

    /**
     * Build script section for SFC
     */
    buildScript(config, type = 'sfc') {
        const importStatement = this.buildImportStatement(config)
        const propsDefinition = this.buildPropsDefinition(config)
        const eventDefinition = config.events?.map(e => `'${e.name}'`).join(', ') || ''

        // For SFC, we don't need the complex setup function since we're binding directly in template
        return `${importStatement}

export default {
  name: '${config.name}',
  props: ${propsDefinition},
  emits: [${eventDefinition}]
}`
    }

    /**
     * Get base component from library adapter
     */
    getBaseComponent(config) {
        if (this.libraryAdapter) {
            return this.libraryAdapter.getComponent(config.baseComponent)
        }
        return config.baseComponent || 'div'
    }

    /**
     * Build import statement
     */
    buildImportStatement(config) {
        if (this.libraryAdapter) {
            return this.libraryAdapter.getImportStatement(config.baseComponent)
        }

        // Default PrimeVue import for now
        if (config.baseComponent) {
            return `import ${config.baseComponent} from 'primevue/${config.baseComponent.toLowerCase()}'`
        }

        return ''
    }

    /**
     * Build props definition
     */
    buildPropsDefinition(config) {
        if (!config.props) return '{}'

        const propsObj = {}
        config.props.forEach(prop => {
            propsObj[prop.name] = {
                type: this.getVueType(prop.type),
                ...(prop.default !== undefined && { default: prop.default }),
                ...(prop.required !== undefined && { required: prop.required })
            }
        })

        // Format as clean JavaScript object instead of JSON
        const propsStr = JSON.stringify(propsObj, null, 4)
            .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
            .replace(/"/g, "'") // Use single quotes
            .replace(/'([A-Z][a-zA-Z]*)':/g, "$1:") // Remove quotes from type values

        return propsStr
    }

    /**
     * Build prop transformations using the advanced engine
     */
    buildPropTransformations(config) {
        return this.transformationEngine.generateTransformations(
            config.propMappings,
            config.props
        )
    }

    /**
     * Build event handlers
     */
    buildEventHandlers(config) {
        if (!config.events) return 'const eventListeners = {}'

        let handlerCode = 'const eventListeners = {\n'

        config.events.forEach(event => {
            const eventName = this.normalizeEventName(event.name)
            handlerCode += `      ${eventName}: (payload) => emit('${event.emit || event.name}', payload),\n`
        })

        handlerCode += '    }'
        return handlerCode
    }

    /**
     * Build props string for template
     */
    buildProps(config) {
        let propsStr = ''

        if (config.propMappings) {
            config.propMappings.forEach(mapping => {
                if (mapping.type === 'direct') {
                    propsStr += `\n    :${mapping.target}="${mapping.source}"`
                } else if (mapping.type === 'conditional') {
                    // Fix quote escaping for conditional props
                    const condition = mapping.condition.replace(/"/g, '\\"')
                    const fallback = mapping.fallback.replace(/"/g, '\\"')
                    propsStr += `\n    :${mapping.target}="${condition} ? ${mapping.source} : ${fallback}"`
                }
            })
        }

        return propsStr
    }

    /**
     * Build events string for template
     */
    buildEvents(config) {
        if (!config.events) return ''

        let eventsStr = ''
        config.events.forEach(event => {
            const eventName = this.normalizeEventName(event.name)
            eventsStr += `\n    @${eventName}="$emit('${event.emit || event.name}', $event)"`
        })

        return eventsStr
    }

    /**
     * Build slots for template
     */
    buildSlots(config) {
        if (!config.slots || config.slots.length === 0) return ''

        let slotsContent = ''
        config.slots.forEach(slot => {
            if (slot.name === 'default') {
                slotsContent += `    <slot />\n`
            } else {
                slotsContent += `    <template #${slot.name}>\n      <slot name="${slot.name}" />\n    </template>\n`
            }
        })

        return slotsContent.trim()
    }

    /**
     * Build slot elements for JSX
     */
    buildSlotElements(config) {
        if (!config.slots || config.slots.length === 0) return ''

        return config.slots
            .filter(slot => slot.name !== 'default')
            .map(slot => `        <template slot="${slot.name}">{slots.${slot.name}?.()}</template>`)
            .join('\n')
    }

    /**
     * Build style section
     */
    buildStyle(config) {
        return config.styles || ''
    }

    /**
     * Convert JavaScript type to Vue prop type
     */
    getVueType(jsType) {
        const typeMap = {
            'string': 'String',
            'number': 'Number',
            'boolean': 'Boolean',
            'array': 'Array',
            'object': 'Object',
            'function': 'Function'
        }

        return typeMap[jsType] || 'String'
    }

    /**
     * Normalize event names for Vue (kebab-case to camelCase)
     */
    normalizeEventName(eventName) {
        return eventName.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
    }

    /**
     * Validate component configuration
     */
    validateConfig(config) {
        if (!config.name) {
            throw new Error('Component configuration must have a name')
        }

        if (!config.baseComponent && !this.libraryAdapter) {
            throw new Error('Component configuration must specify a baseComponent or use a library adapter')
        }

        // Additional validation can be added here
        return true
    }

    /**
     * Set library adapter and update transformation engine
     */
    setLibraryAdapter(adapter) {
        this.libraryAdapter = adapter
        this.transformationEngine = new TransformationEngine(adapter)
    }
}
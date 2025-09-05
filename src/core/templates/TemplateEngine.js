// src/core/templates/TemplateEngine.js
import ConfigurationLoader from '../ConfigurationLoader.js';

export class TemplateEngine {
    constructor() {
        this.templates = new Map();
        this.configLoader = ConfigurationLoader;
        this.templateCache = new Map();
    }

    /**
     * Generate template based on format and data
     */
    async generateTemplate(format, data, options = {}) {
        const { useCache = true, validate = true } = options;

        const cacheKey = `${format}-${JSON.stringify(data)}`;

        if (useCache && this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey);
        }

        let template;

        switch (format) {
            case 'sfc':
                template = await this.generateSFCTemplate(data);
                break;

            case 'jsx':
                template = await this.generateJSXTemplate(data);
                break;

            case 'typescript':
                template = await this.generateTypeScriptTemplate(data);
                break;

            case 'style':
                template = await this.generateStyleTemplate(data);
                break;

            default:
                throw new Error(`Unsupported template format: ${format}`);
        }

        if (useCache) {
            this.templateCache.set(cacheKey, template);
        }

        return template;
    }

    /**
     * Generate Vue Single File Component template
     */
    async generateSFCTemplate(data) {
        const {
            componentName,
            props,
            events,
            slots,
            imports,
            library,
            mapping
        } = data;

        const templateParts = [];

        // Template section
        templateParts.push('<template>');
        templateParts.push(`  <${mapping.tag || componentName}`);

        // Add props
        const propBindings = this.generatePropBindings(props, library);
        if (propBindings.length > 0) {
            templateParts.push(`    ${propBindings.join('\n    ')}`);
        }

        // Add events
        const eventBindings = this.generateEventBindings(events);
        if (eventBindings.length > 0) {
            templateParts.push(`    ${eventBindings.join('\n    ')}`);
        }

        templateParts.push('  >');

        // Add slots
        if (slots && Object.keys(slots).length > 0) {
            const slotContent = this.generateSlotContent(slots);
            templateParts.push(`    ${slotContent.join('\n    ')}`);
        }

        templateParts.push(`  </${mapping.tag || componentName}>`);
        templateParts.push('</template>');
        templateParts.push('');

        // Script section
        templateParts.push('<script setup>');

        // Add imports
        const cleanImports = this.cleanImports(imports);
        templateParts.push(...cleanImports);
        templateParts.push('');

        // Add props definition
        if (Object.keys(props).length > 0) {
            templateParts.push(this.generatePropsDefinition(props));
            templateParts.push('');
        }

        // Add emits definition
        if (Object.keys(events).length > 0) {
            templateParts.push(this.generateEmitsDefinition(events));
            templateParts.push('');
        }

        templateParts.push('</script>');

        return templateParts.join('\n');
    }

    /**
     * Generate JSX template
     */
    async generateJSXTemplate(data) {
        const {
            componentName,
            props,
            events,
            slots,
            imports,
            library,
            mapping
        } = data;

        const templateParts = [];

        // Add imports
        const cleanImports = this.cleanImports(imports);
        templateParts.push(...cleanImports);
        templateParts.push('');

        // Component definition
        templateParts.push(`export default function ${componentName}(props) {`);
        templateParts.push('  const {');

        // Add prop destructuring
        const propNames = Object.keys(props);
        if (propNames.length > 0) {
            templateParts.push(`    ${propNames.join(',\n    ')}`);
        }

        templateParts.push('  } = props;');
        templateParts.push('');

        // Return JSX
        templateParts.push('  return (');
        templateParts.push(`    <${mapping.tag || componentName}`);

        // Add props
        const propBindings = this.generateJSXPropBindings(props, library);
        if (propBindings.length > 0) {
            templateParts.push(`      ${propBindings.join('\n      ')}`);
        }

        // Add events
        const eventBindings = this.generateJSXEventBindings(events);
        if (eventBindings.length > 0) {
            templateParts.push(`      ${eventBindings.join('\n      ')}`);
        }

        templateParts.push('    >');

        // Add slots/children
        if (slots && Object.keys(slots).length > 0) {
            const slotContent = this.generateJSXSlotContent(slots);
            templateParts.push(`      ${slotContent.join('\n      ')}`);
        }

        templateParts.push(`    </${mapping.tag || componentName}>`);
        templateParts.push('  );');
        templateParts.push('}');

        return templateParts.join('\n');
    }

    /**
     * Generate TypeScript template
     */
    async generateTypeScriptTemplate(data) {
        const {
            componentName,
            props,
            events,
            slots,
            imports,
            library,
            mapping,
            typescript
        } = data;

        const templateParts = [];

        // Add imports
        const cleanImports = this.cleanImports(imports);
        templateParts.push(...cleanImports);
        templateParts.push('');

        // Add TypeScript interfaces
        if (typescript && typescript.interfaces) {
            templateParts.push(typescript.interfaces);
            templateParts.push('');
        }

        // Component definition with types
        templateParts.push(`export default defineComponent({`);
        templateParts.push(`  name: '${componentName}',`);
        templateParts.push('  props: {');

        // Add typed props
        const typedProps = this.generateTypedProps(props);
        templateParts.push(`    ${typedProps.join(',\n    ')}`);

        templateParts.push('  },');
        templateParts.push('  emits: {');

        // Add typed emits
        const typedEmits = this.generateTypedEmits(events);
        templateParts.push(`    ${typedEmits.join(',\n    ')}`);

        templateParts.push('  },');
        templateParts.push('  setup(props, { emit }) {');
        templateParts.push('    return () => (');
        templateParts.push(`      <${mapping.tag || componentName}`);

        // Add props
        const propBindings = this.generateJSXPropBindings(props, library);
        if (propBindings.length > 0) {
            templateParts.push(`        ${propBindings.join('\n        ')}`);
        }

        // Add events
        const eventBindings = this.generateJSXEventBindings(events);
        if (eventBindings.length > 0) {
            templateParts.push(`        ${eventBindings.join('\n        ')}`);
        }

        templateParts.push('      >');

        if (slots && Object.keys(slots).length > 0) {
            const slotContent = this.generateJSXSlotContent(slots);
            templateParts.push(`        ${slotContent.join('\n        ')}`);
        }

        templateParts.push(`      </${mapping.tag || componentName}>`);
        templateParts.push('    );');
        templateParts.push('  }');
        templateParts.push('});');

        return templateParts.join('\n');
    }

    /**
     * Generate style template
     */
    async generateStyleTemplate(data) {
        const {
            componentName,
            styles = {},
            tokens = [],
            library
        } = data;

        const templateParts = [];

        // Add component-specific styles
        templateParts.push(`/* ${componentName} Component Styles */`);

        if (styles.scoped) {
            templateParts.push(`.${componentName.toLowerCase()} {`);
            for (const [property, value] of Object.entries(styles.scoped)) {
                templateParts.push(`  ${property}: ${value};`);
            }
            templateParts.push('}');
        }

        // Add design token usage
        if (tokens.length > 0) {
            templateParts.push('');
            templateParts.push('/* Design Tokens */');
            templateParts.push(':root {');
            for (const token of tokens) {
                templateParts.push(`  --${token.name}: ${token.value};`);
            }
            templateParts.push('}');
        }

        return templateParts.join('\n');
    }

    /**
     * Generate prop bindings for Vue templates
     */
    generatePropBindings(props, library) {
        const bindings = [];

        for (const [propName, propConfig] of Object.entries(props)) {
            if (propConfig.type === 'boolean') {
                bindings.push(`:${propName}="${propName}"`);
            } else if (propConfig.type === 'string' && propConfig.static) {
                bindings.push(`${propName}="${propConfig.value || propName}"`);
            } else {
                bindings.push(`:${propName}="${propName}"`);
            }
        }

        return bindings;
    }

    /**
     * Generate event bindings for Vue templates
     */
    generateEventBindings(events) {
        const bindings = [];

        for (const eventName of Object.keys(events)) {
            const vueEventName = eventName.startsWith('update:')
                ? eventName
                : eventName.replace(/([A-Z])/g, '-$1').toLowerCase();
            bindings.push(`@${vueEventName}="$emit('${eventName}', $event)"`);
        }

        return bindings;
    }

    /**
     * Generate slot content for Vue templates
     */
    generateSlotContent(slots) {
        const content = [];

        for (const [slotName, slotConfig] of Object.entries(slots)) {
            if (slotName === 'default') {
                content.push('<!-- Default slot content -->');
                content.push('<slot />');
            } else {
                content.push(`<!-- ${slotName} slot -->`);
                content.push(`<slot name="${slotName}" />`);
            }
        }

        return content;
    }

    /**
     * Generate JSX prop bindings
     */
    generateJSXPropBindings(props, library) {
        const bindings = [];

        for (const [propName, propConfig] of Object.entries(props)) {
            if (propConfig.type === 'boolean') {
                bindings.push(`${propName}={${propName}}`);
            } else if (propConfig.type === 'string' && propConfig.static) {
                bindings.push(`${propName}="${propConfig.value || propName}"`);
            } else {
                bindings.push(`${propName}={${propName}}`);
            }
        }

        return bindings;
    }

    /**
     * Generate JSX event bindings
     */
    generateJSXEventBindings(events) {
        const bindings = [];

        for (const eventName of Object.keys(events)) {
            const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
            bindings.push(`${handlerName}={props.${handlerName}}`);
        }

        return bindings;
    }

    /**
     * Generate JSX slot content
     */
    generateJSXSlotContent(slots) {
        const content = [];

        for (const [slotName, slotConfig] of Object.entries(slots)) {
            if (slotName === 'default') {
                content.push('{props.children}');
            } else {
                content.push(`{props.${slotName}Slot}`);
            }
        }

        return content;
    }

    /**
     * Generate props definition for Vue script setup
     */
    generatePropsDefinition(props) {
        const propDefs = [];

        for (const [propName, propConfig] of Object.entries(props)) {
            let propDef = `${propName}: {`;
            propDef += ` type: ${this.getVueType(propConfig.type)}`;

            if (propConfig.required !== undefined) {
                propDef += `, required: ${propConfig.required}`;
            }

            if (propConfig.default !== undefined) {
                propDef += `, default: ${JSON.stringify(propConfig.default)}`;
            }

            if (propConfig.validator) {
                propDef += `, validator: ${propConfig.validator}`;
            }

            propDef += ' }';
            propDefs.push(propDef);
        }

        return `const props = defineProps({\n  ${propDefs.join(',\n  ')}\n});`;
    }

    /**
     * Generate emits definition for Vue script setup
     */
    generateEmitsDefinition(events) {
        const eventNames = Object.keys(events);
        const emitDefs = eventNames.map(name => `'${name}'`);

        return `const emit = defineEmits([${emitDefs.join(', ')}]);`;
    }

    /**
     * Generate typed props for TypeScript
     */
    generateTypedProps(props) {
        const typedProps = [];

        for (const [propName, propConfig] of Object.entries(props)) {
            let propDef = `${propName}: {`;
            propDef += ` type: ${this.getVueType(propConfig.type)} as PropType<${this.getTypeScriptType(propConfig.type)}>`;

            if (propConfig.required !== undefined) {
                propDef += `, required: ${propConfig.required}`;
            }

            if (propConfig.default !== undefined) {
                propDef += `, default: ${JSON.stringify(propConfig.default)}`;
            }

            propDef += ' }';
            typedProps.push(propDef);
        }

        return typedProps;
    }

    /**
     * Generate typed emits for TypeScript
     */
    generateTypedEmits(events) {
        const typedEmits = [];

        for (const [eventName, eventConfig] of Object.entries(events)) {
            const paramTypes = eventConfig.parameters || ['any'];
            const paramSignature = paramTypes.map((type, index) => `param${index}: ${type}`).join(', ');
            typedEmits.push(`${eventName}: (${paramSignature}) => boolean`);
        }

        return typedEmits;
    }

    /**
     * Get Vue prop type
     */
    getVueType(type) {
        const typeMap = {
            'string': 'String',
            'number': 'Number',
            'boolean': 'Boolean',
            'array': 'Array',
            'object': 'Object',
            'function': 'Function',
            'any': 'null'
        };

        return typeMap[type] || 'String';
    }

    /**
     * Get TypeScript type
     */
    getTypeScriptType(type) {
        const typeMap = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'array': 'any[]',
            'object': 'Record<string, any>',
            'function': 'Function',
            'any': 'any'
        };

        return typeMap[type] || 'string';
    }

    /**
     * Clean and filter imports
     */
    cleanImports(imports) {
        const cleanedImports = [];
        const seen = new Set();

        for (const importStatement of imports) {
            if (typeof importStatement === 'string' && !seen.has(importStatement)) {
                // Skip CSS imports in script sections
                if (!importStatement.includes('.css')) {
                    cleanedImports.push(importStatement);
                    seen.add(importStatement);
                }
            }
        }

        return cleanedImports;
    }

    /**
     * Load template configuration
     */
    async loadTemplateConfig(templateName) {
        const configPath = `templates/${templateName}.config.js`;
        return await this.configLoader.loadConfig(configPath);
    }

    /**
     * Register custom template
     */
    registerTemplate(name, generator) {
        if (typeof generator !== 'function') {
            throw new Error('Template generator must be a function');
        }

        this.templates.set(name, generator);
    }

    /**
     * Clear template cache
     */
    clearCache(format = null) {
        if (format) {
            for (const key of this.templateCache.keys()) {
                if (key.startsWith(`${format}-`)) {
                    this.templateCache.delete(key);
                }
            }
        } else {
            this.templateCache.clear();
        }
    }

    /**
     * Get template statistics
     */
    getTemplateStats() {
        return {
            cachedTemplates: this.templateCache.size,
            customTemplates: this.templates.size,
            supportedFormats: ['sfc', 'jsx', 'typescript', 'style']
        };
    }

    /**
     * Validate template data
     */
    validateTemplateData(data, format) {
        const errors = [];

        const requiredFields = ['componentName', 'props', 'events'];
        for (const field of requiredFields) {
            if (!data[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        if (format === 'typescript' && !data.typescript) {
            errors.push('TypeScript format requires typescript configuration');
        }

        if (errors.length > 0) {
            throw new Error(`Template data validation failed:\n${errors.join('\n')}`);
        }

        return true;
    }
}

export default new TemplateEngine();
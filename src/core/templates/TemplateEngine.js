import { ConfigurationLoader } from '../ConfigurationLoader.js';
import path from 'path';
import fs from 'fs-extra';

/**
 * Template engine that generates Vue SFC components, JSX components,
 * and TypeScript definitions using configuration-driven templates
 */
export class TemplateEngine {
    constructor() {
        this.configLoader = new ConfigurationLoader();
        this.templates = new Map();
        this.templateCache = new Map();
        this.generatorFunctions = new Map();

        // Initialize built-in generators
        this.initializeBuiltInGenerators();
    }

    /**
     * Load template configurations from template files
     * @param {string} templatesPath - Path to templates directory
     * @returns {Promise<void>}
     */
    async loadTemplates(templatesPath = 'src/core/templates') {
        try {
            const templateFiles = [
                'sfc.template.js',
                'jsx.template.js',
                'style.template.js',
                'typescript.template.js'
            ];

            const loadPromises = templateFiles.map(async (filename) => {
                const templatePath = path.join(templatesPath, filename);

                if (await fs.pathExists(templatePath)) {
                    const templateConfig = await this.configLoader.loadConfig(templatePath);
                    const templateName = path.basename(filename, '.template.js');
                    this.templates.set(templateName, templateConfig);
                }
            });

            await Promise.all(loadPromises);
        } catch (error) {
            throw new Error(`Failed to load templates: ${error.message}`);
        }
    }

    /**
     * Generate a Vue SFC component
     * @param {Object} componentData - Component generation data
     * @returns {Promise<string>} Generated Vue SFC code
     */
    async generateComponent(componentData) {
        const {
            componentName,
            semanticName,
            libraryComponent,
            props,
            events,
            slots,
            imports,
            theme,
            typeDefinitions,
            options = {}
        } = componentData;

        try {
            // Determine output format
            const format = options.format || 'sfc';

            switch (format) {
                case 'sfc':
                    return this.generateSFC(componentData);
                case 'jsx':
                    return this.generateJSX(componentData);
                case 'typescript':
                    return this.generateTypescript(componentData);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Component generation failed: ${error.message}`);
        }
    }

    /**
     * Generate Vue Single File Component
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Generated SFC code
     */
    async generateSFC(componentData) {
        const {
            componentName,
            semanticName,
            libraryComponent,
            props,
            events,
            slots,
            imports,
            theme,
            typeDefinitions,
            options = {}
        } = componentData;

        // Generate template section
        const templateSection = await this.generateTemplate(componentData);

        // Generate script section
        const scriptSection = await this.generateScript(componentData);

        // Generate style section
        const styleSection = await this.generateStyle(componentData);

        // Combine sections into SFC
        const sfc = this.combineSFCSections({
            template: templateSection,
            script: scriptSection,
            style: styleSection,
            options
        });

        return sfc;
    }

    /**
     * Generate JSX component
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Generated JSX code
     */
    async generateJSX(componentData) {
        const jsxTemplate = this.templates.get('jsx') || this.getBuiltInJSXTemplate();

        return this.processTemplate(jsxTemplate, componentData);
    }

    /**
     * Generate TypeScript definitions
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Generated TypeScript code
     */
    async generateTypescript(componentData) {
        const { typeDefinitions, componentName } = componentData;

        if (!typeDefinitions) {
            return '';
        }

        const tsTemplate = this.templates.get('typescript') || this.getBuiltInTSTemplate();

        return this.processTemplate(tsTemplate, {
            ...componentData,
            interfaceName: typeDefinitions.interfaceName,
            propTypes: typeDefinitions.propTypes,
            eventTypes: typeDefinitions.eventTypes
        });
    }

    /**
     * Generate template section for SFC
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Template section
     */
    async generateTemplate(componentData) {
        const {
            libraryComponent,
            props,
            events,
            slots,
            options = {}
        } = componentData;

        // Build props string
        const propsString = this.buildPropsString(props);

        // Build events string
        const eventsString = this.buildEventsString(events);

        // Build slots content
        const slotsContent = this.buildSlotsContent(slots);

        // Generate component tag
        const componentTag = this.buildComponentTag({
            component: libraryComponent,
            props: propsString,
            events: eventsString,
            slots: slotsContent,
            selfClosing: !slotsContent,
            options
        });

        return `<template>\n  ${componentTag}\n</template>`;
    }

    /**
     * Generate script section for SFC
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Script section
     */
    async generateScript(componentData) {
        const {
            componentName,
            semanticName,
            imports,
            props,
            events,
            typeDefinitions,
            options = {}
        } = componentData;

        // Generate imports
        const importsString = this.buildImportsString(imports);

        // Generate props definition
        const propsDefinition = this.buildPropsDefinition(props, typeDefinitions);

        // Generate emits definition
        const emitsDefinition = this.buildEmitsDefinition(events);

        // Build script content
        const scriptContent = this.buildScriptContent({
            componentName,
            semanticName,
            imports: importsString,
            props: propsDefinition,
            emits: emitsDefinition,
            typescript: options.typescript,
            setup: options.setup !== false
        });

        const lang = options.typescript ? ' lang="ts"' : '';
        return `<script${lang}>\n${scriptContent}\n</script>`;
    }

    /**
     * Generate style section for SFC
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Style section
     */
    async generateStyle(componentData) {
        const { theme, options = {} } = componentData;

        if (!theme && !options.styles) {
            return '';
        }

        const styleContent = this.buildStyleContent({
            theme,
            customStyles: options.styles,
            scoped: options.scoped !== false,
            preprocessor: options.preprocessor
        });

        if (!styleContent.trim()) {
            return '';
        }

        const scoped = options.scoped !== false ? ' scoped' : '';
        const lang = options.preprocessor ? ` lang="${options.preprocessor}"` : '';

        return `<style${scoped}${lang}>\n${styleContent}\n</style>`;
    }

    /**
     * Build props string for template
     * @param {Object} props - Props object
     * @returns {string} Props string
     */
    buildPropsString(props) {
        if (!props || Object.keys(props).length === 0) {
            return '';
        }

        const propEntries = Object.entries(props).map(([key, value]) => {
            return this.buildPropAttribute(key, value);
        });

        return propEntries.join(' ');
    }

    /**
     * Build single prop attribute
     * @param {string} key - Prop name
     * @param {*} value - Prop value
     * @returns {string} Prop attribute
     */
    buildPropAttribute(key, value) {
        // Convert camelCase to kebab-case for Vue templates
        const kebabKey = this.camelToKebab(key);

        if (value === true) {
            return kebabKey;
        }

        if (value === false || value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'string') {
            // Check if it's a dynamic binding
            if (value.startsWith('{{') && value.endsWith('}}')) {
                const expression = value.slice(2, -2).trim();
                return `:${kebabKey}="${expression}"`;
            }
            return `${kebabKey}="${this.escapeAttribute(value)}"`;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return `:${kebabKey}="${value}"`;
        }

        if (typeof value === 'object') {
            return `:${kebabKey}="${JSON.stringify(value)}"`;
        }

        // Dynamic binding for other types
        return `:${kebabKey}="${value}"`;
    }

    /**
     * Build events string for template
     * @param {Object} events - Events object
     * @returns {string} Events string
     */
    buildEventsString(events) {
        if (!events || Object.keys(events).length === 0) {
            return '';
        }

        const eventEntries = Object.entries(events).map(([key, handler]) => {
            const kebabKey = this.camelToKebab(key);

            if (typeof handler === 'string') {
                return `@${kebabKey}="${handler}"`;
            }

            if (typeof handler === 'function') {
                return `@${kebabKey}="${handler.name || 'handler'}"`;
            }

            return `@${kebabKey}="${handler}"`;
        });

        return eventEntries.join(' ');
    }

    /**
     * Build slots content
     * @param {Object} slots - Slots object
     * @returns {string} Slots content
     */
    buildSlotsContent(slots) {
        if (!slots || Object.keys(slots).length === 0) {
            return '';
        }

        const slotEntries = Object.entries(slots).map(([name, content]) => {
            if (name === 'default') {
                return content;
            }
            return `<template #${name}>${content}</template>`;
        });

        return slotEntries.join('\n    ');
    }

    /**
     * Build component tag
     * @param {Object} options - Component tag options
     * @returns {string} Component tag
     */
    buildComponentTag({ component, props, events, slots, selfClosing, options = {} }) {
        const attributes = [props, events].filter(Boolean).join(' ');
        const attributesString = attributes ? ` ${attributes}` : '';

        if (selfClosing) {
            return `<${component}${attributesString} />`;
        }

        return `<${component}${attributesString}>\n    ${slots}\n  </${component}>`;
    }

    /**
     * Build imports string
     * @param {Array} imports - Imports array
     * @returns {string} Imports string
     */
    buildImportsString(imports) {
        if (!imports || imports.length === 0) {
            return '';
        }

        return imports.map(imp => {
            if (typeof imp === 'string') {
                return imp;
            }

            if (typeof imp === 'object') {
                const { from, imports: importList, default: defaultImport } = imp;

                if (defaultImport) {
                    return `import ${defaultImport} from '${from}';`;
                }

                if (importList && Array.isArray(importList)) {
                    const importNames = importList.join(', ');
                    return `import { ${importNames} } from '${from}';`;
                }

                return `import '${from}';`;
            }

            return '';
        }).filter(Boolean).join('\n');
    }

    /**
     * Build props definition for script
     * @param {Object} props - Props object
     * @param {Object} typeDefinitions - Type definitions
     * @returns {string} Props definition
     */
    buildPropsDefinition(props, typeDefinitions) {
        if (!props || Object.keys(props).length === 0) {
            return '';
        }

        if (typeDefinitions) {
            return `const props = defineProps<${typeDefinitions.interfaceName}>();`;
        }

        const propNames = Object.keys(props).map(key => `'${key}'`).join(', ');
        return `const props = defineProps([${propNames}]);`;
    }

    /**
     * Build emits definition for script
     * @param {Object} events - Events object
     * @returns {string} Emits definition
     */
    buildEmitsDefinition(events) {
        if (!events || Object.keys(events).length === 0) {
            return '';
        }

        const eventNames = Object.keys(events).map(key => `'${key}'`).join(', ');
        return `const emit = defineEmits([${eventNames}]);`;
    }

    /**
     * Build script content
     * @param {Object} options - Script options
     * @returns {string} Script content
     */
    buildScriptContent({ componentName, semanticName, imports, props, emits, typescript, setup }) {
        const parts = [];

        // Add imports
        if (imports) {
            parts.push(imports);
        }

        // Add Vue imports for Composition API
        if (setup) {
            const vueImports = typescript ?
                "import { defineProps, defineEmits } from 'vue';" :
                "import { defineProps, defineEmits } from 'vue';";
            parts.push(vueImports);
        }

        // Add component comment
        parts.push(`// Generated semantic component: ${semanticName}`);

        // Add props definition
        if (props) {
            parts.push(props);
        }

        // Add emits definition
        if (emits) {
            parts.push(emits);
        }

        // Add setup function if not using setup sugar
        if (!setup) {
            parts.push('export default {');
            parts.push(`  name: '${componentName}',`);
            if (props) {
                parts.push('  props,');
            }
            if (emits) {
                parts.push('  emits,');
            }
            parts.push('};');
        }

        return parts.join('\n');
    }

    /**
     * Build style content
     * @param {Object} options - Style options
     * @returns {string} Style content
     */
    buildStyleContent({ theme, customStyles, scoped, preprocessor }) {
        const parts = [];

        // Add theme styles
        if (theme && theme.tokens) {
            parts.push(this.generateThemeStyles(theme.tokens));
        }

        // Add custom styles
        if (customStyles) {
            parts.push(customStyles);
        }

        return parts.join('\n\n');
    }

    /**
     * Generate CSS from theme tokens
     * @param {Object} tokens - Theme tokens
     * @returns {string} CSS string
     */
    generateThemeStyles(tokens) {
        const css = [];

        for (const [category, categoryTokens] of Object.entries(tokens)) {
            if (typeof categoryTokens === 'object') {
                for (const [token, value] of Object.entries(categoryTokens)) {
                    const cssVar = `--${this.camelToKebab(category)}-${this.camelToKebab(token)}`;
                    css.push(`  ${cssVar}: ${value};`);
                }
            }
        }

        if (css.length === 0) {
            return '';
        }

        return `:root {\n${css.join('\n')}\n}`;
    }

    /**
     * Combine SFC sections
     * @param {Object} sections - SFC sections
     * @returns {string} Complete SFC
     */
    combineSFCSections({ template, script, style, options = {} }) {
        const parts = [];

        // Add template
        if (template) {
            parts.push(template);
        }

        // Add script
        if (script) {
            parts.push(script);
        }

        // Add style
        if (style) {
            parts.push(style);
        }

        // Add component comment header
        const header = options.includeHeader !== false ? this.generateHeader(options) : '';

        return header + parts.join('\n\n') + '\n';
    }

    /**
     * Generate component header comment
     * @param {Object} options - Header options
     * @returns {string} Header comment
     */
    generateHeader(options) {
        const timestamp = new Date().toISOString();
        const generator = 'Vue Design System Code Generator';

        return `<!--
  Generated by ${generator}
  Timestamp: ${timestamp}
  Adapter: ${options.adapter || 'unknown'}
  Zero-overhead design system component
-->\n\n`;
    }

    /**
     * Process template with data
     * @param {Object} template - Template configuration
     * @param {Object} data - Template data
     * @returns {string} Processed template
     */
    processTemplate(template, data) {
        if (!template || !template.generate) {
            throw new Error('Invalid template configuration');
        }

        if (typeof template.generate === 'function') {
            return template.generate(data);
        }

        if (typeof template.generate === 'string') {
            return this.processStringTemplate(template.generate, data);
        }

        throw new Error('Template must have a generate function or string');
    }

    /**
     * Process string template with variable substitution
     * @param {string} template - Template string
     * @param {Object} data - Template data
     * @returns {string} Processed string
     */
    processStringTemplate(template, data) {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(data, path);
            return value !== undefined ? value : match;
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-notation path
     * @returns {*} Found value or undefined
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Convert camelCase to kebab-case
     * @param {string} str - Input string
     * @returns {string} kebab-case string
     */
    camelToKebab(str) {
        return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    }

    /**
     * Escape HTML attribute value
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeAttribute(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Initialize built-in template generators
     */
    initializeBuiltInGenerators() {
        // Built-in SFC generator
        this.generatorFunctions.set('sfc', (data) => this.generateSFC(data));

        // Built-in JSX generator
        this.generatorFunctions.set('jsx', (data) => this.generateJSX(data));

        // Built-in TypeScript generator
        this.generatorFunctions.set('typescript', (data) => this.generateTypescript(data));
    }

    /**
     * Get built-in JSX template
     * @returns {Object} JSX template
     */
    getBuiltInJSXTemplate() {
        return {
            generate: (data) => {
                const { componentName, libraryComponent, props, events, slots } = data;

                const propsString = Object.entries(props || {})
                    .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
                    .join(' ');

                const eventsString = Object.entries(events || {})
                    .map(([key, handler]) => `${key}={${handler}}`)
                    .join(' ');

                const attributes = [propsString, eventsString].filter(Boolean).join(' ');
                const attributesString = attributes ? ` ${attributes}` : '';

                return `export default function ${componentName}() {
  return <${libraryComponent}${attributesString} />;
}`;
            }
        };
    }

    /**
     * Get built-in TypeScript template
     * @returns {Object} TypeScript template
     */
    getBuiltInTSTemplate() {
        return {
            generate: (data) => {
                const { interfaceName, propTypes, eventTypes, componentName } = data;

                const propTypesString = Object.entries(propTypes || {})
                    .map(([key, type]) => `  ${key}: ${type};`)
                    .join('\n');

                const eventTypesString = Object.entries(eventTypes || {})
                    .map(([key, type]) => `  ${key}: ${type};`)
                    .join('\n');

                return `export interface ${interfaceName} {
${propTypesString}
}

export interface ${componentName}Events {
${eventTypesString}
}`;
            }
        };
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }

    /**
     * Get template generation statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            loadedTemplates: this.templates.size,
            cacheSize: this.templateCache.size,
            generators: this.generatorFunctions.size
        };
    }
}
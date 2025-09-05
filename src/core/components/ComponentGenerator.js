// src/core/components/ComponentGenerator.js
import AdapterLoader from '../adapters/AdapterLoader.js';
import ComponentLoader from './ComponentLoader.js';
import TransformationEngine from '../TransformationEngine.js';
import TemplateEngine from '../templates/TemplateEngine.js';

export class ComponentGenerator {
    constructor() {
        this.adapterLoader = AdapterLoader;
        this.componentLoader = ComponentLoader;
        this.transformationEngine = TransformationEngine;
        this.templateEngine = TemplateEngine;
        this.generatedComponents = new Map();
    }

    /**
     * Generate component for target library
     */
    async generateComponent(componentName, targetLibrary, options = {}) {
        const {
            format = 'sfc', // 'sfc', 'jsx', 'ts'
            optimize = true,
            includeTypes = true,
            outputPath = null
        } = options;

        try {
            // Load component configuration
            const componentConfig = await this.componentLoader.loadComponent(componentName);

            // Load target adapter
            const adapter = await this.adapterLoader.loadAdapter(targetLibrary);

            // Transform component according to target library
            const transformedComponent = await this.transformComponent(
                componentConfig,
                adapter,
                options
            );

            // Generate component code
            const generatedCode = await this.generateCode(
                transformedComponent,
                adapter,
                format,
                options
            );

            // Apply optimizations if requested
            if (optimize) {
                generatedCode.optimized = await this.optimizeCode(generatedCode, adapter);
            }

            // Cache generated component
            const cacheKey = `${componentName}-${targetLibrary}-${format}`;
            this.generatedComponents.set(cacheKey, generatedCode);

            return generatedCode;
        } catch (error) {
            throw new Error(`Failed to generate ${componentName} for ${targetLibrary}: ${error.message}`);
        }
    }

    /**
     * Transform component configuration for target library
     */
    async transformComponent(componentConfig, adapter, options = {}) {
        const transformed = {
            name: componentConfig.name,
            originalConfig: componentConfig,
            targetLibrary: adapter.libraryName,
            props: {},
            events: {},
            slots: componentConfig.slots || {},
            imports: [],
            template: null,
            styles: null,
            typescript: null
        };

        // Transform props
        transformed.props = await this.transformationEngine.transformProps(
            componentConfig.props || {},
            componentConfig.transformation?.props || {},
            adapter,
            componentConfig.name
        );

        // Transform events
        transformed.events = await this.transformationEngine.transformEvents(
            componentConfig.events || {},
            componentConfig.transformation?.events || {},
            adapter,
            componentConfig.name
        );

        // Get library-specific imports
        const componentMapping = adapter.getComponentMapping(componentConfig.name);
        if (componentMapping.import) {
            transformed.imports.push(componentMapping.import);
        }

        // Add base library imports
        const baseImports = adapter.getImports();
        if (baseImports.base) {
            transformed.imports.push(...baseImports.base);
        }

        // Generate TypeScript definitions if needed
        if (options.includeTypes && componentConfig.typescript) {
            transformed.typescript = this.generateTypeScriptDefinitions(
                transformed,
                componentConfig.typescript
            );
        }

        return transformed;
    }

    /**
     * Generate component code
     */
    async generateCode(transformedComponent, adapter, format, options = {}) {
        const code = {
            format,
            component: null,
            template: null,
            script: null,
            style: null,
            types: null,
            imports: transformedComponent.imports,
            metadata: {
                generated: new Date().toISOString(),
                library: adapter.libraryName,
                version: adapter.config.version,
                componentName: transformedComponent.name
            }
        };

        switch (format) {
            case 'sfc':
                code.component = await this.generateSFC(transformedComponent, adapter, options);
                break;

            case 'jsx':
                code.component = await this.generateJSX(transformedComponent, adapter, options);
                break;

            case 'ts':
                code.component = await this.generateTypeScript(transformedComponent, adapter, options);
                break;

            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        return code;
    }

    /**
     * Generate Vue Single File Component
     */
    async generateSFC(transformedComponent, adapter, options = {}) {
        const templateData = {
            componentName: transformedComponent.name,
            props: transformedComponent.props,
            events: transformedComponent.events,
            slots: transformedComponent.slots,
            imports: transformedComponent.imports,
            library: adapter.libraryName,
            mapping: adapter.getComponentMapping(transformedComponent.name)
        };

        const template = await this.templateEngine.generateTemplate('sfc', templateData);

        return {
            filename: `${transformedComponent.name}.vue`,
            content: template,
            type: 'vue-sfc'
        };
    }

    /**
     * Generate JSX Component
     */
    async generateJSX(transformedComponent, adapter, options = {}) {
        const templateData = {
            componentName: transformedComponent.name,
            props: transformedComponent.props,
            events: transformedComponent.events,
            slots: transformedComponent.slots,
            imports: transformedComponent.imports,
            library: adapter.libraryName,
            mapping: adapter.getComponentMapping(transformedComponent.name)
        };

        const template = await this.templateEngine.generateTemplate('jsx', templateData);

        return {
            filename: `${transformedComponent.name}.jsx`,
            content: template,
            type: 'jsx'
        };
    }

    /**
     * Generate TypeScript Component
     */
    async generateTypeScript(transformedComponent, adapter, options = {}) {
        const templateData = {
            componentName: transformedComponent.name,
            props: transformedComponent.props,
            events: transformedComponent.events,
            slots: transformedComponent.slots,
            imports: transformedComponent.imports,
            library: adapter.libraryName,
            mapping: adapter.getComponentMapping(transformedComponent.name),
            typescript: transformedComponent.typescript
        };

        const template = await this.templateEngine.generateTemplate('typescript', templateData);

        return {
            filename: `${transformedComponent.name}.ts`,
            content: template,
            type: 'typescript'
        };
    }

    /**
     * Generate TypeScript definitions
     */
    generateTypeScriptDefinitions(transformedComponent, typeConfig) {
        const interfaces = [];

        // Generate props interface
        if (typeConfig.props) {
            interfaces.push(typeConfig.props);
        }

        // Generate events interface
        if (typeConfig.events) {
            interfaces.push(typeConfig.events);
        }

        // Generate slots interface
        if (typeConfig.slots) {
            interfaces.push(typeConfig.slots);
        }

        return {
            interfaces: interfaces.join('\n\n'),
            exports: `export { ${transformedComponent.name}Props, ${transformedComponent.name}Events, ${transformedComponent.name}Slots };`
        };
    }

    /**
     * Optimize generated code
     */
    async optimizeCode(generatedCode, adapter) {
        const optimizations = adapter.getOptimizationHints();
        const optimized = { ...generatedCode };

        // Tree-shake unused imports
        if (optimizations.treeshake?.imports) {
            optimized.imports = this.optimizeImports(optimized.imports, optimized.component.content);
        }

        // Minimize component size
        if (optimizations.minify) {
            optimized.component.content = this.minifyCode(optimized.component.content);
        }

        // Apply performance optimizations
        if (optimizations.performance) {
            optimized.component.content = this.applyPerformanceOptimizations(
                optimized.component.content,
                optimizations.performance
            );
        }

        return optimized;
    }

    /**
     * Optimize imports by removing unused ones
     */
    optimizeImports(imports, code) {
        return imports.filter(importStatement => {
            // Extract import name from statement
            const match = importStatement.match(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/);
            if (!match) return true;

            const importName = match[1];
            return code.includes(importName);
        });
    }

    /**
     * Minify code for production
     */
    minifyCode(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\/\/.*$/gm, '') // Remove single line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
    }

    /**
     * Apply performance optimizations
     */
    applyPerformanceOptimizations(code, optimizations) {
        let optimizedCode = code;

        // Add v-memo for static content
        if (optimizations.memo) {
            optimizedCode = optimizedCode.replace(
                /<(\w+)([^>]*?)>/g,
                '<$1$2 v-memo="[]">'
            );
        }

        // Add lazy loading for heavy components
        if (optimizations.lazy) {
            optimizedCode = optimizedCode.replace(
                /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
                'const $1 = defineAsyncComponent(() => import("$2"))'
            );
        }

        return optimizedCode;
    }

    /**
     * Generate multiple components
     */
    async generateComponents(componentNames, targetLibrary, options = {}) {
        const results = {};

        for (const componentName of componentNames) {
            try {
                results[componentName] = await this.generateComponent(
                    componentName,
                    targetLibrary,
                    options
                );
            } catch (error) {
                results[componentName] = {
                    error: error.message,
                    success: false
                };
            }
        }

        return results;
    }

    /**
     * Generate component library bundle
     */
    async generateLibrary(componentNames, targetLibrary, options = {}) {
        const {
            bundleFormat = 'esm',
            includeIndex = true,
            includeTypes = true,
            outputDir = './dist'
        } = options;

        const library = {
            components: {},
            index: null,
            types: null,
            styles: null,
            metadata: {
                generated: new Date().toISOString(),
                library: targetLibrary,
                components: componentNames,
                format: bundleFormat
            }
        };

        // Generate all components
        library.components = await this.generateComponents(
            componentNames,
            targetLibrary,
            options
        );

        // Generate index file
        if (includeIndex) {
            library.index = this.generateIndexFile(library.components, bundleFormat);
        }

        // Generate global types
        if (includeTypes) {
            library.types = this.generateGlobalTypes(library.components);
        }

        // Generate bundled styles
        library.styles = await this.generateBundledStyles(targetLibrary, componentNames);

        return library;
    }

    /**
     * Generate index file for library
     */
    generateIndexFile(components, format = 'esm') {
        const exports = [];
        const imports = [];

        for (const [componentName, generated] of Object.entries(components)) {
            if (generated.error) continue;

            const filename = generated.component.filename.replace(/\.(vue|jsx|ts)$/, '');

            if (format === 'esm') {
                imports.push(`import ${componentName} from './${filename}';`);
                exports.push(componentName);
            } else if (format === 'cjs') {
                imports.push(`const ${componentName} = require('./${filename}');`);
                exports.push(componentName);
            }
        }

        let indexContent = imports.join('\n') + '\n\n';

        if (format === 'esm') {
            indexContent += `export { ${exports.join(', ')} };\n`;
            indexContent += `export default { ${exports.join(', ')} };`;
        } else if (format === 'cjs') {
            indexContent += `module.exports = { ${exports.join(', ')} };`;
        }

        return {
            filename: 'index.js',
            content: indexContent
        };
    }

    /**
     * Generate global TypeScript definitions
     */
    generateGlobalTypes(components) {
        const typeDefinitions = [];

        for (const [componentName, generated] of Object.entries(components)) {
            if (generated.error || !generated.typescript) continue;

            typeDefinitions.push(`// ${componentName} Types`);
            typeDefinitions.push(generated.typescript.interfaces);
            typeDefinitions.push('');
        }

        typeDefinitions.push('// Global Component Registry');
        typeDefinitions.push('declare module "@vue/runtime-core" {');
        typeDefinitions.push('  export interface GlobalComponents {');

        for (const componentName of Object.keys(components)) {
            typeDefinitions.push(`    ${componentName}: typeof import('./${componentName}')['default'];`);
        }

        typeDefinitions.push('  }');
        typeDefinitions.push('}');

        return {
            filename: 'index.d.ts',
            content: typeDefinitions.join('\n')
        };
    }

    /**
     * Generate bundled styles
     */
    async generateBundledStyles(targetLibrary, componentNames) {
        const adapter = await this.adapterLoader.loadAdapter(targetLibrary);
        const baseImports = adapter.getImports();

        const styles = [];

        // Add base library styles
        if (baseImports.base) {
            baseImports.base.forEach(importStatement => {
                if (importStatement.includes('.css')) {
                    styles.push(importStatement);
                }
            });
        }

        return {
            filename: 'styles.css',
            imports: styles
        };
    }

    /**
     * Get generation statistics
     */
    getGenerationStats() {
        const stats = {
            totalGenerated: this.generatedComponents.size,
            byLibrary: {},
            byFormat: {},
            lastGenerated: null
        };

        for (const [key, component] of this.generatedComponents.entries()) {
            const [, library, format] = key.split('-');

            stats.byLibrary[library] = (stats.byLibrary[library] || 0) + 1;
            stats.byFormat[format] = (stats.byFormat[format] || 0) + 1;

            if (!stats.lastGenerated || component.metadata.generated > stats.lastGenerated) {
                stats.lastGenerated = component.metadata.generated;
            }
        }

        return stats;
    }

    /**
     * Clear generation cache
     */
    clearCache(componentName = null, targetLibrary = null) {
        if (componentName && targetLibrary) {
            // Clear specific component-library combination
            for (const key of this.generatedComponents.keys()) {
                if (key.startsWith(`${componentName}-${targetLibrary}`)) {
                    this.generatedComponents.delete(key);
                }
            }
        } else if (componentName) {
            // Clear all versions of a component
            for (const key of this.generatedComponents.keys()) {
                if (key.startsWith(`${componentName}-`)) {
                    this.generatedComponents.delete(key);
                }
            }
        } else {
            // Clear all
            this.generatedComponents.clear();
        }
    }

    /**
     * Hot reload component generation
     */
    async hotReload(componentName, targetLibrary) {
        this.clearCache(componentName, targetLibrary);
        await this.componentLoader.hotReload(componentName);
        await this.adapterLoader.hotReload(targetLibrary);

        return await this.generateComponent(componentName, targetLibrary, { useCache: false });
    }

    /**
     * Validate generated component
     */
    validateGenerated(generatedCode) {
        const errors = [];

        // Check for required properties
        if (!generatedCode.component || !generatedCode.component.content) {
            errors.push('Generated component missing content');
        }

        // Check for import consistency
        if (generatedCode.imports.length === 0) {
            errors.push('No imports found - component may not work');
        }

        // Check for syntax errors (basic)
        try {
            // This is a simplified check - in real implementation, use a proper parser
            if (generatedCode.format === 'sfc' && !generatedCode.component.content.includes('<template>')) {
                errors.push('SFC missing template block');
            }
        } catch (error) {
            errors.push(`Syntax error: ${error.message}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default new ComponentGenerator();
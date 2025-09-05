import { TransformationEngine } from '../TransformationEngine.js';
import { TemplateEngine } from '../templates/TemplateEngine.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Core component generator that orchestrates the transformation pipeline
 * and generates optimized, self-contained components at build time
 */
export class ComponentGenerator {
    constructor(adapterLoader, componentLoader, themeLoader) {
        this.adapterLoader = adapterLoader;
        this.componentLoader = componentLoader;
        this.themeLoader = themeLoader;
        this.transformationEngine = new TransformationEngine();
        this.templateEngine = new TemplateEngine();

        // Generation cache for performance
        this.generationCache = new Map();
        this.dependencyCache = new Map();

        // Generation statistics
        this.stats = {
            generated: 0,
            cached: 0,
            errors: 0,
            totalTime: 0
        };
    }

    /**
     * Generate a single component with full optimization pipeline
     * @param {string} componentName - Semantic component name
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated component code and metadata
     */
    async generateComponent(componentName, options = {}) {
        const startTime = Date.now();

        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(componentName, options);
            if (options.useCache !== false && this.generationCache.has(cacheKey)) {
                this.stats.cached++;
                return this.generationCache.get(cacheKey);
            }

            // Get current adapter
            const adapter = this.adapterLoader.getCurrentAdapter();
            if (!adapter) {
                throw new Error('No adapter loaded. Set current library first.');
            }

            // Load component configuration
            const componentConfig = this.componentLoader.getComponent(componentName);
            if (!componentConfig) {
                throw new Error(`Component configuration not found: ${componentName}`);
            }

            // Check adapter support
            if (!adapter.isComponentSupported(componentName)) {
                throw new Error(`Component '${componentName}' not supported by ${adapter.name} adapter`);
            }

            // Generate component code
            const generatedComponent = await this.performGeneration(
                componentName,
                componentConfig,
                adapter,
                options
            );

            // Cache the result
            this.generationCache.set(cacheKey, generatedComponent);

            // Update statistics
            this.stats.generated++;
            this.stats.totalTime += Date.now() - startTime;

            return generatedComponent;
        } catch (error) {
            this.stats.errors++;
            throw new Error(`Component generation failed for ${componentName}: ${error.message}`);
        }
    }

    /**
     * Generate multiple components with dependency resolution
     * @param {string[]} componentNames - Array of component names
     * @param {Object} options - Generation options
     * @returns {Promise<Map>} Map of component names to generated code
     */
    async generateComponents(componentNames, options = {}) {
        const results = new Map();
        const processed = new Set();
        const processing = new Set();

        const generateWithDependencies = async (componentName) => {
            if (processed.has(componentName)) {
                return results.get(componentName);
            }

            if (processing.has(componentName)) {
                throw new Error(`Circular dependency detected: ${componentName}`);
            }

            processing.add(componentName);

            try {
                // Get component dependencies
                const dependencies = this.componentLoader.getComponentDependencies(componentName);

                // Generate dependencies first
                for (const depName of dependencies) {
                    await generateWithDependencies(depName);
                }

                // Generate the component
                const generated = await this.generateComponent(componentName, options);
                results.set(componentName, generated);
                processed.add(componentName);
                processing.delete(componentName);

                return generated;
            } catch (error) {
                processing.delete(componentName);
                throw error;
            }
        };

        // Generate all components with dependencies
        await Promise.all(
            componentNames.map(name => generateWithDependencies(name))
        );

        return results;
    }

    /**
     * Perform the actual component generation pipeline
     * @param {string} componentName - Component name
     * @param {Object} componentConfig - Component configuration
     * @param {Object} adapter - Current adapter
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated component
     */
    async performGeneration(componentName, componentConfig, adapter, options) {
        // Step 1: Transform semantic props to library-specific props
        const transformedProps = await this.transformationEngine.transformProps(
            componentName,
            componentConfig.semanticProps,
            adapter,
            options
        );

        // Step 2: Transform events and slots
        const transformedEvents = await this.transformationEngine.transformEvents(
            componentName,
            componentConfig.events || {},
            adapter,
            options
        );

        const transformedSlots = await this.transformationEngine.transformSlots(
            componentName,
            componentConfig.slots || {},
            adapter,
            options
        );

        // Step 3: Get library-specific component mapping
        const componentMapping = adapter.getComponentMapping(componentName);

        // Step 4: Collect required imports
        const requiredImports = this.collectRequiredImports(
            componentName,
            adapter,
            componentConfig,
            options
        );

        // Step 5: Apply theme transformations if theme is loaded
        const themeData = await this.applyThemeTransformations(
            componentName,
            transformedProps,
            options
        );

        // Step 6: Generate TypeScript interfaces if requested
        const typeDefinitions = await this.generateTypeDefinitions(
            componentName,
            componentConfig,
            transformedProps,
            options
        );

        // Step 7: Apply performance optimizations
        const optimizedCode = await this.applyPerformanceOptimizations(
            componentName,
            {
                props: transformedProps,
                events: transformedEvents,
                slots: transformedSlots,
                mapping: componentMapping,
                imports: requiredImports,
                theme: themeData
            },
            adapter,
            options
        );

        // Step 8: Generate final component code using templates
        const generatedCode = await this.templateEngine.generateComponent({
            componentName,
            semanticName: componentName,
            libraryComponent: componentMapping.component,
            props: optimizedCode.props,
            events: optimizedCode.events,
            slots: optimizedCode.slots,
            imports: optimizedCode.imports,
            theme: optimizedCode.theme,
            typeDefinitions,
            options
        });

        return {
            componentName,
            semanticName: componentName,
            libraryComponent: componentMapping.component,
            code: generatedCode,
            typeDefinitions,
            imports: optimizedCode.imports,
            dependencies: this.componentLoader.getComponentDependencies(componentName),
            performanceHints: adapter.getPerformanceHints(componentName),
            metadata: {
                adapter: adapter.name,
                version: adapter.version,
                generated: new Date().toISOString(),
                optimizations: optimizedCode.optimizations || []
            }
        };
    }

    /**
     * Collect all required imports for a component
     * @param {string} componentName - Component name
     * @param {Object} adapter - Current adapter
     * @param {Object} componentConfig - Component configuration
     * @param {Object} options - Generation options
     * @returns {Array} Array of import statements
     */
    collectRequiredImports(componentName, adapter, componentConfig, options) {
        const imports = new Set();

        // Add adapter imports
        const adapterImports = adapter.getRequiredImports(componentName);
        adapterImports.forEach(imp => imports.add(imp));

        // Add component-specific imports
        if (componentConfig.imports) {
            componentConfig.imports.forEach(imp => imports.add(imp));
        }

        // Add theme imports if theme is being used
        if (options.theme) {
            const themeImports = this.themeLoader?.getThemeImports(options.theme) || [];
            themeImports.forEach(imp => imports.add(imp));
        }

        // Deduplicate and sort imports
        return Array.from(imports).sort();
    }

    /**
     * Apply theme transformations to component props
     * @param {string} componentName - Component name
     * @param {Object} transformedProps - Already transformed props
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Theme data and transformations
     */
    async applyThemeTransformations(componentName, transformedProps, options) {
        if (!options.theme || !this.themeLoader) {
            return null;
        }

        try {
            const themeConfig = this.themeLoader.getTheme(options.theme);
            if (!themeConfig) {
                return null;
            }

            // Apply theme-specific transformations
            const themeTransformations = await this.themeLoader.generateThemeTokens(
                componentName,
                transformedProps,
                themeConfig
            );

            return {
                tokens: themeTransformations,
                config: themeConfig,
                name: options.theme
            };
        } catch (error) {
            console.warn(`Theme transformation failed for ${componentName}:`, error.message);
            return null;
        }
    }

    /**
     * Generate TypeScript interface definitions
     * @param {string} componentName - Component name
     * @param {Object} componentConfig - Component configuration
     * @param {Object} transformedProps - Transformed props
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} TypeScript definitions
     */
    async generateTypeDefinitions(componentName, componentConfig, transformedProps, options) {
        if (!options.typescript) {
            return null;
        }

        try {
            const interfaceName = `${componentName}Props`;
            const propTypes = {};

            // Generate types from semantic props
            for (const [propName, propConfig] of Object.entries(componentConfig.semanticProps)) {
                propTypes[propName] = this.generatePropType(propConfig);
            }

            // Generate event types
            const eventTypes = {};
            if (componentConfig.events) {
                for (const [eventName, eventConfig] of Object.entries(componentConfig.events)) {
                    eventTypes[eventName] = this.generateEventType(eventConfig);
                }
            }

            return {
                interfaceName,
                propTypes,
                eventTypes,
                generated: this.templateEngine.generateTypeScript({
                    interfaceName,
                    propTypes,
                    eventTypes,
                    componentName
                })
            };
        } catch (error) {
            console.warn(`TypeScript generation failed for ${componentName}:`, error.message);
            return null;
        }
    }

    /**
     * Generate TypeScript type for a prop
     * @param {Object} propConfig - Prop configuration
     * @returns {string} TypeScript type
     */
    generatePropType(propConfig) {
        switch (propConfig.type) {
            case 'string':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return propConfig.itemType ? `${this.generatePropType({ type: propConfig.itemType })}[]` : 'any[]';
            case 'object':
                return 'object';
            case 'function':
                return 'Function';
            case 'date':
                return 'Date';
            case 'enum':
                return propConfig.values.map(v => `'${v}'`).join(' | ');
            case 'union':
                return propConfig.types.map(t => this.generatePropType({ type: t })).join(' | ');
            default:
                return 'any';
        }
    }

    /**
     * Generate TypeScript type for an event
     * @param {Object} eventConfig - Event configuration
     * @returns {string} TypeScript type
     */
    generateEventType(eventConfig) {
        if (eventConfig.parameters) {
            const paramTypes = eventConfig.parameters.map(param =>
                `${param.name}: ${this.generatePropType(param)}`
            ).join(', ');
            return `(${paramTypes}) => void`;
        }
        return '() => void';
    }

    /**
     * Apply performance optimizations to generated code
     * @param {string} componentName - Component name
     * @param {Object} codeData - Component code data
     * @param {Object} adapter - Current adapter
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Optimized code
     */
    async applyPerformanceOptimizations(componentName, codeData, adapter, options) {
        const optimizations = [];
        const optimizedData = { ...codeData };

        // Get performance hints from adapter
        const performanceHints = adapter.getPerformanceHints(componentName);

        // Apply prop optimizations
        if (performanceHints.props?.optimize) {
            optimizedData.props = await this.optimizeProps(
                optimizedData.props,
                performanceHints.props
            );
            optimizations.push('prop-optimization');
        }

        // Apply event optimizations
        if (performanceHints.events?.debounce) {
            optimizedData.events = await this.optimizeEvents(
                optimizedData.events,
                performanceHints.events
            );
            optimizations.push('event-optimization');
        }

        // Apply import optimizations
        if (options.treeShaking !== false) {
            optimizedData.imports = await this.optimizeImports(
                optimizedData.imports,
                performanceHints
            );
            optimizations.push('tree-shaking');
        }

        // Apply memory optimizations
        if (performanceHints.memory?.optimize) {
            optimizedData.props = await this.optimizeMemoryUsage(
                optimizedData.props,
                performanceHints.memory
            );
            optimizations.push('memory-optimization');
        }

        optimizedData.optimizations = optimizations;
        return optimizedData;
    }

    /**
     * Optimize props for performance
     * @param {Object} props - Props object
     * @param {Object} hints - Performance hints
     * @returns {Promise<Object>} Optimized props
     */
    async optimizeProps(props, hints) {
        const optimized = { ...props };

        // Remove unused props
        if (hints.removeUnused) {
            for (const [propName, propValue] of Object.entries(optimized)) {
                if (propValue === undefined || propValue === null) {
                    delete optimized[propName];
                }
            }
        }

        // Merge static props
        if (hints.mergeStatic) {
            const staticProps = {};
            const dynamicProps = {};

            for (const [propName, propValue] of Object.entries(optimized)) {
                if (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean') {
                    staticProps[propName] = propValue;
                } else {
                    dynamicProps[propName] = propValue;
                }
            }

            return { ...staticProps, ...dynamicProps };
        }

        return optimized;
    }

    /**
     * Optimize events for performance
     * @param {Object} events - Events object
     * @param {Object} hints - Performance hints
     * @returns {Promise<Object>} Optimized events
     */
    async optimizeEvents(events, hints) {
        const optimized = { ...events };

        // Add debouncing to specified events
        if (hints.debounce && Array.isArray(hints.debounce)) {
            for (const eventName of hints.debounce) {
                if (optimized[eventName]) {
                    optimized[eventName] = `debounce(${optimized[eventName]}, ${hints.debounceMs || 300})`;
                }
            }
        }

        return optimized;
    }

    /**
     * Optimize imports for tree shaking
     * @param {Array} imports - Imports array
     * @param {Object} hints - Performance hints
     * @returns {Promise<Array>} Optimized imports
     */
    async optimizeImports(imports, hints) {
        // Remove duplicate imports
        const uniqueImports = [...new Set(imports)];

        // Apply import-specific optimizations from hints
        if (hints.imports?.optimize) {
            return uniqueImports.filter(imp => !hints.imports.exclude?.includes(imp));
        }

        return uniqueImports;
    }

    /**
     * Optimize memory usage
     * @param {Object} props - Props object
     * @param {Object} hints - Memory hints
     * @returns {Promise<Object>} Memory-optimized props
     */
    async optimizeMemoryUsage(props, hints) {
        // Implement memory optimization strategies
        // This could include object pooling, lazy loading, etc.
        return props;
    }

    /**
     * Generate cache key for component generation
     * @param {string} componentName - Component name
     * @param {Object} options - Generation options
     * @returns {string} Cache key
     */
    generateCacheKey(componentName, options) {
        const adapter = this.adapterLoader.getCurrentAdapter();
        const adapterInfo = adapter ? `${adapter.name}:${adapter.version}` : 'no-adapter';
        const optionsHash = JSON.stringify(options);
        return `${componentName}:${adapterInfo}:${optionsHash}`;
    }

    /**
     * Get generation statistics
     * @returns {Object} Generation statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Reset generation statistics
     */
    resetStats() {
        this.stats = {
            generated: 0,
            cached: 0,
            errors: 0,
            totalTime: 0
        };
    }

    /**
     * Clear generation cache
     */
    clearCache() {
        this.generationCache.clear();
        this.dependencyCache.clear();
    }

    /**
     * Save generated components to files
     * @param {Map} generatedComponents - Map of generated components
     * @param {string} outputPath - Output directory path
     * @param {Object} options - Save options
     * @returns {Promise<void>}
     */
    async saveGeneratedComponents(generatedComponents, outputPath, options = {}) {
        await fs.ensureDir(outputPath);

        const savePromises = [];

        for (const [componentName, generated] of generatedComponents) {
            const filename = options.typescript ? `${componentName}.vue.ts` : `${componentName}.vue`;
            const filePath = path.join(outputPath, filename);

            savePromises.push(
                fs.writeFile(filePath, generated.code, 'utf8')
            );

            // Save TypeScript definitions separately if generated
            if (generated.typeDefinitions && options.typescript) {
                const typeFilePath = path.join(outputPath, `${componentName}.d.ts`);
                savePromises.push(
                    fs.writeFile(typeFilePath, generated.typeDefinitions.generated, 'utf8')
                );
            }
        }

        await Promise.all(savePromises);
    }
}
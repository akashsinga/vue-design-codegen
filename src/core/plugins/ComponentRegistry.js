// src/core/plugins/ComponentRegistry.js
import ComponentGenerator from '../components/ComponentGenerator.js';
import ComponentLoader from '../components/ComponentLoader.js';

export class ComponentRegistry {
    constructor() {
        this.registeredComponents = new Map();
        this.componentInfo = new Map();
        this.app = null;
    }

    /**
     * Register a component in the Vue app
     */
    async registerComponent(app, componentName, targetLibrary, options = {}) {
        const { prefix = '', global = true } = options;

        try {
            // Generate component for target library
            const generatedComponent = await ComponentGenerator.generateComponent(
                componentName,
                targetLibrary,
                { format: 'sfc', optimize: true }
            );

            // Create Vue component from generated code
            const vueComponent = this.createVueComponent(generatedComponent);

            // Register component name
            const registeredName = prefix ? `${prefix}${componentName}` : componentName;

            if (global) {
                app.component(registeredName, vueComponent);
            }

            // Store component info
            this.registeredComponents.set(registeredName, vueComponent);
            this.componentInfo.set(registeredName, {
                originalName: componentName,
                targetLibrary,
                generated: generatedComponent,
                registeredName,
                global
            });

            return vueComponent;

        } catch (error) {
            throw new Error(`Failed to register component ${componentName}: ${error.message}`);
        }
    }

    /**
     * Create Vue component from generated code
     */
    createVueComponent(generatedComponent) {
        // This would compile the generated SFC into a Vue component
        // For now, return a placeholder component
        return {
            name: generatedComponent.metadata.componentName,
            template: `<div class="ds-component ds-${generatedComponent.metadata.componentName.toLowerCase()}">
                Generated ${generatedComponent.metadata.componentName} for ${generatedComponent.metadata.library}
            </div>`,
            props: {},
            __designSystemComponent: true
        };
    }

    /**
     * Get registered components
     */
    getRegisteredComponents() {
        return Array.from(this.registeredComponents.keys());
    }

    /**
     * Get component info
     */
    getComponentInfo(componentName) {
        return this.componentInfo.get(componentName);
    }

    /**
     * Check if component is registered
     */
    isRegistered(componentName) {
        return this.registeredComponents.has(componentName);
    }

    /**
     * Migrate components to new library
     */
    async migrateComponents(newLibrary) {
        const migratedComponents = [];

        for (const [registeredName, info] of this.componentInfo.entries()) {
            try {
                // Re-generate component for new library
                const newComponent = await ComponentGenerator.generateComponent(
                    info.originalName,
                    newLibrary,
                    { format: 'sfc', optimize: true }
                );

                // Update component info
                info.targetLibrary = newLibrary;
                info.generated = newComponent;

                // Re-register component if it was global
                if (info.global && this.app) {
                    const vueComponent = this.createVueComponent(newComponent);
                    this.app.component(registeredName, vueComponent);
                    this.registeredComponents.set(registeredName, vueComponent);
                }

                migratedComponents.push(registeredName);

            } catch (error) {
                console.warn(`Failed to migrate component ${registeredName}:`, error.message);
            }
        }

        return migratedComponents;
    }

    /**
     * Cleanup registry
     */
    cleanup() {
        this.registeredComponents.clear();
        this.componentInfo.clear();
        this.app = null;
    }
}

export default new ComponentRegistry();
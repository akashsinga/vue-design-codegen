/**
 * Base Library Adapter Interface
 * Abstract class for implementing different UI library adapters
 */

export class LibraryAdapter {
    constructor(name, version = 'latest') {
        this.name = name
        this.version = version
        this.componentMap = new Map()
        this.eventMap = new Map()
        this.propMap = new Map()
    }

    /**
     * Get the actual component for the library
     * @param {String} - GenericName
     * @returns {String} Library Specific
     */
    getComponent(genericName) {
        return this.componentMap.get(genericName) || genericName
    }

    /**
     * Get import statement for component
     * @param {string} componentName - Component name
     * @returns {string} Import statement
     */
    getImportStatement(componentName) {
        throw new Error('getImportStatement must be implemented by subclass')
    }

    /**
     * Transform prop name for library compatibility
     * @param {string} genericProp - Generic prop name
     * @returns {string} Library-specific prop name
     */
    transformProp(genericProp) {
        return this.propMap.get(genericProp) || genericProp
    }

    /**
     * Transform event name for library compatibility
     * @param {string} genericEvent - Generic event name
     * @returns {string} Library-specific event name
     */
    transformEvent(genericEvent) {
        return this.eventMap.get(genericEvent) || genericEvent
    }

    /**
     * Get library-specific component configuration
     * @param {string} componentName - Component name
     * @returns {Object} Component configuration
     */
    getComponentConfig(componentName) {
        return {};
    }

    /**
     * Register component mapping
     * @param {string} genericName - Generic component name
     * @param {string} libraryName - Library-specific name
    */
    registerComponent(genericName, libraryName) {
        this.componentMap.set(genericName, libraryName)
    }

    /**
     * Register prop mapping
     * @param {string} genericProp - Generic prop name
     * @param {string} libraryProp - Library-specific prop name
     */
    registerProp(genericProp, libraryProp) {
        this.propMap.set(genericProp, libraryProp)
    }

    /**
     * Register event mapping
     * @param {string} genericEvent - Generic event name
     * @param {string} libraryEvent - Library-specific event name
     */
    registerEvent(genericEvent, libraryEvent) {
        this.eventMap.set(genericEvent, libraryEvent)
    }
}
/**
 * Base Library Adapter Interface.
 * Abstract class for implementing different UI library adapters.
 * 
 * File: src/core/adapters/LibraryAdapter.js
 */

export class LibraryAdapter {
    constructor(name, version) {
        this.name = name
        this.version = version
        this.componentMap = new Map()
    }

    /**
     * Get library-specific component name
     * @param {String} semanticName - OP Name
     * @returns {String} - Name in the Library
     */
    getComponent(semanticName) {
        return this.componentMap.get(semanticName) || semanticName
    }

    /**
     * Generate import statement for component
     * @param {Object} config - Component Config
     * @returns {String} Import statement
     */
    getImportStatement(config) {
        throw new Error(`${this.name} Adapter must implement getImportStatement()`)
    }

    /**
     * Register Component Mapping
     * @param {String} semanticName - OP Name
     * @param {String} libraryName - Name in the library
     */
    registerComponent(semanticName, libraryName) {
        this.componentMap.set(semanticName, libraryName)
    }

    /**
     * Check if the component is registered
     * @param {String} semanticName
     * @returns {Boolean}
     */
    hasComponent(semanticName) {
        return this.componentMap.has(semanticName)
    }

    /**
     * Get all registered components
     * @returns {Array} Array of [semanticName, libraryName] pairs
     */
    getAllComponents() {
        return Array.from(this.componentMap.entries())
    }
}
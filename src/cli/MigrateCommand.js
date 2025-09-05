import { AdapterLoader } from '../core/adapters/AdapterLoader.js';
import { ComponentLoader } from '../core/components/ComponentLoader.js';
import { ComponentGenerator } from '../core/components/ComponentGenerator.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

/**
 * Migrate command for switching between UI libraries with zero code changes
 */
export class MigrateCommand {
    constructor() {
        this.adapterLoader = new AdapterLoader();
        this.componentLoader = new ComponentLoader();
        this.componentGenerator = null;

        this.defaultOptions = {
            from: null,
            to: null,
            output: 'src/generated',
            backup: true,
            preview: false,
            force: false,
            verbose: false
        };
    }

    /**
     * Execute the migrate command
     * @param {string[]} args - Command arguments
     */
    async execute(args) {
        const options = this.parseArguments(args);

        if (options.help) {
            this.showHelp();
            return;
        }

        if (!options.to) {
            throw new Error('Target library (--to) is required');
        }

        console.log(chalk.blue('🔄 Starting library migration...\n'));

        try {
            // Initialize
            await this.initialize(options);

            // Check compatibility
            const compatibility = await this.checkCompatibility(options);

            // Show migration preview
            if (options.preview) {
                await this.showMigrationPreview(compatibility, options);
                return;
            }

            // Confirm migration
            if (!options.force && !await this.confirmMigration(compatibility, options)) {
                console.log(chalk.yellow('Migration cancelled.'));
                return;
            }

            // Create backup
            if (options.backup) {
                await this.createBackup(options);
            }

            // Perform migration
            const results = await this.performMigration(options);

            // Show results
            this.showMigrationResults(results, options);

        } catch (error) {
            throw new Error(`Migration failed: ${error.message}`);
        }
    }

    /**
     * Parse command line arguments
     * @param {string[]} args - Raw arguments
     * @returns {Object} Parsed options
     */
    parseArguments(args) {
        const options = { ...this.defaultOptions };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];

            switch (arg) {
                case '--help':
                case '-h':
                    options.help = true;
                    break;

                case '--from':
                case '-f':
                    options.from = nextArg;
                    i++;
                    break;

                case '--to':
                case '-t':
                    options.to = nextArg;
                    i++;
                    break;

                case '--output':
                case '-o':
                    options.output = nextArg;
                    i++;
                    break;

                case '--preview':
                case '-p':
                    options.preview = true;
                    break;

                case '--no-backup':
                    options.backup = false;
                    break;

                case '--force':
                    options.force = true;
                    break;

                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;

                default:
                    if (arg.startsWith('--')) {
                        throw new Error(`Unknown option: ${arg}`);
                    }
            }
        }

        return options;
    }

    /**
     * Initialize adapters and loaders
     * @param {Object} options - Migration options
     */
    async initialize(options) {
        const stopLoading = this.showLoading('Initializing migration system...');

        try {
            // Load all adapters
            await this.adapterLoader.loadAllAdapters();

            // Load components
            await this.componentLoader.loadAllComponents();

            // Validate target library
            if (!this.adapterLoader.isAdapterLoaded(options.to)) {
                throw new Error(`Target library '${options.to}' is not supported`);
            }

            // Validate source library if specified
            if (options.from && !this.adapterLoader.isAdapterLoaded(options.from)) {
                throw new Error(`Source library '${options.from}' is not supported`);
            }

            // Initialize component generator
            this.componentGenerator = new ComponentGenerator(
                this.adapterLoader,
                this.componentLoader,
                null // No theme loader needed for migration
            );

            stopLoading();

            if (options.verbose) {
                const supportedLibraries = this.adapterLoader.getLoadedAdapters();
                console.log(chalk.green(`✓ Supported libraries: ${supportedLibraries.join(', ')}`));
                console.log(chalk.green(`✓ Loaded ${this.componentLoader.getLoadedComponents().length} component configurations`));
            }

        } catch (error) {
            stopLoading();
            throw error;
        }
    }

    /**
     * Check migration compatibility between libraries
     * @param {Object} options - Migration options
     * @returns {Promise<Object>} Compatibility report
     */
    async checkCompatibility(options) {
        console.log(chalk.blue('🔍 Analyzing migration compatibility...\n'));

        const fromLibrary = options.from || 'current';
        const toLibrary = options.to;

        // Get compatibility info from adapter loader
        const compatibility = this.adapterLoader.checkMigrationCompatibility(fromLibrary, toLibrary);

        // Get detailed component compatibility
        const componentCompatibility = await this.checkComponentCompatibility(fromLibrary, toLibrary);

        return {
            ...compatibility,
            components: componentCompatibility,
            fromLibrary,
            toLibrary
        };
    }

    /**
     * Check component-level compatibility
     * @param {string} fromLibrary - Source library
     * @param {string} toLibrary - Target library
     * @returns {Promise<Object>} Component compatibility info
     */
    async checkComponentCompatibility(fromLibrary, toLibrary) {
        const components = this.componentLoader.getLoadedComponents();
        const targetAdapter = this.adapterLoader.getAdapter(toLibrary);

        const compatible = [];
        const incompatible = [];
        const warnings = [];

        for (const componentName of components) {
            if (targetAdapter.isComponentSupported(componentName)) {
                compatible.push(componentName);
            } else {
                incompatible.push(componentName);
            }

            // Check for potential issues
            const componentConfig = this.componentLoader.getComponent(componentName);
            if (componentConfig && componentConfig.migrationWarnings) {
                warnings.push({
                    component: componentName,
                    warnings: componentConfig.migrationWarnings[toLibrary] || []
                });
            }
        }

        return {
            compatible,
            incompatible,
            warnings,
            total: components.length,
            compatibilityRate: (compatible.length / components.length) * 100
        };
    }

    /**
     * Show migration preview
     * @param {Object} compatibility - Compatibility report
     * @param {Object} options - Migration options
     */
    async showMigrationPreview(compatibility, options) {
        console.log(chalk.blue.bold('📋 Migration Preview\n'));

        // Migration summary
        console.log(chalk.yellow('Migration Summary:'));
        console.log(`  From: ${compatibility.fromLibrary}`);
        console.log(`  To: ${compatibility.toLibrary}`);
        console.log(`  Components: ${compatibility.components.total}`);
        console.log(`  Compatibility: ${compatibility.components.compatibilityRate.toFixed(1)}%\n`);

        // Compatible components
        if (compatibility.components.compatible.length > 0) {
            console.log(chalk.green.bold(`✓ Compatible Components (${compatibility.components.compatible.length}):`));
            this.showList(compatibility.components.compatible.slice(0, 10));

            if (compatibility.components.compatible.length > 10) {
                console.log(chalk.gray(`  ... and ${compatibility.components.compatible.length - 10} more\n`));
            } else {
                console.log('');
            }
        }

        // Incompatible components
        if (compatibility.components.incompatible.length > 0) {
            console.log(chalk.red.bold(`✗ Incompatible Components (${compatibility.components.incompatible.length}):`));
            this.showList(compatibility.components.incompatible);
            console.log('');
        }

        // Warnings
        if (compatibility.components.warnings.length > 0) {
            console.log(chalk.yellow.bold('⚠ Components with Warnings:'));
            for (const warning of compatibility.components.warnings) {
                console.log(`  ${chalk.yellow('•')} ${warning.component}`);
                for (const msg of warning.warnings) {
                    console.log(`    ${chalk.gray('-')} ${msg}`);
                }
            }
            console.log('');
        }

        // Migration recommendations
        this.showMigrationRecommendations(compatibility);
    }

    /**
     * Show migration recommendations
     * @param {Object} compatibility - Compatibility report
     */
    showMigrationRecommendations(compatibility) {
        console.log(chalk.blue.bold('💡 Recommendations:\n'));

        if (compatibility.components.compatibilityRate >= 90) {
            console.log(chalk.green('  ✓ High compatibility rate - migration should be smooth'));
        } else if (compatibility.components.compatibilityRate >= 70) {
            console.log(chalk.yellow('  ⚠ Moderate compatibility - review incompatible components'));
        } else {
            console.log(chalk.red('  ✗ Low compatibility - consider alternative libraries'));
        }

        if (compatibility.components.incompatible.length > 0) {
            console.log(chalk.yellow('  ⚠ Some components will need manual adaptation'));
        }

        if (compatibility.migrationPath) {
            console.log(chalk.blue(`  ℹ Migration guide available: ${compatibility.migrationPath}`));
        }

        console.log('');
    }

    /**
     * Confirm migration with user
     * @param {Object} compatibility - Compatibility report
     * @param {Object} options - Migration options
     * @returns {Promise<boolean>} User confirmation
     */
    async confirmMigration(compatibility, options) {
        console.log(chalk.yellow.bold('⚠ Migration Confirmation\n'));

        console.log(`Migrating from ${compatibility.fromLibrary} to ${compatibility.toLibrary}`);
        console.log(`Components: ${compatibility.components.compatible.length}/${compatibility.components.total} compatible`);

        if (compatibility.components.incompatible.length > 0) {
            console.log(chalk.red(`Warning: ${compatibility.components.incompatible.length} components are incompatible`));
        }

        console.log('');

        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(chalk.yellow('Do you want to proceed with the migration? (y/N): '), (answer) => {
                rl.close();
                resolve(answer.toLowerCase().startsWith('y'));
            });
        });
    }

    /**
     * Create backup of existing components
     * @param {Object} options - Migration options
     */
    async createBackup(options) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = `${options.output}.backup.${timestamp}`;

        if (await fs.pathExists(options.output)) {
            await fs.copy(options.output, backupDir);
            console.log(chalk.green(`💾 Backup created: ${backupDir}`));
        }
    }

    /**
     * Perform the actual migration
     * @param {Object} options - Migration options
     * @returns {Promise<Object>} Migration results
     */
    async performMigration(options) {
        console.log(chalk.blue(`🔄 Migrating to ${options.to}...\n`));

        // Set target library
        await this.adapterLoader.setCurrentLibrary(options.to);

        // Get all components
        const components = this.componentLoader.getLoadedComponents();
        const targetAdapter = this.adapterLoader.getCurrentAdapter();

        const results = {
            migrated: [],
            skipped: [],
            errors: []
        };

        let current = 0;

        // Migrate each component
        for (const componentName of components) {
            current++;

            if (options.verbose) {
                console.log(chalk.cyan(`Migrating ${componentName}...`));
            } else {
                this.showProgress(current, components.length, `Migrating ${componentName}...`);
            }

            try {
                // Check if component is supported by target library
                if (!targetAdapter.isComponentSupported(componentName)) {
                    results.skipped.push({
                        component: componentName,
                        reason: 'Not supported by target library'
                    });

                    if (options.verbose) {
                        console.log(chalk.yellow(`  ⚠ Skipped ${componentName} (not supported)`));
                    }
                    continue;
                }

                // Generate component with new adapter
                const generated = await this.componentGenerator.generateComponent(componentName, {
                    useCache: false // Force regeneration with new adapter
                });

                // Save migrated component
                await this.saveMigratedComponent(componentName, generated, options);

                results.migrated.push({
                    component: componentName,
                    adapter: targetAdapter.name,
                    size: generated.code.length
                });

                if (options.verbose) {
                    console.log(chalk.green(`  ✓ Migrated ${componentName}`));
                }

            } catch (error) {
                results.errors.push({
                    component: componentName,
                    error: error.message
                });

                if (options.verbose) {
                    console.log(chalk.red(`  ✗ Failed to migrate ${componentName}: ${error.message}`));
                }
            }
        }

        // Generate updated index file
        await this.generateMigratedIndex(results.migrated, options);

        return results;
    }

    /**
     * Save migrated component to file
     * @param {string} componentName - Component name
     * @param {Object} generated - Generated component
     * @param {Object} options - Migration options
     */
    async saveMigratedComponent(componentName, generated, options) {
        await fs.ensureDir(options.output);

        const filename = `${componentName}.vue`;
        const filepath = path.join(options.output, filename);

        await fs.writeFile(filepath, generated.code, 'utf8');

        // Save TypeScript definitions if available
        if (generated.typeDefinitions) {
            const typeFilename = `${componentName}.d.ts`;
            const typeFilepath = path.join(options.output, typeFilename);
            await fs.writeFile(typeFilepath, generated.typeDefinitions.generated, 'utf8');
        }
    }

    /**
     * Generate index file for migrated components
     * @param {Array} migratedComponents - Migrated components info
     * @param {Object} options - Migration options
     */
    async generateMigratedIndex(migratedComponents, options) {
        const imports = [];
        const exports = [];

        for (const component of migratedComponents) {
            const componentName = component.component;
            imports.push(`import ${componentName} from './${componentName}.vue';`);
            exports.push(componentName);
        }

        const indexContent = [
            '// Auto-generated index file after migration',
            `// Migrated to ${options.to} by Zero-Overhead Design System CLI`,
            `// Generated on ${new Date().toISOString()}`,
            '',
            ...imports,
            '',
            `export {`,
            exports.map(name => `  ${name}`).join(',\n'),
            '};',
            '',
            'export default {',
            exports.map(name => `  ${name}`).join(',\n'),
            '};'
        ].join('\n');

        const indexPath = path.join(options.output, 'index.js');
        await fs.writeFile(indexPath, indexContent, 'utf8');
    }

    /**
     * Show migration results
     * @param {Object} results - Migration results
     * @param {Object} options - Migration options
     */
    showMigrationResults(results, options) {
        console.log(chalk.green.bold('\n🎉 Migration completed!\n'));

        // Summary statistics
        const total = results.migrated.length + results.skipped.length + results.errors.length;
        const successRate = (results.migrated.length / total) * 100;

        const summaryData = [
            ['Total Components', total],
            ['Successfully Migrated', results.migrated.length],
            ['Skipped', results.skipped.length],
            ['Errors', results.errors.length],
            ['Success Rate', `${successRate.toFixed(1)}%`],
            ['Target Library', options.to],
            ['Output Directory', options.output]
        ];

        this.showTable(summaryData, ['Metric', 'Value']);

        // Show skipped components
        if (results.skipped.length > 0) {
            console.log(chalk.yellow.bold('\n⚠ Skipped Components:'));
            for (const skipped of results.skipped) {
                console.log(`  ${chalk.yellow('•')} ${skipped.component} - ${skipped.reason}`);
            }
        }

        // Show errors
        if (results.errors.length > 0) {
            console.log(chalk.red.bold('\n✗ Migration Errors:'));
            for (const error of results.errors) {
                console.log(`  ${chalk.red('•')} ${error.component} - ${error.error}`);
            }
        }

        // Show success components in verbose mode
        if (options.verbose && results.migrated.length > 0) {
            console.log(chalk.green.bold('\n✓ Successfully Migrated:'));
            for (const migrated of results.migrated) {
                const size = this.formatFileSize(migrated.size);
                console.log(`  ${chalk.green('•')} ${migrated.component} (${size})`);
            }
        }

        // Post-migration instructions
        this.showPostMigrationInstructions(results, options);
    }

    /**
     * Show post-migration instructions
     * @param {Object} results - Migration results
     * @param {Object} options - Migration options
     */
    showPostMigrationInstructions(results, options) {
        console.log(chalk.blue.bold('\n📝 Next Steps:\n'));

        if (results.migrated.length > 0) {
            console.log(chalk.green('1. Update your Vue application to use the new library:'));
            console.log(`   ${chalk.gray(`import { createApp } from 'vue';`)}`);
            console.log(`   ${chalk.gray(`import ${this.getLibraryImportName(options.to)} from '${this.getLibraryPackageName(options.to)}';`)}`);
            console.log(`   ${chalk.gray(`app.use(${this.getLibraryImportName(options.to)});`)}\n`);

            console.log(chalk.green('2. Install the new UI library:'));
            console.log(`   ${chalk.gray(`npm install ${this.getLibraryPackageName(options.to)}`)}\n`);

            console.log(chalk.green('3. Update your imports to use migrated components:'));
            console.log(`   ${chalk.gray(`import { Button, Card } from '${options.output}';`)}\n`);
        }

        if (results.skipped.length > 0) {
            console.log(chalk.yellow('4. Review skipped components and find alternatives'));
            console.log(chalk.yellow('5. Consider creating custom components for missing functionality\n'));
        }

        if (results.errors.length > 0) {
            console.log(chalk.red('6. Fix migration errors before using the components'));
            console.log(chalk.red('7. Check component configurations for compatibility issues\n'));
        }

        console.log(chalk.blue('8. Test your application thoroughly after migration'));
        console.log(chalk.blue('9. Update documentation and component usage\n'));

        // Show library-specific instructions
        this.showLibrarySpecificInstructions(options.to);
    }

    /**
     * Show library-specific migration instructions
     * @param {string} library - Target library
     */
    showLibrarySpecificInstructions(library) {
        const instructions = {
            primevue: [
                'Configure PrimeVue theme in your main.js',
                'Import PrimeVue CSS: import "primevue/resources/themes/saga-blue/theme.css"',
                'Import PrimeIcons if needed: import "primeicons/primeicons.css"'
            ],
            vuetify: [
                'Configure Vuetify instance with createVuetify()',
                'Import Vuetify styles in your main.js',
                'Configure Material Design Icons if needed'
            ],
            quasar: [
                'Configure Quasar with app.use(Quasar)',
                'Import Quasar CSS framework',
                'Configure Quasar icon sets if needed'
            ],
            antdv: [
                'Import Ant Design Vue CSS',
                'Configure locale if needed',
                'Set up Ant Design icons'
            ]
        };

        const libraryInstructions = instructions[library];
        if (libraryInstructions) {
            console.log(chalk.blue.bold(`${library.toUpperCase()} Specific Setup:\n`));
            for (const instruction of libraryInstructions) {
                console.log(`  ${chalk.cyan('•')} ${instruction}`);
            }
            console.log('');
        }
    }

    /**
     * Get library import name
     * @param {string} library - Library name
     * @returns {string} Import name
     */
    getLibraryImportName(library) {
        const importNames = {
            primevue: 'PrimeVue',
            vuetify: 'vuetify',
            quasar: 'Quasar',
            antdv: 'Antd'
        };

        return importNames[library] || library;
    }

    /**
     * Get library package name
     * @param {string} library - Library name
     * @returns {string} Package name
     */
    getLibraryPackageName(library) {
        const packageNames = {
            primevue: 'primevue',
            vuetify: 'vuetify',
            quasar: 'quasar',
            antdv: 'ant-design-vue'
        };

        return packageNames[library] || library;
    }

    /**
     * Show command help
     */
    showHelp() {
        console.log(chalk.blue.bold('Migrate Command'));
        console.log(chalk.gray('Switch between UI libraries with zero code changes\n'));

        console.log(chalk.yellow('Usage:'));
        console.log('  zods migrate [options]\n');

        console.log(chalk.yellow('Options:'));
        console.log('  --from, -f         Source library (optional, auto-detected)');
        console.log('  --to, -t           Target library (required)');
        console.log('  --output, -o       Output directory (default: src/generated)');
        console.log('  --preview, -p      Show migration preview without executing');
        console.log('  --no-backup        Skip creating backup of existing files');
        console.log('  --force            Skip confirmation prompt');
        console.log('  --verbose, -v      Show detailed output');
        console.log('  --help, -h         Show this help\n');

        console.log(chalk.yellow('Supported Libraries:'));
        console.log('  • primevue         PrimeVue components');
        console.log('  • vuetify          Vuetify Material Design');
        console.log('  • quasar           Quasar Framework');
        console.log('  • antdv            Ant Design Vue\n');

        console.log(chalk.yellow('Examples:'));
        console.log('  zods migrate --to primevue');
        console.log('  zods migrate --from vuetify --to quasar --preview');
        console.log('  zods migrate --to antdv --force --verbose');
        console.log('  zods migrate --to primevue --no-backup');
    }

    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {Function} Stop function
     */
    showLoading(message) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let index = 0;

        const interval = setInterval(() => {
            process.stdout.write(`\r${chalk.cyan(frames[index])} ${message}`);
            index = (index + 1) % frames.length;
        }, 100);

        return () => {
            clearInterval(interval);
            process.stdout.write(`\r${chalk.green('✓')} ${message}\n`);
        };
    }

    /**
     * Show progress bar
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} message - Progress message
     */
    showProgress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const barLength = 30;
        const filledLength = Math.round((barLength * current) / total);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

        process.stdout.write(`\r${chalk.cyan(bar)} ${percentage}% ${message}`);

        if (current === total) {
            process.stdout.write('\n');
        }
    }

    /**
     * Show table of data
     * @param {Array} data - Table data
     * @param {Array} headers - Table headers
     */
    showTable(data, headers) {
        if (!data || data.length === 0) {
            console.log(chalk.gray('No data to display'));
            return;
        }

        // Calculate column widths
        const widths = headers.map((header, i) => {
            const headerWidth = header.length;
            const dataWidth = Math.max(...data.map(row => String(row[i] || '').length));
            return Math.max(headerWidth, dataWidth);
        });

        // Show headers
        const headerRow = headers.map((header, i) =>
            chalk.bold(header.padEnd(widths[i]))
        ).join(' │ ');
        console.log('┌─' + widths.map(w => '─'.repeat(w)).join('─┬─') + '─┐');
        console.log('│ ' + headerRow + ' │');
        console.log('├─' + widths.map(w => '─'.repeat(w)).join('─┼─') + '─┤');

        // Show data rows
        for (const row of data) {
            const dataRow = row.map((cell, i) =>
                String(cell || '').padEnd(widths[i])
            ).join(' │ ');
            console.log('│ ' + dataRow + ' │');
        }

        console.log('└─' + widths.map(w => '─'.repeat(w)).join('─┴─') + '─┘');
    }

    /**
     * Show list with bullets
     * @param {Array} items - List items
     */
    showList(items) {
        for (const item of items) {
            console.log(`  ${chalk.cyan('•')} ${item}`);
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = (bytes / Math.pow(1024, i)).toFixed(1);

        return `${size} ${sizes[i]}`;
    }
}
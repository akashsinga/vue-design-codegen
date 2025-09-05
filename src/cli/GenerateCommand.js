import { ComponentGenerator } from '../core/components/ComponentGenerator.js';
import { AdapterLoader } from '../core/adapters/AdapterLoader.js';
import { ComponentLoader } from '../core/components/ComponentLoader.js';
import { ThemeLoader } from '../core/themes/ThemeLoader.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

/**
 * Generate command for creating optimized components from configurations
 */
export class GenerateCommand {
    constructor() {
        this.adapterLoader = new AdapterLoader();
        this.componentLoader = new ComponentLoader();
        this.themeLoader = new ThemeLoader();
        this.componentGenerator = null;

        this.defaultOptions = {
            library: 'primevue',
            components: 'all',
            theme: 'light',
            output: 'src/generated',
            format: 'sfc',
            typescript: false,
            watch: false,
            clean: false,
            verbose: false
        };
    }

    /**
     * Execute the generate command
     * @param {string[]} args - Command arguments
     */
    async execute(args) {
        const options = this.parseArguments(args);

        if (options.help) {
            this.showHelp();
            return;
        }

        // Show banner for verbose mode
        if (options.verbose) {
            this.showBanner();
        }

        console.log(chalk.blue('🚀 Starting component generation...\n'));

        try {
            // Initialize generators
            await this.initialize(options);

            // Clean output directory if requested
            if (options.clean) {
                await this.cleanOutput(options);
            }

            // Generate components
            const results = await this.generateComponents(options);

            // Save generated components
            await this.saveComponents(results, options);

            // Show results
            this.showResults(results, options);

            // Setup watch mode if requested
            if (options.watch) {
                await this.setupWatchMode(options);
            }

        } catch (error) {
            throw new Error(`Generation failed: ${error.message}`);
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

                case '--library':
                case '-l':
                    options.library = nextArg;
                    i++;
                    break;

                case '--components':
                case '-c':
                    options.components = nextArg;
                    i++;
                    break;

                case '--theme':
                case '-t':
                    options.theme = nextArg;
                    i++;
                    break;

                case '--output':
                case '-o':
                    options.output = nextArg;
                    i++;
                    break;

                case '--format':
                case '-f':
                    options.format = nextArg;
                    i++;
                    break;

                case '--typescript':
                case '--ts':
                    options.typescript = true;
                    break;

                case '--watch':
                case '-w':
                    options.watch = true;
                    break;

                case '--clean':
                    options.clean = true;
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
     * Initialize all required loaders and generators
     * @param {Object} options - Generation options
     */
    async initialize(options) {
        const stopLoading = this.showLoading('Initializing generators...');

        try {
            // Load adapters
            await this.adapterLoader.loadAllAdapters();
            await this.adapterLoader.setCurrentLibrary(options.library);

            // Load components
            await this.componentLoader.loadAllComponents();

            // Load themes
            if (options.theme !== 'none') {
                await this.themeLoader.loadAllThemes();
            }

            // Initialize component generator
            this.componentGenerator = new ComponentGenerator(
                this.adapterLoader,
                this.componentLoader,
                this.themeLoader
            );

            stopLoading();

            if (options.verbose) {
                const adapter = this.adapterLoader.getCurrentAdapter();
                console.log(chalk.green(`✓ Initialized with ${adapter.name} adapter`));
                console.log(chalk.green(`✓ Loaded ${this.componentLoader.getLoadedComponents().length} component configurations`));

                if (options.theme !== 'none') {
                    console.log(chalk.green(`✓ Loaded ${this.themeLoader.getLoadedThemes().length} theme configurations`));
                }
            }

        } catch (error) {
            stopLoading();
            throw error;
        }
    }

    /**
     * Clean output directory
     * @param {Object} options - Generation options
     */
    async cleanOutput(options) {
        if (await fs.pathExists(options.output)) {
            await fs.remove(options.output);
            console.log(chalk.yellow(`🧹 Cleaned output directory: ${options.output}`));
        }
    }

    /**
     * Generate components based on options
     * @param {Object} options - Generation options
     * @returns {Map} Generated components
     */
    async generateComponents(options) {
        // Determine which components to generate
        const componentNames = await this.resolveComponentNames(options.components);

        if (componentNames.length === 0) {
            throw new Error('No components found to generate');
        }

        console.log(chalk.blue(`📦 Generating ${componentNames.length} components...\n`));

        const results = new Map();
        let current = 0;

        // Generate components with progress tracking
        for (const componentName of componentNames) {
            current++;

            if (options.verbose) {
                console.log(chalk.cyan(`Generating ${componentName}...`));
            } else {
                this.showProgress(current, componentNames.length, `Generating ${componentName}...`);
            }

            try {
                const generated = await this.componentGenerator.generateComponent(componentName, {
                    theme: options.theme !== 'none' ? options.theme : null,
                    format: options.format,
                    typescript: options.typescript,
                    useCache: true
                });

                results.set(componentName, generated);

                if (options.verbose) {
                    console.log(chalk.green(`  ✓ Generated ${componentName}`));
                }

            } catch (error) {
                console.log(chalk.red(`  ✗ Failed to generate ${componentName}: ${error.message}`));
                if (options.verbose) {
                    console.error(error.stack);
                }
            }
        }

        return results;
    }

    /**
     * Resolve component names from options
     * @param {string} componentsOption - Components option value
     * @returns {Promise<string[]>} Array of component names
     */
    async resolveComponentNames(componentsOption) {
        if (componentsOption === 'all') {
            return this.componentLoader.getLoadedComponents();
        }

        if (componentsOption.includes(',')) {
            return componentsOption.split(',').map(name => name.trim());
        }

        if (componentsOption.includes('*')) {
            // Glob pattern matching
            const allComponents = this.componentLoader.getLoadedComponents();
            const pattern = new RegExp(componentsOption.replace(/\*/g, '.*'));
            return allComponents.filter(name => pattern.test(name));
        }

        return [componentsOption];
    }

    /**
     * Save generated components to files
     * @param {Map} results - Generated components
     * @param {Object} options - Generation options
     */
    async saveComponents(results, options) {
        await fs.ensureDir(options.output);

        console.log(chalk.blue(`\n💾 Saving components to ${options.output}...\n`));

        const savePromises = [];
        let current = 0;

        for (const [componentName, generated] of results) {
            current++;

            const extension = options.typescript ? '.vue' : '.vue';
            const filename = `${componentName}${extension}`;
            const filepath = path.join(options.output, filename);

            savePromises.push(
                fs.writeFile(filepath, generated.code, 'utf8').then(() => {
                    if (options.verbose) {
                        console.log(chalk.green(`  ✓ Saved ${filename}`));
                    } else {
                        this.showProgress(current, results.size, `Saving ${filename}...`);
                    }
                })
            );

            // Save TypeScript definitions if generated
            if (generated.typeDefinitions && options.typescript) {
                const typeFilename = `${componentName}.d.ts`;
                const typeFilepath = path.join(options.output, typeFilename);

                savePromises.push(
                    fs.writeFile(typeFilepath, generated.typeDefinitions.generated, 'utf8')
                );
            }
        }

        await Promise.all(savePromises);

        // Generate index file
        await this.generateIndexFile(results, options);
    }

    /**
     * Generate index file for easy imports
     * @param {Map} results - Generated components
     * @param {Object} options - Generation options
     */
    async generateIndexFile(results, options) {
        const imports = [];
        const exports = [];

        for (const componentName of results.keys()) {
            const extension = options.typescript ? '.vue' : '.vue';
            imports.push(`import ${componentName} from './${componentName}${extension}';`);
            exports.push(componentName);
        }

        const indexContent = [
            '// Auto-generated index file',
            '// Generated by Zero-Overhead Design System CLI',
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

        const indexFilename = options.typescript ? 'index.ts' : 'index.js';
        const indexPath = path.join(options.output, indexFilename);

        await fs.writeFile(indexPath, indexContent, 'utf8');

        if (options.verbose) {
            console.log(chalk.green(`  ✓ Generated ${indexFilename}`));
        }
    }

    /**
     * Show generation results
     * @param {Map} results - Generated components
     * @param {Object} options - Generation options
     */
    showResults(results, options) {
        console.log(chalk.green.bold('\n🎉 Generation completed!\n'));

        // Calculate statistics
        const stats = this.calculateStats(results, options);

        // Show summary table
        const tableData = [
            ['Generated Components', stats.components],
            ['Output Directory', options.output],
            ['Target Library', options.library],
            ['Format', options.format],
            ['Theme', options.theme],
            ['TypeScript', options.typescript ? 'Yes' : 'No'],
            ['Total Files', stats.files],
            ['Total Size', this.formatFileSize(stats.totalSize)]
        ];

        this.showTable(tableData, ['Property', 'Value']);

        // Show component list
        if (options.verbose && results.size > 0) {
            console.log(chalk.blue('\nGenerated Components:'));
            this.showList(Array.from(results.keys()));
        }

        // Show performance info
        if (options.verbose) {
            const generatorStats = this.componentGenerator.getStats();
            console.log(chalk.blue('\nPerformance Statistics:'));
            console.log(`  Generated: ${generatorStats.generated}`);
            console.log(`  Cached: ${generatorStats.cached}`);
            console.log(`  Errors: ${generatorStats.errors}`);
            console.log(`  Average time: ${Math.round(generatorStats.totalTime / generatorStats.generated)}ms per component`);
        }
    }

    /**
     * Calculate generation statistics
     * @param {Map} results - Generated components
     * @param {Object} options - Generation options
     * @returns {Object} Statistics
     */
    calculateStats(results, options) {
        let totalSize = 0;
        let files = results.size;

        // Estimate file sizes (simplified)
        for (const [componentName, generated] of results) {
            totalSize += generated.code.length;
            if (generated.typeDefinitions) {
                totalSize += generated.typeDefinitions.generated.length;
                files++;
            }
        }

        // Add index file
        files++;

        return {
            components: results.size,
            files,
            totalSize
        };
    }

    /**
     * Setup watch mode for development
     * @param {Object} options - Generation options
     */
    async setupWatchMode(options) {
        console.log(chalk.blue('\n👀 Setting up watch mode...\n'));

        const chokidar = await import('chokidar');

        // Watch component configurations
        const componentWatcher = chokidar.watch('src/config/components/*.config.js', {
            ignoreInitial: true
        });

        componentWatcher.on('change', async (filePath) => {
            const componentName = path.basename(filePath, '.config.js');
            console.log(chalk.yellow(`🔄 Component config changed: ${componentName}`));

            try {
                await this.regenerateComponent(componentName, options);
                console.log(chalk.green(`✓ Regenerated ${componentName}`));
            } catch (error) {
                console.log(chalk.red(`✗ Failed to regenerate ${componentName}: ${error.message}`));
            }
        });

        // Watch adapter configurations
        const adapterWatcher = chokidar.watch('src/core/adapters/configs/*.config.js', {
            ignoreInitial: true
        });

        adapterWatcher.on('change', async () => {
            console.log(chalk.yellow('🔄 Adapter config changed, regenerating all components...'));

            try {
                await this.initialize(options);
                const results = await this.generateComponents(options);
                await this.saveComponents(results, options);
                console.log(chalk.green('✓ All components regenerated'));
            } catch (error) {
                console.log(chalk.red(`✗ Failed to regenerate components: ${error.message}`));
            }
        });

        // Watch theme configurations
        if (options.theme !== 'none') {
            const themeWatcher = chokidar.watch('src/config/themes/*.config.js', {
                ignoreInitial: true
            });

            themeWatcher.on('change', async () => {
                console.log(chalk.yellow('🔄 Theme config changed, regenerating all components...'));

                try {
                    await this.themeLoader.loadAllThemes();
                    const results = await this.generateComponents(options);
                    await this.saveComponents(results, options);
                    console.log(chalk.green('✓ All components regenerated'));
                } catch (error) {
                    console.log(chalk.red(`✗ Failed to regenerate components: ${error.message}`));
                }
            });
        }

        console.log(chalk.green('✓ Watch mode active. Press Ctrl+C to stop.'));

        // Keep process alive
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n👋 Stopping watch mode...'));
            process.exit(0);
        });
    }

    /**
     * Regenerate a single component
     * @param {string} componentName - Component to regenerate
     * @param {Object} options - Generation options
     */
    async regenerateComponent(componentName, options) {
        // Reload component configuration
        await this.componentLoader.loadComponent(componentName);

        // Generate component
        const generated = await this.componentGenerator.generateComponent(componentName, {
            theme: options.theme !== 'none' ? options.theme : null,
            format: options.format,
            typescript: options.typescript,
            useCache: false // Force regeneration
        });

        // Save component
        const extension = options.typescript ? '.vue' : '.vue';
        const filename = `${componentName}${extension}`;
        const filepath = path.join(options.output, filename);

        await fs.writeFile(filepath, generated.code, 'utf8');

        // Save TypeScript definitions if generated
        if (generated.typeDefinitions && options.typescript) {
            const typeFilename = `${componentName}.d.ts`;
            const typeFilepath = path.join(options.output, typeFilename);
            await fs.writeFile(typeFilepath, generated.typeDefinitions.generated, 'utf8');
        }
    }

    /**
     * Show command help
     */
    showHelp() {
        console.log(chalk.blue.bold('Generate Command'));
        console.log(chalk.gray('Generate optimized components from configurations\n'));

        console.log(chalk.yellow('Usage:'));
        console.log('  zods generate [options]\n');

        console.log(chalk.yellow('Options:'));
        console.log('  --library, -l      Target UI library (default: primevue)');
        console.log('  --components, -c   Components to generate (default: all)');
        console.log('  --theme, -t        Theme to apply (default: light)');
        console.log('  --output, -o       Output directory (default: src/generated)');
        console.log('  --format, -f       Output format: sfc, jsx (default: sfc)');
        console.log('  --typescript, --ts Generate TypeScript definitions');
        console.log('  --watch, -w        Watch for changes and regenerate');
        console.log('  --clean            Clean output directory before generation');
        console.log('  --verbose, -v      Show detailed output');
        console.log('  --help, -h         Show this help\n');

        console.log(chalk.yellow('Examples:'));
        console.log('  zods generate');
        console.log('  zods generate --library vuetify --components Button,Card');
        console.log('  zods generate --theme dark --typescript --watch');
        console.log('  zods generate --components "Button*" --verbose');
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

    /**
     * Show banner
     */
    showBanner() {
        console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 GENERATE COMMAND                       ║
║              Zero-Overhead Component Generation              ║
╚══════════════════════════════════════════════════════════════╝
        `));
    }
}
import { GenerateCommand } from './GenerateCommand.js';
import { MigrateCommand } from './MigrateCommand.js';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

/**
 * Main CLI class for Zero-Overhead Design System
 * Handles command routing, help, and global options
 */
export class ZeroOverheadCLI {
    constructor() {
        this.commands = new Map([
            ['generate', new GenerateCommand()],
            ['migrate', new MigrateCommand()],
            ['g', new GenerateCommand()], // Alias for generate
            ['m', new MigrateCommand()]   // Alias for migrate
        ]);

        this.version = '1.0.0';
        this.startTime = null;
    }

    /**
     * Run the CLI with provided arguments
     * @param {string[]} args - Command line arguments
     */
    async run(args) {
        this.startTime = performance.now();

        // Handle no arguments
        if (args.length === 0) {
            this.showHelp();
            return;
        }

        const [commandName, ...commandArgs] = args;

        // Handle global flags
        if (this.handleGlobalFlags(commandName)) {
            return;
        }

        // Execute command
        const command = this.commands.get(commandName);
        if (!command) {
            this.showError(`Unknown command: ${commandName}`);
            this.showHelp();
            process.exit(1);
        }

        try {
            await command.execute(commandArgs);
            this.showSuccess(`Command completed in ${this.getExecutionTime()}ms`);
        } catch (error) {
            this.showError(`Command failed: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Handle global CLI flags
     * @param {string} flag - Flag to handle
     * @returns {boolean} Whether flag was handled
     */
    handleGlobalFlags(flag) {
        switch (flag) {
            case '--version':
            case '-v':
                this.showVersion();
                return true;

            case '--help':
            case '-h':
                this.showHelp();
                return true;

            default:
                return false;
        }
    }

    /**
     * Show CLI version
     */
    showVersion() {
        console.log(chalk.blue(`Zero-Overhead Design System CLI v${this.version}`));
    }

    /**
     * Show CLI help
     */
    showHelp() {
        console.log(chalk.blue.bold('Zero-Overhead Design System CLI'));
        console.log(chalk.gray('Configuration-driven Vue.js design system with zero runtime overhead\n'));

        console.log(chalk.yellow('Usage:'));
        console.log('  zods <command> [options]\n');

        console.log(chalk.yellow('Commands:'));
        console.log('  generate, g    Generate optimized components from configurations');
        console.log('  migrate, m     Migrate between UI libraries with zero code changes\n');

        console.log(chalk.yellow('Global Options:'));
        console.log('  --version, -v  Show version number');
        console.log('  --help, -h     Show help information\n');

        console.log(chalk.yellow('Examples:'));
        console.log('  zods generate --library primevue --components all');
        console.log('  zods generate --components Button,Card --theme dark');
        console.log('  zods migrate --from vuetify --to primevue');
        console.log('  zods migrate --to quasar --preview\n');

        console.log(chalk.gray('For more information about a specific command:'));
        console.log(chalk.gray('  zods <command> --help'));
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        console.log(chalk.green('✓ ' + message));
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error(chalk.red('✗ ' + message));
    }

    /**
     * Show warning message
     * @param {string} message - Warning message
     */
    showWarning(message) {
        console.warn(chalk.yellow('⚠ ' + message));
    }

    /**
     * Show info message
     * @param {string} message - Info message
     */
    showInfo(message) {
        console.log(chalk.blue('ℹ ' + message));
    }

    /**
     * Get execution time in milliseconds
     * @returns {number} Execution time
     */
    getExecutionTime() {
        if (!this.startTime) return 0;
        return Math.round(performance.now() - this.startTime);
    }

    /**
     * Show loading spinner with message
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
     * Prompt user for confirmation
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>} User confirmation
     */
    async confirm(message) {
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(chalk.yellow(`${message} (y/N): `), (answer) => {
                rl.close();
                resolve(answer.toLowerCase().startsWith('y'));
            });
        });
    }

    /**
     * Prompt user for input
     * @param {string} message - Input prompt message
     * @param {string} defaultValue - Default value
     * @returns {Promise<string>} User input
     */
    async prompt(message, defaultValue = '') {
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            const promptMessage = defaultValue
                ? `${message} (${chalk.gray(defaultValue)}): `
                : `${message}: `;

            rl.question(chalk.cyan(promptMessage), (answer) => {
                rl.close();
                resolve(answer || defaultValue);
            });
        });
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
        console.log('┌' + '─'.repeat(headerRow.length - 8) + '┐');
        console.log('│ ' + headerRow + ' │');
        console.log('├' + '─'.repeat(headerRow.length - 8) + '┤');

        // Show data rows
        for (const row of data) {
            const dataRow = row.map((cell, i) =>
                String(cell || '').padEnd(widths[i])
            ).join(' │ ');
            console.log('│ ' + dataRow + ' │');
        }

        console.log('└' + '─'.repeat(headerRow.length - 8) + '┘');
    }

    /**
     * Show list with bullets
     * @param {Array} items - List items
     * @param {string} bullet - Bullet character
     */
    showList(items, bullet = '•') {
        for (const item of items) {
            console.log(`  ${chalk.cyan(bullet)} ${item}`);
        }
    }

    /**
     * Show banner with ASCII art
     */
    showBanner() {
        console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ███████╗███████╗██████╗  ██████╗     ██████╗ ██╗   ██╗   ║
║    ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗   ██╔═══██╗██║   ██║   ║
║      ███╔╝ █████╗  ██████╔╝██║   ██║   ██║   ██║██║   ██║   ║
║     ███╔╝  ██╔══╝  ██╔══██╗██║   ██║   ██║   ██║╚██╗ ██╔╝   ║
║    ███████╗███████╗██║  ██║╚██████╔╝   ╚██████╔╝ ╚████╔╝    ║
║    ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝     ╚═════╝   ╚═══╝     ║
║                                                              ║
║            Zero-Overhead Design System CLI                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `));
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
     * Format duration for display
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    }

    /**
     * Create CLI summary report
     * @param {Object} stats - Statistics object
     */
    showSummary(stats) {
        console.log('\n' + chalk.blue.bold('Summary:'));
        console.log('─'.repeat(50));

        for (const [key, value] of Object.entries(stats)) {
            const formattedKey = key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
            console.log(`${formattedKey.padEnd(25)} ${chalk.green(value)}`);
        }

        console.log('─'.repeat(50));
        console.log(`Total execution time: ${chalk.cyan(this.formatDuration(this.getExecutionTime()))}\n`);
    }
}
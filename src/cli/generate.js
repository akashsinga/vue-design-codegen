import { program } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import ComponentGenerator from '../core/components/ComponentGenerator.js';
import AdapterLoader from '../core/adapters/AdapterLoader.js';
import ComponentLoader from '../core/components/ComponentLoader.js';

program
    .name('vue-design-codegen')
    .description('Zero-Overhead Design System Component Generator')
    .version('1.0.0');

program
    .command('generate <component>')
    .alias('gen')
    .description('Generate a component for target library')
    .option('-l, --library <library>', 'Target library (primevue, vuetify, quasar, antdv)', 'vuetify')
    .option('-f, --format <format>', 'Output format (sfc, jsx, ts)', 'sfc')
    .option('-o, --output <path>', 'Output directory', './generated')
    .option('--no-optimize', 'Disable optimizations')
    .option('--no-types', 'Exclude TypeScript definitions')
    .option('--watch', 'Watch for configuration changes')
    .action(async (componentName, options) => {
        try {
            console.log(chalk.blue('🚀 Generating component...'));
            console.log(chalk.gray(`Component: ${componentName}`));
            console.log(chalk.gray(`Library: ${options.library}`));
            console.log(chalk.gray(`Format: ${options.format}`));

            const startTime = performance.now();

            // Generate component
            const result = await ComponentGenerator.generateComponent(componentName, options.library, {
                format: options.format,
                optimize: options.optimize,
                includeTypes: options.types
            });

            // Write to file system
            const outputPath = await writeComponent(result, options.output, componentName);

            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);

            console.log(chalk.green('✅ Component generated successfully!'));
            console.log(chalk.gray(`Output: ${outputPath}`));
            console.log(chalk.gray(`Time: ${duration}ms`));

        } catch (error) {
            console.error(chalk.red('❌ Generation failed:'), error.message);
            process.exit(1);
        }
    });

async function writeComponent(result, outputDir, componentName) {
    const outputPath = path.resolve(outputDir);
    await fs.mkdir(outputPath, { recursive: true });

    const filePath = path.join(outputPath, result.component.filename);
    await fs.writeFile(filePath, result.component.content);

    return filePath;
}


program.parse()
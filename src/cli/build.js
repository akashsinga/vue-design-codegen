/**
 * Build script for design system.
 * Generates complete design system with all components.
 * 
 * File: src/cli/build.js
 */
import { validate } from '@babel/types'
import chalk from 'chalk'
import { promises as fs } from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function build() {
  console.log(chalk.blue.bold('Openprise Design System Builder'))
  console.log(chalk.gray('Generating optimized components'))

  const startTime = performance.now()

  try {
    console.log(chalk.blue('Loading Configuration'))
    const { default: ConfigurationLoader } = await import('../core/ConfigurationLoader.js')
    const config = await ConfigurationLoader.loadConfig('design-system.config.js')

    console.log(chalk.green('Configuration Loaded'))
    console.log(chalk.gray(`Target Library: ${config.targetLibrary}`))
    console.log(chalk.gray(`Components: ${config.components?.length || 0}\n`))

    console.log(chalk.blue('Initializing System Components'))
    const { default: ComponentGenerator } = await import('../core/components/ComponentGenerator.js')
    const { default: AdapterLoader } = await import('../core/adapters/AdapterLoader.js')

    await AdapterLoader.loadAdapter(config.targetLibrary, { validate: true })
    console.log(chalk.green(`Adapter Validated: ${config.targetLibrary}`))

    const outputDir = path.resolve('./dist')
    await fs.mkdir(outputDir, { recursive: true })

    const componentsDir = path.join(outputDir, 'components')
    await fs.mkdir(componentsDir, { recursive: true })

    console.log(chalk.green(`Output directory created: ${outputDir}\n`))
    console.log(chalk.blue('Generating Components'))

    const generationResults = { success: [], failed: [], totalSize: 0, totalTime: 0 }

    for (const componentName of config.components || []) {
      const componentStartTime = performance.now()

      try {
        console.log(chalk.gray(`Generating ${componentName}`))

        const result = await ComponentGenerator.generateComponent(componentName, config.targetLibrary, { format: 'sfc', optimize: true, includeTypes: true })

        const componentPath = path.join(componentsDir, result.component.filename)
        await fs.writeFile(componentPath, result.component.content)

        const componentEndTime = performance.now()
        const componentTime = componentEndTime - componentStartTime
        const componentSize = result.component.content.length

        generationResults.success.push({ name: componentName, time: componentTime, size: componentSize, path: componentPath })

        generationResults.totalTime += componentTime
        generationResults.totalSize += componentSize

        console.log(chalk.green(`${componentName} (${componentTime.toFixed(1)}ms ${componentSize} bytes)\n`))
      } catch (error) {
        generationResults.failed.push({ name: componentName, error: error.message })
        console.log(chalk.red(`${componentName}: ${error.message}\n`))
      }
    }

    console.log(chalk.blue('Creating library bundle'))

    const indexContent = generateIndexFile(generationResults.success, config)
    const indexPath = path.join(outputDir, 'index.js')
    await fs.writeFile(indexPath, indexContent)

    const typesContent = generateTypeDefinitions(generationResults.success, config)
    const typesPath = path.join(outputDir, 'index.d.ts')
    await fs.writeFile(typesPath, typesContent)

    const pluginContent = generateVuePlugin(generationResults.success, config)
    const pluginPath = path.join(outputDir, 'plugin.js')
    await fs.writeFile(pluginPath, pluginContent)

    const stylesContent = generateStyles(config)
    const stylesPath = path.join(outputDir, 'styles.css')
    await fs.writeFile(stylesPath, stylesContent)

    console.log('Library Bundle created\n')

    // Build Summary
    const endTime = performance.now()
    const totalTime = endTime - startTime

    console.log(chalk.green.bold('Build completed successfully\n'))
    console.log(chalk.bold('Build Summary'))
    console.table({
      'Total Time': `${totalTime.toFixed(1)}ms`,
      'Components Generated': generationResults.success.length,
      'Components Failed': generationResults.failed.length,
      'Total Bundle Size': `${((generationResults.totalSize / 1024).toFixed(2))}KB`,
      'Average Generation Time': `${(generationResults.totalTime / generationResults.success.length).toFixed(1)}ms`,
      'Target Library': config.targetLibrary,
      'Output Directory': outputDir
    })

    if (generationResults.failed.length > 0) {
      console.log(chalk.yellow.bold('⚠️  Failed Components:'));
      generationResults.failed.forEach(failed => {
        console.log(chalk.red(`   • ${failed.name}: ${failed.error}`));
      });
    }

    console.log(chalk.blue.bold('📁 Generated Files:'));
    console.log(chalk.gray(`   ${indexPath}`));
    console.log(chalk.gray(`   ${typesPath}`));
    console.log(chalk.gray(`   ${pluginPath}`));
    console.log(chalk.gray(`   ${stylesPath}`));
    console.log(chalk.gray(`   ${componentsDir}/ (${generationResults.success.length} components)`));

    console.log(chalk.green('✨ Your zero-overhead design system is ready!'));
    console.log(chalk.gray('   Installation: npm install ' + path.relative(process.cwd(), outputDir)));
    console.log(chalk.gray('   Usage: import DesignSystem from "' + path.relative(process.cwd(), outputDir) + '"'));
  } catch (error) {
    console.error(chalk.red.bold('❌ Build failed:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

/**
 * Generate index file for the library
 */
function generateIndexFile(successfulComponents, config) {
  const imports = successfulComponents.map(comp =>
    `import ${comp.name} from './components/${comp.name}.vue';`
  ).join('\n');

  const componentsList = successfulComponents.map(comp => comp.name).join(', ');

  return `// Generated by Zero-Overhead Design System
// Target Library: ${config.targetLibrary}
// Generated: ${new Date().toISOString()}

${imports}

// Individual component exports
export { ${componentsList} };

// Component registry
export const components = {
  ${componentsList}
};

// Design system metadata
export const metadata = {
  name: '${config.name || 'Design System'}',
  version: '${config.version || '1.0.0'}',
  targetLibrary: '${config.targetLibrary}',
  generatedAt: '${new Date().toISOString()}',
  components: [${successfulComponents.map(c => `'${c.name}'`).join(', ')}]
};

// Default export - all components
export default {
  ...components,
  install(app, options = {}) {
    // Register all components globally
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component);
    });
    
    // Provide metadata
    app.provide('designSystemMetadata', metadata);
    
    return app;
  }
};
`;
}

/**
 * Generate TypeScript definitions
 */
function generateTypeDefinitions(successfulComponents, config) {
  const componentInterfaces = successfulComponents.map(comp =>
    `export declare const ${comp.name}: import('vue').DefineComponent<{}, {}, any>;`
  ).join('\n');

  const componentsList = successfulComponents.map(comp => comp.name).join(' | ');

  return `// Generated TypeScript definitions
// Target Library: ${config.targetLibrary}
// Generated: ${new Date().toISOString()}

import type { App } from 'vue';

${componentInterfaces}

export interface DesignSystemMetadata {
  name: string;
  version: string;
  targetLibrary: string;
  generatedAt: string;
  components: string[];
}

export interface DesignSystemPlugin {
  install(app: App, options?: any): App;
}

export type ComponentName = ${componentsList ? `'${componentsList.split(' | ').join("' | '")}'` : 'never'};

export declare const components: {
  ${successfulComponents.map(comp => `${comp.name}: typeof ${comp.name};`).join('\n  ')}
};

export declare const metadata: DesignSystemMetadata;

declare const designSystem: DesignSystemPlugin & typeof components;
export default designSystem;

// Vue component registration
declare module '@vue/runtime-core' {
  interface GlobalComponents {
    ${successfulComponents.map(comp => `${comp.name}: typeof ${comp.name};`).join('\n    ')}
  }
}
`;
}

/**
 * Generate Vue plugin
 */
function generateVuePlugin(successfulComponents, config) {
  const imports = successfulComponents.map(comp =>
    `import ${comp.name} from './components/${comp.name}.vue';`
  ).join('\n');

  const componentsList = successfulComponents.map(comp => comp.name).join(', ');

  return `// Vue Plugin for Zero-Overhead Design System
// Target Library: ${config.targetLibrary}
// Generated: ${new Date().toISOString()}

${imports}

const components = { ${componentsList} };

export default {
  install(app, options = {}) {
    const { prefix = '', globalComponents = true } = options;
    
    if (globalComponents) {
      // Register all components globally
      Object.entries(components).forEach(([name, component]) => {
        const componentName = prefix ? prefix + name : name;
        app.component(componentName, component);
      });
    }
    
    // Provide design system utilities
    app.provide('designSystem', {
      components,
      targetLibrary: '${config.targetLibrary}',
      version: '${config.version || '1.0.0'}'
    });
    
    // Global properties
    app.config.globalProperties.$designSystem = {
      components,
      targetLibrary: '${config.targetLibrary}',
      isComponent: (name) => name in components
    };
    
    console.log('✅ Design System Plugin installed with ${config.targetLibrary}');
    
    return app;
  }
};

// Named exports
export { ${componentsList} };
`;
}

/**
 * Generate styles
 */
function generateStyles(config) {
  return `/* Zero-Overhead Design System Styles */
/* Target Library: ${config.targetLibrary} */
/* Generated: ${new Date().toISOString()} */

/* Design Tokens */
:root {
  /* Colors */
  --ds-color-primary: ${config.theme?.tokens?.colors?.primary || '#3B82F6'};
  --ds-color-secondary: ${config.theme?.tokens?.colors?.secondary || '#6B7280'};
  --ds-color-success: ${config.theme?.tokens?.colors?.success || '#10B981'};
  --ds-color-warning: ${config.theme?.tokens?.colors?.warning || '#F59E0B'};
  --ds-color-danger: ${config.theme?.tokens?.colors?.danger || '#EF4444'};
  
  /* Spacing */
  --ds-spacing-xs: ${config.theme?.tokens?.spacing?.xs || '0.25rem'};
  --ds-spacing-sm: ${config.theme?.tokens?.spacing?.sm || '0.5rem'};
  --ds-spacing-md: ${config.theme?.tokens?.spacing?.md || '1rem'};
  --ds-spacing-lg: ${config.theme?.tokens?.spacing?.lg || '1.5rem'};
  --ds-spacing-xl: ${config.theme?.tokens?.spacing?.xl || '2rem'};
  
  /* Typography */
  --ds-font-family-sans: ${config.theme?.tokens?.typography?.fontFamily?.sans?.join(', ') || 'system-ui, sans-serif'};
  --ds-font-size-sm: ${config.theme?.tokens?.typography?.fontSize?.sm || '0.875rem'};
  --ds-font-size-base: ${config.theme?.tokens?.typography?.fontSize?.base || '1rem'};
  --ds-font-size-lg: ${config.theme?.tokens?.typography?.fontSize?.lg || '1.125rem'};
}

/* Design System Base Styles */
.ds-component {
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-font-size-base);
}

/* Utility Classes */
.ds-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Component-specific styles will be included in individual components */
`;
}

// Run build if called directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  build().catch(console.error);
}

export default build;
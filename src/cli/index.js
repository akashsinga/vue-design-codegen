#!/usr/bin/env node

import { ZeroOverheadCLI } from './ZeroOverheadCLI.js';

/**
 * Main CLI entry point for the Zero-Overhead Design System
 */
async function main() {
    try {
        const cli = new ZeroOverheadCLI();
        await cli.run(process.argv.slice(2));
    } catch (error) {
        console.error('CLI Error:', error.message);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
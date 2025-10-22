#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const args = [
    '--test',
    '--experimental-strip-types',
    '--experimental-test-coverage',
    'src/tests/**/*.node.test.ts'
];

// Add watch mode if requested
if (process.argv.includes('--watch')) {
    args.splice(1, 0, '--watch');
}

const testProcess = spawn('node', args, {
    cwd: projectRoot,
    stdio: 'inherit'
});

testProcess.on('exit', (code) => {
    process.exit(code);
});
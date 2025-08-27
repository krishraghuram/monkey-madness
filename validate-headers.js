#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Required headers for userscripts
const REQUIRED_HEADERS = [
    { key: '@namespace', value: 'https://github.com/krishraghuram' },
    { key: '@author', value: 'Raghuram Krishnaswami' },
    { key: '@name' },
    { key: '@version', value: '0.0.1' },
    { key: '@description' },
    { key: '@grant', value: 'none' }
];

const ALLOWED_HEADERS = [
    '@namespace', '@author', '@name', '@version', '@description', '@grant', '@match'
];

const IGNORE_FILES = [
    'userscripts/general/claude-ctrl-enter-to-send.user.js'
]

function validateUserScript(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Find userscript header block
    const startIndex = lines.findIndex(line => line.trim() === '// ==UserScript==');
    const endIndex = lines.findIndex(line => line.trim() === '// ==/UserScript==');

    if (startIndex === -1 || endIndex === -1) {
        return [`No userscript header block found`];
    }

    const headerLines = lines.slice(startIndex + 1, endIndex);
    const headers = {};
    const errors = [];

    // Parse headers
    headerLines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('//')) {
            errors.push(`Line ${startIndex + index + 2}: Invalid header format`);
            return;
        }

        const headerMatch = trimmed.match(/^\/\/\s*(@\w+)\s+(.+)$/);
        if (!headerMatch) {
            if (trimmed !== '//') {
                errors.push(`Line ${startIndex + index + 2}: Invalid header format`);
            }
            return;
        }

        const [, key, value] = headerMatch;

        // Check if header is allowed
        if (!ALLOWED_HEADERS.includes(key)) {
            errors.push(`Line ${startIndex + index + 2}: Unexpected header '${key}'`);
            return;
        }

        if (!headers[key]) {
            headers[key] = [];
        }
        headers[key].push(value);
    });

    // Validate required headers
    REQUIRED_HEADERS.forEach(req => {
        if (!headers[req.key]) {
            errors.push(`Missing required header '${req.key}'`);
        } else if (req.value && !headers[req.key].includes(req.value)) {
            errors.push(`Header '${req.key}' should be '${req.value}', found: ${headers[req.key].join(', ')}`);
        } else if (headers[req.key].every(val => !val.trim())) {
            errors.push(`Header '${req.key}' cannot be empty`);
        }
    });

    return errors;
}

async function main() {
    // Find all .user.js files in userscripts directory
    const userscriptPattern = 'userscripts/**/*.user.js';
    const files = await glob(userscriptPattern, { cwd: process.cwd() });

    if (files.length === 0) {
        console.log('No userscript files found');
        return;
    }

    let totalErrors = 0;

    files.forEach(file => {
        if (IGNORE_FILES.includes(file)) {
            return;
        }
        const errors = validateUserScript(file);
        if (errors.length > 0) {
            console.log(`\n${file}:`);
            errors.forEach(error => {
                console.log(`  L ${error}`);
            });
            totalErrors += errors.length;
        } else {
            console.log(` ${file}`);
        }
    });

    if (totalErrors > 0) {
        console.log(`\nFound ${totalErrors} validation error(s)`);
        process.exit(1);
    } else {
        console.log(`\nAll ${files.length} userscript(s) passed validation`);
    }
}

main().catch(console.error);
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
    { key: '@grant', value: ['none','GM_addStyle','GM_setValue','GM_getValue'] }
];

const ALLOWED_HEADERS = [
    '@namespace', '@author', '@name', '@version', '@description', '@grant', '@match', '@validate-ignore'
];

const KEY_VALIDATE_IGNORE = "@validate-ignore";

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

        const headerMatch = trimmed.match(/^\/\/\s*(@[\w-]+)\s+(.+)$/);
        if (!headerMatch) {
            if (trimmed !== '//') {
                errors.push(`Line ${startIndex + index + 2}: Invalid header format`);
            }
            return;
        }

        const [, key, value] = headerMatch;

        if (!headers[key]) {
            headers[key] = [];
        }
        headers[key].push(value);
    });

    let VALIDATE_IGNORE = headers[KEY_VALIDATE_IGNORE] || [];
    for (const headerName in headers) {
        if (VALIDATE_IGNORE.includes(headerName)) {
            continue;
        }
        if (!ALLOWED_HEADERS.includes(headerName)) {
            errors.push(`Unexpected header '${headerName}'`);
        }
    }

    // Validate required headers
    REQUIRED_HEADERS.forEach(req => {
        if (!headers[req.key]) {
            errors.push(`Missing required header '${req.key}'`);
        } else if (headers[req.key].every(val => !val.trim())) {
            errors.push(`Header '${req.key}' cannot be empty`);
        } else if (req.value && ![req.value].flat().some(i => headers[req.key].includes(i))) {
            errors.push(`Header '${req.key}' should be '${req.value}', found: ${headers[req.key].join(', ')}`);
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
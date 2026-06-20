#!/usr/bin/env bun

// FILE-PATH: src/deconsolidate.ts

/**
 * @file deconsolidate.ts
 * @description A utility script to reconstruct individual project files and
 *              directories from consolidated .txt files produced by consolidate.ts.
 *
 *              The script is organized into logical namespaces:
 *              - `config`:      Runtime options parsed from CLI args.
 *              - `ui`:          All console output via @clack/prompts + picocolors.
 *              - `parser`:      Extracts file segments from a consolidated blob.
 *              - `writer`:      Recreates directories and writes extracted files.
 *              - `deconsolidator`: Orchestrates the full pipeline.
 *
 * @copyright 2026 Dustin Dew
 * @license MIT
 * @author Dustin Dew <phyxashun@gmail.com>
 */

import * as p from '@clack/prompts';
import { file, write } from 'bun';
import { glob } from 'glob';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';

//* === CONSTANTS ===

const BANNER_SPACER = '■'.repeat(30);
const RE_START = new RegExp(`^//${BANNER_SPACER} Start of file: (.+?) ${BANNER_SPACER}\\s*$`);
const RE_END = new RegExp(`^//${BANNER_SPACER} End of file: (.+?) ${BANNER_SPACER}\\s*$`);

//* === TYPES ===

interface ExtractedFile {
    filePath: string;
    content: string;
}

interface RunOptions {
    inputPaths: string[];
    outputDir: string;
    force: boolean;
    verbose: boolean;
    dryRun: boolean;
}

interface Summary {
    written: number;
    skipped: number;
    errors: number;
}

//* === ARG PARSING & HELP ===

function parseArgs(argv: string[]): RunOptions {
    const opts: RunOptions = {
        inputPaths: [],
        outputDir: './ALL_REBUILT',
        force: false,
        verbose: false,
        dryRun: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '-o':
            case '--out':
                opts.outputDir = argv[++i] ?? opts.outputDir;
                break;
            case '-f':
            case '--force':
                opts.force = true;
                break;
            case '-v':
            case '--verbose':
                opts.verbose = true;
                break;
            case '-n':
            case '--dry-run':
                opts.dryRun = true;
                break;
            case '-h':
            case '--help':
                printHelp();
                process.exit(0);
            default: // eslint-disable-line no-fallthrough
                if (!arg.startsWith('-')) opts.inputPaths.push(arg);
                else p.log.warn(`Unknown flag: ${arg}`);
                break;
        }
    }
    if (opts.inputPaths.length === 0) {
        opts.inputPaths.push(path.join(process.cwd(), 'ALL', 'txt', '**', '*.txt'));
    }
    return opts;
}

function printHelp(): void {
    p.outro(`
    ${pc.bold(pc.cyan('deconsolidate.ts'))} — Reconstruct project files.
    ${pc.yellow('Usage:')} bun deconsolidate.ts [options] [inputPaths...]
    ${pc.yellow('Options:')}
        -o, --out <dir>     Output directory. Default: ./ALL_REBUILT
        -f, --force         Overwrite existing files.
        -v, --verbose       Print every file path written.
        -n, --dry-run       Show what would be written.
        -h, --help          Show this help message.
    `);
}

//* === UI ===

const ui = {
    header: () => p.intro(`${pc.bgCyan(pc.black(' DECONSOLIDATE '))} ${pc.dim('Project File Rebuilder')}`),
    logDryRun: (dest: string) => console.log(`    ${pc.gray('~')} DRY-RUN would write: ${dest}`),
    logWriting: (dest: string) => console.log(`    ${pc.blue('→')} Writing: ${dest}`),
    logSkipped: (dest: string) => console.log(`    ${pc.yellow('⊘')} Skipped (exists): ${dest}`),
    summary: (summary: Summary, outputDir: string, dryRun: boolean) => {
        const lines: string[] = [
            dryRun ? pc.bold(pc.yellow('DRY-RUN complete.')) : `${pc.green('✓')} Done! Written to ${pc.cyan(outputDir)}`,
            `${pc.green(summary.written)} written.`,
            summary.skipped > 0 ? pc.yellow(`${summary.skipped} skipped.`) : '',
            summary.errors > 0 ? pc.red(`${summary.errors} errors.`) : '',
        ].filter(Boolean);
        p.outro(lines.join(' '));
    },
    confirm: async (message: string): Promise<boolean> => {
        const ok = await p.confirm({ message });
        if (p.isCancel(ok)) {
            p.cancel('Aborted.');
            process.exit(0);
        }
        return ok;
    },
};

//* === PARSER ===

const parser = {
    extract(text: string): ExtractedFile[] {
        const results: ExtractedFile[] = [];
        const lines = text.split('\n');
        let currentPath: string | null = null;
        let contentLines: string[] = [];

        for (const line of lines) {
            const startMatch: RegExpMatchArray | null = !currentPath ? line.match(RE_START) : null;
            if (startMatch?.[1]) {
                currentPath = startMatch[1].trim().replace(/^\.\//, '');
                contentLines = [];
            } else if (currentPath) {
                const endMatch = line.match(RE_END);
                if (endMatch) {
                    const content = contentLines.join('\n').replace(/^\n+|\n+$/g, '');
                    results.push({ filePath: currentPath, content });
                    currentPath = null;
                } else {
                    contentLines.push(line);
                }
            }
        }
        if (currentPath) p.log.warn(`No End-of-file banner found for "${currentPath}". Segment discarded.`);
        return results;
    },
};

//* === WRITER ===

const writer = {
    async writeFile(
        extracted: ExtractedFile,
        outputDir: string,
        opts: { force: boolean; verbose: boolean; dryRun: boolean; }, // eslint-disable-line prettier/prettier
    ): Promise<'written' | 'skipped' | 'errors'> {
        const dest = path.join(outputDir, extracted.filePath);
        if (opts.dryRun) {
            if (opts.verbose) ui.logDryRun(dest);
            return 'written';
        }

        const destFile = file(dest);
        if (!opts.force && (await destFile.exists())) {
            if (opts.verbose) ui.logSkipped(dest);
            return 'skipped';
        }

        try {
            await mkdir(path.dirname(dest), { recursive: true });
            await write(dest, extracted.content + '\n');
            if (opts.verbose) ui.logWriting(dest);
            return 'written';
        } catch (err) {
            p.log.error(`Error writing ${dest}: ${err instanceof Error ? err.message : String(err)}`);
            return 'errors';
        }
    },
};

//* === ORCHESTRATOR ===

const deconsolidator = {
    async resolveInputFiles(patterns: string[]): Promise<string[]> {
        const spinner = p.spinner();
        spinner.start('Scanning for input files...');
        const allFiles = await Promise.all(patterns.map(pattern => glob(pattern, { nodir: true })));
        const uniqueFiles = [...new Set(allFiles.flat())];
        spinner.stop(`Found ${uniqueFiles.length} file(s).`);
        return uniqueFiles;
    },
    async run(opts: RunOptions): Promise<void> {
        ui.header();
        if (opts.dryRun) p.log.warn('DRY-RUN mode — no files will be written.');

        const inputFiles = await this.resolveInputFiles(opts.inputPaths);
        if (inputFiles.length === 0) {
            p.cancel('No input files found. Nothing to do.');
            process.exit(1);
        }

        const outputDirExists = await file(opts.outputDir).exists();
        if (!opts.force && !opts.dryRun && outputDirExists) {
            const entries = await readdir(opts.outputDir);
            if (entries.length > 0) {
                const ok = await ui.confirm(`Output directory "${opts.outputDir}" has content. Continue?`);
                if (!ok) process.exit(0);
            }
        }

        const summary: Summary = { written: 0, skipped: 0, errors: 0 };
        for (const inputFile of inputFiles) {
            p.log.step(`Processing ${pc.white(path.basename(inputFile))}`);
            const text = await file(inputFile).text();
            const segments = parser.extract(text);
            for (const segment of segments) {
                const result = await writer.writeFile(segment, opts.outputDir, opts);
                summary[result]++;
            }
        }
        ui.summary(summary, opts.outputDir, opts.dryRun);
    },
};

//* === ENTRY POINT ===

const main = async (): Promise<void> => {
    const opts = parseArgs(process.argv.slice(2));
    await deconsolidator.run(opts);
};

// Allow direct execution
if (import.meta.main) {
    await main();
}

export default main;

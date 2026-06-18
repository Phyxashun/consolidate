#!/usr/bin/env bun

// ~ FILE-PATH: src/deconsolidate.ts

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

import Bun from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import * as p from '@clack/prompts';
import pc from 'picocolors';

/******************************************************************************************************
 *
 * CONSTANTS — mirror the values used in consolidate.ts so the markers parse correctly
 *
 ******************************************************************************************************/
/** Number of ■ characters used in Start/End-of-file banners (must match consolidate.ts). */
const SPACER_WIDTH = 30;
const SPACER_CHAR = '■';

/** The banner spacer string, e.g. "■■■■■…■■■■■" (30 chars). */
const BANNER_SPACER = SPACER_CHAR.repeat(SPACER_WIDTH);

/**
 * Regex for the start-of-file banner.
 *
 * consolidate.ts writes:
 *   `//■■■… Start of file: <path> ■■■…`
 * (preceded by `\n\n` and followed by `\n\n\n`).
 *
 * We capture everything between the two spacer blocks as the original file path.
 */
const RE_START = new RegExp(`^\\/\\/${escapeRegex(BANNER_SPACER)} Start of file: (.+?) ${escapeRegex(BANNER_SPACER)}\\s*$`);

/**
 * Regex for the end-of-file banner.
 */
const RE_END = new RegExp(`^\\/\\/${escapeRegex(BANNER_SPACER)} End of file: (.+?) ${escapeRegex(BANNER_SPACER)}\\s*$`);

/******************************************************************************************************
 *
 * TYPES
 *
 ******************************************************************************************************/
interface ExtractedFile {
    /** Original relative path stored in the banner, e.g. `src/utils/helper.ts` */
    filePath: string;
    /** Raw file content between the banners, with leading/trailing blank lines stripped */
    content: string;
}

interface RunOptions {
    /** Glob pattern(s) or explicit paths to the consolidated .txt files. */
    inputPaths: string[];
    /** Root directory where rebuilt files will be written. */
    outputDir: string;
    /** When true, existing files are silently overwritten without prompting. */
    force: boolean;
    /** When true, print every rebuilt path; otherwise only print a summary. */
    verbose: boolean;
    /** When true, print what would happen without actually writing anything. */
    dryRun: boolean;
}

interface Summary {
    written: number;
    skipped: number;
    errors: number;
}

/******************************************************************************************************
 *
 * UTILITY HELPERS
 *
 ******************************************************************************************************/
/** Escape a string for use inside a RegExp literal. */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip the leading `./` or `/` from a path so it is always relative. */
function normalizeRelativePath(filePath: string): string {
    return filePath.replace(/^\.\//, '').replace(/^\//, '');
}

/******************************************************************************************************
 *
 * CONFIG — parse CLI arguments
 *
 ******************************************************************************************************/
function parseArgs(): RunOptions {
    const args = process.argv.slice(2);

    const opts: RunOptions = {
        inputPaths: [],
        outputDir: './ALL_REBUILT',
        force: false,
        verbose: false,
        dryRun: false,
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        switch (arg) {
            case '--out':
            case '-o':
                opts.outputDir = args[++i] ?? opts.outputDir;
                break;
            case '--force':
            case '-f':
                opts.force = true;
                break;
            case '--verbose':
            case '-v':
                opts.verbose = true;
                break;
            case '--dry-run':
            case '-n':
                opts.dryRun = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                if (arg) {
                    if (!arg.startsWith('-')) {
                        opts.inputPaths.push(arg);
                    }
                } else {
                    p.log.warn(`Unknown flag: ${arg!}`);
                }
        }
        i++;
    }

    // Default: look for all .txt files in the ALL/txt directory
    if (opts.inputPaths.length === 0) {
        opts.inputPaths = ['./ALL/txt/**/*.txt'];
    }

    return opts;
}

function printHelp(): void {
    console.log(`
${pc.bold(pc.cyan('deconsolidate.ts'))} — Reconstruct project files from consolidated .txt output.

${pc.yellow('Usage:')}
  bun deconsolidate.ts [options] [inputPaths...]

${pc.yellow('Arguments:')}
  inputPaths          One or more .txt file paths or glob patterns.
                      Default: ./ALL/txt/**/*.txt

${pc.yellow('Options:')}
  -o, --out <dir>     Output directory for rebuilt files.
                      Default: ./ALL_REBUILT
  -f, --force         Overwrite existing files without prompting.
  -v, --verbose       Print every file path as it is written.
  -n, --dry-run       Show what would be written without touching disk.
  -h, --help          Show this help message.

${pc.yellow('Examples:')}
  bun deconsolidate.ts
  bun deconsolidate.ts ./ALL/txt/1_ALL_SOURCE.txt -o ./restored -f
  bun deconsolidate.ts "./ALL/txt/*.txt" --dry-run --verbose
`);
}

/******************************************************************************************************
 *
 * USER INTERFACE
 *
 ******************************************************************************************************/
const ui = {
    displayHeader(): void {
        p.intro(`${pc.bgCyan(pc.black(' DECONSOLIDATE '))}  ${pc.dim('Project File Rebuilder')}`);
    },

    logScanStart(pattern: string): void {
        p.log.step(`Scanning: ${pc.white(pattern)}`);
    },

    logParsingFile(filePath: string): void {
        p.log.info(`Parsing consolidated file: ${pc.white(filePath)}`);
    },

    logExtracted(count: number, source: string): void {
        p.log.success(`Extracted ${count} file segment(s) from ${pc.white(source)}`);
    },

    logWriting(filePath: string): void {
        console.log(`    ${pc.blue('→')} Writing: ${filePath}`);
    },

    logSkipped(filePath: string): void {
        console.log(`    ${pc.yellow('⊘')} Skipped (exists): ${filePath}`);
    },

    logError(filePath: string, err: unknown): void {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`    ${pc.red('✗')} Error writing ${filePath}: ${msg}`);
    },

    logDryRun(filePath: string): void {
        console.log(`    ${pc.gray('~')} DRY-RUN would write: ${filePath}`);
    },

    logSummary(summary: Summary, outputDir: string, dryRun: boolean): void {
        const lines: string[] = [];
        if (dryRun) {
            lines.push(pc.bold(pc.yellow('DRY-RUN complete — no files were written.')));
        } else {
            lines.push(`${pc.green('✓')} Done! ${summary.written} file(s) written to ${pc.cyan(outputDir)}`);
        }
        if (summary.skipped > 0) {
            lines.push(pc.yellow(`⊘ ${summary.skipped} file(s) skipped (already exist).`));
        }
        if (summary.errors > 0) {
            lines.push(pc.red(`✗ ${summary.errors} error(s) encountered.`));
        }
        p.outro(lines.join('\n'));
    },

    /** Prompt the user yes/no via @clack/prompts; exits on Ctrl+C / cancellation. */
    async confirm(message: string): Promise<boolean> {
        const ok = await p.confirm({ message });
        if (p.isCancel(ok)) {
            p.cancel('Aborted.');
            process.exit(0);
        }
        return ok;
    },
};

/******************************************************************************************************
 *
 * PARSER — extract file segments from consolidated text
 *
 ******************************************************************************************************/
const parser = {
    /**
     * Splits a consolidated file's text into individual {@link ExtractedFile} records.
     *
     * The algorithm is a simple state machine:
     *   IDLE  → sees a Start banner → COLLECTING
     *   COLLECTING → accumulates lines → sees End banner → IDLE  (saves segment)
     *
     * Any content outside banners (divider lines, blank lines) is ignored.
     */
    extract(text: string): ExtractedFile[] {
        const results: ExtractedFile[] = [];
        const lines = text.split('\n');

        let currentPath: string | null = null;
        let contentLines: string[] = [];

        for (const line of lines) {
            if (currentPath === null) {
                // IDLE — look for a Start banner
                const startMatch = line.match(RE_START);
                if (startMatch && startMatch[1]) {
                    currentPath = normalizeRelativePath(startMatch[1].trim());
                    contentLines = [];
                }
            } else {
                // COLLECTING — look for the matching End banner
                const endMatch = line.match(RE_END);
                if (endMatch) {
                    // Strip the decorative leading/trailing blank lines that
                    // consolidate.ts appends (START_END_NEWLINE = 2 newlines).
                    const rawContent = contentLines.join('\n');
                    const trimmed = rawContent.replace(/^\n+/, '').replace(/\n+$/, '');
                    results.push({ filePath: currentPath, content: trimmed });
                    currentPath = null;
                    contentLines = [];
                } else {
                    contentLines.push(line);
                }
            }
        }

        if (currentPath !== null) {
            p.log.warn(`No End-of-file banner found for "${currentPath}". Segment discarded.`);
        }

        return results;
    },
};

/******************************************************************************************************
 *
 * WRITER — recreate files on disk
 *
 ******************************************************************************************************/
const writer = {
    /**
     * Writes a single extracted file to disk under `outputDir`.
     * Returns `'written' | 'skipped' | 'errors'`.
     */
    async writeFile(
        extracted: ExtractedFile,
        outputDir: string,
        opts: { force: boolean; verbose: boolean; dryRun: boolean },
    ): Promise<'written' | 'skipped' | 'errors'> {
        const dest = path.join(outputDir, extracted.filePath);

        if (opts.dryRun) {
            ui.logDryRun(dest);
            return 'written'; // count as "would write" in dry-run summary
        }

        // Check for existing file when --force is not set
        if (!opts.force && fs.existsSync(dest)) {
            ui.logSkipped(dest);
            return 'skipped';
        }

        try {
            // Ensure parent directories exist
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            await Bun.write(dest, extracted.content + '\n');
            if (opts.verbose) {
                ui.logWriting(dest);
            }
            return 'written';
        } catch (err) {
            ui.logError(dest, err);
            return 'errors';
        }
    },
};

/******************************************************************************************************
 *
 * DECONSOLIDATOR — orchestration
 *
 ******************************************************************************************************/
const deconsolidator = {
    /**
     * Resolves all input globs to concrete file paths.
     */
    resolveInputFiles(patterns: string[]): string[] {
        const files: string[] = [];
        for (const pattern of patterns) {
            ui.logScanStart(pattern);
            // If it looks like a plain path (not a glob), add it directly if it exists
            if (!pattern.includes('*') && !pattern.includes('{')) {
                if (fs.existsSync(pattern)) {
                    files.push(pattern);
                } else {
                    p.log.warn(`File not found: ${pattern}`);
                }
            } else {
                const found = globSync(pattern);
                if (found.length === 0) {
                    p.log.warn(`No files matched: ${pattern}`);
                }
                files.push(...found);
            }
        }
        // Deduplicate
        return [...new Set(files)];
    },

    /**
     * Full pipeline: resolve inputs → parse → write → summarize.
     */
    async run(opts: RunOptions): Promise<void> {
        ui.displayHeader();

        if (opts.dryRun) {
            p.log.warn('DRY-RUN mode — no files will be written.');
        }

        // 1. Resolve input files
        const inputFiles = deconsolidator.resolveInputFiles(opts.inputPaths);

        if (inputFiles.length === 0) {
            p.cancel('No input files found. Nothing to do.');
            process.exit(1);
        }

        p.log.info(`Found ${inputFiles.length} consolidated file(s) to process.`);

        // 2. If we will be writing to a non-empty directory and --force is not
        //    set, give the user a chance to bail out.
        if (!opts.force && !opts.dryRun && fs.existsSync(opts.outputDir)) {
            const entries = fs.readdirSync(opts.outputDir);
            if (entries.length > 0) {
                const ok = await ui.confirm(
                    `Output directory "${opts.outputDir}" already has content. Continue? (Use --force to skip this prompt)`,
                );
                if (!ok) {
                    p.outro(pc.yellow('Aborted.'));
                    process.exit(0);
                }
            }
        }

        // 3. Parse and write
        const summary: Summary = { written: 0, skipped: 0, errors: 0 };

        for (const inputFile of inputFiles) {
            ui.logParsingFile(inputFile);

            let text: string;
            try {
                text = await Bun.file(inputFile).text();
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                p.log.error(`Could not read "${inputFile}": ${msg}`);
                summary.errors++;
                continue;
            }

            const segments = parser.extract(text);
            ui.logExtracted(segments.length, path.basename(inputFile));

            for (const segment of segments) {
                const result = await writer.writeFile(segment, opts.outputDir, {
                    force: opts.force,
                    verbose: opts.verbose,
                    dryRun: opts.dryRun,
                });
                summary[result]++;
            }
        }

        // 4. Final summary
        ui.logSummary(summary, opts.outputDir, opts.dryRun);
    },
};

/******************************************************************************************************
 *
 * ENTRY POINT
 *
 ******************************************************************************************************/
const main = async (): Promise<void> => {
    const opts = parseArgs();
    await deconsolidator.run(opts);
};

export default main;

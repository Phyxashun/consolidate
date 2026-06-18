#!/usr/bin/env bun

// ~ FILE-PATH:  src/consolidate.ts

/**
 * @file consolidate.ts
 * @description A utility script to consolidate project files into single,
 *              combined output files. The script is organized into logical
 *              namespaces:
 *              - `config`: Defines the consolidation jobs.
 *              - `ui`: Handles all console output via @clack/prompts + picocolors.
 *              - `fileSystem`: Provides low-level functions for file system interactions.
 *              - `consolidator`: Orchestrates the consolidation process using the other namespaces.
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
 * CONSTANTS
 *
 ******************************************************************************************************/
const IGNORELIST = ['**/*.lock', 'coverage/**/*', 'node_modules/**/*', 'ALL/**/*', '.env'];
const GITIGNORE_PATH = path.resolve(process.cwd(), '.gitignore');
const OUTPUT_DIR = './ALL';
const TEXT_OUTPUT_DIR = OUTPUT_DIR + '/txt/';
const TEXT_FILE_EXT = 'txt';
const TS_OUTPUT_DIR = OUTPUT_DIR + '/ts/';
const TS_FILE_EXT = 'ts';
const START_END_SPACER = 30;
const START_END_NEWLINE = 2;
const FILE_DIVIDER_WIDTH = 100;

/******************************************************************************************************
 *
 * TYPES
 *
 ******************************************************************************************************/
/**
 * @interface JobDefinition
 * @description Defines the structure for a single consolidation task.
 * @property {string} name - A name for the job, used in output file name.
 * @property {string} description - A descriptive name for the job, used in logging.
 * @property {string[]} include - An array of glob patterns to find files for this job.
 * @property {string[]} exclude - An array of glob patterns to exclude for this job.
 */
interface JobDefinition {
    name: string;
    description?: string;
    include: string[];
    exclude: string[];
}

/**
 * @interface ConsolidationJob
 * @description Defines the structure for a single consolidation task.
 * @extends {JobDefinition}
 * @property {string} outputFile - The path to the file where content will be consolidated.
 */
interface ConsolidationJob extends JobDefinition {
    outputFile: string;
}

interface Configuration {
    GenerateJobs: (outputDir: string, extension: string) => ConsolidationJob[];
    AddGitIgnore: (gitignorePath: string) => string[];
    JOBS: ConsolidationJob[];
    IGNORELIST: string[];
}

interface FinalSummaryOptions {
    totalFiles: number;
    processedJobs: number;
    skippedJobs: number;
}

/******************************************************************************************************
 *
 * CONFIGURATION
 *
 ******************************************************************************************************/
const JOB_DEFINITIONS: JobDefinition[] = [
    {
        name: 'SOURCE_FILES',
        description: 'TypeScript (ts, tsx, mts, cts) and JavaScript (js, jsx, mjs, cjs) Source Files',
        include: ['src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}', '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}', 'index.ts'],
        exclude: ['**/*.config.{ts,mts,js,mjs}', '**/*.test.ts'],
    },
    {
        name: 'HTML_FILES',
        description: 'HTML Files',
        include: ['src/**/*.{html}', '**/*.{html}', 'index.html'],
        exclude: [],
    },
    {
        name: 'STYLES_FILES',
        description: 'Style (ss,scss,sass,less) Files',
        include: ['src/**/*.{css,scss,sass,less}', '**/*.{css,scss,sass,less}'],
        exclude: [],
    },
    {
        name: 'CONFIG_FILES',
        description: 'Configuration Files and Markdown',
        include: [
            '../../AppData/Roaming/code/user/settings.json',
            '.vscode/**/*.json',
            '.gitignore',
            '*.json',
            '*.config.{ts,mts,js,mjs}',
            '.editorconfig',
            '.prettierrc',
        ],
        exclude: [],
    },
    {
        name: 'TEST_FILES',
        description: 'Test Files',
        include: ['{test,tests,test_old, tests_old}/**/*.test.ts', '**/*.test.ts'],
        exclude: [],
    },
    {
        name: 'DOC_FILES',
        description: 'Documentation Files',
        include: ['**/*.{md,txt}', 'License'],
        exclude: [],
    },
];

const CONFIG: Configuration = {
    GenerateJobs: (outputDir: string, fileExtension: string): ConsolidationJob[] => {
        return JOB_DEFINITIONS.map((definition, index) => ({
            name: definition.description ?? definition.name,

            outputFile: `${outputDir}${index + 1}_ALL_${definition.name.toUpperCase().replace(' ', '_')}.${fileExtension}`,

            include: definition.include,
            exclude: definition.exclude,
        }));
    },
    AddGitIgnore: (gitignorePath: string): string[] => {
        let gitignoreContent;
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            return gitignoreContent
                .split(/\r?\n/) // Split by newline
                .map(line => line.trim()) // Remove whitespace
                .filter(line => line && !line.startsWith('#')); // Ignore empty lines and comments
        } else {
            return [];
        }
    },
    JOBS: [],
    IGNORELIST: [] as string[],
};

// Create all jobs
CONFIG.JOBS = [...CONFIG.GenerateJobs(TS_OUTPUT_DIR, TS_FILE_EXT), ...CONFIG.GenerateJobs(TEXT_OUTPUT_DIR, TEXT_FILE_EXT)];

// Merge, de-duplicate, and assign in one go
CONFIG.IGNORELIST = [...new Set([...IGNORELIST, ...CONFIG.AddGitIgnore(GITIGNORE_PATH)])];

/******************************************************************************************************
 *
 * USER INTERFACE
 *
 ******************************************************************************************************/
const ui = {
    /**
     * @function displayHeader
     * @description Renders the main application header and the ignore-list box.
     * @returns {void}
     */
    displayHeader: (): void => {
        p.intro(`${pc.bgMagenta(pc.black(' CONSOLIDATE '))}  ${pc.dim('Project File Consolidator')}`);

        if (CONFIG.IGNORELIST.length > 0) {
            p.box(CONFIG.IGNORELIST.join(', '), pc.dim('Ignored Patterns'));
        }
    },

    /**
     * Logs a final summary message after all jobs are complete.
     * @param {FinalSummaryOptions} options - Totals collected while running jobs.
     */
    logFinalSummary: (options: FinalSummaryOptions): void => {
        const { totalFiles, processedJobs, skippedJobs } = options;
        let summaryMessage = `Successfully consolidated ${pc.bold(String(totalFiles))} file(s) across ${pc.bold(String(processedJobs))} job(s).`;
        if (skippedJobs > 0) {
            summaryMessage += `\n${pc.dim(`${skippedJobs} job(s) skipped — no matching files.`)}`;
        }
        p.outro(pc.green(summaryMessage));
    },

    /**
     * Logs that no files were found for any job.
     */
    logNoFiles: (): void => {
        p.outro(pc.yellow('No matching files found for any job — nothing to consolidate.'));
    },
};

/******************************************************************************************************
 *
 * FILE SYSTEM INTERACTION
 *
 ******************************************************************************************************/
const fileSystem = {
    /**
     * Ensures that a directory exists, creating it if necessary.
     * @param {string} dirPath - The path to the directory to create.
     */
    ensureDirectoryExists: (dirPath: string): void => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    },

    /**
     * Ensures an output file is empty by deleting it if it already exists.
     * @param {string} filePath - The path to the output file to prepare.
     */
    prepareOutputFile: (filePath: string): void => {
        // Extract directory path and ensure it exists
        const dirPath = path.dirname(filePath);
        fileSystem.ensureDirectoryExists(dirPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    },

    /**
     * Finds all file paths matching an array of glob patterns using glob.
     * @param {string[]} patterns - The glob patterns to search for.
     * @param {string[]} ignorePatterns - An array of glob patterns to ignore files.
     * @param {string} outputFile - The path of the output file, to be excluded from the search.
     * @returns {string[]} An array of found file paths.
     */
    findFiles: (patterns: string[], ignorePatterns: string[], outputFile: string): string[] => {
        return globSync(patterns, {
            ignore: [...CONFIG.IGNORELIST, ...ignorePatterns, outputFile],
        });
    },

    /**
     * Creates the content for a single source file, including headers and footers.
     * @param {string} sourceFile - The path of the source file to process.
     * @returns {Promise<string>} A promise that resolves to the formatted file content as a string.
     */
    createFileContent: async (sourceFile: string): Promise<string> => {
        const space = '■'.repeat(START_END_SPACER);
        const endLine = '\n'.repeat(START_END_NEWLINE);
        const divider = '█'.repeat(FILE_DIVIDER_WIDTH);
        const fileDivider = `//${divider}\n`;
        const startFile = `${endLine}//${space} Start of file: ${sourceFile} ${space}${endLine}${endLine}\n`;
        const content = await Bun.file(sourceFile).text();
        const endFile = `\n${endLine}${endLine}//${space} End of file: ${sourceFile} ${space}${endLine}\n`;
        return `${startFile}${content}${endFile}${fileDivider}${fileDivider}`;
    },
};

/******************************************************************************************************
 *
 * MAIN EXECUTION AND EXPORTS
 *
 ******************************************************************************************************/
const consolidateJobs = {
    /**
     * Processes a single consolidation job. Finds files and, if any exist,
     * consolidates them into a single output file. Reports progress via
     * the optional `message` callback supplied by `p.tasks()`.
     * @param {ConsolidationJob} job - The consolidation job to execute.
     * @param {(msg: string) => void} [message] - Progress callback from the active task.
     * @returns {Promise<number>} The number of files processed in the job.
     */
    process: async (job: ConsolidationJob, message?: (msg: string) => void): Promise<number> => {
        const { outputFile, include, exclude } = job;
        const sourceFiles = fileSystem.findFiles(include, exclude, outputFile);
        if (sourceFiles.length === 0) {
            return 0;
        }

        fileSystem.prepareOutputFile(outputFile);
        const allContent: string[] = [];
        for (const sourceFile of sourceFiles) {
            message?.(`Appending ${sourceFile}`);
            allContent.push(await fileSystem.createFileContent(sourceFile));
        }
        fs.writeFileSync(outputFile, allContent.join(''));
        return sourceFiles.length;
    },

    /**
     * Runs all consolidation jobs as a `@clack/prompts` task list, tracks the
     * total files processed, and logs a final summary.
     * @param {ConsolidationJob[]} jobs - An array of consolidation jobs to execute.
     */
    run: async (jobs: ConsolidationJob[]): Promise<void> => {
        let totalFiles = 0;
        let processedJobs = 0;
        let skippedJobs = 0;

        await p.tasks(
            jobs.map(job => ({
                title: job.name,
                task: async (message: (msg: string) => void): Promise<string> => {
                    const fileCountForJob = await consolidateJobs.process(job, message);
                    if (fileCountForJob === 0) {
                        skippedJobs++;
                        return pc.dim('No matching files — skipped');
                    }
                    totalFiles += fileCountForJob;
                    processedJobs++;
                    return `${pc.bold(String(fileCountForJob))} file(s) → ${pc.dim(job.outputFile)}`;
                },
            })),
        );

        if (totalFiles > 0) {
            ui.logFinalSummary({ totalFiles, processedJobs, skippedJobs });
        } else {
            ui.logNoFiles();
        }
    },
};

/**
 * @function main
 * @description The main entry point for the script. Initializes the UI and
 *              starts the consolidation process.
 */
const main = async (): Promise<void> => {
    ui.displayHeader();
    await consolidateJobs.run(CONFIG.JOBS);
};

export default main;

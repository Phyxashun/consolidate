#!/usr/bin/env bun
// ./consolidate.ts

/**
 * @file consolidate.ts
 * @description A utility script to consolidate project files into single, 
 *              combined output files. The script is organized into logical 
 *              namespaces:
 *              - `config`: Defines the consolidation jobs.
 *              - `ui`: Handles all console output and user interface elements.
 *              - `fileSystem`: Provides low-level functions for file system interactions.
 *              - `consolidator`: Orchestrates the consolidation process using the other namespaces.
 * @copyright 2026 Dustin Dew
 * @license MIT
 * @author Dustin Dew <phyxashun@gmail.com>
 */

import { styleText } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import ProgressBar from 'progress';
import {
    LineType,
    BoxType,
    Spacer,
    CenteredText,
    CenteredFiglet,
    PrintLine,
    BoxText,
} from 'logger';


/**
 * Constants
 */
const TEXT_OUTPUT_DIR = './ALL/txt/';
const TS_OUTPUT_DIR = './ALL/ts/';
const START_END_SPACER = 30;
const START_END_NEWLINE = 2;
const FILE_DIVIDER_WIDTH = 100;

/**************************************************************************************************
 * 
 * CONFIGURATION
 * 
 *************************************************************************************************/

/**
 * @interface ConsolidationSourceDef
 * @description Defines the structure for a single consolidation task.
 * @property {string} jobName - A name for the job, used in output file name.
 * @property {string} name - A descriptive name for the job, used in logging.
 * @property {string[]} patterns - An array of glob patterns to find files for this job.
 */
interface ConsolidationSourceDef {
    jobName?: string;
    name: string;
    patterns: string[];
}

/**
 * @interface ConsolidationJob
 * @description Defines the structure for a single consolidation task.
 * @extends {ConsolidationSourceDef}
 * @property {string} outputFile - The path to the file where content will be consolidated.
 */
interface ConsolidationJob extends ConsolidationSourceDef {
    outputFile: string;
}

const SOURCE_DEFINITIONS: ConsolidationSourceDef[] = [
    {
        name: 'MAIN_FILES',
        jobName: 'Main Project TypeScript and JavaScript Files',
        patterns: [
            './src/**/*.ts',
            './src/**/*.js',
            './index.ts',
            './Consolidate.ts',
        ]
    },
    {
        name: 'CONFIG',
        jobName: 'Configuration Files and Markdown',
        patterns: [
            './.vscode/launch.json',
            './.vscode/settings.json',
            './.gitignore',
            './*.json',
            './*.config.ts',
            './git-push.sh',
        ]
    },
    {
        name: 'NEW_TEST',
        jobName: 'New Test Files',
        patterns: [
            './test/**/*.test.ts',
        ]
    },
    {
        name: 'OLD_TEST',
        jobName: 'Old Test Files',
        patterns: [
            './test_old/**/*.ts',
            './test_old/**/*.test.ts',
        ],
    },
    {
        name: 'MARKDOWN',
        jobName: 'Project Markdown Files',
        patterns: [
            './0. NOTES/*.md',
            './License',
            './README.md'
        ],
    },
];

interface IConfig {
    generateJobsForType: (outputDir: string, extension: string) => ConsolidationJob[];
    JOBS: ConsolidationJob[];
    IGNORELIST: string[];
}

const config: IConfig = {
    /**
     * @description Generates an array of all consolidation jobs to be executed by the script.
     * @returns {ConsolidationJob[]}
     */
    generateJobsForType: (outputDir: string, extension: string): ConsolidationJob[] => {
        return SOURCE_DEFINITIONS.map((definition, index) => ({
            name: styleText(['red', 'underline'], definition.jobName ?? definition.name),
            outputFile: `${outputDir}${index + 1}_ALL_${definition.name.toUpperCase().replace(' ', '_')}.${extension}`,
            patterns: definition.patterns,
        }));
    },
    JOBS: [] as ConsolidationJob[],
    IGNORELIST: [] as string[],
};

/**
 * @description An array of all consolidation jobs to be executed by the script.
 * @type {ConsolidationJob[]}
 */
Object.defineProperty(config, "JOBS", {
    value: [
        ...config.generateJobsForType(TS_OUTPUT_DIR, 'ts'),
        ...config.generateJobsForType(TEXT_OUTPUT_DIR, 'txt'),
    ],
    writable: false,     // Prevents modification after definition
    enumerable: true,    // Allows the property to show up during enumeration (e.g., in a for...in loop)
    configurable: false  // Prevents the property from being deleted or having its descriptor changed further
});

Object.defineProperty(config, "IGNORELIST", {
    value: [
        'coverage/**',
        'node_modules/**',
        'ALL/**',
    ],
    writable: false,     // Prevents modification after definition
    enumerable: true,    // Allows the property to show up during enumeration (e.g., in a for...in loop)
    configurable: false  // Prevents the property from being deleted or having its descriptor changed further
});

/*
config.JOBS = [
    ...config.generateJobsForType(TS_OUTPUT_DIR, 'ts'),
    ...config.generateJobsForType(TEXT_OUTPUT_DIR, 'txt'),
];

config.IGNORELIST = [
    'coverage/**',
    'node_modules/**',
    'ALL/**',
];
*/
/**************************************************************************************************
 * 
 * USER INTERFACE
 * 
 *************************************************************************************************/

interface FinalSummaryOptions {
    totalFiles: number;
    processedJobs: number;
    skippedJobs: number;
}

const ui = {
    /**
     * @function displayHeader
     * @description Renders the main application header, including title and subtitle.
     * @returns {void}
     */
    displayHeader: (): void => {
        PrintLine({ preNewLine: true, lineType: LineType.boldBlock });
        console.log(styleText(['yellowBright', 'bold'], CenteredFiglet(`Consolidate!!!`)));
        CenteredText(styleText(['magentaBright', 'bold'], '*** PROJECT FILE CONSOLIDATOR SCRIPT ***'));
        PrintLine({ preNewLine: true, postNewLine: true, lineType: LineType.boldBlock });
    },

    /**
     * Logs the start of a new consolidation job.
     * @param {string} jobName - The name of the job being processed.
     * @param {string} outputFile - The path of the output file for the job.
     */
    logJobStart: (jobName: string, outputFile: string): void => {
        CenteredText(styleText('cyan', `Consolidating all project ${jobName}`));
        CenteredText(styleText('cyan', `files into ${outputFile}...\n`));
    },

    /**
     * Logs the path of a file being appended to an output file.
     * @param {string} filePath - The path of the file being appended.
     */
    logFileAppend: (filePath: string): void => {
        console.log(styleText('blue', `\tAppending:`), `${filePath}`);
    },

    /**
     * Logs a successful completion message for a job.
     */
    logComplete: (): void => {
        console.log();
        CenteredText(styleText(['yellow', 'bold'], 'Consolidation complete!!!'));
        PrintLine({ preNewLine: true, postNewLine: true, lineType: LineType.boldBlock });
    },

    /**
     * Logs a final summary message after all jobs are complete.
     * @param {number} fileCount - The total number of files consolidated.
     * @param {number} jobCount - The total number of jobs processed.
     */
    logFinalSummary: (options: FinalSummaryOptions): void => {
        const { totalFiles, processedJobs, skippedJobs } = options;

        let summaryMessage = `✓ Successfully consolidated ${totalFiles} files across ${processedJobs} jobs.`;
        if (skippedJobs > 0) {
            summaryMessage += ` (${skippedJobs} jobs skipped).`;
        }

        BoxText(
            summaryMessage, {
            boxType: BoxType.double,
            color: 'green',
            textColor: ['green', 'bold']
        }
        );
        PrintLine({ preNewLine: true, postNewLine: true, lineType: LineType.boldBlock });
    },
}

/**************************************************************************************************
 * 
 * FILE SYSTEM INTERACTION
 * 
 *************************************************************************************************/

const fileSystem = {
    /**
     * Ensures that a directory exists, creating it if necessary.
     * @param {string} dirPath - The path to the directory to create.
     */
    ensureDirectoryExists: async (dirPath: string): Promise<void> => {
        if (!fs.existsSync(dirPath)) {
            console.log(styleText('yellow', `\tCreating directory: ${dirPath}`));
            fs.mkdirSync(dirPath, { recursive: true });
        }
    },

    /**
     * Ensures an output file is empty by deleting it if it already exists.
     * @param {string} filePath - The path to the output file to prepare.
     */
    prepareOutputFile: async (filePath: string): Promise<void> => {
        // Extract directory path and ensure it exists
        const dirPath = path.dirname(filePath);
        fileSystem.ensureDirectoryExists(dirPath);

        const file = Bun.file(filePath);
        if (await file.exists()) {
            fs.unlinkSync(filePath);
        }
    },

    /**
     * Finds all file paths matching an array of glob patterns using Bun.Glob.
     * @param {string[]} patterns - The glob patterns to search for.
     * @param {string} outputFile - The path of the output file, to be excluded from the search.
     * @returns {Promise<string[]>} A promise that resolves to an array of found file paths.
     */
    findFiles: async (patterns: string[], outputFile: string): Promise<string[]> => {
        const allFiles = new Set<string>();
        for (const pattern of patterns) {
            const glob = new Bun.Glob(pattern);
            for await (const file of glob.scan('.')) {
                allFiles.add(file);
            }
        }

        const ignoreList = [
            ...config.IGNORELIST,
            outputFile
        ];

        const finalFiles = Array.from(allFiles);

        // Filter out ignored files
        return finalFiles.filter(file =>
            !ignoreList.some(ignorePattern => new Bun.Glob(ignorePattern).match(file))
        );
    },

    /**
     * Creates the content for a single source file, including headers and footers.
     * @param {string} sourceFile - The path of the source file to process.
     * @returns {Promise<string>} A promise that resolves to the formatted file content as a string.
     */
    createFileContent: async (sourceFile: string): Promise<string> => {
        const space = Spacer(START_END_SPACER, '■');
        const endLine = Spacer(START_END_NEWLINE, '\n');
        const divider = Spacer(FILE_DIVIDER_WIDTH, '█');
        const fileDivider = `//${divider}\n`;
        const startFile = `${endLine}//${space} Start of file: ${sourceFile} ${space}${endLine}${endLine}\n`;
        const content = await Bun.file(sourceFile).text();
        const endFile = `\n${endLine}${endLine}//${space} End of file: ${sourceFile} ${space}${endLine}\n`;

        return `${startFile}${content}${endFile}${fileDivider}${fileDivider}`;
    },
}

/**************************************************************************************************
 * 
 * MAIN EXECUTION AND EXPORTS
 * 
 *************************************************************************************************/

const consolidateJobs = {
    /**
     * Processes a single consolidation job. Finds files and, if any exist,
     * consolidates them into a single output file.
     * Skips the job silently if no files are found.
     * @param {ConsolidationJob} job - The consolidation job to execute.
     * @returns {Promise<number>} The number of files processed in the job.
     */
    process: async (job: ConsolidationJob): Promise<number> => {
        const { name, outputFile, patterns } = job;
        const sourceFiles = await fileSystem.findFiles(patterns, outputFile);

        if (sourceFiles.length > 0) {
            ui.logJobStart(name, outputFile);
            await fileSystem.prepareOutputFile(outputFile);

            // --- 4. Create and use the progress bar ---
            const bar = new ProgressBar('  processing [:bar] :percent :etas', {
                complete: '█',
                incomplete: '░',
                width: 40,
                total: sourceFiles.length
            });

            const allContent: string[] = [];
            for (const sourceFile of sourceFiles) {
                const content = await fileSystem.createFileContent(sourceFile);
                allContent.push(content);
                bar.tick(); // Advance the progress bar for each file
            }

            await Bun.write(outputFile, allContent.join(''));
            ui.logComplete();
            return sourceFiles.length;
        }

        return 0; // No files found for this job
    },

    /**
     * Runs all consolidation jobs, tracks the total files processed, and logs a final summary.
     * @param {config.ConsolidationJob[]} jobs - An array of consolidation jobs to execute.
     */
    run: async (jobs: ConsolidationJob[]): Promise<void> => {
        let totalFiles = 0;
        let processedJobs = 0;
        let skippedJobs = 0; // --- 5. Add counter for skipped jobs ---

        for (const job of jobs) {
            const fileCountForJob = await consolidateJobs.process(job);

            if (fileCountForJob > 0) {
                totalFiles += fileCountForJob;
                processedJobs++;
            } else {
                skippedJobs++; // --- 6. Increment if job returned 0 files ---
            }
        }

        if (totalFiles > 0) {
            // --- 7. Pass all counts to the summary function ---
            ui.logFinalSummary({ totalFiles, processedJobs, skippedJobs });
        }
    },
}

/**
 * @function main
 * @description The main entry point for the script. Initializes the UI and 
 *              starts the consolidation process.
 */
export const main = async (): Promise<void> => {
    ui.displayHeader();
    await consolidateJobs.run(config.JOBS);
};

// Executes and exports the script.
const consolidate = main;
export default consolidate;

consolidate();
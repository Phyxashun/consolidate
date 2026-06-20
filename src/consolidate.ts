#!/usr/bin/env bun
//
//~ FILE-PATH:  src/consolidate.ts

/**
 * @file consolidate.ts
 * @description A utility script to consolidate project files into single,
 * @            combined output files. The script is organized into logical
 * @            namespaces:
 * ?
 * ?            - `config`:       Defines the consolidation jobs
 * ?            - `ui`:           Handles all console output via @clack/prompts + picocolors
 * ?            - `fileSystem`:   Provides low-level functions for file system interactions
 * ?            - `consolidator`: Controls the consolidation process using the other namespaces
 * @
 * @copyright 2026 Dustin Dew
 * @license MIT
 * @author Dustin Dew <phyxashun@gmail.com>
 */

import * as p from '@clack/prompts';
import { file, sleep, write } from 'bun';
import { mkdir, rm } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import pc from 'picocolors';
import TxtToPdf from './utils/TxtToPdf';
import { generateShortId } from './utils/utils';

//* === CONSTANTS ===

const IGNORE_LIST_BASE = ['**/*.lock', 'coverage/**/*', 'node_modules/**/*', 'ALL/**/*', '.env'];
const GITIGNORE_PATH = path.resolve(process.cwd(), '.gitignore');
const OUTPUT_PATH = './ALL';
const TEXT_OUTPUT_PATH = path.join(OUTPUT_PATH, 'txt');
const TS_OUTPUT_PATH = path.join(OUTPUT_PATH, 'ts');

//* === TYPES ===

interface JobDefinition {
    name: string;
    description: string;
    include: string[];
    exclude?: string[];
}

interface ConsolidationJob extends JobDefinition {
    outputFile: string;
}

//* === CONFIGURATION ===

const JOB_DEFINITIONS: JobDefinition[] = [
    {
        name: 'SOURCE_FILES',
        description: 'Source Files (ts, js, etc.)',
        include: ['src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}', 'index.ts'],
        exclude: ['**/*.config.{ts,mts,js,mjs}', '**/*.test.ts'],
    },
    { name: 'HTML_FILES', description: 'HTML Files', include: ['**/*.html'] },
    { name: 'STYLE_FILES', description: 'Style Files (css, scss, etc.)', include: ['**/*.{css,scss,sass,less}'] },
    {
        name: 'CONFIG_FILES',
        description: 'Configuration Files',
        include: ['.gitignore', '*.json', '*.config.{ts,mts,js,mjs}', '.editorconfig', '.prettierrc', '.vscode/**/*.json'],
    },
    { name: 'TEST_FILES', description: 'Test Files', include: ['**/*.test.ts'] },
    { name: 'DOC_FILES', description: 'Documentation Files', include: ['**/*.{md,txt}', 'LICENSE'] },
];

const getGitignore = async (gitignorePath: string): Promise<string[]> => {
    const gitignoreFile = file(gitignorePath);
    if (!(await gitignoreFile.exists())) {
        return [];
    }
    const content = await gitignoreFile.text();
    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
};

const generateJobs = async (): Promise<ConsolidationJob[]> => {
    const createJobsForExtension = (outputDir: string, fileExtension: string): ConsolidationJob[] =>
        JOB_DEFINITIONS.map((def, index) => ({
            ...def,
            outputFile: path.join(outputDir, `${index + 1}_ALL_${def.name}.${fileExtension}`),
        }));

    return [...createJobsForExtension(TS_OUTPUT_PATH, 'ts'), ...createJobsForExtension(TEXT_OUTPUT_PATH, 'txt')];
};

//* === UI HELPER ===

const ui = {
    title: () => {
        p.intro(`${pc.bgMagenta(pc.black('  󰽜  󰕘 CONSOLIDATE '))}  ${pc.dim('Project File Consolidator')}`);
        p.log.message('');
    },
    header: (ignoreList: string[]) => {
        if (ignoreList.length === 0) return;

        p.box(ignoreList.join(', '), pc.dim('Ignored Patterns'), {
            titleAlign: 'center',
            width: 'auto',
            rounded: true,
        });
    },
    summary: (totalFiles: number, processedJobs: number, skippedJobs: number) => {
        let msg = `Successfully consolidated ${pc.bold(String(totalFiles))} file(s) across ${pc.bold(String(processedJobs))} job(s).`;
        if (skippedJobs > 0) {
            msg += `\n\t${pc.yellow(pc.bold(skippedJobs))} ${pc.green(pc.dim('job(s) skipped — no matching files.'))}`;
        }
        p.outro(pc.green(msg));
    },
    noFiles: () => p.outro(pc.yellow('No matching files found for any job — nothing to consolidate.')),
};

//* === FILE SYSTEM ===

const fileSystem = {
    prepareOutputFile: async (filePath: string): Promise<void> => {
        const dirPath = path.dirname(filePath);
        await mkdir(dirPath, { recursive: true });
        const outFile = file(filePath);
        if (await outFile.exists()) {
            await rm(filePath);
        }
    },
    findFiles: (patterns: string[], ignore: string[]): Promise<string[]> => {
        return glob(patterns, { ignore, nodir: true });
    },
    createFileContent: async (sourceFile: string): Promise<string> => {
        const banner = `//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ${sourceFile} ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■`;
        const footer = `//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ${sourceFile} ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■`;
        const divider = `\n//████████████████████████████████████████████████████████████████████████████████████████████████████\n//████████████████████████████████████████████████████████████████████████████████████████████████████`;
        const content = await file(sourceFile).text();
        return `\n\n${banner}\n\n\n${content}\n\n\n${footer}${divider}`;
    },
};

//* === CORE LOGIC ===

const consolidateJobs = {
    process: async (job: ConsolidationJob, ignorePatterns: string[], message?: (msg: string) => void): Promise<number> => {
        const sourceFiles = await fileSystem.findFiles(job.include, [...(job.exclude || []), ...ignorePatterns]);
        if (sourceFiles.length === 0) {
            return 0;
        }

        await fileSystem.prepareOutputFile(job.outputFile);
        const contentPromises = sourceFiles.map(sourceFile => {
            message?.(`Appending ${sourceFile}`);
            return fileSystem.createFileContent(sourceFile);
        });

        const allContent = await Promise.all(contentPromises);
        await write(job.outputFile, allContent.join(''));
        return sourceFiles.length;
    },

    run: async (jobs: ConsolidationJob[], ignoreList: string[]): Promise<void> => {
        let totalFiles = 0;
        let processedJobs = 0;
        let skippedJobs = 0;

        await p.tasks(
            jobs.map(job => ({
                title: job.description,
                task: async (message: (msg: string) => void): Promise<string> => {
                    const fileCount = await consolidateJobs.process(job, ignoreList, message);
                    if (fileCount === 0) {
                        skippedJobs++;
                        return '';
                    }
                    totalFiles += fileCount;
                    processedJobs++;
                    return `${pc.bold(String(fileCount))} file(s) → ${pc.dim(job.outputFile)}`;
                },
            })),
        );

        if (totalFiles > 0) {
            ui.summary(totalFiles, processedJobs, skippedJobs);
        } else {
            ui.noFiles();
        }
    },
};

//* === ENTRY POINT ===

p.updateSettings({
    messages: {
        cancel: 'Operation cancelled',
        error: 'An error occurred',
    },
});

const getUserInput = async (message: string): Promise<boolean> => {
    const action = await p.confirm({
        message,
        active: 'Yes',
        inactive: 'No',
    });

    if (p.isCancel(action)) {
        p.cancel();
        process.exit(0);
    }
    return action;
};

const convertToPdf = async (): Promise<void> => {
    const spin = p.spinner({
        indicator: 'timer',
        cancelMessage: 'Process cancelled',
        errorMessage: 'Process failed',
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
        delay: 80,
        styleFrame: frame => `\x1b[35m${frame}\x1b[0m`,
    });

    console.log();
    p.intro(pc.yellow(pc.inverse(`  CONVERT TXT TO PDF `)));

    const shouldContinue = await getUserInput('Do you want to proceed?');

    if (!shouldContinue) {
        p.outro(`${pc.green('Finished!')}`);
        return;
    }

    try {
        spin.start('Processing files...');
        await sleep(400);

        const txtPath = path.resolve(import.meta.dir, '../ALL/txt/1_ALL_SOURCE_FILES.txt');
        await sleep(400);

        let suffix = generateShortId();
        let outputFile = `output-${suffix}.pdf`;
        let outputPath = path.resolve(import.meta.dir, `../ALL/pdf/${outputFile}`);

        await mkdir(path.resolve(import.meta.dir, '../ALL/pdf'), { recursive: true });

        while (await Bun.file(outputPath).exists()) {
            suffix = generateShortId();
            outputFile = `output-${suffix}.pdf`;
            outputPath = path.resolve(import.meta.dir, `../ALL/pdf/${outputFile}`);
        }

        await sleep(400);

        const converter = TxtToPdf.create();
        await converter.convertTxtToPdf(txtPath, outputPath);

        spin.stop(`Conversion complete`);
        await sleep(400);
        const styledLogo = pc.red(``);

        p.box(`\n${pc.yellow(pc.bold(outputFile))}\n`, pc.green(` ${styledLogo} PDF file generated: `), {
            contentAlign: 'center',
            titleAlign: 'left',
            width: 'auto',
            rounded: true,
        });

        p.outro(`Complete!`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        spin.error(`Error generating PDF: ${errorMessage}`);
        await sleep(400);
        return;
    }
};

const main = async (): Promise<void> => {
    console.clear();

    ui.title();

    const gitignorePatterns = await getGitignore(GITIGNORE_PATH);
    const fullIgnoreList = [...new Set([...IGNORE_LIST_BASE, ...gitignorePatterns])];
    const jobs = await generateJobs();

    ui.header(fullIgnoreList);

    await consolidateJobs.run(jobs, fullIgnoreList);

    await convertToPdf();
};

if (import.meta.main) {
    await main();
}

export default main;

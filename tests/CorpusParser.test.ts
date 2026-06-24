// FILE-PATH: src/utils/CorpusParser.test.ts

import { intro, log, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import { CorpusParser } from '../src/utils/CorpusParser';
import { parsePath } from '../src/utils/utils';

export const simpleLoadCorpus = async (corpusPath: string): Promise<void> => {
    intro(chalk.bgYellow(chalk.black(chalk.bold(' 📦 LOADING CORPUS  '))));

    const parser: CorpusParser = await CorpusParser.load(corpusPath);

    for (const job of parser.job) {
        log.step(`${chalk.bold('ID Found:')} ${chalk.yellow(job.id)}`);
    }

    outro(chalk.green('✔ Corpus loaded successfully!'));
};

export const detailedLoadCorpus = async (corpusPath: string): Promise<void> => {
    const filename = parsePath(corpusPath).filename;
    log.info(`${chalk.dim('Path:')} ${chalk.blueBright(filename)}`);

    const parser: CorpusParser = await CorpusParser.load(corpusPath);

    // Using simple formatting prints perfectly without losing text frames
    console.log(chalk.cyan('\n ✨ Discovered Configuration Job IDs ✨ \n'));

    for (const job of parser.job) {
        const resolved = parser.resolveJob(job.id);

        // Print the primary Group Header cleanly
        console.log(
            `${chalk.green('│')}  ${chalk.green('✔')} ${chalk.bold('ID Found:')} ${chalk.yellow(job.id)}`,
        );

        // --- Includes Section ---
        console.log(
            `${chalk.green('│')}     ${chalk.green('✔')} ${chalk.gray('Includes:')} ${chalk.bold(chalk.yellow(job.id))}`,
        );

        for (const include of resolved.include) {
            console.log(
                `${chalk.green('│')}     \t${chalk.dim('→')} ${chalk.gray(include.toString())}`,
            );
        }

        console.log(
            `${chalk.green('│')}     \t${chalk.dim('→')} ${chalk.gray('Includes count:')} ${chalk.cyan(resolved.include.length.toString())}`,
        );
        console.log(`${chalk.green('│')}`);

        // --- Excludes Summary Section ---
        const localExcludesCount = job.exclude?.length || 0;
        const totalExcludesCount = resolved.exclude.length;

        console.log(
            `${chalk.green('│')}     ${chalk.green('✔')} ${chalk.gray('Excludes summary:')}`,
        );
        console.log(
            `${chalk.green('│')}     \t${chalk.dim('→')} ${chalk.gray('Job-specific rules:')} ${chalk.red(localExcludesCount.toString())}`,
        );
        console.log(
            `${chalk.green('│')}     \t${chalk.dim('→')} ${chalk.gray('Total (with Globals):')} ${chalk.red(totalExcludesCount.toString())}`,
        );

        // Output a clean separation line before the next job item block
        console.log(`${chalk.green('│')}\n`);
    }

    outro(chalk.green('Corpus loaded successfully!'));
};

const loadCorpus = async (corpusPath: string): Promise<void> => {
    const filename = parsePath(corpusPath).filename;
    log.info(`${chalk.dim('Path:')} ${chalk.blueBright(filename)}`);

    const parser: CorpusParser = await CorpusParser.load(corpusPath);

    for (const job of parser.job) {
        const resolved = parser.resolveJob(job.id);

        const header = `${chalk.bold('Job Definition:')} ${chalk.yellow(job.id)}`;
        const lines: string[] = [];

        // Includes Summary Section
        const localIncludesCount = job.include?.length || 0;
        const totalIncludesCount = resolved.include.length;

        lines.push(`${chalk.green('✔')} ${chalk.white('Includes summary:')}`);
        lines.push(
            `${chalk.gray('Job-specific rules:')} ${chalk.green(localIncludesCount.toString())}`,
        );
        if (job.extends && job.extends.length > 0) {
            lines.push(
                `${chalk.gray('Total (with Extensions):')} ${chalk.green(totalIncludesCount.toString())}`,
            );
        } else {
            lines.push('');
        }

        // Excludes Summary Section
        const localExcludesCount = job.exclude?.length || 0;
        const totalExcludesCount = resolved.exclude.length;

        lines.push(`${chalk.green('✔')} ${chalk.white('Excludes summary:')}`);
        lines.push(
            `${chalk.gray('Job-specific rules:')} ${chalk.cyan(localExcludesCount.toString())}`,
        );
        lines.push(
            `${chalk.gray('With global rules:')} ${chalk.cyan(totalExcludesCount.toString())}`,
        );

        const result = lines.map(line => `${line}`).join('\n');

        note(result, header, {
            format: (line: string) => {
                // Strip styling codes temporarily to perform a safe textual comparison
                const plainText = line.replace(/\x1B\[[0-9;]*m/g, '').trim();

                // Checks safely if it's an empty line or a summary header block
                if (plainText === '' || plainText.startsWith('✔')) {
                    return line;
                } else {
                    return `  ${chalk.magentaBright('→')} ${line}`;
                }
            },
        });
    }

    outro(chalk.green('✔ Corpus loaded successfully!'));
};

const main = async () => {
    const configPath = path.resolve(import.meta.dir, '../.config/corpus.toml');
    await loadCorpus(configPath);
};

await main();

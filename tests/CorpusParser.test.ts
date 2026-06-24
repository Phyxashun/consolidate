// FILE-PATH: src/utils/CorpusParser.test.ts

import { intro, log, outro, taskLog } from '@clack/prompts';
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

const loadCorpus = async (corpusPath: string): Promise<void> => {
    const filename = parsePath(corpusPath).filename;
    log.info(`${chalk.dim('Path:')} ${chalk.blueBright(filename)}`);

    const parser: CorpusParser = await CorpusParser.load(corpusPath);

    const myLog = taskLog({
        title: chalk.cyan(' ✨ Discovered Configuration Job IDs ✨ '),
    });

    for (const job of parser.job) {
        const resolved = parser.resolveJob(job.id);

        const thisGroup = myLog.group(
            `${chalk.green('✔')} ${chalk.bold('ID Found:')} ${chalk.yellow(job.id)}`,
        );

        thisGroup.message(
            `${chalk.green('✔')} ${chalk.gray('Includes:')} ${chalk.bold(chalk.yellow(job.id))}`,
        );

        for (const include of resolved.include) {
            thisGroup.message(
                `\t${chalk.dim('→')} ${chalk.gray(include.toString())}`,
            );
        }

        thisGroup.message(
            `\t${chalk.dim('→')} ${chalk.gray('Includes count:')} ${chalk.cyan(resolved.include.length.toString())}`,
        );

        thisGroup.message('');

        const localExcludesCount = job.exclude?.length || 0;
        const totalExcludesCount = resolved.exclude.length;

        thisGroup.message(
            `${chalk.green('✔')} ${chalk.gray('Excludes summary:')}`,
        );

        thisGroup.message(
            `\t${chalk.dim('→')} ${chalk.gray('Job-specific rules:')} ${chalk.red(localExcludesCount.toString())}`,
        );

        thisGroup.message(
            `\t${chalk.dim('→')} ${chalk.gray('Total (with Globals):')} ${chalk.red(totalExcludesCount.toString())}`,
        );

        thisGroup.message('');
    }

    outro(chalk.green('Corpus loaded successfully!'));
};

const main = async () => {
    const configPath = path.resolve(import.meta.dir, '../.config/corpus.toml');
    await loadCorpus(configPath);
};

await main();

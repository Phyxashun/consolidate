// FILE-PATH: src/utils/CorpusParser.test.ts

import { intro, log, outro, taskLog } from '@clack/prompts';
import path from 'path';
import pc from 'picocolors';
import type { PathInfo } from '../src/types';
import { CorpusParser } from '../src/utils/CorpusParser';

export const parsePath = (input: string | Bun.BunFile): PathInfo => {
    let normalizedPath = '';
    if (typeof input === 'string') {
        const rawString = input.replace(/\\/g, '/');
        normalizedPath = Bun.file(rawString).name || rawString;
    } else {
        normalizedPath = input.name || '';
    }

    const filename = normalizedPath.split('/').pop() || '';
    const lastDot = filename.lastIndexOf('.');

    if (lastDot <= 0) {
        return { filename, name: filename, ext: '' };
    }

    return {
        filename,
        name: filename.substring(0, lastDot),
        ext: filename.substring(lastDot),
    };
};

export const simpleLoadCorpus = async (corpusPath: string): Promise<void> => {
    intro(pc.bgYellow(pc.black(pc.bold(' 📦 LOADING CORPUS  '))));

    const parser: CorpusParser = await CorpusParser.load(corpusPath);
    console.log('\nPARSER:\n', JSON.stringify(parser, null, 4));
    for (const job of parser.job) {
        log.step(`${pc.bold('ID Found:')} ${pc.yellow(job.id)}`);
    }

    outro(pc.green('✔ Corpus loaded successfully!'));
};

const loadCorpus = async (corpusPath: string): Promise<void> => {
    //console.log('\n');
    intro(pc.bgBlue(pc.black(' 📦 LOADING CORPUS ')));

    // Dynamically parsing out the localized file name for cleaner logs
    log.info(
        `${pc.dim('Path:')} ${pc.blueBright(parsePath(corpusPath).filename)}`,
    );

    const parser: CorpusParser = await CorpusParser.load(corpusPath);

    // Initialize Clack Task Grouping structure
    const myLog = taskLog({
        title: pc.cyan(' ✨ Discovered Configuration Job IDs ✨ '),
    });

    for (const job of parser.job) {
        const resolved = parser.resolveJob(job.id);
        const thisGroup = myLog.group(
            `${pc.green('✔')} ${pc.bold('ID Found:')} ${pc.yellow(job.id)}`,
        );

        // Stringified numbers and removed trailing \n to keep Clack unicode lines intact
        thisGroup.message(
            `${pc.dim('→')} ${pc.gray('Includes count:')} ${pc.cyan(resolved.include.length.toString())}`,
        );
        thisGroup.message(
            `${pc.dim('→')} ${pc.gray('Excludes count:')} ${pc.red(resolved.exclude.length.toString())}\n`,
        );
    }

    outro(pc.green('Corpus loaded successfully!'));
};

const main = async () => {
    const configPath = path.resolve(import.meta.dir, '../.config/corpus.toml');
    await loadCorpus(configPath);
};

await main();

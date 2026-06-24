// // FILE-PATH: src/utils/CorpusParser.test.ts

// import { log, note, outro } from '@clack/prompts';
// import chalk from 'chalk';
// import type { Corpus } from '../src/types';
// import { CorpusParser } from '../src/utils/CorpusParser';
// import corpusToml from './corpus.toml';

// /**
//  * 1. Generates the lines for the Includes Summary section.
//  */
// const formatIncludesSummary = (job: any, resolved: any): string[] => {
//     const lines: string[] = [];
//     const localIncludesCount = job.include?.length || 0;
//     const totalIncludesCount = resolved.include.length;

//     lines.push(`${chalk.green('✔')} ${chalk.white('Includes summary:')}`);
//     lines.push(
//         `${chalk.gray('Job-specific rules:')} ${chalk.green(localIncludesCount.toString())}`,
//     );

//     if (job.extends && job.extends.length > 0) {
//         lines.push(
//             `${chalk.gray('Total (with Extensions):')} ${chalk.green(totalIncludesCount.toString())}`,
//         );
//     } else {
//         lines.push('');
//     }
//     return lines;
// };

// /**
//  * 2. Generates the lines for the Excludes Summary section.
//  */
// const formatExcludesSummary = (job: any, resolved: any): string[] => {
//     const lines: string[] = [];
//     const localExcludesCount = job.exclude?.length || 0;
//     const totalExcludesCount = resolved.exclude.length;

//     lines.push(`${chalk.green('✔')} ${chalk.white('Excludes summary:')}`);
//     lines.push(
//         `${chalk.gray('Job-specific rules:')} ${chalk.cyan(localExcludesCount.toString())}`,
//     );
//     lines.push(
//         `${chalk.gray('With global rules:')} ${chalk.cyan(totalExcludesCount.toString())}`,
//     );
//     return lines;
// };

// /**
//  * 3. Formatter callback that safely processes ANSI-styled log lines.
//  */
// const noteLineFormatter = (line: string): string => {
//     // Strip styling codes temporarily to perform a safe textual comparison
//     const plainText = line.replace(/\x1B\[[0-9;]*m/g, '').trim();

//     // Checks safely if it's an empty line or a summary header block
//     if (plainText === '' || plainText.startsWith('✔')) {
//         return line;
//     } else {
//         return `  ${chalk.magentaBright('→')} ${line}`;
//     }
// };

// /**
//  * Main function orchestrating the corpus load process.
//  */
// const loadCorpus = async (corpus: Corpus): Promise<void> => {
//     log.info(`${chalk.dim('Path:')} ${chalk.blueBright(corpus.name)}`);

//     const parser: CorpusParser = await CorpusParser.load(corpus);

//     for (const job of parser.job) {
//         const resolved = parser.resolveJob(job.id);
//         const header = `${chalk.bold('Job Definition:')} ${chalk.yellow(job.id)}`;

//         // Build the output arrays using our extracted helper functions
//         const lines: string[] = [
//             ...formatIncludesSummary(job, resolved),
//             ...formatExcludesSummary(job, resolved)
//         ];

//         const result = lines.join('\n');

//         note(result, header, {
//             format: noteLineFormatter,
//         });
//     }

//     outro(chalk.green('✔ Corpus loaded successfully!'));
// };

// const main = async () => {
//     await loadCorpus(corpusToml);
// };

// await main();

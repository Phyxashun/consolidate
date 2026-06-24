// FILE-PATH: src/utils/CorpusParser.test.ts

import { log, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import type { FilesConfig, Job, JobDefinition } from '../src/config';
import filesToml from '../src/config/files.toml';
import { FilesParser } from '../src/utils/FilesParser';

/**
 * Generates the lines for the Includes Summary section.
 */
const formatIncludesSummary = (job: JobDefinition, resolved: Job): string[] => {
  const lines: string[] = [];
  const localIncludesCount = job.includes?.length || 0;
  const totalIncludesCount = resolved.includes.length;

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
  return lines;
};

/**
 * Generates the lines for the Excludes Summary section.
 */
const formatExcludesSummary = (job: JobDefinition, resolved: Job): string[] => {
  const lines: string[] = [];
  const localExcludesCount = job.excludes?.length || 0;
  const totalExcludesCount = resolved.excludes.length;

  lines.push(`${chalk.green('✔')} ${chalk.white('Excludes summary:')}`);
  lines.push(
    `${chalk.gray('Job-specific rules:')} ${chalk.cyan(localExcludesCount.toString())}`,
  );
  lines.push(
    `${chalk.gray('With global rules:')} ${chalk.cyan(totalExcludesCount.toString())}`,
  );
  return lines;
};

/**
 * Formatter callback that safely processes ANSI-styled log lines.
 */
const noteLineFormatter = (line: string): string => {
  // Strip styling codes temporarily to perform a safe textual comparison
  const plainText = line.replace(/\x1B\[[0-9;]*m/g, '').trim();

  // Checks safely if it's an empty line or a summary header block
  if (plainText === '' || plainText.startsWith('✔')) {
    return line;
  } else {
    return `  ${chalk.magentaBright('→')} ${line}`;
  }
};

/**
 * Main function orchestrating the corpus load process.
 */
const loadCorpus = (files: FilesConfig): void => {
  log.info(`${chalk.dim('Path:')} ${chalk.blueBright(files.name)}`);

  const parser: FilesParser = FilesParser.load(files);

  for (const job of parser.job) {
    const resolved = parser.resolveJob(job.id);
    const header = `${chalk.bold('Job Definition:')} ${chalk.yellow(job.id)}`;

    // Build the output arrays using our extracted helper functions
    const lines: string[] = [
      ...formatIncludesSummary(job, resolved),
      ...formatExcludesSummary(job, resolved)
    ];

    const result = lines.join('\n');

    note(result, header, {
      format: noteLineFormatter,
    });
  }

  outro(chalk.green('✔ Corpus loaded successfully!'));
};

const main = () => {
  loadCorpus(filesToml);
};

main();

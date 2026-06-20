// FILE-PATH: src/components/sever.ts

import pc from 'picocolors';
import { FileExtractor } from '../utils/FileExtractor';
import { Settings } from '../utils/Settings';
import { TUI } from './TUI';

export async function runDeconsolidate(args: string[]): Promise<void> {
    const settings = await Settings.Instance.load();
    const ui = new TUI(settings);
    const dConfig = settings.deconsolidate;
    const msg = settings.messages.deconsolidate;

    const hasFlag = (f: string) => args.includes(f);
    if (hasFlag('-h') || hasFlag('--help')) {
        console.log(msg.helpText);
        return;
    }

    const isDryRun = hasFlag('-n') || hasFlag('--dry-run');
    const isVerbose = hasFlag('-v') || hasFlag('--verbose');
    const forceOverwrite = hasFlag('-f') || hasFlag('--force');

    const customPaths = args.filter(arg => !arg.startsWith('-'));
    const inputPatterns =
        customPaths.length > 0
            ? customPaths
            : [dConfig.defaultInputPathPattern];

    ui.renderHeader('deconsolidate', pc.bgCyan);
    ui.startSpinner(msg.scanning as string);

    const extractor = new FileExtractor(settings.consolidate);
    const combinedFiles = await extractor.scanInputPatterns(inputPatterns);

    const scanSummary = (msg.scanFound as string).replace(
        '{count}',
        combinedFiles.length.toString(),
    );
    ui.stopSpinner(scanSummary, true);

    if (combinedFiles.length === 0) {
        ui.renderAborted();
        return;
    }

    if (
        !forceOverwrite &&
        !isDryRun &&
        (await Bun.file(dConfig.defaultOutputDir).exists())
    ) {
        const overwritePrompt = (msg.overwritePrompt as string).replace(
            '{dir}',
            dConfig.defaultOutputDir,
        );
        if (!(await ui.askConfirmation(overwritePrompt))) {
            ui.renderAborted();
            return;
        }
    }

    let written = 0,
        skipped = 0;

    for (const file of combinedFiles) {
        const combinedText = await Bun.file(file).text();
        const extractedBlocks = extractor.parseContent(combinedText);

        for (const block of extractedBlocks) {
            if (isDryRun) {
                if (isVerbose)
                    ui.traceAction(
                        'deconsolidate',
                        'dryRun',
                        'TEST', //msg.traces.dryRun,
                        block.filePath,
                    );
                written++;
                continue;
            }

            if (
                (await Bun.file(
                    `${dConfig.defaultOutputDir}/${block.filePath}`,
                ).exists()) &&
                !forceOverwrite
            ) {
                if (isVerbose)
                    ui.traceAction(
                        'deconsolidate',
                        'skipped',
                        'TEST', //msg.traces.skipped,
                        block.filePath,
                    );
                skipped++;
                continue;
            }

            await extractor.writeExtractedFile(dConfig.defaultOutputDir, block);
            if (isVerbose)
                ui.traceAction(
                    'deconsolidate',
                    'writing',
                    'TEST', //msg.traces.writing,
                    block.filePath,
                );
            written++;
        }
    }

    const summaryMsg = isDryRun
        ? msg.dryRunWarning
        : `Files Written: ${written}\nFiles Skipped: ${skipped}`;
    ui.renderSummaryBox(
        'deconsolidate',
        'Deconsolidation Complete',
        summaryMsg as string,
    );
    ui.renderFooter((msg.done as string) || 'Finished!');
}

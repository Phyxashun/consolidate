// FILE-PATH: src/components/graft.ts

import pc from 'picocolors';
import { FileProcessor } from '../utils/FileProcessor';
import { FileScanner } from '../utils/FileScanner';
import { Settings } from '../utils/Settings';
import { CliUI } from './TUI';

export async function runConsolidate(): Promise<void> {
    const settings = await Settings.Instance.load();
    const ui = new CliUI(settings);
    const msg = settings.messages.consolidate;

    ui.renderHeader('consolidate', pc.bgMagenta);

    if (!(await ui.askConfirmation(msg.proceedPrompt as string))) {
        ui.renderAborted();
        return;
    }

    ui.startSpinner(msg.spinnerStart as string);

    try {
        const cConfig = settings.consolidate;
        const scanner = new FileScanner(cConfig);
        const processor = new FileProcessor(cConfig, settings.ui.layouts);

        const globalIgnores = await scanner.getIgnorePatterns();
        let totalFilesProcessed = 0;

        for (const job of cConfig.jobs) {
            const files = await scanner.scanJobFiles(
                job.include,
                job.exclude,
                globalIgnores,
            );
            if (files.length === 0) continue;

            const blocks: string[] = [];
            for (const file of files) {
                ui.updateSpinner(`${msg.appendTrace}${file}`);
                blocks.push(await processor.createBlock(file));
                totalFilesProcessed++;
            }

            const targetPath = `${cConfig.outputPath}/${cConfig.subDirs.text}/${job.name.toLowerCase()}.txt`;
            await processor.writeConsolidatedFile(targetPath, blocks);
        }

        ui.stopSpinner(msg.spinnerSuccess as string, true);
        ui.renderSummaryBox(
            'consolidate',
            'Processing Summary',
            `Total Files Consolidated: ${totalFilesProcessed}`,
        );
        ui.renderFooter(msg.done as string);
    } catch (error) {
        ui.stopSpinner(msg.spinnerError as string, false);
        throw error;
    }
}

// FILE-PATH: src/components/graft.ts

import pc from 'picocolors';
import { FileProcessor } from '../utils/FileProcessor';
import { FileScanner } from '../utils/FileScanner';
import { Settings } from '../utils/Settings';
import { UserInterface } from './UserInterface';

const graft = async (): Promise<void> => {
    const settings = await Settings.Instance.load();
    const ui = new UserInterface(settings);
    const msg = settings.messages.graft;

    ui.renderHeader('graft', pc.bgMagenta);

    if (!(await ui.askConfirmation(msg.proceedPrompt as string))) {
        ui.renderAborted();
        return;
    }

    ui.startSpinner(msg.spinnerStart as string);

    try {
        const config = settings.graft;
        const scanner = new FileScanner(config);
        const processor = new FileProcessor(config, settings.ui.layouts);

        const globalIgnores = await scanner.getIgnorePatterns();
        let totalFilesProcessed = 0;

        for (const job of config.jobs) {
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

            const targetPath = `${config.outputPath}/${config.subDirs.text}/${job.name.toLowerCase()}.txt`;
            await processor.writeGraftedFile(targetPath, blocks);
        }

        ui.stopSpinner(msg.spinnerSuccess as string, true);
        ui.renderSummaryBox(
            'graft',
            'Processing Summary',
            `Total Files Graftd: ${totalFilesProcessed}`,
        );
        ui.renderFooter(msg.done as string);
    } catch (error) {
        ui.stopSpinner(msg.spinnerError as string, false);
        throw error;
    }
};

export default graft;

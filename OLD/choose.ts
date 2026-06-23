#!/usr/bin/env bun
// ~ FILE-PATH: src/choose.ts

import {
    cancel,
    confirm,
    intro,
    isCancel,
    outro,
    select,
    spinner,
    text,
} from '@clack/prompts';
import pc from 'picocolors';
import { Settings } from './Settings';

async function main() {
    console.clear();
    intro(pc.bgCyan(pc.black(' Configuration Builder ')));

    const manager = Settings.Instance;
    const config = await manager.load();

    const exit = (): never => {
        cancel(pc.red('Operation cancelled.'));
        process.exit(0);
    };

    // --- App Info ---
    const appName = await text({
        message: 'App Name:',
        initialValue: config.appName,
    });
    if (isCancel(appName)) exit();

    // --- Consolidate Settings ---
    const outputDir = await text({
        message: 'Consolidation Output Directory:',
        initialValue: config.consolidate.outputDir,
    });
    if (isCancel(outputDir)) exit();

    // Multiselect for Ignore List (assuming a predefined list or manual entry)
    // Note: For complex lists, you might use text prompts in a loop

    // --- PDF Settings ---
    const fontSize = await text({
        message: 'PDF Font Size:',
        initialValue: String(config.pdf.fontSize),
        validate: v => (isNaN(Number(v)) ? 'Must be a number' : undefined),
    });
    if (isCancel(fontSize)) exit();

    const pageSize = await select({
        message: 'PDF Page Size:',
        initialValue: config.pdf.pageSize,
        options: [
            { value: 'A4', label: 'A4' },
            { value: 'LETTER', label: 'Letter' },
        ],
    });
    if (isCancel(pageSize)) exit();

    const notifications = await confirm({
        message: 'Enable push notifications?',
        initialValue: config.notifications,
    });
    if (isCancel(notifications)) exit();

    // --- Save Logic ---
    const s = spinner();
    s.start(pc.blue('Saving configuration...'));

    // Applying the mapped settings back to the config object structure
    await manager.save({
        appName: appName as string,
        consolidate: { ...config.consolidate, outputDir: outputDir as string },
        pdf: {
            ...config.pdf,
            fontSize: Number(fontSize),
            pageSize: pageSize as string,
        },
        notifications: notifications as boolean,
    });

    s.stop(pc.green('Configuration saved successfully!'));
    outro(pc.cyan('Setup complete.'));
}

main();

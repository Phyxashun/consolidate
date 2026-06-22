#!/usr/bin/env bun

// FILE-PATH: src/index.ts

import { isCancel, outro, select } from '@clack/prompts';
import pc from 'picocolors';
import { runConsolidate } from './components/graft';
import { runSettingsApp } from './components/settingsMenu';
import { runDeconsolidate } from './components/sever';
import { TUI } from './components/TUI';
import { Settings } from './utils/Settings';

async function main(settings: Config) {
    while (true) {
        const ui = new TUI(settings);
        const indexTheme: ThemeConfig['index'] = settings.ui.theme.index;
        const indexPrompts: PromptsConfig['index'] = settings.messages.index;

        const bg: ColorFunction =
            pc[indexTheme.bannerBg as keyof typeof pc] || pc.bgYellow;

        ui.renderHeader('consolidate', bg);

        const choice = await select({
            message: indexPrompts.menuMessage,
            options: Object.entries(indexPrompts.choices).map(
                ([key, value]) => ({
                    value: key,
                    label: value.label,
                    hint: value.hint,
                }),
            ),
        });

        if (isCancel(choice) || choice === 'exit') {
            outro(pc.yellow(settings.messages.shared.aborted));
            break;
        }

        switch (choice) {
            case 'consolidate':
                await runConsolidate();
                break;
            case 'deconsolidate':
                await runDeconsolidate(process.argv.slice(2));
                break;
            case 'settings':
                await runSettingsApp();
                break;
        }

        console.log('\n');
    }
}

const SETTINGS = await Settings.Instance.load();

main(SETTINGS).catch(err => {
    console.error(pc.red('Fatal runtime exception encountered:'), err);
    process.exit(1);
});

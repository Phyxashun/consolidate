// FILE-PATH: src/components/settingsMenu.ts

import { intro, isCancel, outro, select, text } from '@clack/prompts';
import pc from 'picocolors';
import { Settings } from '../utils/Settings';

const settingsMenu = async (): Promise<void> => {
    const store = Settings.Instance;
    const config = await store.load();

    intro(pc.bgBlue(pc.black(' CONFIGURATION EDITOR ')));

    while (true) {
        const choice = await select({
            message: 'Select an aspect to configure:',
            options: [
                {
                    value: 'outputPath',
                    label: 'Output Directory Path',
                    hint: config.graft.outputPath,
                },
                {
                    value: 'bannerSpacer',
                    label: 'Banner Pattern Character Divider',
                    hint: 'Modify boundary strings',
                },
                {
                    value: 'boxAlignment',
                    label: 'UI Summary Box Alignment',
                    hint: config.ui.layouts.boxAlignment,
                },
                { value: 'back', label: '<-- Return to Main Menu' },
            ],
        });

        if (isCancel(choice) || choice === 'back') break;

        if (choice === 'outputPath') {
            const val = await text({
                message: 'Enter new consolidation output directory:',
                placeholder: config.graft.outputPath,
            });
            if (!isCancel(val) && val.trim()) {
                config.graft.outputPath = val.trim();
                await store.save(config);
            }
        } else if (choice === 'bannerSpacer') {
            const val = await text({
                message: 'Enter boundary spacer symbol string:',
                placeholder: 'e.g. ■■■■',
            });
            if (!isCancel(val) && val.trim()) {
                config.graft.bannerSpacer = val.trim();
                await store.save(config);
            }
        } else if (choice === 'boxAlignment') {
            const align = await select({
                message: 'Pick layout alignment:',
                options: [
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                ],
            });
            if (!isCancel(align)) {
                config.ui.layouts.boxAlignment = align;
                await store.save(config);
            }
        }
    }
    outro(pc.blue('Configuration modifications written to disk files.'));
};

export default settingsMenu;

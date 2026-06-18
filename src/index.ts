#!/usr/bin/env bun
// ~ FILE-PATH: index.ts

/**
 * @file index.ts
 * @description Entry point for the consolidate/deconsolidate CLI toolkit.
 *              Presents an interactive menu (via @clack/prompts) and
 *              dispatches to the selected operation.
 * @copyright 2026 Dustin Dew
 * @license MIT
 * @author Dustin Dew <phyxashun@gmail.com>
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import consolidate from './src/consolidate';
import deconsolidate from './src/deconsolidate';

type MenuChoice = 'consolidate' | 'deconsolidate' | 'exit';

/**
 * @function main
 * @description Displays the main menu and routes to the chosen operation.
 */
const main = async (): Promise<void> => {
    p.intro(`${pc.bgYellow(pc.black(' CONSOLIDATE '))}  ${pc.dim('Project File Toolkit')}`);

    const action = await p.select<MenuChoice>({
        message: 'Pick an option:',
        options: [
            { value: 'consolidate', label: 'Consolidate', hint: 'merge project files into ALL/' },
            { value: 'deconsolidate', label: 'Deconsolidate', hint: 'rebuild files from ALL/' },
            { value: 'exit', label: 'Exit' },
        ],
    });

    if (p.isCancel(action)) {
        p.cancel('Aborted.');
        process.exit(0);
    }

    switch (action) {
        case 'consolidate':
            await consolidate();
            break;
        case 'deconsolidate':
            await deconsolidate();
            break;
        case 'exit':
            p.outro(pc.dim('Goodbye!'));
            process.exit(0);
    }
};

await main();

export { main, consolidate, deconsolidate };

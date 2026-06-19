#!/usr/bin/env bun

// ~ FILE-PATH: src/index.ts

/**
 * @file index.ts
 * @description Entry point for the consolidate/deconsolidate CLI toolkit.
 *              Presents an interactive menu (via @clack/prompts) and
 *              dispatches to the selected operation.
 * @copyright 2026 Dustin Dew
 * @license MIT
 * @author Dustin Dew <phyxashun@gmail.com>
 */

import { cancel, intro, isCancel, log, select } from '@clack/prompts';
import { bgYellow, black, cyan, dim, italic } from 'picocolors';

import consolidate from './components/consolidate';
import deconsolidate from './components/deconsolidate';

/**
 * @type MenuChoice
 * @description Defines the structure of the userInput menu
 * @property {'consolidate' | 'deconsolidate' | 'exit'}
 */
type MenuChoice = 'consolidate' | 'deconsolidate' | 'exit';

const TITLE = bgYellow(black(' CONSOLIDATE '));
const SUBTITLE = dim(italic('Project File Toolkit'));

/**
 * @function displayTitle
 * @description Displays the main app title and subtitle.
 */
const displayTitle = (): void => {
    console.clear();
    intro(`${TITLE}  ${SUBTITLE}`);
};

/**
 * @function mainMenu(): symbol | MenuChoice | null
 * @description Displays the main app title and subtitle.
 * @returns userInput The user's selection from the menu
 */
const mainMenu = async (): Promise<symbol | MenuChoice | null> => {
    const userInput = await select<MenuChoice>({
        message: `${cyan('Pick an option:')}`,
        options: [
            {
                value: 'consolidate',
                label: 'Consolidate',
                hint: 'merge project files into ALL/',
            },
            {
                value: 'deconsolidate',
                label: 'Deconsolidate',
                hint: 'rebuild files from ALL/',
            },
            {
                value: 'exit',
                label: 'Exit',
            },
        ],
    });

    if (isCancel(userInput) || userInput === 'exit') {
        return null;
    }

    return userInput;
};

/**
 * @function main
 * @description Displays the main menu and routes to the chosen operation.
 */
export const main = async (): Promise<void> => {
    let keepAsking = true;
    displayTitle();

    while (keepAsking) {
        const action = await mainMenu();

        switch (action) {
            case 'consolidate':
                await consolidate();
                break;
            case 'deconsolidate':
                await deconsolidate();
                break;
            case null:
            default:
                cancel('Aborted.');
                keepAsking = false;
        }
    }
};

if (import.meta.main) {
    try {
        await main();
    } catch (err: unknown) {
        log.error(`Error: ${err}`);
        process.exit(1);
    }
}

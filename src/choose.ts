#!/usr/bin/env bun
//
// ~ FILE-PATH: src/choose.ts

import { intro, outro, select, confirm, isCancel, cancel, spinner } from '@clack/prompts';
import pc from 'picocolors';
import * as fs from 'node:fs';
import * as path from 'node:path';

// 1. Define your interface for combined settings
interface AppConfig {
    appName: string;
    version: string;
    theme: string;
    notifications: boolean;
}

// 2. Application specific defaults (these won't be overwritten)
const APP_DEFAULTS: Omit<AppConfig, 'theme' | 'notifications'> = {
    appName: 'My Bun CLI App',
    version: '1.0.0',
};

// 3. Setup paths
const CONFIG_DIR = path.join(process.cwd(), '.config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 4. Helper to load or initialize settings
function loadSettings(): AppConfig {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const rawData = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(rawData) as AppConfig;
        } catch (e: unknown) {
            console.error(pc.red(`Error parsing config.json; resetting to defaults. ${e}`));
        }
    }

    // Default configuration if the file doesn't exist
    const defaultSettings: AppConfig = {
        ...APP_DEFAULTS,
        theme: 'dark',
        notifications: true,
    };

    // Save the initial config file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
}

// 5. Main CLI flow
async function main() {
    console.clear();

    intro(pc.bgCyan(pc.black(' Welcome to the Config Builder ')));

    const currentConfig = loadSettings();

    // 6. Prompt menu
    console.log(pc.yellow('\n--- User Settings ---'));

    const theme = await select({
        message: 'Pick a UI theme:',
        initialValue: currentConfig.theme,
        options: [
            { value: 'dark', label: 'Dark Mode' },
            { value: 'light', label: 'Light Mode' },
            { value: 'matrix', label: 'Matrix' },
        ],
    });
    if (isCancel(theme)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const notifications = await confirm({
        message: 'Enable push notifications?',
        initialValue: currentConfig.notifications,
    });
    if (isCancel(notifications)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    // 7. Save Settings
    const updatedConfig: AppConfig = {
        ...currentConfig,
        theme: theme as string,
        notifications: notifications as boolean,
    };

    const s = spinner();
    s.start('Saving your configuration');

    // Write using native Bun IO or Node's fs
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
    s.stop('Configuration saved successfully!');

    outro(pc.green('You are all set! Goodbye.'));
}

main();

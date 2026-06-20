#!/usr/bin/env bun

// FILE-PATH: src/choose.ts

import { cancel, groupMultiselect, intro, isCancel, outro, select, spinner, text } from '@clack/prompts';
import pc from 'picocolors';

// 1. Precise Interface
interface AppConfig {
    appName: string;
    version: string;
    port: number;
    host: string;
    mode: 'development' | 'production';
    features: string[];
    database: {
        type: 'postgres' | 'mysql' | 'mongodb';
        url: string;
    };
    theme: string;
    notifications: boolean;
}

const CONFIG_FILE = `${process.cwd()}/.config/config.json`;

// 2. Load/Save with typed returns
async function loadSettings(): Promise<AppConfig> {
    const defaults: AppConfig = {
        appName: 'My Bun CLI App',
        version: '1.0.0',
        port: 3000,
        host: 'localhost',
        mode: 'development',
        features: [],
        database: { type: 'postgres', url: 'postgresql://user:pass@localhost:5432/db' },
        theme: 'dark',
        notifications: true,
    };

    const file = Bun.file(CONFIG_FILE);

    if (!(await file.exists())) {
        return defaults;
    }

    try {
        const savedData = await file.json();
        // Merge the saved data into defaults to ensure all properties exist
        return {
            ...defaults,
            ...savedData,
            database: { ...defaults.database, ...savedData.database },
        };
    } catch {
        return defaults;
    }
}

async function saveSettings(config: AppConfig): Promise<void> {
    await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 4));
}

async function main() {
    console.clear();
    intro(pc.bgCyan(pc.black(' Configuration Builder ')));

    const currentConfig = await loadSettings();

    // 3. Strict Exit Handler
    const exit = (): never => {
        cancel(pc.red('Operation cancelled.'));
        process.exit(0);
    };

    // 4. Prompting with explicit typing
    const portInput = await text({ message: 'Port:', initialValue: String(currentConfig.port) });
    if (isCancel(portInput)) exit();

    const host = await text({ message: 'Host:', initialValue: currentConfig.host });
    if (isCancel(host)) exit();

    const mode = (await select({
        message: 'Select mode:',
        initialValue: currentConfig.mode,
        options: [
            { value: 'development', label: 'Development' },
            { value: 'production', label: 'Production' },
        ],
    })) as 'development' | 'production' | symbol;
    if (isCancel(mode)) exit();

    const dbType = (await select({
        message: 'Database:',
        initialValue: currentConfig.database.type,
        options: [
            { value: 'postgres', label: 'PostgreSQL' },
            { value: 'mysql', label: 'MySQL' },
            { value: 'mongodb', label: 'MongoDB' },
        ],
    })) as 'postgres' | 'mysql' | 'mongodb' | symbol;
    if (isCancel(dbType)) exit();

    const dbUrl = await text({ message: 'DB URL:', initialValue: currentConfig.database.url });
    if (isCancel(dbUrl)) exit();

    const features = (await groupMultiselect({
        message: 'Features:',
        initialValues: currentConfig.features,
        options: {
            Security: [
                { value: 'auth', label: 'Auth' },
                { value: 'cors', label: 'CORS' },
            ],
            Monitoring: [
                { value: 'logging', label: 'Logging' },
                { value: 'metrics', label: 'Metrics' },
            ],
        },
    })) as string[] | symbol;
    if (isCancel(features)) exit();

    // 5. Build config with strict types
    const updatedConfig: AppConfig = {
        ...currentConfig,
        port: parseInt(portInput as string),
        host: host as string,
        mode: mode as 'development' | 'production',
        database: { type: dbType as 'postgres' | 'mysql' | 'mongodb', url: dbUrl as string },
        features: features as string[],
    };

    const s = spinner();
    s.start(pc.blue('Saving settings...'));
    await saveSettings(updatedConfig);
    s.stop(pc.green('Saved!'));

    outro(pc.cyan('Done.'));
}

main();

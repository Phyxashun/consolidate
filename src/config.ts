//~ FILE-PATH: src/config.ts

import { Glob } from 'bun';
import { homedir } from 'os';
import { join } from 'path';

export interface AppConfig {
    ignorePatterns: string[];
    outputDir: string;
    updatedAt?: string;
}

export class Settings {
    static #instance: Settings;

    public static readonly APP_NAME = 'consolidate';
    public static readonly CONFIG_PATH = process.env.APPDATA ? process.env.APPDATA : join(homedir(), '.config');

    private readonly configFilePath = join(Settings.CONFIG_PATH, Settings.APP_NAME, 'config.json');
    private readonly gitignorePath = join(process.cwd(), '.gitignore');

    private config: AppConfig = {
        ignorePatterns: ['*.lock'],
        outputDir: 'ALL',
    };

    private constructor() {
        this.load();
    }

    public static get instance(): Settings {
        if (!Settings.#instance) {
            Settings.#instance = new Settings();
        }

        return Settings.#instance;
    }

    async load(): Promise<AppConfig> {
        try {
            // Load standard settings JSON
            const file = Bun.file(this.configFilePath);
            if (await file.exists()) {
                const data = await file.json();
                this.config = { ...this.config, ...data };
            }
        } catch (e: unknown) {
            console.error(`Error: ${e}.\nFailed to parse config file, using defaults.`);
        }

        // Automatically ingest .gitignore rules dynamically into runtime state
        await this.importGitignore();

        return this.config;
    }

    private async importGitignore(): Promise<void> {
        try {
            const gitignoreFile = Bun.file(this.gitignorePath);
            if (!(await gitignoreFile.exists())) return;

            const content = await gitignoreFile.text();

            // Split by line breaks to inspect individual rules
            const lines = content.split(/\r?\n/);
            const gitignorePatterns: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();

                // Skip blank lines and comment rows
                if (!trimmed || trimmed.startsWith('#')) continue;

                // Normalize gitignore directory trailing slashes
                const cleanPattern = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;

                gitignorePatterns.push(cleanPattern);
            }

            // Merge gitignore rules into our core array while removing duplicates
            this.config.ignorePatterns = Array.from(new Set([...this.config.ignorePatterns, ...gitignorePatterns]));
        } catch (error) {
            console.warn('Could not read or parse .gitignore file:', error);
        }
    }

    get ignorePatterns(): string[] {
        return this.config.ignorePatterns;
    }

    async save(updates: Partial<AppConfig>): Promise<void> {
        this.config = {
            ...this.config,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await Bun.write(this.configFilePath, JSON.stringify(this.config, null, 2));
    }

    getIgnoreGlobs(): Glob[] {
        return this.config.ignorePatterns.map(pattern => {
            // Format edge-case indicators or map extensions into full recursive wildcards
            const prefix = pattern.startsWith('**/') || pattern.includes('/') ? '' : '**/';
            return new Glob(`${prefix}${pattern}`);
        });
    }
}
//********************************************************** */
// import { SettingsManager } from './SettingsManager';

// const settings = new SettingsManager();
// await settings.load(); // Automatically updates array with clean .gitignore values!

// const projectScanner = new Glob('**/*');
// const allIgnoreMatchers = settings.getIgnoreGlobs();

// for await (const file of projectScanner.scan('.')) {
//     // If the file matches a user choice OR a .gitignore entry, skip it
//     const shouldIgnore = allIgnoreMatchers.some(matcher => matcher.match(file));

//     if (shouldIgnore) continue;

//     console.log(`Processing valid file: ${file}`);
// }
//****************************************************** */
// import * as p from '@clack/prompts';
// import { SettingsManager } from './SettingsManager';

// const settings = new SettingsManager();
// await settings.load(); // Seed state on startup

// // Display prompt
// const chosen = await p.multiselect({
//     message: 'Select file types to ignore:',
//     initialValues: settings.ignorePatterns, // Automatically populates their previous choices!
//     options: [
//         { value: '*.lock', label: 'Lock Files' },
//         { value: '*.log', label: 'Log Files' },
//     ],
// });

// if (!p.isCancel(chosen)) {
//     await settings.save({ ignorePatterns: chosen as string[] });
// }
//*************************************************** */
// import { SettingsManager } from './SettingsManager';

// const settings = new SettingsManager();
// await settings.load();

// const sourceGlob = new Glob('**/*');
// const ignoreMatchers = settings.getIgnoreGlobs();

// for await (const file of sourceGlob.scan('.')) {
//     // Check if the current file matches any of our ignore globs
//     const shouldIgnore = ignoreMatchers.some(matcher => matcher.match(file));

//     if (shouldIgnore) continue;

//     // Process your valid files here...
//     console.log(`Processing: ${file}`);
// }

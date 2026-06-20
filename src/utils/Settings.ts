// FILE-PATH: src/utils/Settings.ts

import type { Config, Prompts } from '../types';

const DEFAULT_CONFIG: Omit<Config, 'ui' | 'messages'> = {
    cli: { title: 'graft.js', subTitle: '', version: '1.0.0' },
    consolidate: {
        outputPath: './ALL',
        subDirs: { text: 'txt', ts: 'ts' },
        baseIgnorePatterns: [
            '**/*.lock',
            'coverage/**/*',
            'node_modules/**/*',
            'ALL/**/*',
            '.env',
        ],
        bannerSpacer: '■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■',
        jobs: [
            {
                name: 'SOURCE_FILES',
                description: 'Source Files (ts, js, etc.)',
                include: [
                    'src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}',
                    'index.ts',
                ],
                exclude: ['**/*.config.{ts,mts,js,mjs}', '**/*.test.ts'],
            },
            {
                name: 'DOC_FILES',
                description: 'Documentation Files',
                include: ['**/*.{md,txt}', 'LICENSE'],
            },
        ],
    },
    deconsolidate: {
        defaultOutputDir: './ALL_REBUILT',
        defaultInputPathPattern: 'ALL/txt/**/*.txt',
    },
};

const DEFAULT_THEME: Config['ui'] = {
    symbols: {
        headerGlyphs: '  󰽜  󰕘 ',
        dryRun: '~',
        writing: '→',
        skipped: '⊘',
        success: '✓',
    },
    layouts: {
        boxAlignment: 'center',
        boxWidth: 'auto',
        boxRounded: true,
        fileDivider: '\n//██████████\n//██████████',
    },
    theme: {
        index: {
            bannerBg: 'bgYellow',
            bannerFg: 'black',
            subtitle: 'dim,italic',
            menuPrompt: 'cyan',
        },
        consolidate: {
            bannerBg: 'bgMagenta',
            bannerFg: 'black',
            boxHeader: 'dim',
            success: 'green',
            warning: 'yellow',
            empty: 'yellow',
        },
        deconsolidate: {
            bannerBg: 'bgCyan',
            bannerFg: 'black',
            boxHeader: 'dim',
            dryRunIndicator: 'gray',
            writingIndicator: 'blue',
            skippedIndicator: 'yellow',
        },
    },
};

const DEFAULT_PROMPTS: Prompts = {
    shared: {
        confirmActive: 'Yes',
        confirmInactive: 'No',
        aborted: 'Aborted.',
    },
    index: {
        menuMessage: 'Pick an option:',
        choices: {
            consolidate: { label: 'Consolidate', hint: 'merge project files' },
            deconsolidate: { label: 'Deconsolidate', hint: 'rebuild files' },
            settings: { label: 'Settings', hint: 'configure toolkit' },
            exit: { label: 'Exit' },
        },
    },
    consolidate: {
        proceedPrompt: 'Do you want to proceed?',
        spinnerStart: 'Processing files...',
        appendTrace: 'Appending ',
        spinnerSuccess: 'Conversion complete',
        spinnerError: 'Process failed',
        done: 'Complete!',
    },
    deconsolidate: {
        scanning: 'Scanning for input files...',
        scanFound: 'Found {count} file(s).',
        dryRunWarning: 'DRY-RUN mode active.',
        overwritePrompt: 'Output directory exists. Continue?',
        traces: {
            dryRun: ' DRY-RUN: ',
            writing: ' Writing: ',
            skipped: ' Skipped: ',
        },
        done: 'Finished!',
    },
};

export class Settings {
    private static instance: Settings;
    private readonly APP_PATH = `${process.cwd()}/.config/appconfig.json`;
    private readonly THEME_PATH = `${process.cwd()}/.config/theme.json`;
    private readonly PROMPTS_PATH = `${process.cwd()}/.config/prompts.json`;

    static get Instance(): Settings {
        if (!this.instance) this.instance = new Settings();
        return this.instance;
    }

    async load(): Promise<Config> {
        const appFile = Bun.file(this.APP_PATH);
        const themeFile = Bun.file(this.THEME_PATH);
        const promptsFile = Bun.file(this.PROMPTS_PATH);

        const appData = (await appFile.exists())
            ? await appFile.json()
            : DEFAULT_CONFIG;
        const themeData = (await themeFile.exists())
            ? await themeFile.json()
            : DEFAULT_THEME;
        const promptsData = (await promptsFile.exists())
            ? await promptsFile.json()
            : DEFAULT_PROMPTS;

        return { ...appData, ui: themeData, messages: promptsData };
    }

    async save(updates: Partial<Config>): Promise<void> {
        const current = await this.load();
        const merged = { ...current, ...updates };
        const { ui, messages, ...appconfig } = merged;

        await Bun.write(this.APP_PATH, JSON.stringify(appconfig, null, 2));
        await Bun.write(this.THEME_PATH, JSON.stringify(ui, null, 2));
        await Bun.write(this.PROMPTS_PATH, JSON.stringify(messages, null, 2));
    }
}

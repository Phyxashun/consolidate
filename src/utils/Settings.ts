// FILE-PATH: src/utils/Settings.ts

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
        graft: {
            bannerBg: 'bgMagenta',
            bannerFg: 'black',
            boxHeader: 'dim',
            success: 'green',
            warning: 'yellow',
            empty: 'yellow',
        },
        sever: {
            bannerBg: 'bgCyan',
            bannerFg: 'black',
            boxHeader: 'dim',
            dryRunIndicator: 'gray',
            writingIndicator: 'blue',
            skippedIndicator: 'yellow',
        },
    },
};

const DEFAULT_PROMPTS: Config['messages'] = {
    shared: {
        confirmActive: 'Yes',
        confirmInactive: 'No',
        aborted: 'Aborted.',
    },
    index: {
        menuMessage: 'Pick an option:',
        choices: {
            graft: { label: 'Graft', hint: 'merge project files' },
            sever: { label: 'Sever', hint: 'rebuild files' },
            settings: { label: 'Settings', hint: 'configure toolkit' },
            exit: { label: 'Exit' },
        },
    },
    graft: {
        proceedPrompt: 'Do you want to proceed?',
        spinnerStart: 'Processing files...',
        appendTrace: 'Appending ',
        spinnerSuccess: 'Conversion complete',
        spinnerError: 'Process failed',
        done: 'Complete!',
    },
    sever: {
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

const DEFAULT_CONFIG: Config = {
    cli: { title: 'graft.js', subTitle: '', version: '1.0.0' },
    ui: DEFAULT_THEME,
    graft: {
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
    sever: {
        defaultOutputDir: './ALL_REBUILT',
        defaultInputPathPattern: 'ALL/txt/**/*.txt',
    },
    messages: DEFAULT_PROMPTS,
};

export class Settings {
    private static instance: Settings;
    private readonly CONFIG_PATH = `${process.cwd()}/.config/config.json`;

    private constructor() {}

    static get Instance(): Settings {
        if (!this.instance) this.instance = new Settings();
        return this.instance;
    }

    async load(): Promise<Config> {
        const file = Bun.file(this.CONFIG_PATH);
        if (!(await file.exists())) return DEFAULT_CONFIG;

        try {
            const saved = await file.json();
            return {
                ...DEFAULT_CONFIG,
                ...saved,
                graft: { ...DEFAULT_CONFIG.graft, ...saved.graft },
            };
        } catch {
            return DEFAULT_CONFIG;
        }
    }

    async save(updates: Partial<Config>): Promise<void> {
        const current = await this.load();
        const merged = {
            ...current,
            ...updates,
            graft: { ...current.graft, ...updates.graft },
        };
        await Bun.write(this.CONFIG_PATH, JSON.stringify(merged, null, 2));
    }
}

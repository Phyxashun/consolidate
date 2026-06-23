// FILE-PATH: src/Settings.ts

// src/Settings.ts
import { ColorTypes } from 'pdf-lib';
import type { AppConfig } from './config';

const DEFAULTS: AppConfig = {
    appName: 'My Bun CLI App',
    version: '1.0.0',
    notifications: true,
    consolidate: {
        ignoreList: ['node_modules'],
        outputDir: './dist',
        jobs: [],
    },
    pdf: {
        fontSize: 8,
        lineHeight: 12,
        marginTop: 50,
        marginBottom: 50,
        marginLeft: 50,
        marginRight: 50,
        fontFile:
            '../assets/JetBrainsMono/JetBrainsMonoNLNerdFontPropo-Regular.ttf',
        textColor: { type: ColorTypes.RGB, red: 0.96, green: 0.96, blue: 0.94 },
        textOpacity: 1.0,
        pageSize: 'Letter',
        pageOrientation: 'portrait',
        wordWrap: 'word',
        syntaxHighlighting: true,
        language: 'typescript',
        backgroundColor: {
            type: ColorTypes.RGB,
            red: 0.11,
            green: 0.12,
            blue: 0.13,
        },
        oneLongPage: true,
    },
};

export class Settings {
    private static instance: Settings;
    private readonly CONFIG_PATH = `${process.cwd()}/.config/config.json`;

    static get Instance(): Settings {
        if (!this.instance) this.instance = new Settings();
        return this.instance;
    }

    async load(): Promise<AppConfig> {
        const file = Bun.file(this.CONFIG_PATH);
        if (!(await file.exists())) return DEFAULTS;

        try {
            const saved = await file.json();
            return {
                ...DEFAULTS,
                ...saved,
                consolidate: { ...DEFAULTS.consolidate, ...saved.consolidate },
                pdf: { ...DEFAULTS.pdf, ...saved.pdf },
            };
        } catch {
            return DEFAULTS;
        }
    }

    async save(updates: Partial<AppConfig>): Promise<void> {
        const current = await this.load();
        const merged = {
            ...current,
            ...updates,
            consolidate: { ...current.consolidate, ...updates.consolidate },
            pdf: { ...current.pdf, ...updates.pdf },
        };
        await Bun.write(this.CONFIG_PATH, JSON.stringify(merged, null, 2));
    }
}

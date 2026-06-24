// FILE-PATH: src/utils/Settings.ts

import type { Config } from '../types';

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

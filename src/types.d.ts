// FILE-PATH: src/types.d.ts

import type { BoxAlignment } from '@clack/prompts';
import type { Colors } from 'picocolors';

export interface BaseConfig {
    title: string;
    subTitle: string;
    version: string;
}

export interface Theme {
    index: {
        bannerBg: string;
        bannerFg: string;
        subtitle: string;
        menuPrompt: string;
    };
    consolidate: {
        bannerBg: string;
        bannerFg: string;
        boxHeader: string;
        success: string;
        warning: string;
        empty: string;
    };
    deconsolidate: {
        bannerBg: string;
        bannerFg: string;
        boxHeader: string;
        dryRunIndicator: string;
        writingIndicator: string;
        skippedIndicator: string;
    };
}

export interface Prompts {
    shared: { confirmActive: string; confirmInactive: string; aborted: string };
    index: {
        menuMessage: string;
        choices: { [key: string]: { label: string; hint?: string } };
    };
    consolidate: { [key: string]: string | object };
    deconsolidate: { [key: string]: string | object };
}

export type BoxWidth = 'auto' | number;
export interface SubDirNames {
    text: string;
    ts: string;
    //pdf?: string;
}
export interface Job {
    name: string;
    description: string;
    include: string[];
    exclude?: string[];
}
export interface Config {
    cli: BaseConfig;
    ui: {
        symbols: {
            headerGlyphs: string;
            dryRun: string;
            writing: string;
            skipped: string;
            success: string;
        };
        layouts: {
            boxAlignment: BoxAlignment;
            boxWidth: BoxWidth;
            boxRounded: boolean;
            fileDivider: string;
        };
        theme: Theme;
    };
    consolidate: {
        outputPath: string;
        subDirs: SubDirNames;
        baseIgnorePatterns: string[];
        bannerSpacer: string;
        jobs: Job[];
    };
    deconsolidate: {
        defaultOutputDir: string;
        defaultInputPathPattern: string;
    };
    messages: Prompts;
}

export type ColorFunction = Colors & {
    createColors: (enabled?: boolean) => Colors;
};

export default {};

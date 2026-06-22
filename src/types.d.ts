// FILE-PATH: src/types.d.ts

interface BaseConfig {
    title: string;
    subTitle: string;
    version: string;
}

interface ThemeConfig {
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

interface PromptsConfig {
    shared: { confirmActive: string; confirmInactive: string; aborted: string };
    index: {
        menuMessage: string;
        choices: { [key: string]: { label: string; hint?: string } };
    };
    consolidate: { [key: string]: string | object };
    deconsolidate: { [key: string]: string | object };
}

type BoxWidth = 'auto' | number;

interface SubDirNames {
    text: string;
    ts: string;
    //pdf?: string;
}

interface Job {
    name: string;
    description: string;
    include: string[];
    exclude?: string[];
}

interface Config {
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

type ColorFunction = Colors & { createColors: (enabled?: boolean) => Colors };

// FILE-PATH: src/types.d.ts

export interface BaseConfig {
    title: string;
    subTitle: string;
    version: string;
}

export interface ThemeConfig {
    index: {
        bannerBg: string;
        bannerFg: string;
        subtitle: string;
        menuPrompt: string;
    };
    graft: {
        bannerBg: string;
        bannerFg: string;
        boxHeader: string;
        success: string;
        warning: string;
        empty: string;
    };
    sever: {
        bannerBg: string;
        bannerFg: string;
        boxHeader: string;
        dryRunIndicator: string;
        writingIndicator: string;
        skippedIndicator: string;
    };
}

export interface PromptsConfig {
    shared: { confirmActive: string; confirmInactive: string; aborted: string };
    index: {
        menuMessage: string;
        choices: { [key: string]: { label: string; hint?: string } };
    };
    graft: { [key: string]: string | object };
    sever: { [key: string]: string | object };
}

export type BoxWidth = 'auto' | number;

export interface SubDirNames {
    text: string;
    ts: string;
    //pdf?: string;
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
    graft: {
        outputPath: string;
        subDirs: SubDirNames;
        baseIgnorePatterns: string[];
        bannerSpacer: string;
        jobs: Job[];
    };
    sever: { defaultOutputDir: string; defaultInputPathPattern: string };
    messages: Prompts;
}

// FILE-PATH: src/types.d.ts

export interface BaseConfig {
    id: string;
    name: string;
    description: string;
}

export interface MetaData extends BaseConfig {
    type: string;
}

export type ColorFunction = Colors & {
    createColors: (enabled?: boolean) => Colors;
};

export interface ExtractedFile {
    filePath: string;
    contents: string;
}

export interface PathInfo {
    filename: string;
    name: string;
    ext: string;
}

export type List = Record<string, string[]>;

export interface Job extends BaseConfig {
    include: string[];
    exclude: string[];
}

export interface JobDefinition extends Job {
    extends: string[];
}

export interface Corpus extends BaseConfig {
    includes: List;
    excludes: List;
    job: JobDefinition[];
}

export interface ThemeTypography {
    color: string;
    style: 'none' | 'bold' | 'italic' | 'dim';
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    muted: string;
    text: string;
    [key: string]: string;
}

export interface ThemeUI {
    promptPrefix: string;
    activeOption: string;
    selectedOption: string;
    inactiveOption: string;
    submittedText: string;
    [key: string]: string;
}
export interface Theme extends BaseConfig {
    type: 'dark' | 'light';
    colors: ThemeColors;
    ui: ThemeUI;
    symbols: {
        pointer: string;
        checked: string;
        unchecked: string;
        success: string;
        error: string;
        info: string;
        [key: string]: string;
    };
    typography: {
        header: ThemeTypography;
        description: ThemeTypography;
        code: ThemeTypography;
        [key: string]: ThemeTypography;
    };
}

export interface IgnoreConfig {
    global: string[];
    dependencies?: string[];
    build?: string[];
    media?: string[];
    secrets?: string[];
    [category: string]: string[] | undefined;
}

export interface PromptParameter {
    [key: string]: string;
}

export interface PromptDefinition extends BaseConfig {
    category?: string;
    prompt: string;
    parameters?: PromptParameter;
}

export type PromptsConfig = UiPromptDefinition[];

export {};

// FILE-PATH: src/config.d.ts

export type FilterMap = Record<string, string[]>;

export interface BaseConfig {
    id: string;
    name: string;
    description: string;
    version: string;
    type?: string;
}

export interface FileConfig extends BaseConfig {
    includes: FilterMap;
    excludes: FilterMap;
    job: JobDefinition[];
}

export interface Job extends BaseConfig {
    includes: FileConfig['includes'][string];
    excludes: FileConfig['excludes'][string];
}

export interface JobDefinition extends Job {
    extends: string[];
}

export interface IgnorePattern {
    readonly raw: string;
    readonly glob: string; // Normalized pattern for glob matching
    readonly isNegated: boolean; // True if line starts with '!'
    readonly isDirectoryOnly: boolean; // True if line ends with '/'
}

export interface GitIgnoreSection {
    readonly heading: string | null; // The comment above this group of rules
    readonly rules: IgnorePattern[];
}

export interface ParsedGitIgnore {
    readonly filepath?: string;
    readonly globalRules: IgnorePattern[]; // Rules before any section header
    readonly sections: GitIgnoreSection[];
}

// A predicate function to check if a file path matches the gitignore rules
export type GitIgnoreFilter = (filePath: string) => boolean;

// Dictionary mapping raw input lines to their operational state
export type GitIgnoreRuleMap = Map<
    string,
    { isDisabled: boolean; order: number }
>;

export interface IgnoreConfig extends BaseConfig {
    id: string;
    name: string;
    description: string;
    version: string;
    [category: string]: string[] | undefined;
}

export interface ThemeTypography {
    color: string;
    style: 'none' | 'bold' | 'italic' | 'dim';
}

export interface PromptParameter {
    [key: string]: string;
}

export interface PromptDefinition extends BaseConfig {
    category?: string;
    prompt: string;
    parameters?: PromptParameter;
}

export type PromptsConfig = PromptDefinition[];

export interface CorpusConfig extends BaseConfig {
    id: string;
    name: string;
    description: string;

    metadata: {
        title: string;
        subtitle: string;
        version: string;
        license: string;
        root_markers: string[];
    };

    commands: { debug: boolean; graft: string; sever: string };

    paths: {
        config: string;
        graftIn: string;
        graftOut: string;
        severIn: string;
        severOut: string;
    };

    subPaths: Record<string, string>;

    banners: { divider: string; spacer: string };

    features: {
        output_format: string[];
        betaMenu: boolean;
        txtToPdf: boolean;
        inject_banners: boolean;
        include_line_numbers: boolean;
        respect_gitignore: boolean;
        max_file_size_kb: number;
        follow_symlinks: boolean;
    };

    additional: Record<string, string>;
}

export interface OutputTemplate {
    output_dir: string;
    'pkg.name': string;
    'pkg.version': string;
    job: string;
    subpath: string;
}

export interface Style {
    color?: string;
    backgroundColor?: string;
}

export interface BaseStyle extends Style {
    bold?: boolean;
    italic?: boolean;
}

export interface ThemeColors {
    background: string;
    current_line: string;
    selection: string;
    foreground: string;
    comment: string;
    red: string;
    orange: string;
    yellow: string;
    green: string;
    cyan: string;
    purple: string;
    pink: string;
    current_line_fallback: string;
}

export interface AnsiColors {
    red: string;
    yellow: string;
    green: string;
    cyan: string;
    magenta: string;
    blue: string;
    black: string;
    white: string;
    brRed: string;
    brYellow: string;
    brGreen: string;
    brCyan: string;
    brMagenta: string;
    brBlue: string;
    brBlack: string;
    brWhite: string;
}

export interface UIColors {
    floatingElements: string;
    bgLighter: string;
    bgLight: string;
    bgDark: string;
    bgDarker: string;
}

export interface Notifications {
    info: Style;
    warn: Style;
    error: Style;
    debug: Style;
}

export interface Theme extends BaseConfig {
    author: string;
    website: string;
    github: string;
    template: string;
    samples: string;
    colors: ThemeColors;
    ansi: AnsiColors;
    ui: UIColors;
    input: { cursor: Style; completion: BaseStyle };
    notify: Notifications;
    hint_style: BaseStyle;
}

export {};

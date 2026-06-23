// FILE-PATH: src/config.ts

import type { Color } from 'pdf-lib';

export interface JobDefinition {
    name: string;
    description: string;
    include: string[];
    exclude?: string[];
}

export type PageOrientation = 'portrait' | 'landscape';
export type WordWrap = 'word' | 'char' | 'none';

export interface AppConfig {
    appName: string;
    version: string;
    notifications: boolean;
    consolidate: {
        ignoreList: string[];
        outputDir: string;
        jobs: JobDefinition[];
    };
    pdf: {
        fontSize: number;
        lineHeight: number;
        marginTop: number;
        marginBottom: number;
        marginLeft: number;
        marginRight: number;
        fontFile: string;
        textColor: Color;
        textOpacity: number;
        pageSize: string;
        pageOrientation: PageOrientation;
        wordWrap: WordWrap;
        syntaxHighlighting: boolean;
        language: string;
        backgroundColor: Color;
        oneLongPage: boolean;
    };
}

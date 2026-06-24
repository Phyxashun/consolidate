// FILE-PATH: src/types.d.ts

export type BoxWidth = 'auto' | number;

export interface SubDirNames {
    text: string;
    typescript: string;
    pdf?: string;
    markdown?: string;
}

export interface StyleText {
    text: string;
    style?: BaseStyle;
}

export interface TestUI {
    header: StyleText;
    message: StyleText;
    placeholder: StyleText;
    outro: StyleText;
    error: { [key: string]: StyleText };
}

export type ColorFunction = Colors & {
    createColors: (enabled?: boolean) => Colors;
};

export interface File {
    path: string;
    filename: string;
    name: string;
    ext: string;
    contents?: string;
}

export {};

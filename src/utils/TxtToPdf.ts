// ~ FILE-PATH: src/utils/TxtToPdf.ts
import fontkit from '@pdf-lib/fontkit';
import type { BunFile } from 'bun';
import { resolve } from 'path';
import { PageSizes, PDFDocument, PDFFont, PDFPage, rgb, type RGB, StandardFonts } from 'pdf-lib';
import Prism from 'prismjs';
// Prism requires loading components manually if running headless in Bun environments
import loadLanguages from 'prismjs/components/index.js';

export interface PDFDimensions {
    width: number;
    height: number;
}

export type TextWidth = (text: string) => number;

export interface Config {
    fontSize?: number;
    lineHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    fontFile?: string;
    textColor?: RGB;
    textOpacity?: number;
    pageSize?: [number, number] | keyof typeof PageSizes;
    pageOrientation?: 'portrait' | 'landscape';
    wordWrap?: 'word' | 'char' | 'none';
    // Option B Structural Additions
    syntaxHighlighting?: boolean;
    language?: string;
    backgroundColor?: RGB;
}

export const DEFAULT_CONFIG: Required<Config> = {
    fontSize: 8,
    lineHeight: 16,
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
    fontFile: '../assets/JetBrainsMono/JetBrainsMonoNLNerdFontPropo-Regular.ttf',
    textColor: rgb(0.96, 0.96, 0.94),
    textOpacity: 1.0,
    pageSize: 'Letter',
    pageOrientation: 'portrait',
    wordWrap: 'word',
    syntaxHighlighting: true,
    language: 'typescript',
    backgroundColor: rgb(0.11, 0.12, 0.13),
};

// Minimalist High-Density Dark Theme Palette
export const SYNTAX_THEME: Record<string, RGB> = {
    keyword: rgb(0.97, 0.15, 0.45), // Pink-Red
    string: rgb(0.65, 0.86, 0.4), // Green
    comment: rgb(0.46, 0.48, 0.42), // Muted Sage Grey
    number: rgb(0.68, 0.51, 1.0), // Purple
    function: rgb(0.4, 0.85, 0.94), // Cyan
    operator: rgb(0.97, 0.61, 0.12), // Orange
    punctuation: rgb(0.8, 0.8, 0.8), // Light Grey
    boolean: rgb(0.97, 0.61, 0.12), // Orange
    classname: rgb(0.4, 0.85, 0.94), // Cyan
    plain: rgb(0.96, 0.96, 0.94), // Off-White Default
};

export const NEWLINE: RegExp = /\r?\n/;

interface TextAtom {
    text: string;
    color: RGB;
}

export class TxtToPdfConverter {
    private readonly config: Required<Config>;

    constructor(config: Required<Config>) {
        this.config = config;
        if (this.config.syntaxHighlighting) {
            try {
                loadLanguages([this.config.language]);
            } catch (e: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
                // Fallback gracefully if Prism component is missing natively
                console.warn(`[TxtToPdf]: Could not load Prism definition for "${this.config.language}". Using standard styling.`);
            }
        }
    }

    private createPageWithLayout(pdfDoc: PDFDocument): PDFPage {
        const page = pdfDoc.addPage(typeof this.config.pageSize === 'string' ? PageSizes[this.config.pageSize] : this.config.pageSize);
        if (this.config.pageOrientation === 'landscape') {
            const { width, height } = page.getSize();
            page.setSize(height, width);
        }

        // Paint global solid background background container color across canvas canvas surfaces
        const { width, height } = page.getSize();
        page.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: height,
            color: this.config.backgroundColor,
        });

        return page;
    }

    public async convertTxtToPdf(sourcePath: string, outputPath: string, fontPath: string = this.config.fontFile): Promise<void> {
        const textContent: string = await this.getText(sourcePath);
        const pdfDoc: PDFDocument = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const font: PDFFont = await this.getFontSafely(fontPath, pdfDoc);
        let page: PDFPage = this.createPageWithLayout(pdfDoc);
        const { width, height }: PDFDimensions = page.getSize();

        const maxLineWidth: number = width - (this.config.marginLeft + this.config.marginRight);
        const pageBottomThreshold: number = this.config.marginBottom;
        let currentY: number = height - this.config.marginTop;

        // --- 1. PRE-PROCESS ENTIRE DOCUMENT VIA GLOBAL ATOM TOKEN ENGINE ---
        const renderingLines: TextAtom[][] = [[]];
        let currentLineIdx = 0;

        if (this.config.syntaxHighlighting) {
            const grammar = Prism.languages[this.config.language] || Prism.languages.clike;
            const globalTokens = Prism.tokenize(textContent, grammar);

            const parseToken = (token: string | Prism.Token, type?: string) => {
                if (typeof token === 'string') {
                    const lines = token.split(/\r?\n/);
                    const tokenType = type || 'plain';
                    const activeColor = SYNTAX_THEME[tokenType] || this.config.textColor;

                    lines.forEach((lineText, index) => {
                        if (index > 0) {
                            currentLineIdx++;
                            renderingLines[currentLineIdx] = [];
                        }
                        if (lineText.length > 0) {
                            renderingLines[currentLineIdx].push({ text: lineText, color: activeColor });
                        }
                    });
                } else {
                    if (Array.isArray(token.content)) {
                        token.content.forEach(subToken => parseToken(subToken, token.type));
                    } else {
                        parseToken(token.content, token.type);
                    }
                }
            };

            globalTokens.forEach(token => parseToken(token));
        } else {
            // Fallback: Populate flat atoms if syntax features are deactivated
            const rawLines = textContent.split(NEWLINE);
            rawLines.forEach((line, index) => {
                renderingLines[index] = [{ text: line, color: this.config.textColor }];
            });
        }

        // --- 2. LAYOUT WRAPPING AND RENDERING ENGINE ENGINE LOOP ---
        for (const rawLineAtoms of renderingLines) {
            const fullLineText = rawLineAtoms.map(atom => atom.text).join('');
            const textWidthFn: TextWidth = (text: string) => font.widthOfTextAtSize(text, this.config.fontSize);
            const wrappedLineStrings = this.wrapText(fullLineText, maxLineWidth, textWidthFn);

            let atomIndex = 0;
            let atomCharOffset = 0;

            for (const wrappedString of wrappedLineStrings) {
                if (currentY - this.config.fontSize < pageBottomThreshold) {
                    page = this.createPageWithLayout(pdfDoc);
                    currentY = height - this.config.marginTop;
                }

                let currentX = this.config.marginLeft;
                let remainingCharsToDraw = wrappedString.length;

                while (remainingCharsToDraw > 0 && atomIndex < rawLineAtoms.length) {
                    const currentAtom = rawLineAtoms[atomIndex];
                    const availableAtomText = currentAtom.text.slice(atomCharOffset);

                    const takeLength = Math.min(availableAtomText.length, remainingCharsToDraw);
                    const textChunkToDraw = availableAtomText.slice(0, takeLength);

                    if (textChunkToDraw.length > 0) {
                        page.drawText(textChunkToDraw, {
                            x: currentX,
                            y: currentY,
                            size: this.config.fontSize,
                            font: font,
                            color: currentAtom.color,
                            opacity: this.config.textOpacity,
                        });
                    }

                    currentX += font.widthOfTextAtSize(textChunkToDraw, this.config.fontSize);
                    remainingCharsToDraw -= takeLength;
                    atomCharOffset += takeLength;

                    if (atomCharOffset >= currentAtom.text.length) {
                        atomIndex++;
                        atomCharOffset = 0;
                    }
                }

                currentY -= this.config.lineHeight;
            }
        }

        const pdfBytes: Uint8Array = await pdfDoc.save();
        await Bun.write(outputPath, pdfBytes);
    }

    private wrapText(text: string, maxWidth: number, getTextWidth: TextWidth): string[] {
        if (this.config.wordWrap === 'none') return [text];

        const normalizedText = text.replace(/\t/g, '    ');

        if (this.config.wordWrap === 'char') {
            const lines: string[] = [];
            let currentLine = '';
            for (const char of normalizedText) {
                if (getTextWidth(currentLine + char) > maxWidth) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine += char;
                }
            }
            if (currentLine) lines.push(currentLine);
            return lines.length > 0 ? lines : [''];
        }

        const leadingSpaceMatch = normalizedText.match(/^ +/);
        const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
        const remainingText = normalizedText.slice(leadingSpaces.length);

        const words: string[] = remainingText.split(' ');
        const lines: string[] = [];
        let currentLine: string = leadingSpaces;

        for (const word of words) {
            const isLineStart = currentLine === '' || currentLine === leadingSpaces;
            const testLine: string = isLineStart ? `${currentLine}${word}` : `${currentLine} ${word}`;

            if (getTextWidth(testLine) > maxWidth) {
                if (currentLine !== leadingSpaces) {
                    lines.push(currentLine);
                } else if (currentLine === leadingSpaces && word !== '') {
                    lines.push(testLine);
                    currentLine = leadingSpaces;
                    continue;
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine && currentLine !== leadingSpaces) lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    }

    private async getFontSafely(fontPath: string, pdfDoc: PDFDocument): Promise<PDFFont> {
        try {
            const absoluteFontPath = resolve(import.meta.dir, fontPath);
            const fontFile: BunFile = Bun.file(absoluteFontPath);
            if (!(await fontFile.exists())) {
                throw new Error(`File not found at target resolution layout: "${absoluteFontPath}"`);
            }
            const fontBytes: ArrayBuffer = await fontFile.arrayBuffer();
            return await pdfDoc.embedFont(fontBytes);
        } catch (error: unknown) {
            console.warn(
                `🚨 [TxtToPdf Warning]: Custom font loading failed ("${error}"). ` + `Falling back to standard Monospace Courier.`,
            );
            return await pdfDoc.embedFont(StandardFonts.Courier);
        }
    }
    private async getText(sourcePath: string): Promise<string> {
        const sourceFile: BunFile = Bun.file(sourcePath);
        if (!(await sourceFile.exists())) {
            throw new Error(`Input text source file completely missing at path: "${sourcePath}"`);
        }
        return await sourceFile.text();
    }
}
export default class TxtToPdf {
    public static create(options?: Config): TxtToPdfConverter {
        const mergedConfig: Required<Config> = {
            ...DEFAULT_CONFIG,
            ...options,
        };
        return new TxtToPdfConverter(mergedConfig);
    }
}

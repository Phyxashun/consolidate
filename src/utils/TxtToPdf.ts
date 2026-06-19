import { resolve } from 'path';
import { PDFDocument, PDFFont, PDFPage, rgb, RGB, PageSizes, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { BunFile } from 'bun';

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
}

export const DEFAULT_CONFIG: Required<Config> = {
    fontSize: 8,
    lineHeight: 16,
    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,
    fontFile: '../assets/JetBrainsMono/JetBrainsMonoNLNerdFontPropo-Regular.ttf',
    textColor: rgb(0, 0, 0),
    textOpacity: 1.0,
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    wordWrap: 'word',
};

export const DASH: RegExp = /-/g;
export const NEWLINE: RegExp = /\r?\n/;

/**
 * Concrete Core Class managed and generated dynamically by the Factory
 */
export class TxtToPdfConverter {
    private readonly config: Required<Config>;

    // Package scoped constructor visible only to the factory framework layer
    constructor(config: Required<Config>) {
        this.config = config;
    }

    private createPageWithLayout(pdfDoc: PDFDocument): PDFPage {
        const page = pdfDoc.addPage(typeof this.config.pageSize === 'string' ? PageSizes[this.config.pageSize] : this.config.pageSize);

        if (this.config.pageOrientation === 'landscape') {
            const { width, height } = page.getSize();
            page.setSize(height, width);
        }
        return page;
    }

    /**
     * Main execution pipeline mapping plain text files to layout PDF bytes
     */
    public async convertTxtToPdf(sourcePath: string, outputPath: string, fontPath: string = this.config.fontFile): Promise<void> {
        const textContent: string = await this.getText(sourcePath);
        const pdfDoc: PDFDocument = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        // Safe Fallback Layer Execution
        const font: PDFFont = await this.getFontSafely(fontPath, pdfDoc);

        let page: PDFPage = this.createPageWithLayout(pdfDoc);
        const { width, height }: PDFDimensions = page.getSize();

        const maxLineWidth: number = width - (this.config.marginLeft + this.config.marginRight);
        const pageBottomThreshold: number = this.config.marginBottom;

        const rawLines: string[] = textContent.split(NEWLINE);
        let currentY: number = height - this.config.marginTop;

        for (const line of rawLines) {
            const textWidthFn: TextWidth = (text: string) => font.widthOfTextAtSize(text, this.config.fontSize);
            const wrappedLines: string[] = this.wrapText(line, maxLineWidth, textWidthFn);

            for (const wrappedLine of wrappedLines) {
                if (currentY - this.config.fontSize < pageBottomThreshold) {
                    page = this.createPageWithLayout(pdfDoc);
                    currentY = height - this.config.marginTop;
                }

                page.drawText(wrappedLine, {
                    x: this.config.marginLeft,
                    y: currentY,
                    size: this.config.fontSize,
                    font: font,
                    color: this.config.textColor,
                    opacity: this.config.textOpacity,
                });

                currentY -= this.config.lineHeight;
            }
        }

        const pdfBytes: Uint8Array = await pdfDoc.save();
        await Bun.write(outputPath, pdfBytes);
    }

    private wrapText(text: string, maxWidth: number, getTextWidth: TextWidth): string[] {
        if (this.config.wordWrap === 'none') return [text];

        if (this.config.wordWrap === 'char') {
            const lines: string[] = [];
            let currentLine = '';
            for (const char of text) {
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

        const words: string[] = text.split(' ');
        const lines: string[] = [];
        let currentLine: string = '';

        for (const word of words) {
            const testLine: string = currentLine ? `${currentLine} ${word}` : word;
            if (getTextWidth(testLine) > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    }

    /**
     * Advanced Fail-Safe Font Loader
     * Intercepts file system failures or missing binaries and supplies native Standard Font routing alternatives.
     */
    private async getFontSafely(fontPath: string, pdfDoc: PDFDocument): Promise<PDFFont> {
        try {
            const absoluteFontPath = resolve(import.meta.dir, fontPath);
            const fontFile: BunFile = Bun.file(absoluteFontPath);

            // Validate absolute file existence under Bun before reading buffers
            if (!(await fontFile.exists())) {
                throw new Error(`File not found at target resolution layout: "${absoluteFontPath}"`);
            }

            const fontBytes: ArrayBuffer = await fontFile.arrayBuffer();
            return await pdfDoc.embedFont(fontBytes);
        } catch (error: Error) {
            console.warn(
                `🚨 [TxtToPdf Warning]: Custom font loading failed ("${error.message}"). ` + `Falling back to standard Monospace Courier.`,
            );
            // Default to Courier to maintain consistent grid alignments if user font is missing
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

/**
 * 🏭 TxtToPdfConverter Factory Pattern Implementation
 * Eliminates shared singleton states, permitting parallel
 * rendering processes using distinct configuration sets.
 */
export default class TxtToPdf {
    /**
     * Spawns a fully configured, isolated, production-grade converter instance.
     *
     * @param options Partial user-defined configuration overrides
     */
    public static create(options?: Config): TxtToPdfConverter {
        const mergedConfig: Required<Config> = {
            ...DEFAULT_CONFIG,
            ...options,
        };
        return new TxtToPdfConverter(mergedConfig);
    }
}

import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { resolve } from 'path';
import { type BunFile } from 'bun';

// Clear the console
export const clear = (): void => {
    console.clear();
};

// Output empty line to console
export const line = (): void => {
    console.log(`\n`);
};

export interface PDFDimensions {
    width: number;
    height: number;
}

export type TextWidth = (text: string) => number;

const DASH: RegExp = /-/g;
const NEWLINE: RegExp = /\r?\n/;
const FONT_FILE: string = '../assets/JetBrainsMono/JetBrainsMonoNerdFont-Regular.ttf';
const FONT_SIZE: number = 12;
// In pdf-lib, color channels are strictly mapped as fractional values between 0.0 and 1.0...divide traditional values by 255
const TEXT_COLOR: RGB = rgb(0, 0, 0);
const LINE_HEIGHT: number = 6;
const MARGIN: number = 50;

export const generateShortId = (): string => {
    // Generate a standard UUID (e.g., "123e4567-e89b-12d3-a456-426614174000")
    const fullUuid = crypto.randomUUID();

    // Remove dashes and take a heavy entropy section (the last 12 chars)
    const segment = fullUuid.replace(DASH, '').slice(-12);

    // Convert the hex segment to a Base36 alphanumeric string and grab 6 chars
    return parseInt(segment, 16).toString(36).substring(0, 6);
};

export const generateHashId = async (): string => {
    const fullUuid = crypto.randomUUID();

    // Hash the UUID string into an ArrayBuffer using Bun's crypto Web API
    const encoder = new TextEncoder();
    const data = encoder.encode(fullUuid);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Take a chunk and translate to base36 alphanumeric
    return parseInt(hashHex.slice(0, 12), 16).toString(36).substring(0, 6);
};

/**
 * Helper function to wrap text strings based on layout bounds
 */
const wrapText = (text: string, maxWidth: number, getTextWidth: TextWidth): string[] => {
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
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [''];
};

const getText = async (sourcePath: string): string => {
    // Load source file
    const sourceFile: BunFile = Bun.file(sourcePath);
    return await sourceFile.text();
};

const getFont = async (fontPath: string): PDFFont => {
    // Load custom font
    const fontFile: BunFile = Bun.file(resolve(import.meta.dir, fontPath));
    const fontBytes: ArrayBuffer = await fontFile.arrayBuffer();
    return await pdfDoc.embedFont(fontBytes);
};

/**
 * Converts a text file to a PDF document using Bun's native API and a custom font.
 * @param sourcePath Path to the source .txt file
 * @param outputPath Path where the final .pdf should be saved
 * @param fontPath Path to your custom .ttf or .otf font file
 */
export const convertTxtToPdf = async (sourcePath: string, outputPath: string, fontPath: string = FONT_FILE): Promise<void> => {
    // Load source file
    const textContent: string = getText(sourcePath);

    // Create PDF document instance and register the fontkit router
    const pdfDoc: PDFDocument = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Load custom font
    const font: PDFFont = getFont(fontPath);

    // Create page layout
    let page: PDFPage = pdfDoc.addPage();
    const { width, height }: PDFDimensions = page.getSize();
    const maxLineWidth: number = width - MARGIN * 2;
    const pageBottomThreshold: number = MARGIN;

    // Split content into single lines
    const rawLines: string[] = textContent.split(NEWLINE);
    let currentY: number = height - MARGIN;

    for (const line of rawLines) {
        // Embedded fonts
        const textWidth = (text: string) => font.widthOfTextAtSize(text, FONT_SIZE);
        const wrappedLines: string[] = wrapText(line, maxLineWidth, textWidth(text));

        for (const wrappedLine of wrappedLines) {
            // If text extends beyond page; create new page
            if (currentY - FONT_SIZE < pageBottomThreshold) {
                page = pdfDoc.addPage();
                currentY = height - MARGIN;
            }

            // Draw text slice onto the current page
            page.drawText(wrappedLine, {
                x: MARGIN,
                y: currentY,
                size: FONT_SIZE,
                font: font,
                color: TEXT_COLOR,
            });

            // Move cursor down for the next line
            currentY -= FONT_SIZE + LINE_HEIGHT;
        }
    }

    // Serialize and write the PDF
    const pdfBytes: Uint8Array = await pdfDoc.save();
    await Bun.write(outputPath, pdfBytes);
};

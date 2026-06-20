// FILE-PATH: src/utils/FileProcessor.ts

import type { AppConfig } from '../types';

export class FileProcessor {
    private config: AppConfig['consolidate'];
    private layouts: AppConfig['ui']['layouts'];

    constructor() {}

    public async createBlock(filePath: string): Promise<string> {
        const file = Bun.file(filePath);
        const content = await file.text();
        const spacer = this.config.bannerSpacer;

        const banner = `//${spacer} Start of file: ${filePath} ${spacer}\n`;
        const footer = `\n//${spacer} End of file: ${filePath} ${spacer}\n`;

        return `${banner}${content}${footer}${this.layouts.fileDivider}`;
    }

    public async writeConsolidatedFile(
        outputPath: string,
        blocks: string[],
    ): Promise<void> {
        const finalContent = blocks.join('\n');
        await Bun.write(outputPath, finalContent);
    }
}

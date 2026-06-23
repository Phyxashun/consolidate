// FILE-PATH: src/utils/FileProcessor.ts

export class FileProcessor {
    private config: Config['graft'];
    private layouts: Config['ui']['layouts'];

    constructor(config: Config['graft'], layouts: Config['ui']['layouts']) {
        this.config = config;
        this.layouts = layouts;
    }

    public async createBlock(filePath: string): Promise<string> {
        const file = Bun.file(filePath);
        const content = await file.text();
        const spacer = this.config.bannerSpacer;

        const banner = `//${spacer} Start of file: ${filePath} ${spacer}\n`;
        const footer = `\n//${spacer} End of file: ${filePath} ${spacer}\n`;

        return `${banner}${content}${footer}${this.layouts.fileDivider}`;
    }

    public async writeGraftedFile(
        outputPath: string,
        blocks: string[],
    ): Promise<void> {
        const finalContent = blocks.join('\n');
        await Bun.write(outputPath, finalContent);
    }
}

// FILE-PATH: src/utils/FileExtractor.ts

import { Glob } from 'bun';
import path from 'path';
import type { AppConfig } from '../types';

export interface ExtractedFile {
    filePath: string;
    content: string;
}

export class FileExtractor {
    private config: AppConfig['consolidate'];

    constructor() {}

    public async scanInputPatterns(patterns: string[]): Promise<string[]> {
        const matchingFiles: string[] = [];
        for (const pattern of patterns) {
            const glob = new Glob(pattern);
            for await (const file of glob.scan('.')) {
                matchingFiles.push(file);
            }
        }
        return matchingFiles;
    }

    public parseContent(text: string): ExtractedFile[] {
        const extracted: ExtractedFile[] = [];
        const lines = text.split('\n');

        let currentFile: string | null = null;
        let currentContent: string[] = [];
        const spacer = this.config.bannerSpacer;

        for (const line of lines) {
            if (line.startsWith(`//${spacer} Start of file:`)) {
                const match = line.match(
                    new RegExp(`//${spacer} Start of file: (.*?) ${spacer}`),
                );
                if (match) {
                    currentFile = match[1].trim();
                    currentContent = [];
                }
                continue;
            }

            if (line.startsWith(`//${spacer} End of file:`)) {
                if (currentFile) {
                    extracted.push({
                        filePath: currentFile,
                        content: currentContent.join('\n').trimEnd(),
                    });
                    currentFile = null;
                }
                continue;
            }

            if (currentFile !== null) {
                currentContent.push(line);
            }
        }

        return extracted;
    }

    public async writeExtractedFile(
        targetDir: string,
        file: ExtractedFile,
    ): Promise<void> {
        const fullOutputPath = path.join(targetDir, file.filePath);
        await Bun.write(fullOutputPath, file.content);
    }
}

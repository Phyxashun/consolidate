// FILE-PATH: src/utils/utils.ts

import path from 'path';
import type { FileInfo } from '../types';

export const parsePath = (inputPath: string | Bun.BunFile): FileInfo => {
    const normalized = normalizePath(inputPath);
    const parsed = path.parse(normalized);

    return {
        path: normalized,
        filename: parsed.base,
        name: parsed.name,
        ext: parsed.ext || '',
    };
};

export const normalizePath = (inputPath: string | Bun.BunFile): string => {
    if (typeof inputPath === 'string') {
        const cleanPath = path.normalize(inputPath);
        return Bun.file(cleanPath).name || cleanPath;
    } else {
        return inputPath.name || '';
    }
};

export const getFilenameFromPath = (inputPath: string): string => {
    return path.basename(normalizePath(inputPath));
};

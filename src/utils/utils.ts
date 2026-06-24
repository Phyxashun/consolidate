// FILE-PATH: src/utils/utils.ts

import path, { dirname, join } from 'path';
import themeToml from '../config/theme.toml';
import type { CorpusConfig, FileInfo, OutputTemplate, Theme } from '../types';

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

export const getGraftOutputPath = (
    config: CorpusConfig,
    format: string,
    fileName: string,
): string => {
    // Normalize wildcards out of paths if necessary
    const baseGraftDir = config.paths.graftOut.replace(/\*\*\/|\*/g, '');

    // Resolve chosen subpath directory mapping
    const subFolder = config.subPaths[format] || '';

    // Build full clean dynamic path tree: e.g., root/project/GRAFT/pdf/consolidated_project.pdf
    return join(process.cwd(), baseGraftDir, subFolder, fileName);
};

/**
 * Searches upward from the execution directory to find the true project root
 */
export async function findPackageJsonPath(
    currentDir: string = process.cwd(),
): Promise<string> {
    const possiblePath = join(currentDir, 'package.json');
    const file = Bun.file(possiblePath);

    // Bun's native async file existence check
    if (await file.exists()) {
        return possiblePath;
    }

    const parentDir = dirname(currentDir);

    // Safeguard: Stop if we hit the system root file system boundary
    if (parentDir === currentDir) {
        throw new Error(
            'Could not find a project package.json from this terminal directory.',
        );
    }

    // Recursive tail-call optimization upward
    return findPackageJsonPath(parentDir);
}

/**
 * Reads, parses, and returns the workspace package.json configuration object
 */
export async function getPackageJsonData() {
    try {
        const packagePath = await findPackageJsonPath();
        const file = Bun.file(packagePath);

        // Bun reads and deserializes JSON text streams concurrently
        return await file.json();
    } catch (error) {
        console.error('❌ Failed to resolve package.json parameters.\n', error);
        return null;
    }
}

/**
 * Parses a double-curly template string using a flat context object
 */
export const isValidKey = <T extends object>(
    key: PropertyKey,
    obj: T,
): key is keyof T => {
    return key in obj;
};

export const resolveOutputTemplate = (
    template: string,
    context: OutputTemplate,
): string => {
    return template.replace(
        /\{\{\s*([\w.]+)\s*\}\}/g,
        (match, path: string): string => {
            if (
                isValidKey(path, context) &&
                context[path] !== undefined &&
                context[path] !== null
            ) {
                return String(context[path]);
            }
            console.warn(
                `⚠️ Template placeholder "${path}" is not valid or has no value.`,
            );
            return match;
        },
    );
};

interface User {
    id: number;
    name: string;
}

// 'UserKey' can only be "id" or "name"
type UserKey = keyof User;

export function getProperty(user: User, key: UserKey) {
    return user[key]; // Safe and valid
}

/**
 * Loads and types your scoped theme.toml configuration
 */
export function loadTheme(): Theme {
    return themeToml;
}

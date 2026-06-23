// FILE-PATH: src/utils/FileScanner.ts

export class FileScanner {
    private config: Config['graft'];

    constructor(config: Config['graft']) {
        this.config = config;
    }

    public async getIgnorePatterns(): Promise<string[]> {
        const patterns = [...this.config.baseIgnorePatterns];
        const gitignore = Bun.file('.gitignore');

        if (await gitignore.exists()) {
            const lines = (await gitignore.text()).split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    patterns.push(
                        trimmed.endsWith('/') ? `${trimmed}**/*` : trimmed,
                    );
                }
            }
        }
        return patterns;
    }

    public async scanJobFiles(
        include: string[],
        exclude: string[] = [],
        ignores: string[],
    ): Promise<string[]> {
        const allExplored: string[] = [];
        const activeExclusions = new Set([...exclude, ...ignores]);

        for (const pattern of include) {
            const glob = new Bun.Glob(pattern);
            for await (const file of glob.scan('.')) {
                if (!this.isIgnored(file, activeExclusions)) {
                    allExplored.push(file);
                }
            }
        }
        return allExplored;
    }

    private isIgnored(filePath: string, exclusions: Set<string>): boolean {
        return Array.from(exclusions).some(pattern =>
            filePath.includes(pattern.replace(/\*/g, '')),
        );
    }
}

// FILE-PATH: src/utils/CorpusParser.ts

import type { BunFile } from 'bun';
import type { Corpus, Job, JobDefinition, List } from '../types';

export class CorpusParser {
    private config: Corpus;

    // Private constructor ensures instantiation only happens via the async factory
    private constructor(parsedConfig: Corpus) {
        this.config = parsedConfig;
    }

    // Exposes all loaded jobs from the parsed TOML document configuration.
    public get job(): Job[] {
        return this.config.job || [];
    }

    // Static factory initialization method utilizing Bun's native File API
    public static async load(configPath: string): Promise<CorpusParser> {
        const file: BunFile = Bun.file(configPath);
        const exists: boolean = await file.exists();

        if (!exists) {
            throw new Error(`File ${configPath} does not exist`);
        }

        const text: string = await file.text();
        const parsedData: Corpus = Bun.TOML.parse(text) as Corpus;
        return new CorpusParser(parsedData);
    }

    // Resolve the paths for a job cleanly without mutating original config memory
    public resolveJob(jobId: string): Job {
        const job: JobDefinition | undefined = this.findJob(jobId);
        if (!job) throw new Error(`Error: ${jobId} not found.`);

        return {
            ...job,
            include: this.resolveIncludes(job),
            exclude: this.resolveExcludes(job),
        };
    }

    // Find a fob by job ID
    private findJob(jobId: string): JobDefinition | undefined {
        return this.config.job?.find((j: JobDefinition) => j.id === jobId);
    }

    // Resolve extended pattern sets
    private resolveIncludes(job: JobDefinition): string[] {
        const globalIncludes: List = this.config.includes || {};
        const includes: string[] = [...(job.include || [])];

        if (job.extends) {
            for (const item of job.extends) {
                if (globalIncludes[item]) {
                    includes.push(...globalIncludes[item]);
                }
            }
        }

        return Array.from(new Set(includes));
    }

    // Resolve exclusions and overrides
    private resolveExcludes(job: JobDefinition): string[] {
        const globalExcludes: List = this.config.excludes || {};
        const excludes: string[] = [];

        if (job.exclude) {
            for (const item of job.exclude) {
                if (globalExcludes[item]) {
                    excludes.push(...globalExcludes[item]);
                } else {
                    excludes.push(item);
                }
            }
        }
        excludes.push(...globalExcludes['global']);
        return Array.from(new Set(excludes));
    }
}

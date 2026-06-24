// FILE-PATH: src/utils/CorpusParser.ts

import type { Corpus, Job, JobDefinition } from '../types';

export class CorpusParser {
    private config: Corpus;

    private constructor(parsedConfig: Corpus) {
        this.config = parsedConfig;
    }

    public get job(): JobDefinition[] {
        return this.config.job || [];
    }

    // Expose root config if needed for top-level logging metrics
    public get corpus(): Corpus {
        return this.config;
    }

    public static async load(tomlConfig: Corpus): Promise<CorpusParser> {
        return new CorpusParser(tomlConfig);
    }

    public resolveJob(jobId: string): Job {
        const job = this.findJob(jobId);
        if (!job) throw new Error(`Error: ${jobId} not found.`);

        // Keep track of visited jobs to prevent infinite loops from circular extends
        const visited = new Set<string>();

        return {
            id: job.id,
            name: job.name,
            description: job.description,
            version: job.version,
            include: this.flattenIncludes(job, visited),
            exclude: this.flattenExcludes(job, new Set<string>()), // Reset for exclusion chain
        };
    }

    private findJob(jobId: string): JobDefinition | undefined {
        return this.config.job?.find((j: JobDefinition) => j.id === jobId);
    }

    /**
     * Recursively crawls the inheritance tree via 'extends' to collect all include globs
     */
    private flattenIncludes(
        job: JobDefinition,
        visited: Set<string>,
    ): string[] {
        if (visited.has(job.id)) return [];
        visited.add(job.id);

        const includes: string[] = [...(job.include || [])];

        // If this job extends other jobs, recursively fetch their includes
        if (job.extends) {
            for (const parentId of job.extends) {
                const parentJob = this.findJob(parentId);
                if (parentJob) {
                    includes.push(...this.flattenIncludes(parentJob, visited));
                }
            }
        }

        return Array.from(new Set(includes));
    }

    /**
     * Recursively crawls the inheritance tree to inherit parent exclusions,
     * then appends the global baseline rules.
     */
    private flattenExcludes(
        job: JobDefinition,
        visited: Set<string>,
    ): string[] {
        if (visited.has(job.id)) return [];
        visited.add(job.id);

        const excludes: string[] = [...(job.exclude || [])];

        // Inherit exclusions from extended parental jobs
        if (job.extends) {
            for (const parentId of job.extends) {
                const parentJob = this.findJob(parentId);
                if (parentJob) {
                    excludes.push(...this.flattenExcludes(parentJob, visited));
                }
            }
        }

        // Always mix in the fallback baseline root global exclusions array
        const globalExcludes = this.config.excludes?.global || [];
        excludes.push(...globalExcludes);

        return Array.from(new Set(excludes));
    }
}

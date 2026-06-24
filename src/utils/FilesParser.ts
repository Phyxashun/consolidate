// FILE-PATH: src/utils/FilesParser.ts

import type { FilesConfig, Job, JobDefinition } from '../config';

export class FilesParser {
  private config: FilesConfig;

  private constructor(parsedConfig: FilesConfig) {
    this.config = parsedConfig;
  }

  public get job(): JobDefinition[] {
    return this.config.job || [];
  }

  // Expose root config if needed for top-level logging metrics
  public get corpus(): FilesConfig {
    return this.config;
  }

  public static load(tomlConfig: FilesConfig): FilesParser {
    return new FilesParser(tomlConfig);
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
      includes: this.flattenIncludes(job, visited),
      excludes: this.flattenExcludes(job, new Set<string>()), // Reset for exclusion chain
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

    const includes: string[] = [...(job.includes || [])];

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

    const excludes: string[] = [...(job.excludes || [])];

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

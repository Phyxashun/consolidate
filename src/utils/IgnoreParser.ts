import type { IgnoreConfig } from '../config';
import rawConfig from '../config/ignore.toml';

// Explicitly separate the metadata keys from the dynamic categories
export type IgnoreCategories = Record<string, string[]>;

// The payload structure returned by the .gitignore parser
export interface ParsedGitIgnorePayload {
    categories: IgnoreCategories;
}

export async function parseGitIgnore(
    filePath: string,
): Promise<ParsedGitIgnorePayload> {
    const content = await Bun.file(filePath).text();
    const lines = content.split(/\r?\n/);

    const categories: IgnoreCategories = {};
    let currentCategory = 'general';

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Handle comments as new categories
        if (trimmed.startsWith('#')) {
            // Clean up the comment to make a valid TOML key (e.g., "# Build outputs" -> "build_outputs")
            const categoryName = trimmed
                .replace(/^#+\s*/, '') // Remove leading '#' and spaces
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscores
                .replace(/_+/g, '_') // Collapse multiple underscores
                .replace(/(^_|_$)/g, ''); // Trim leading/trailing underscores

            if (categoryName) {
                currentCategory = categoryName;
            }
            continue;
        }

        // Add pattern to the current active category
        if (!categories[currentCategory]) {
            categories[currentCategory] = [];
        }

        // Deduplicate patterns inside the same file
        if (!categories[currentCategory].includes(trimmed)) {
            categories[currentCategory].push(trimmed);
        }
    }

    return { categories };
}

export function mergeGitIgnoreToConfig(
    existingConfig: IgnoreConfig,
    parsedGitIgnore: ParsedGitIgnorePayload,
): IgnoreConfig {
    // Deep copy the base metadata to keep the function pure
    const updatedConfig: IgnoreConfig = { ...existingConfig };

    // Iterate over every category discovered in the .gitignore file
    for (const [category, newPatterns] of Object.entries(
        parsedGitIgnore.categories,
    )) {
        // Get existing rules for this category, or fallback to an empty array
        const existingPatterns = (updatedConfig[category] as string[]) || [];

        // Merge and deduplicate rules using a Set
        const mergedSet = new Set([...existingPatterns, ...newPatterns]);

        // Update the dynamic key on the configuration object
        updatedConfig[category] = Array.from(mergedSet);
    }

    return updatedConfig;
}

export function formatConfigToTOML(config: IgnoreConfig): string {
    const lines: string[] = [];
    const metadataKeys = ['id', 'name', 'description', 'version', 'type'];

    // Serialize top-level metadata first
    for (const key of metadataKeys) {
        if (config[key] !== undefined) {
            lines.push(`${key} = "${config[key]}"`);
            //lines.push('');
        }
    }
    lines.push('');

    // 2. Serialize category arrays as clean multiline blocks
    for (const [key, value] of Object.entries(config)) {
        // Skip the metadata keys we handled above
        if (metadataKeys.includes(key) || !Array.isArray(value)) continue;

        lines.push(`${key} = [`);

        // Format array items with an explicit 2-space tab indentation
        for (const pattern of value) {
            lines.push(`  "${pattern}",`);
        }

        lines.push(']');
        lines.push(''); // <--- Adds a newline after each block array property
    }

    // Clean up any trailing stacked whitespace before returning
    return lines.join('\n').trim() + '\n';
}

const main = async () => {
    const ignoreConfig = rawConfig as IgnoreConfig;

    // Flatten all ignore arrays from the template
    const ignorePatterns = Object.entries(ignoreConfig)
        .filter(
            ([key]) =>
                !['id', 'name', 'description', 'version', 'type'].includes(key),
        )
        .flatMap(([_, value]) => (value as string[]) || []);

    const parsedGitIgnore = await parseGitIgnore('.gitignore');

    console.log(`IGNORE.TOML: ${JSON.stringify(ignorePatterns)}`);
    console.log(`GITIGNORE: ${JSON.stringify(parsedGitIgnore)}`);

    // Merge the gitignore values into the template config structure
    const updatedConfig = mergeGitIgnoreToConfig(ignoreConfig, parsedGitIgnore);

    // Generate your beautifully formatted TOML raw content string
    const beautifulTomlString = formatConfigToTOML(updatedConfig);

    // Write finalized document natively via Bun core
    const destinationFile = 'consolidated_ignore.toml';
    await Bun.write(destinationFile, beautifulTomlString);

    console.log(`Successfully generated cleanly formatted ${destinationFile}!`);
};

await main();

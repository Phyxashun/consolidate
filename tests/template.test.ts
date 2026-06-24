import { describe, expect, spyOn, test } from 'bun:test';
import chalk from 'chalk';
import type { OutputTemplate } from '../src/config';
import { resolveOutputTemplate } from '../src/utils/utils';

let testCount: number = 1;

const print = <T>(obj: Record<string, T>): void => {
    const name = Object.keys(obj)[0];
    const title = chalk.cyan(`${testCount}. ${name.toLocaleUpperCase()}`);
    const result = chalk.dim(chalk.green(obj[name]));
    console.log(`\n${title}: ${result}\n`);
    testCount++;
};

describe('Output Template Resolver', () => {
    // Mock data representing a typical valid project state
    const mockContext: OutputTemplate = {
        output_dir: 'GRAFT/',
        'pkg.name': 'corpus-ts',
        'pkg.version': '3.0.1',
        job: 'source',
        subpath: 'ts',
    };

    test('should successfully resolve a completely valid template string', () => {
        const template =
            '{{output_dir}}{{pkg.name}}_{{job}}_{{pkg.version}}.{{subpath}}';
        const expected = 'GRAFT/corpus-ts_source_3.0.1.ts';

        const result = resolveOutputTemplate(template, mockContext);
        print({ result });
        expect(result).toBe(expected);
    });

    test('should handle templates with mixed whitespace inside brackets safely', () => {
        const template =
            '{{ output_dir }}{{pkg.name  }}_{{   job}}_{{pkg.version}}.{{subpath}}';
        const expected = 'GRAFT/corpus-ts_source_3.0.1.ts';

        const result = resolveOutputTemplate(template, mockContext);
        print({ result });
        expect(result).toBe(expected);
    });

    test('should leave invalid placeholders unchanged and trigger a console warning', () => {
        // Intercept console.warn to verify your warning message fires
        const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

        const template = '{{output_dir}}{{invalid_placeholder}}.ts';
        const expected = 'GRAFT/{{invalid_placeholder}}.ts';

        const result = resolveOutputTemplate(template, mockContext);

        expect(result).toBe(expected);
        print({ result });
        expect(warnSpy).toHaveBeenCalled();

        // Restore console behavior
        warnSpy.mockRestore();
    });
});

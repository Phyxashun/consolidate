# consolidate

A small Bun/TypeScript CLI for merging a project's files into single combined
output files — and rebuilding the original file tree from them later.

Useful for dropping an entire codebase into something like an LLM context
window, or for archiving/transferring a project as a handful of flat text
files instead of a directory tree.

## Features

- **Consolidate** — scans your project by category (source, HTML, styles,
  config, tests, docs) and merges each category into a single output file.
- **Deconsolidate** — parses those merged files back into individual files on
  disk, with `--dry-run`, `--verbose`, and `--force` options.
- Interactive menu powered by [`@clack/prompts`](https://www.npmjs.com/package/@clack/prompts)
  when run with no arguments.
- Respects your `.gitignore` in addition to a built-in ignore list
  (`node_modules`, lockfiles, coverage, etc).

## Requirements

- [Bun](https://bun.com) `>= 1.3.14`

## Installation

```bash
bun install
```

## Usage

### Interactive menu

```bash
bun run index.ts
```

Pick **Consolidate** or **Deconsolidate** from the menu.

### Consolidate directly

```bash
bun run src/consolidate.ts
```

Walks the job definitions below and writes merged output to:

- `ALL/ts/` — each job's output, saved with a `.ts` extension
- `ALL/txt/` — each job's output, saved with a `.txt` extension

| # | Job            | Includes                                                            |
| - | -------------- | ------------------------------------------------------------------- |
| 1 | Source Files   | `.ts` `.tsx` `.mts` `.cts` `.js` `.jsx` `.mjs` `.cjs`               |
| 2 | HTML Files     | `.html`                                                             |
| 3 | Style Files    | `.css` `.scss` `.sass` `.less`                                      |
| 4 | Config Files   | `.json`, `.gitignore`, `*.config.*`, `.editorconfig`, `.prettierrc` |
| 5 | Test Files     | `*.test.ts`                                                         |
| 6 | Doc Files      | `.md` `.txt`, `License`                                             |

A job is skipped silently if no files match its patterns.

### Deconsolidate directly

```bash
bun run src/deconsolidate.ts [options] [inputPaths...]
```

| Flag            | Alias | Description                                   | Default               |
| --------------- | ----- | --------------------------------------------- | --------------------- |
| `--out <dir>`   | `-o`  | Output directory for rebuilt files            | `./ALL_REBUILT`       |
| `--force`       | `-f`  | Overwrite existing files without prompting    | off                   |
| `--verbose`     | `-v`  | Print every file path as it's written         | off                   |
| `--dry-run`     | `-n`  | Show what would happen without writing        | off                   |
| `--help`        | `-h`  | Show usage help                               | —                     |

If no `inputPaths` are given, it defaults to `./ALL/txt/**/*.txt`.

```bash
# Rebuild everything found under ALL/txt
bun run src/deconsolidate.ts

# Rebuild a single consolidated file into ./restored, overwriting anything there
bun run src/deconsolidate.ts ./ALL/txt/1_ALL_SOURCE_FILES.txt -o ./restored -f

# Preview a rebuild without touching disk
bun run src/deconsolidate.ts "./ALL/txt/*.txt" --dry-run --verbose
```

## How it works

Each source file is wrapped in a banner when consolidated:

```ts
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: src/foo.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


...file content...


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: src/foo.ts ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
//████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████
```

`deconsolidate.ts` reads these banners back out with a small state machine
and restores each file at its original relative path under the chosen output
directory.

## Tech stack

- [Bun](https://bun.com) — runtime, `Bun.file`/`Bun.write`
- TypeScript (strict mode)
- [`@clack/prompts`](https://www.npmjs.com/package/@clack/prompts) — interactive CLI UI (menus, spinners, task lists, confirmations)
- [`picocolors`](https://www.npmjs.com/package/picocolors) — terminal styling
- [`glob`](https://www.npmjs.com/package/glob) — file pattern matching

## Project structure

```plaintext
.
├── index.ts              # interactive menu entry point
├── src/
│   ├── consolidate.ts     # merges project files → ALL/ts, ALL/txt
│   └── deconsolidate.ts   # rebuilds files from consolidated output
├── eslint.config.ts
├── prettier.config.ts
├── tsconfig.json
└── package.json
```

## License

MIT © 2026 Dustin Dew. See [LICENSE](License).

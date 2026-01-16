import { type Config } from 'prettier';

const config: Config = {
    arrowParens: 'avoid',
    bracketSameLine: false,
    objectWrap: 'preserve',
    bracketSpacing: true,
    semi: true,
    experimentalOperatorPosition: 'end',
    experimentalTernaries: false,
    singleQuote: true,
    jsxSingleQuote: true,
    quoteProps: 'as-needed',
    trailingComma: 'all',
    singleAttributePerLine: false,
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    proseWrap: 'preserve',
    endOfLine: 'lf',
    insertPragma: false,
    printWidth: 140,
    requirePragma: false,
    tabWidth: 4,
    useTabs: false,
    embeddedLanguageFormatting: 'auto',
};

export default config;

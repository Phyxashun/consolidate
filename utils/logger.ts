#!/usr/bin/env bun
// ./utils/logger.ts

import { styleText } from 'node:util';
import figlet from 'figlet';
import standard from 'figlet/fonts/Standard';

const MAX_WIDTH: number = 100;
const TAB_WIDTH: number = 4;
const SPACE: string = ' ';
const FIGLET_FONT = 'Standard';
figlet.parseFont(FIGLET_FONT, standard);

/**
 * @type AlignType
 * @description Type defining text alignment options.
 */
type AlignType = 'left' | 'center' | 'right';

/**
 * @enum Align
 * @description Enum for different text alignments.
 */
enum Align {
    left = 'left',
    center = 'center',
    right = 'right',
}

/**
 * @type StyleType
 * @description Type defining available text styles.
 */
type StyleType = 'bold' | 'reset' | 'dim' | 'italic' | 'underline' | 'blink' | 'inverse' | 'hidden' | 'strikethrough' | 'doubleunderline';

/**
 * @enum Style
 * @description Enum for different text styles.
 */
enum Style {
    bold = 'bold',
    reset = 'reset',
    dim = 'dim',
    italic = 'italic',
    underline = 'underline',
    blink = 'blink',
    inverse = 'inverse',
    hidden = 'hidden',
    strikethrough = 'strikethrough',
    doubleunderline = 'doubleunderline',
}

/**
 * @type ColorType
 * @description Type defining available text colors.
 */
type ColorType =
    | 'green'
    | 'red'
    | 'yellow'
    | 'cyan'
    | 'black'
    | 'blue'
    | 'magenta'
    | 'white'
    | 'gray'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright';

/**
 * @enum Color
 * @description Enum for different text colors.
 */
enum Color {
    green = 'green',
    red = 'red',
    yellow = 'yellow',
    cyan = 'cyan',
    black = 'black',
    blue = 'blue',
    magenta = 'magenta',
    white = 'white',
    gray = 'gray',
    redBright = 'redBright',
    greenBright = 'greenBright',
    yellowBright = 'yellowBright',
    blueBright = 'blueBright',
    magentaBright = 'magentaBright',
    cyanBright = 'cyanBright',
    whiteBright = 'whiteBright',
}

/**
 * @type BackgroundColorType
 * @description Type defining available background colors.
 */
type BackgroundColorType =
    | 'bgGreen'
    | 'bgRed'
    | 'bgYellow'
    | 'bgCyan'
    | 'bgBlack'
    | 'bgBlue'
    | 'bgMagenta'
    | 'bgWhite'
    | 'bgGray'
    | 'bgRedBright'
    | 'bgGreenBright'
    | 'bgYellowBright'
    | 'bgBlueBright'
    | 'bgMagentaBright'
    | 'bgCyanBright'
    | 'bgWhiteBright';

/**
 * @enum BackgroundColor
 * @description Enum for different background colors.
 */
enum BackgroundColor {
    bgGreen = 'bgGreen',
    bgRed = 'bgRed',
    bgYellow = 'bgYellow',
    bgCyan = 'bgCyan',
    bgBlack = 'bgBlack',
    bgBlue = 'bgBlue',
    bgMagenta = 'bgMagenta',
    bgWhite = 'bgWhite',
    bgGray = 'bgGray',
    bgRedBright = 'bgRedBright',
    bgGreenBright = 'bgGreenBright',
    bgYellowBright = 'bgYellowBright',
    bgBlueBright = 'bgBlueBright',
    bgMagentaBright = 'bgMagentaBright',
    bgCyanBright = 'bgCyanBright',
    bgWhiteBright = 'bgWhiteBright',
}

/**
 * @type InspectColor
 * @description Type defining available inspect colors.
 */
type InspectColor = StyleType | ColorType | BackgroundColorType; // From 'node:util'

/**
 * @enum LineType
 * @description Enum for different line types.
 */
enum LineType {
    default = '─',
    dashed = '-',
    underscore = '_',
    doubleUnderscore = '‗',
    equals = '=',
    double = '═',
    diaeresis = '¨',
    macron = '¯',
    section = '§',
    interpunct = '·',
    lightBlock = '░',
    mediumBlock = '▒',
    heavyBlock = '▓',
    boldBlock = '█',
    boldSquare = '■',
    boldBottom = '▄',
    boldTop = '▀',
}

/**
 * @enum BoxStyle
 * @description Enum for different box styles.
 */
enum BoxType {
    single,
    double,
    light,
    medium,
    heavy,
    bold,
    half,
    star,
    circle,
    square,
    hash,
}

/**
 * @type BoxPartKeys
 * @description Type defining the keys for box parts.
 */
enum BoxPart {
    tl = 'tl',
    t = 't',
    tr = 'tr',
    l = 'l',
    r = 'r',
    bl = 'bl',
    b = 'b',
    br = 'br',
}

/**
 * @type BoxParts
 * @description Type defining the structure for box parts.
 */
type BoxParts = Record<BoxPart, string>;

/**
 * @constant BoxStyles
 * @description Predefined box styles with their corresponding characters.
 */
const BoxStyles: Record<BoxType, BoxParts> = {
    [BoxType.single]: { tl: '┌', t: '─', tr: '┐', l: '│', r: '│', bl: '└', b: '─', br: '┘' },
    [BoxType.double]: { tl: '╔', t: '═', tr: '╗', l: '║', r: '║', bl: '╚', b: '═', br: '╝' },
    [BoxType.light]: { tl: '░', t: '░', tr: '░', l: '░', r: '░', bl: '░', b: '░', br: '░' },
    [BoxType.medium]: { tl: '▒', t: '▒', tr: '▒', l: '▒', r: '▒', bl: '▒', b: '▒', br: '▒' },
    [BoxType.heavy]: { tl: '▓', t: '▓', tr: '▓', l: '▓', r: '▓', bl: '▓', b: '▓', br: '▓' },
    [BoxType.bold]: { tl: '█', t: '█', tr: '█', l: '█', r: '█', bl: '█', b: '█', br: '█' },
    [BoxType.half]: { tl: '▄', t: '▄', tr: '▄', l: '█', r: '█', bl: '▀', b: '▀', br: '▀' },
    [BoxType.star]: { tl: '*', t: '*', tr: '*', l: '*', r: '*', bl: '*', b: '*', br: '*' },
    [BoxType.circle]: { tl: '●', t: '●', tr: '●', l: '●', r: '●', bl: '●', b: '●', br: '●' },
    [BoxType.square]: { tl: '■', t: '■', tr: '■', l: '■', r: '■', bl: '■', b: '■', br: '■' },
    [BoxType.hash]: { tl: '#', t: '#', tr: '#', l: '#', r: '#', bl: '#', b: '#', br: '#' },
} as const;

/**
 * @interface Theme
 * @description Defines the structure for a theme object.
 * @property {InspectColor | InspectColor[]} color - The color(s) associated with the theme.
 * @property {LineType} line - The line type associated with the theme.
 * @property {(StyleType)[]} [styles] - Optional styles associated with the theme.
 */
interface Theme {
    color: InspectColor | InspectColor[];
    line: LineType;
    styles?: StyleType[];
}

/**
 * @constant THEMES
 * @description Predefined themes for PrintLine.
 */
const Themes: Record<string, Theme> = {
    Success: { color: 'green', line: LineType.default, styles: ['bold'] },
    Error: { color: 'red', line: LineType.boldBlock },
    Warning: { color: 'yellow', line: LineType.dashed },
    Info: { color: 'cyan', line: LineType.default },
} as const;

/**
 * @interface PrintLineOptions
 * @description Defines the structure for a PrintLine options object.
 * @property {number} width - The width of the line.
 * @property {boolean} preNewLine - If true, adds a newline before the line.
 * @property {boolean} postNewLine - If true, adds a newline after the line.
 * @property {LineType} lineType - The style of the line.
 * @property {AlignType} textAlign - The alignment of the text.
 * @property {keyof typeof THEMES} theme - Apply a predefined theme.
 * @property {InspectColor | InspectColor[]} color - The color of the line.
 * @property {InspectColor | InspectColor[]} bgColor - The background color of the line.
 * @property {StyleType | StyleType[]} styles - The styles applied to the line.
 * @property {string} text - The text to display on the line.
 */
interface PrintLineOptions {
    // Alignment options
    width?: number;
    preNewLine?: boolean;
    postNewLine?: boolean;

    // Line options
    lineType?: LineType;
    theme?: keyof typeof Themes;
    color?: InspectColor | InspectColor[];
    bgColor?: InspectColor | InspectColor[];
    gradient?: [InspectColor, InspectColor];
    styles?: StyleType | StyleType[];

    // Text options
    text?: string;
    textAlign?: AlignType;
    textColor?: InspectColor | InspectColor[];
}

/**
 * @type BoxWidth
 * @description Type defining box width options.
 * 'tight' - Width adjusts to fit the text content.
 * 'max'   - Width spans the maximum allowed width.
 * number  - Specific numeric width.
 */
type BoxWidth = 'tight' | 'max' | number;

enum Width {
    default = 80,
    tight = 'tight',
    max = 'max',
}

/**
 * @interface BoxTextOptions
 * @description Defines the structure for a BoxText options object.
 * @property {BoxWidth} width - The width of the box.
 * @property {boolean} preNewLine - If true, adds a newline before the box.
 * @property {boolean} postNewLine - If true, adds a newline after the box.
 * @property {BoxType} boxType - The style of the box.
 * @property {AlignType} boxAlign - The alignment of the box.
 * @property {keyof typeof THEMES} theme - Apply a predefined theme.
 * @property {InspectColor | InspectColor[]} color - The default foreground color of the box.
 * @property {InspectColor | InspectColor[]} bgColor - The default backgound color of the box.
 * @property {StyleType | StyleType[]} styles - The styles of the box.
 * @property {InspectColor | InspectColor[]} textColor - The text color inside the box.
 * @property {InspectColor | InspectColor[]} textBgColor - The text background color inside the box.
 */
interface BoxTextOptions {
    // Alignment options
    width?: BoxWidth;
    preNewLine?: boolean;
    postNewLine?: boolean;

    // Box options
    boxType?: BoxType;
    boxAlign?: AlignType;
    theme?: keyof typeof Themes;
    color?: InspectColor | InspectColor[];
    bgColor?: InspectColor | InspectColor[];
    styles?: StyleType | StyleType[];

    // Text options
    textColor?: InspectColor | InspectColor[];
    textBgColor?: InspectColor | InspectColor[];
}

/**
 * @function Spacer
 * @description Creates a string of repeated characters, useful for padding.
 * @param {number} [width=TAB_WIDTH] - Number of characters to repeat.
 * @param {string} [char=SPACE] - The character to repeat.
 * @returns {string} A string of repeated characters.
 */
const Spacer = (width: number = TAB_WIDTH, char: string = SPACE): string => char.repeat(width);

/**
 * @function CenterText
 * @description Centers a line of text within a given width by adding padding.
 * @param {string} text - The text to center.
 * @param {number} [width=MAX_WIDTH] - The total width to center within.
 * @returns {string} The centered text string.
 * @requires spacer - Function that return a string for spacing.
 */
const CenterText = (text: string, width: number = MAX_WIDTH): string => {
    // Remove any existing styling for accurate length calculation
    const unstyledText = text.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = Math.max(0, Math.floor((width - unstyledText.length) / 2));
    return `${Spacer(padding)}${text}`;
};

/**
 * @function CenteredFiglet
 * @description Generates and centers multi-line FIGlet (ASCII) text.
 * @param {string} text - The text to convert to ASCII art.
 * @param {number} [width=MAX_WIDTH] - The total width to center the art within.
 * @returns {string} The centered, multi-line ASCII art as a single string.
 * @requires centerText
 */
const CenteredFiglet = (text: string, width: number = MAX_WIDTH): string => {
    const rawFiglet = figlet.textSync(text, {
        font: FIGLET_FONT,
        width: width,
        whitespaceBreak: true,
    });

    return rawFiglet
        .split('\n')
        .map(line => CenterText(line, width))
        .join('\n');
};

/**
 * @function PrintLine
 * @description Outputs a styled horizontal line to the console.
 * @param {PrintLineOptions} [options={}] - Configuration options for the line.
 * @returns {string}
 */
const PrintLine = (options: PrintLineOptions = {}): string => {
    /**
     * @description Default options object for the printLine function.
     */
    const defaultOptions: PrintLineOptions = {
        preNewLine: false,
        postNewLine: false,
        width: MAX_WIDTH,
        lineType: LineType.double,
        color: [Color.gray, Style.bold],
        textAlign: Align.center,
    } as const;

    const themeOptions = options.theme ? (Themes as any)[options.theme] : {};
    const mergedOptions = {
        ...defaultOptions,
        ...themeOptions,
        ...options,
    };
    const { width, preNewLine, postNewLine, lineType, color, bgColor, gradient, styles, text, textColor, textAlign } = mergedOptions;

    const colorStyles = color ? (Array.isArray(color) ? color : [color]) : [];
    const bgColorStyles = bgColor ? (Array.isArray(bgColor) ? bgColor : [bgColor]) : [];
    const otherStyles = styles || [];
    const lineStyles = [...colorStyles, ...bgColorStyles, ...otherStyles];
    const textStyles = textColor ? (Array.isArray(textColor) ? textColor : [textColor]) : lineStyles;
    const pre = preNewLine ? '\n' : '';
    const post = postNewLine ? '\n' : '';
    let finalOutput: string;

    if (gradient) {
        const [startColor, endColor] = gradient;
        const halfWidth = Math.floor(width! / 2);

        const startSegment = styleText([startColor], lineType!.repeat(halfWidth));
        const endSegment = styleText([endColor], lineType!.repeat(width! - halfWidth));

        const styledDivider = startSegment + endSegment;

        const result = `${pre}${styledDivider}${post}`;
        console.log(result);
        return result;
    }

    if (!text) {
        // Simple case: No text, just style the whole line as before.
        finalOutput = styleText(lineStyles, lineType!.repeat(width!));
    } else {
        // Advanced case: Text exists, so build the line in pieces.
        const paddedText = ` ${text} `; // Add padding

        // Style the text separately
        const styledText = styleText(textStyles, paddedText);

        const lineCharCount = width! - paddedText.length;
        if (lineCharCount < 0) {
            // If the text is too long, just print the styled text.
            finalOutput = styledText;
        } else {
            // Otherwise, calculate and style the line segments.
            switch (textAlign) {
                case 'left': {
                    const rightLine = styleText(lineStyles, lineType!.repeat(lineCharCount));
                    finalOutput = styledText + rightLine;
                    break;
                }
                case 'right': {
                    const leftLine = styleText(lineStyles, lineType!.repeat(lineCharCount));
                    finalOutput = leftLine + styledText;
                    break;
                }
                case 'center':
                default: {
                    const leftCount = Math.floor(lineCharCount / 2);
                    const rightCount = lineCharCount - leftCount;
                    const leftLine = styleText(lineStyles, lineType!.repeat(leftCount));
                    const rightLine = styleText(lineStyles, lineType!.repeat(rightCount));
                    finalOutput = leftLine + styledText + rightLine;
                    break;
                }
            }
        }
    }

    // 5. Log the final constructed string
    const result = `${pre}${finalOutput}${post}`;
    console.log(result);
    return result;
};

/**
 * @function BoxText
 * @description Draws a styled ASCII box around a given text string and prints it to the console.
 * @param {string | string[]} text - The text to be enclosed in the box.
 * @param {BoxTextOptions} [options={}] - Configuration options for the box.
 * @returns {string}
 */
const BoxText = (text: string | string[], options: BoxTextOptions = {}): void => {
    /**
     * @description Default options object for the printLine function.
     */
    const defaultOptions: BoxTextOptions = {
        width: Width.tight,
        preNewLine: false,
        postNewLine: false,
        boxType: BoxType.single,
        boxAlign: Align.center,
        color: [Color.gray, Style.bold],
        textColor: Color.white,
    } as const;

    const themeOptions = options.theme ? (Themes as any)[options.theme] : {};
    const mergedOptions = {
        ...defaultOptions,
        ...themeOptions,
        ...options,
    };
    const { width, preNewLine, postNewLine, boxType, boxAlign, color, bgColor, textColor, textBgColor, styles } = mergedOptions;

    const boxChars = (BoxStyles as any)[boxType];

    // Prepare Separate Styles for Box and Text
    const boxFinalStyles = [
        ...(color ? (Array.isArray(color) ? color : [color]) : []),
        ...(bgColor ? (Array.isArray(bgColor) ? bgColor : [bgColor]) : []),
        ...(styles || []),
    ];

    // If text styles aren't provided, they default to the box styles
    const textFinalStyles = [
        ...(textColor ? (Array.isArray(textColor) ? textColor : [textColor]) : boxFinalStyles),
        ...(textBgColor ? (Array.isArray(textBgColor) ? textBgColor : [textBgColor]) : []),
        ...(styles || []),
    ];

    // Add this helper inside BoxText, right after the options destructuring
    const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, '');

    // Calculate Content Width and Wrap Text
    let contentWidth: number;
    let textLines: string[] = [];

    // Determine the target content width
    if (typeof width === 'number') {
        contentWidth = width - 4;
    } else if (width === 'max') {
        contentWidth = MAX_WIDTH - 4;
    } else {
        // Handle 'tight' or auto-detect based on input
        const initialLines = Array.isArray(text) ? text : text.split('\n');
        contentWidth = Math.max(...initialLines.map(line => stripAnsi(line).length));
    }

    // Wrap the text into lines that fit contentWidth
    const inputString = Array.isArray(text) ? text.join(' ') : text;
    const words = inputString.split(/\s+/);
    let currentLine = '';

    words.forEach(word => {
        const lineLen = stripAnsi(currentLine).length;
        const wordLen = stripAnsi(word).length;

        if (lineLen + (lineLen > 0 ? 1 : 0) + wordLen <= contentWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) textLines.push(currentLine);

            // If a single word is wider than contentWidth, force-break it
            let remainingWord = word;
            while (stripAnsi(remainingWord).length > contentWidth) {
                textLines.push(remainingWord.substring(0, contentWidth));
                remainingWord = remainingWord.substring(contentWidth);
            }
            currentLine = remainingWord;
        }
    });
    if (currentLine) textLines.push(currentLine);

    // Recalculate if 'tight' was used to avoid unnecessary whitespace
    if (width === 'tight') {
        contentWidth = Math.max(...textLines.map(line => stripAnsi(line).length), 0);
    }

    // Calculate Outer Alignment Padding
    const fullBoxWidth = contentWidth + 4;
    let leftPaddingAmount = 0;

    if (boxAlign === 'center') {
        leftPaddingAmount = Math.max(0, Math.floor((MAX_WIDTH - fullBoxWidth) / 2));
    } else if (boxAlign === 'right') {
        leftPaddingAmount = Math.max(0, MAX_WIDTH - fullBoxWidth);
    }

    const outerPadding = ' '.repeat(leftPaddingAmount);

    // Build Box Components
    const centerAlign = (str: string, width: number): string => {
        const paddingCount = Math.max(0, width - str.length);
        const leftPadding = Math.floor(paddingCount / 2);
        const rightPadding = paddingCount - leftPadding;
        const content = str.length > width ? str.substring(0, width) : str;
        return ' '.repeat(leftPadding) + content + ' '.repeat(rightPadding);
    };

    const styledTop = styleText(boxFinalStyles, boxChars.tl + boxChars.t.repeat(contentWidth + 2) + boxChars.tr);
    const styledBottom = styleText(boxFinalStyles, boxChars.bl + boxChars.b.repeat(contentWidth + 2) + boxChars.br);
    const styledLeftBorder = styleText(boxFinalStyles, boxChars.l + ' ');
    const styledRightBorder = styleText(boxFinalStyles, ' ' + boxChars.r);

    // Assemble lines with outer padding
    const styledContentLines = textLines!.map(line => {
        const centeredText = centerAlign(line, contentWidth);
        const styledText = styleText(textFinalStyles, centeredText);
        return outerPadding + styledLeftBorder + styledText + styledRightBorder;
    });

    const fullBoxString = [outerPadding + styledTop, ...styledContentLines, outerPadding + styledBottom].join('\n');

    const pre = preNewLine ? '\n' : '';
    const post = postNewLine ? '\n' : '';
    console.log(`${pre}${fullBoxString}${post}`);
};

/**
 * @function CenteredText
 * @description Outputs centered text to the console.
 * @param {string} text - The text to center and print.
 */
const CenteredText = (text: string): void => {
    console.log(CenterText(text));
};

export {
    type Theme,
    type PrintLineOptions,
    type BoxWidth,
    type BoxTextOptions,
    Align,
    Style,
    Color,
    BackgroundColor,
    LineType,
    BoxType,
    BoxStyles,
    Themes,
    Width,
    Spacer,
    CenterText,
    CenteredText,
    CenteredFiglet,
    PrintLine,
    BoxText,
};

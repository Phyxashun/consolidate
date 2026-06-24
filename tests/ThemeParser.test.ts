// import * as p from '@clack/prompts';
// import chalk from 'chalk';
// import type { BaseStyle } from '../src/config';
// import theme from '../src/config/theme.toml';
// import type { TestUI } from '../src/types';

// const style = (text: string, style?: BaseStyle): string => {
//   if (!style) return text;
//   let formatter = chalk;
//   if (style.color) formatter = formatter.hex(style.color);
//   if (style.backgroundColor) formatter = formatter.bgHex(style.backgroundColor);
//   if (style.bold) formatter = formatter.bold;
//   if (style.italic) formatter = formatter.italic;
//   return formatter(text);
// };

// export const ui: TestUI = {
//   header: {
//     text: ` ${theme.name} v${theme.version} `,
//     style: { color: theme.colors.background, backgroundColor: theme.colors.purple, bold: true },
//   },
//   message: {
//     text: 'What is your project name?',
//   },

//   placeholder: {
//     text: 'my-dracula-app',
//     style: theme.hint_style,
//   },

//   error: {
//     noname: {
//       text: 'Project name is required!',
//       style: theme.notify.error,
//     },
//   },

//   outro: {
//     text: 'Setup completed successfully! ✨',
//     style: theme.notify.info
//   },
// };

// p.intro(style(ui.header.text, ui.header.style));

// export const projectName = await p.text({
//   message: ui.message.text,

//   placeholder: style(ui.placeholder.text, ui.placeholder.style),

//   validate: (value: (string | undefined)) => {
//     if (!value || value.length === 0) {
//       return style(ui.error.noname.text, ui.error.noname.style);
//     }
//   },
// });

// p.outro(style(ui.outro.text, ui.outro.style));

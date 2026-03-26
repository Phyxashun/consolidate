import consolidate from './src/consolidate';
import deconsolidate from './src/deconsolidate';

import readline from 'node:readline';
import { styleText } from 'node:util';
import { CenteredFiglet, LineType, PrintLine } from './src/logger';

PrintLine({ preNewLine: true, lineType: LineType.boldBlock });
console.log(styleText(['yellowBright', 'bold'], CenteredFiglet(`Consolidate!!!`)));
PrintLine({ postNewLine: true, lineType: LineType.boldBlock });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
    styleText('cyanBright', '\n[1] Consolidate\n[2] Deconsolidate\n[3] Exit\n') + styleText('white', '\nPick an option: '),

    answer => {
        rl.close();
        switch (answer.trim()) {
            case '1':
                return consolidate();
            case '2':
                return deconsolidate();
            case '3':
                process.exit(0);
            default:
                console.log(styleText('red', `\nError! Invalid option "${answer}". Exiting.\n`));
                process.exit(1);
        }
    },
);

export { consolidate, deconsolidate };

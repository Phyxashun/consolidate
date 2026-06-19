import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { spawnSync } from 'child_process';

const MESSAGE: string = 'Update';

function runCommand(command: string, args: string[]): boolean {
    const result = spawnSync(command, args, { encoding: 'utf-8' });
    return result.status === 0;
}

async function main() {
    const args = Bun.argv.slice(2);
    console.log(args);

    const msg = args[0] ? args[0] : MESSAGE;

    intro(`${pc.bgMagenta(pc.black(' 󰊢 Git Automation Script '))}`);

    const s = spinner();

    // Execute 'git add .'
    s.start('Staging changes (git add .)...');
    if (!runCommand('git', ['add', '.'])) {
        s.stop('Failed to stage changes.', 1);
        process.exit(1);
    }

    // Execute 'git commit -m "MESSAGE"'
    s.message(`Committing changes (git commit -m "${msg}")...`);
    if (!runCommand('git', ['commit', '-m', 'Update'])) {
        // Check if there was nothing to commit
        s.stop('Failed to commit. (Are there any new changes?)', 1);
        process.exit(1);
    }

    // Execute 'git push'
    s.message('Pushing to origin main (git push origin main)...');
    if (!runCommand('git', ['push', 'origin', 'main'])) {
        s.stop('Failed to push changes to remote.', 1);
        process.exit(1);
    }

    s.stop('All steps completed successfully!');
    outro('Workflow complete!');
}

main().catch(console.error);

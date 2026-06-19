import { intro, outro, log } from '@clack/prompts';
import pc from 'picocolors';
import { spawnSync } from 'child_process';

const MESSAGE: string = 'Update';

function runCommand(command: string, args: string[]): boolean {
    const result = spawnSync(command, args, { encoding: 'utf-8' });
    return result.status === 0;
}

async function main() {
    console.clear();
    const args = Bun.argv.slice(2);
    console.log(args);

    const msg = args[0] ? args[0] : MESSAGE;

    intro(`${pc.bgMagenta(pc.black(' 󰊢 Git Automation Script '))}`);

    // Execute 'git add .'
    log.step('Staging changes (git add .)...');
    if (!runCommand('git', ['add', '.'])) {
        log.stop('Failed to stage changes.\n', 1);
        process.exit(1);
    }

    // Execute 'git commit -m "MESSAGE"'
    log.step(`Committing changes (git commit -m "${msg}")...`);
    if (!runCommand('git', ['commit', '-m', 'Update'])) {
        // Check if there was nothing to commit
        log.stop('Failed to commit. (Are there any new changes?)\n', 1);
        process.exit(1);
    }

    // Execute 'git push'
    log.step('Pushing to origin main (git push origin main)...');
    if (!runCommand('git', ['push', 'origin', 'main'])) {
        log.stop('Failed to push changes to remote.\n', 1);
        process.exit(1);
    }

    log.success('All steps completed successfully!');
    outro('✅ Git update complete!');
}

main().catch(console.error);

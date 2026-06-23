#!/usr/bin/env bun

// FILE-PATH: src/push.ts

import { intro, log, note, outro } from '@clack/prompts';
import { spawnSync } from 'child_process';
import pc from 'picocolors';

const MESSAGE: string = 'Update';
const lPill = pc.magenta('');
const rPill = pc.magenta('');

// Modified to return both success status and terminal output
function runCommand(command: string, args: string[]): { success: boolean; output: string; } { // eslint-disable-line prettier/prettier
    const result = spawnSync(command, args, { encoding: 'utf-8' });
    return {
        success: result.status === 0,
        output: result.stdout?.trim() || result.stderr?.trim() || '',
    };
}

async function main() {
    console.clear();

    const args = Bun.argv.slice(2);
    const msg = args[0] ? args[0] : MESSAGE;
    const formattedMsg = pc.bold(msg);
    const title = pc.magenta(pc.inverse(' 󰊢 Git Automation Script '));
    intro(`${lPill}${title}${rPill}`);

    // 1. Fetch current changes before staging them
    const status = runCommand('git', ['status', '--short']);

    if (!status.output) {
        note(pc.yellow('Your working tree is clean. Nothing to commit!'), 'Status');
        outro('✅ Git update complete!');
        process.exit(0);
    }

    // 2. Output the changes in a Clack note
    note(pc.dim(status.output), 'Changes Being Processed');

    // 3. Execute 'git add .'
    log.step(`Staging changes (${pc.cyan('git add .')})...`);
    if (!runCommand('git', ['add', '.']).success) {
        log.error('Failed to stage changes.\n');
        process.exit(1);
    }

    // 4. Execute 'git commit -m "MESSAGE"'
    const commandText = pc.cyan(`git commit -m '${formattedMsg}'`);
    log.step(`Committing changes (${commandText})...`);

    // Note: Changed hardcoded 'Update' string to use your dynamic 'msg' variable
    if (!runCommand('git', ['commit', '-m', msg]).success) {
        log.error('Failed to commit. (Are there any new changes?)\n');
        process.exit(1);
    }

    // 5. Execute 'git push'
    log.step(`Pushing to origin main (${pc.cyan('git push origin main')})...`);
    if (!runCommand('git', ['push', 'origin', 'main']).success) {
        log.error('Failed to push changes to remote.\n');
        process.exit(1);
    }

    log.success('All steps completed successfully!');
    outro('✅ Git update complete!');
}

main().catch(console.error);

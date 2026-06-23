/* eslint-disable @typescript-eslint/no-explicit-any */

// FILE-PATH: src/components/UserInterface.ts

import { box, confirm, intro, isCancel, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import type { Config } from 'prettier';
import type { ColorFunction } from '../types';

export class UserInterface {
    private currentSpinner?: ReturnType<typeof spinner>;
    private symbols: Config['ui']['symbols'];
    private layouts: Config['ui']['layouts'];
    private config: Config;

    constructor(config: Config) {
        this.symbols = config.ui.symbols;
        this.layouts = config.ui.layouts;
        this.config = config;
    }

    private getModifier(
        moduleKey: 'graft' | 'sever',
        themeKey: string,
        fallback: ColorFunction,
    ): ColorFunction {
        const theme = this.config.ui.theme[moduleKey];
        const colorName = theme ? (theme as any)[themeKey] : undefined;
        return (pc as any)[colorName || ''] || fallback;
    }

    public renderHeader(
        moduleKey: 'graft' | 'sever',
        defaultBg: ColorFunction,
    ): void {
        const bg = this.getModifier(moduleKey, 'bannerBg', defaultBg);
        const fg = this.getModifier(moduleKey, 'bannerFg', pc.black);
        intro(
            bg(fg(` ${this.symbols.headerGlyphs} ${this.config.cli.title} `)),
        );
    }

    public async askConfirmation(message: string): Promise<boolean> {
        const proceed = await confirm({
            message,
            active: this.config.messages.shared.confirmActive,
            inactive: this.config.messages.shared.confirmInactive,
        });
        return !isCancel(proceed) && proceed;
    }

    public startSpinner(message: string): void {
        this.currentSpinner = spinner();
        this.currentSpinner.start(message);
    }

    public updateSpinner(message: string): void {
        this.currentSpinner?.message(message);
    }

    public stopSpinner(message: string, isSuccess = true): void {
        const colorizer = isSuccess ? pc.green : pc.red;
        this.currentSpinner?.stop(colorizer(message));
    }

    public traceAction(
        moduleKey: 'graft' | 'sever',
        actionKey: 'dryRun' | 'writing' | 'skipped',
        labelPrefix: string,
        targetPath: string,
    ): void {
        const indicatorMap = {
            dryRun: this.symbols.dryRun,
            writing: this.symbols.writing,
            skipped: this.symbols.skipped,
        };

        const color = this.getModifier(
            moduleKey,
            `${actionKey}Indicator`,
            pc.gray,
        );
        const symbol = indicatorMap[actionKey];

        console.log(`  ${color(symbol)} ${labelPrefix}${pc.cyan(targetPath)}`);
    }

    public renderSummaryBox(
        moduleKey: 'graft' | 'sever',
        title: string,
        message: string,
    ): void {
        const headerColor = this.getModifier(moduleKey, 'boxHeader', pc.dim);
        box(message, headerColor(` ${title} `), {
            contentAlign: this.layouts.boxAlignment,
        });
    }

    public renderAborted(): void {
        outro(pc.yellow(this.config.messages.shared.aborted));
    }

    public renderFooter(message: string): void {
        outro(pc.cyan(message));
    }
}

import * as vscode from 'vscode';

export class Logger {
    private static channel: vscode.OutputChannel;

    public static init() {
        if (!this.channel) {
            this.channel = vscode.window.createOutputChannel('Sonar Sync');
        }
    }

    public static log(message: string) {
        this.init();
        const timestamp = new Date().toLocaleString();
        this.channel.appendLine(`[${timestamp}] [INFO] ${message}`);
        console.log(message); // Still log to console for debug
    }

    public static error(message: string, error?: any) {
        this.init();
        const timestamp = new Date().toLocaleString();
        this.channel.appendLine(`[${timestamp}] [ERROR] ${message}`);
        if (error) {
            this.channel.appendLine(error.stack || error.message || String(error));
        }
        this.channel.show(true); // Bring channel to front on error
        console.error(message, error);
    }

    public static warn(message: string) {
        this.init();
        const timestamp = new Date().toLocaleString();
        this.channel.appendLine(`[${timestamp}] [WARN] ${message}`);
        console.warn(message);
    }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SonarConfig } from './types';

export function getSonarConfig(): SonarConfig {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const configPath = path.join(workspaceFolder.uri.fsPath, 'sonar.json');
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(configContent);
            } catch (err) {
                console.error('Error reading sonar.json:', err);
            }
        }
    }

    const config = vscode.workspace.getConfiguration('sonar');
    return {
        host: config.get<string>('host') || '',
        token: config.get<string>('token') || '',
        projectKey: config.get<string>('projectKey') || '',
        cookie: config.get<string>('cookie') || '',
        queryParams: config.get<Record<string, string>>('queryParams') || {}
    };
}

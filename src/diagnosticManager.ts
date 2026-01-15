import * as vscode from 'vscode';
import * as path from 'path';
import { Issue } from './types';
import { Logger } from './logger';

export class DiagnosticManager {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('sonar-issues');
    }

    public updateDiagnostics(issues: Issue[]) {
        Logger.log(`Updating diagnostics for ${issues.length} issues`);
        this.diagnosticCollection.clear();
        const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();

        issues.forEach(issue => {
            const range = new vscode.Range(
                new vscode.Position(issue.startLine - 1, issue.startColumn),
                new vscode.Position(issue.endLine - 1, issue.endColumn)
            );
            const severity = this.getSeverity(issue.severity);
            const message = issue.author ? `${issue.message} (Author: ${issue.author})` : issue.message;
            const diagnostic = new vscode.Diagnostic(range, message, severity);
            diagnostic.source = 'SonarQube';

            const filePath = issue.file; // This might need to be resolved to a full URI
            if (!diagnosticsMap.has(filePath)) {
                diagnosticsMap.set(filePath, []);
            }
            diagnosticsMap.get(filePath)!.push(diagnostic);
        });

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        diagnosticsMap.forEach((diagnostics, filePath) => {
            const uri = workspaceFolder 
                ? vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath))
                : vscode.Uri.file(filePath);
            this.diagnosticCollection.set(uri, diagnostics);
        });
    }

    private getSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'BLOCKER':
                return vscode.DiagnosticSeverity.Error;
            case 'CRITICAL':
                return vscode.DiagnosticSeverity.Error;
            case 'MAJOR':
                return vscode.DiagnosticSeverity.Warning;
            case 'MINOR':
                return vscode.DiagnosticSeverity.Information;
            case 'INFO':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }
}
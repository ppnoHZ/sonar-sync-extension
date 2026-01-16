import * as vscode from 'vscode';
import * as path from 'path';
import { Issue, PagingInfo } from './types';

export class SonarIssueTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private issues: Issue[] = [];
    private paging: PagingInfo = { pageIndex: 1, pageSize: 100, total: 0 };
    private branchInfo?: string;
    private groupingMode: 'author' | 'file' = 'author';

    refresh(issues?: Issue[], paging?: PagingInfo, branch?: string): void {
        if (issues) {
            this.issues = issues;
        }
        if (paging) {
            this.paging = paging;
        }
        if (branch !== undefined) {
            this.branchInfo = branch;
        }
        this._onDidChangeTreeData.fire();
    }

    setGroupingMode(mode: 'author' | 'file'): void {
        this.groupingMode = mode;
        this.refresh();
    }

    getGroupingMode(): 'author' | 'file' {
        return this.groupingMode;
    }

    getPaging(): PagingInfo {
        return this.paging;
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!element) {
            const items: TreeItem[] = [];
            
            // Add Pagination Item if total > 0
            if (this.paging.total > 0) {
                items.push(new PaginationItem(this.paging, this.branchInfo));
            }

            if (this.groupingMode === 'author') {
                const authorsMap = new Map<string, Issue[]>();
                this.issues.forEach(issue => {
                    const author = issue.author || 'Unknown Author';
                    if (!authorsMap.has(author)) {
                        authorsMap.set(author, []);
                    }
                    authorsMap.get(author)!.push(issue);
                });

                items.push(...Array.from(authorsMap.keys()).sort().map(author => 
                    new AuthorItem(author, authorsMap.get(author)!.length, authorsMap.get(author)!)
                ));
            } else {
                const filesMap = new Map<string, Issue[]>();
                this.issues.forEach(issue => {
                    const file = issue.file;
                    if (!filesMap.has(file)) {
                        filesMap.set(file, []);
                    }
                    filesMap.get(file)!.push(issue);
                });

                items.push(...Array.from(filesMap.keys()).sort().map(file => 
                    new FileItem(file, filesMap.get(file)!.length, filesMap.get(file)!)
                ));
            }
            return Promise.resolve(items);
        }

        if (element instanceof AuthorItem) {
            return Promise.resolve(element.issues.map(issue => new IssueItem(issue, true)));
        }

        if (element instanceof FileItem) {
            return Promise.resolve(element.issues.map(issue => new IssueItem(issue, false)));
        }

        return Promise.resolve([]);
    }
}

type TreeItem = AuthorItem | FileItem | IssueItem | PaginationItem;

class PaginationItem extends vscode.TreeItem {
    constructor(paging: PagingInfo, branchInfo?: string) {
        const totalPages = Math.ceil(paging.total / paging.pageSize);
        const label = branchInfo ? `${branchInfo} - Page ${paging.pageIndex} of ${totalPages}` : `Page ${paging.pageIndex} of ${totalPages}`;
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = `(Total: ${paging.total})`;
        this.contextValue = 'pagination';
        this.iconPath = new vscode.ThemeIcon('git-branch');
    }
}

class AuthorItem extends vscode.TreeItem {
    constructor(
        public readonly author: string,
        public readonly count: number,
        public readonly issues: Issue[]
    ) {
        super(author, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = `(${count})`;
        this.contextValue = 'author';
        this.iconPath = new vscode.ThemeIcon('account');
    }
}

class FileItem extends vscode.TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly count: number,
        public readonly issues: Issue[]
    ) {
        super(path.basename(filePath), vscode.TreeItemCollapsibleState.Collapsed);
        this.description = filePath;
        this.contextValue = 'file';

        // Use resourceUri and ThemeIcon.File to show file-type specific icons (e.g. TS, JSON)
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const uri = workspaceFolder 
            ? vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath))
            : vscode.Uri.file(filePath);
            
        this.resourceUri = uri;
        this.iconPath = vscode.ThemeIcon.File;
    }
}

class IssueItem extends vscode.TreeItem {
    constructor(public readonly issue: Issue, showFileName: boolean = false) {
        super(issue.message, vscode.TreeItemCollapsibleState.None);
        this.description = showFileName ? `${path.basename(issue.file)}:L${issue.line}` : `L${issue.line}`;
        this.tooltip = `${issue.severity}: ${issue.message}`;
        this.contextValue = 'issue';
        
        // Define command to open the file
        this.command = {
            command: 'vscode.open',
            title: 'Open Issue',
            arguments: [
                this.getFileUri(issue.file),
                {
                    selection: new vscode.Range(
                        issue.startLine - 1,
                        issue.startColumn,
                        issue.endLine - 1,
                        issue.endColumn
                    )
                }
            ]
        };

        this.iconPath = this.getIconForSeverity(issue.severity);
    }

    private getFileUri(filePath: string): vscode.Uri {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath));
        }
        return vscode.Uri.file(filePath);
    }

    private getIconForSeverity(severity: string): vscode.ThemeIcon {
        switch (severity) {
            case 'BLOCKER':
            case 'CRITICAL':
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('problemsErrorIcon.foreground'));
            case 'MAJOR':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
            default:
                return new vscode.ThemeIcon('info', new vscode.ThemeColor('problemsInfoIcon.foreground'));
        }
    }
}

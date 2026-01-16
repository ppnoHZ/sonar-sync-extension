export interface Issue {
    key: string;
    severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
    type: string;
    message: string;
    component: string;
    file: string;
    line: number;
    status: 'OPEN' | 'CLOSED';
    effort: number | null;
    debt: number | null;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    author?: string;
}

export interface SonarConfig {
    host: string;
    token: string;
    projectKey: string;
    cookie?: string;
    queryParams?: Record<string, string>;
}

export interface PagingInfo {
    pageIndex: number;
    pageSize: number;
    total: number;
}

export interface SonarIssuesResponse {
    issues: Issue[];
    paging: PagingInfo;
    branch?: string;
}

export interface Diagnostic {
    severity: number;
    message: string;
    source: string;
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
}
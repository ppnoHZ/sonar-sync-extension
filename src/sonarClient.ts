import axios from 'axios';
import { Issue, SonarIssuesResponse } from './types';
import { Logger } from './logger';

export class SonarClient {
    private host: string;
    private token: string;
    private projectKey: string;
    private cookie?: string;
    private queryParams?: Record<string, string>;

    constructor(host: string, token: string, projectKey: string, cookie?: string, queryParams?: Record<string, string>) {
        this.host = host;
        this.token = token;
        this.projectKey = projectKey;
        this.cookie = cookie;
        this.queryParams = queryParams;
    }

    public async fetchIssues(page: number = 1, pageSize: number = 100): Promise<SonarIssuesResponse> {
        const url = `${this.host}api/issues/search`;
        Logger.log(`Fetching issues from: ${url} for project: ${this.projectKey} (Page: ${page}, PageSize: ${pageSize})`);

        const headers: any = {
            'Authorization': `Bearer ${this.token}`
        };

        if (this.cookie) {
            headers['Cookie'] = this.cookie;
        }

        const params = {
            componentKeys: this.projectKey,
            p: page,
            ps: pageSize,
            ...this.queryParams
        };

        try {
            const response = await axios.get(url, { headers, params });
            Logger.log(`Sonar API response status: ${response.status}`);
            
            if (!response.data || !response.data.issues) {
                Logger.warn('Sonar API returned empty or invalid data');
                return { issues: [], paging: { pageIndex: page, pageSize, total: 0 } };
            }

            const issues = response.data.issues.map((issue: any) => ({
                key: issue.key,
                severity: issue.severity,
                message: issue.message,
                file: issue.component.split(':')[1],
                line: issue.line,
                status: issue.status,
                // Assuming startLine/endLine might be needed by diagnosticManager
                startLine: issue.textRange?.startLine || issue.line,
                startColumn: issue.textRange?.startOffset || 0,
                endLine: issue.textRange?.endLine || issue.line,
                endColumn: issue.textRange?.endOffset || 0,
                author: issue.author
            }));

            // Extract branch info from components[0].branch if available
            let branchInfo = undefined;
            if (response.data.components && response.data.components.length > 0) {
                const component = response.data.components[0];
                if (component.branch) {
                    branchInfo = `Branch: ${component.branch}`;
                } else if (component.pullRequest) {
                    branchInfo = `PR: ${component.pullRequest}`;
                }
            }

            // Fallback to queryParams if not found in components
            if (!branchInfo) {
                branchInfo = this.queryParams?.branch || this.queryParams?.pullRequest 
                    ? (this.queryParams.branch ? `Branch: ${this.queryParams.branch}` : `PR: ${this.queryParams.pullRequest}`)
                    : undefined;
            }

            return {
                issues,
                paging: {
                    pageIndex: response.data.paging.pageIndex,
                    pageSize: response.data.paging.pageSize,
                    total: response.data.paging.total
                },
                branch: branchInfo
            };
        } catch (error) {
            Logger.error('Error fetching from Sonar API', error);
            throw error;
        }
    }
}

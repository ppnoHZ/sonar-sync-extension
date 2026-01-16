import axios from 'axios';
import { Issue } from './types';
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

    public async fetchIssues(): Promise<Issue[]> {
        const url = `${this.host}api/issues/search`;
        Logger.log(`Fetching issues from: ${url} for project: ${this.projectKey}`);

        const headers: any = {
            'Authorization': `Bearer ${this.token}`
        };

        if (this.cookie) {
            headers['Cookie'] = this.cookie;
        }

        const params = {
            componentKeys: this.projectKey,
            ...this.queryParams
        };

        try {
            const response = await axios.get(url, { headers, params });
            Logger.log(`Sonar API response status: ${response.status}`);
            
            if (!response.data || !response.data.issues) {
                Logger.warn('Sonar API returned empty or invalid data');
                return [];
            }

            return response.data.issues.map((issue: any) => ({
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
        } catch (error) {
            Logger.error('Error fetching from Sonar API', error);
            throw error;
        }
    }
}

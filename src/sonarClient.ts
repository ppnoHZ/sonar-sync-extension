import axios from 'axios';
import { Issue } from './types';
import { Logger } from './logger';

export class SonarClient {
    private host: string;
    private token: string;
    private projectKey: string;
    private cookie?: string;

    constructor(host: string, token: string, projectKey: string, cookie?: string) {
        this.host = host;
        this.token = token;
        this.projectKey = projectKey;
        this.cookie = cookie;
    }

    public async fetchIssues(): Promise<Issue[]> {
        const url = `${this.host}api/issues/search?componentKeys=${this.projectKey}`;
        Logger.log(`Fetching issues from: ${url}`);

        const headers: any = {
            'Authorization': `Bearer ${this.token}`
        };

        if (this.cookie) {
            headers['Cookie'] = this.cookie;
        }

        try {
            const response = await axios.get(url, { headers });
            Logger.log(`Sonar API response status: ${response.status}`);
            
            if (!response.data || !response.data.issues) {
                Logger.warn('Sonar API returned empty or invalid data');
                return [];
            }

            return response.data.issues.map((issue: any) => ({
            key: issue.key,
            severity: issue.severity,
            message: issue.message,
            file: issue.component,
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

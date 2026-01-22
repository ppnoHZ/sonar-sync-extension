import axios, { AxiosInstance } from 'axios';
import { SonarIssuesResponse, SonarBranchesResponse } from './types';
import { Logger } from './logger';

export class SonarClient {
    private readonly host: string;
    private readonly token: string;
    private readonly projectKey: string;
    private readonly cookie?: string;
    private readonly queryParams?: Record<string, string>;
    private readonly axiosInstance: AxiosInstance;

    constructor(host: string, token: string, projectKey: string, cookie?: string, queryParams?: Record<string, string>) {
        this.host = host;
        this.token = token;
        this.projectKey = projectKey;
        this.cookie = cookie;
        this.queryParams = queryParams;

        this.axiosInstance = axios.create({
            baseURL: this.host
        });

        this.axiosInstance.interceptors.request.use((config) => {
            config.headers['Authorization'] = `Bearer ${this.token}`;
            if (this.cookie) {
                config.headers['Cookie'] = this.cookie;
            }
            return config;
        });
    }

    public async fetchIssues(page: number = 1, pageSize: number = 100): Promise<SonarIssuesResponse> {
        const url = `api/issues/search`;
        Logger.log(`Fetching issues from: ${this.host}${url} for project: ${this.projectKey} (Page: ${page}, PageSize: ${pageSize})`);

        const params = {
            componentKeys: this.projectKey,
            p: page,
            ps: pageSize,
            ...this.queryParams
        };

        try {
            const response = await this.axiosInstance.get(url, { params });
            Logger.log(`Sonar API response status: ${response.status}`);
            
            if (!response.data?.issues) {
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
                if (this.queryParams?.branch) {
                    branchInfo = `Branch: ${this.queryParams.branch}`;
                } else if (this.queryParams?.pullRequest) {
                    branchInfo = `PR: ${this.queryParams.pullRequest}`;
                }
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

    public async fetchBranches(): Promise<SonarBranchesResponse> {
        const url = `api/project_branches/list`;
        Logger.log(`Fetching branches from: ${this.host}${url} for project: ${this.projectKey}`);

        const params = {
            project: this.projectKey
        };

        try {
            const response = await this.axiosInstance.get(url, { params });
            Logger.log(`Sonar API response status: ${response.status}`);
            
            if (!response.data?.branches) {
                Logger.warn('Sonar API returned empty or invalid branches data');
                return { branches: [] };
            }

            return {
                branches: response.data.branches
            };
        } catch (error) {
            Logger.error('Error fetching branches from Sonar API', error);
            throw error;
        }
    }
}

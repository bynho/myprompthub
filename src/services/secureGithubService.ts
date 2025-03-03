import {Octokit} from 'octokit';
import {Folder, Prompt, SavedPrompt} from '../types';
import secureStorageService from './secureStorageService';
import errorService from './errorService';

interface GistContent {
    savedPrompts: SavedPrompt[];
    customPrompts: Prompt[];
    folders: Folder[];
    lastSynced: string;
}

interface GistFile {
    content: string;
    filename?: string;
    type?: string;
    language?: string;
    raw_url?: string;
    size?: number;
}

// Updated Gist interface to match Octokit's return type
interface Gist {
    id: string;
    description: string | null;
    files: Record<string, GistFile>;
    url?: string;
    forks_url?: string;
    commits_url?: string;
    node_id?: string;
    git_pull_url?: string;
    git_push_url?: string;
    html_url?: string;
}

const GIST_FILENAME = 'myprompt-hub-data.json';
const STORAGE_KEY_TOKEN = 'github-token';
const STORAGE_KEY_GIST_ID = 'github-gist-id';

class GitHubService {
    private octokit: Octokit | null = null;
    private token: string | null = null;
    private gistId: string | null = null;
    private tokenExpiry: number | null = null;

    constructor() {
        this.loadCredentials();
    }

    /**
     * Load GitHub credentials from secure storage
     */
    private async loadCredentials(): Promise<void> {
        try {
            // Get stored token with expiry
            const tokenData = await secureStorageService.getItem<{
                token: string;
                expiry: number;
            } | null>(STORAGE_KEY_TOKEN);

            // Check if token exists and isn't expired
            const now = Date.now();
            if (tokenData && tokenData.expiry > now) {
                this.token = tokenData.token;
                this.tokenExpiry = tokenData.expiry;
                this.octokit = new Octokit({auth: this.token});
            }

            // Get gist ID
            this.gistId = await secureStorageService.getItem<string | null>(STORAGE_KEY_GIST_ID);
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'loadCredentials'},
                severity: 'medium'
            });
        }
    }

    /**
     * Check if authenticated with GitHub
     */
    isAuthenticated(): boolean {
        return !!this.token && !!this.octokit && !!this.tokenExpiry && this.tokenExpiry > Date.now();
    }

    /**
     * Check if a Gist ID is set
     */
    hasGist(): boolean {
        return !!this.gistId;
    }

    /**
     * Login to GitHub with a personal access token
     */
    async login(token: string): Promise<boolean> {
        try {
            // Create Octokit instance
            this.octokit = new Octokit({auth: token});

            // Verify the token works by getting user info
            const {data} = await this.octokit.rest.users.getAuthenticated();
            console.log(data);

            // Set expiry to 30 days
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

            // Store the token and expiry
            this.token = token;
            this.tokenExpiry = expiry;

            // Save to secure storage
            await secureStorageService.setItem(STORAGE_KEY_TOKEN, {
                token,
                expiry
            });

            return true;
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'login'},
                severity: 'medium',
                userMessage: 'Failed to authenticate with GitHub. Please check your token and try again.'
            });

            // Clear any partial state
            this.logout();
            return false;
        }
    }

    /**
     * Logout from GitHub
     */
    logout(): void {
        // Clear memory state
        this.octokit = null;
        this.token = null;
        this.gistId = null;
        this.tokenExpiry = null;

        // Clear stored data
        secureStorageService.removeItem(STORAGE_KEY_TOKEN);
        secureStorageService.removeItem(STORAGE_KEY_GIST_ID);
    }

    /**
     * Get the user's Gists
     */
    async getUserGists(): Promise<Gist[]> {
        if (!this.isAuthenticated() || !this.octokit) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await this.octokit.rest.gists.list();
            // Explicitly type cast the response to match Gist[] interface
            return response.data as unknown as Gist[];
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'getUserGists'},
                severity: 'medium',
                userMessage: 'Failed to fetch Gists from GitHub.'
            });
            throw error;
        }
    }

    /**
     * Create a new Gist for storing prompt data
     */
    async createGist(data: GistContent): Promise<string> {
        if (!this.isAuthenticated() || !this.octokit) {
            throw new Error('Not authenticated');
        }

        try {
            // Sanitize data to remove sensitive information
            const sanitizedData = this.sanitizeDataForGist(data);

            // Create the Gist
            const response = await this.octokit.rest.gists.create({
                description: 'MyPromptHub saved prompts and templates',
                public: false,
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(sanitizedData, null, 2)
                    }
                }
            });

            const gist = response.data;

            if (!gist.id) {
                throw new Error('Failed to create Gist on GitHub.');
            }
            // Store the Gist ID
            this.gistId = gist.id ?? null;
            await secureStorageService.setItem(STORAGE_KEY_GIST_ID, gist.id);

            return gist.id;
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'createGist'},
                severity: 'medium',
                userMessage: 'Failed to create Gist on GitHub.'
            });
            throw error;
        }
    }

    /**
     * Update an existing Gist with new data
     */
    async updateGist(data: GistContent): Promise<void> {
        if (!this.isAuthenticated() || !this.octokit || !this.gistId) {
            throw new Error('Not authenticated or no Gist ID');
        }

        try {
            // Sanitize data
            const sanitizedData = this.sanitizeDataForGist(data);

            // Update the Gist
            await this.octokit.rest.gists.update({
                gist_id: this.gistId,
                files: {
                    [GIST_FILENAME]: {
                        content: JSON.stringify(sanitizedData, null, 2)
                    }
                }
            });
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'updateGist'},
                severity: 'medium',
                userMessage: 'Failed to update Gist on GitHub.'
            });
            throw error;
        }
    }

    /**
     * Get content from a Gist
     */
    async getGistContent(): Promise<GistContent | null> {
        if (!this.isAuthenticated() || !this.octokit || !this.gistId) {
            throw new Error('Not authenticated or no Gist ID');
        }

        try {
            // Get the Gist
            const response = await this.octokit.rest.gists.get({
                gist_id: this.gistId
            });

            const data = response.data;

            if (!data.files) {
                return null;
            }
            // Get the file content
            const file = data?.files[GIST_FILENAME];
            if (!file || !file.content) {
                return null;
            }

            // Parse and validate the content
            const content = JSON.parse(file.content) as GistContent;
            return this.validateGistContent(content);
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'getGistContent'},
                severity: 'medium',
                userMessage: 'Failed to fetch Gist content from GitHub.'
            });
            throw error;
        }
    }

    /**
     * Sync data with GitHub
     */
    async syncData(
        savedPrompts: SavedPrompt[],
        customPrompts: Prompt[],
        folders: Folder[]
    ): Promise<GistContent> {
        // Prepare the data
        const data: GistContent = {
            savedPrompts,
            customPrompts,
            folders,
            lastSynced: new Date().toISOString()
        };

        // Create or update Gist
        if (this.hasGist()) {
            await this.updateGist(data);
        } else {
            await this.createGist(data);
        }

        return data;
    }

    /**
     * Set the Gist ID
     */
    async setGistId(gistId: string): Promise<void> {
        this.gistId = gistId;
        await secureStorageService.setItem(STORAGE_KEY_GIST_ID, gistId);
    }

    /**
     * Get the current Gist ID
     */
    getGistId(): string | null {
        return this.gistId;
    }

    /**
     * Check token validity and refresh if needed
     */
    async checkTokenValidity(): Promise<boolean> {
        if (!this.token || !this.tokenExpiry || !this.octokit) {
            return false;
        }

        // If token is about to expire (less than 1 day), try to refresh
        if (this.tokenExpiry < Date.now() + 24 * 60 * 60 * 1000) {
            try {
                // Verify the token still works
                await this.octokit.rest.users.getAuthenticated();

                // Extend the token expiry
                this.tokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

                // Update stored data
                await secureStorageService.setItem(STORAGE_KEY_TOKEN, {
                    token: this.token,
                    expiry: this.tokenExpiry
                });

                return true;
            } catch (error) {
                console.error(error as Error);
                // Token is no longer valid
                this.logout();
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitize data before storing in Gist
     * Removes sensitive information and limits content size
     */
    private sanitizeDataForGist(data: GistContent): GistContent {
        try {
            // Create a deep copy to avoid modifying the original
            const sanitized: GistContent = JSON.parse(JSON.stringify(data));

            // Trim long content for performance
            sanitized.savedPrompts = sanitized.savedPrompts.map(prompt => {
                if (prompt.content && prompt.content.length > 10000) {
                    return {
                        ...prompt,
                        generatedContent: prompt.content.substring(0, 10000) +
                            '... [content truncated for storage]'
                    };
                }
                return prompt;
            });

            // Trim custom prompts content too
            sanitized.customPrompts = sanitized.customPrompts.map(prompt => {
                if (prompt.content && prompt.content.length > 10000) {
                    return {
                        ...prompt,
                        content: prompt.content.substring(0, 10000) +
                            '... [content truncated for storage]'
                    };
                }
                return prompt;
            });

            return sanitized;
        } catch (error) {
            errorService.handleError(error as Error, {
                context: {component: 'GitHubService', method: 'sanitizeDataForGist'},
                severity: 'low'
            });
            return data; // Return original if sanitization fails
        }
    }

    /**
     * Validate Gist content to ensure it's valid
     */
    private validateGistContent(content: GistContent): GistContent {
        // Basic structure validation
        if (!content ||
            !Array.isArray(content.savedPrompts) ||
            !Array.isArray(content.customPrompts) ||
            !Array.isArray(content.folders)) {
            throw new Error('Invalid Gist content structure');
        }

        // Set default lastSynced if missing
        if (!content.lastSynced) {
            content.lastSynced = new Date().toISOString();
        }

        return content as GistContent;
    }
}

// Create singleton instance
const githubService = new GitHubService();
export default githubService;

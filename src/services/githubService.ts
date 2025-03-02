import { Octokit } from 'octokit';
import { Prompt, SavedPrompt, Folder } from '../types';

interface GistContent {
  savedPrompts: SavedPrompt[];
  customPrompts: Prompt[];
  folders: Folder[];
  lastSynced: string;
}

interface GistFile {
  content: string;
}

interface Gist {
  id: string;
  description: string;
  files: Record<string, GistFile>;
}

const GIST_FILENAME = 'myprompt-hub-data.json';
const STORAGE_KEY_TOKEN = 'github-token';
const STORAGE_KEY_GIST_ID = 'github-gist-id';

class GitHubService {
  private octokit: Octokit | null = null;
  private token: string | null = null;
  private gistId: string | null = null;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    try {
      this.token = localStorage.getItem(STORAGE_KEY_TOKEN);
      this.gistId = localStorage.getItem(STORAGE_KEY_GIST_ID);
      
      if (this.token) {
        this.octokit = new Octokit({ auth: this.token });
      }
    } catch (error) {
      console.error('Error loading GitHub credentials:', error);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.octokit;
  }

  hasGist(): boolean {
    return !!this.gistId;
  }

  async login(token: string): Promise<boolean> {
    try {
      this.octokit = new Octokit({ auth: token });
      
      // Verify token by making a simple API call
      const { data } = await this.octokit.rest.users.getAuthenticated();
      
      // Save token if valid
      this.token = token;
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      
      return true;
    } catch (error) {
      console.error('GitHub authentication error:', error);
      this.octokit = null;
      this.token = null;
      return false;
    }
  }

  logout(): void {
    this.octokit = null;
    this.token = null;
    this.gistId = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_GIST_ID);
  }

  async getUserGists(): Promise<Gist[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const { data } = await this.octokit!.rest.gists.list();
      return data;
    } catch (error) {
      console.error('Error fetching user gists:', error);
      throw error;
    }
  }

  async createGist(data: GistContent): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const { data: gist } = await this.octokit!.rest.gists.create({
        description: 'MyPromptHub saved prompts and templates',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      });

      this.gistId = gist.id;
      localStorage.setItem(STORAGE_KEY_GIST_ID, gist.id);
      
      return gist.id;
    } catch (error) {
      console.error('Error creating gist:', error);
      throw error;
    }
  }

  async updateGist(data: GistContent): Promise<void> {
    if (!this.isAuthenticated() || !this.gistId) {
      throw new Error('Not authenticated or no gist ID');
    }

    try {
      await this.octokit!.rest.gists.update({
        gist_id: this.gistId,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      });
    } catch (error) {
      console.error('Error updating gist:', error);
      throw error;
    }
  }

  async getGistContent(): Promise<GistContent | null> {
    if (!this.isAuthenticated() || !this.gistId) {
      throw new Error('Not authenticated or no gist ID');
    }

    try {
      const { data } = await this.octokit!.rest.gists.get({
        gist_id: this.gistId
      });

      const file = data.files[GIST_FILENAME];
      if (!file || !file.content) {
        return null;
      }

      return JSON.parse(file.content) as GistContent;
    } catch (error) {
      console.error('Error fetching gist content:', error);
      throw error;
    }
  }

  async syncData(
    savedPrompts: SavedPrompt[],
    customPrompts: Prompt[],
    folders: Folder[]
  ): Promise<GistContent> {
    const data: GistContent = {
      savedPrompts,
      customPrompts,
      folders,
      lastSynced: new Date().toISOString()
    };

    if (this.hasGist()) {
      await this.updateGist(data);
    } else {
      await this.createGist(data);
    }

    return data;
  }

  async setGistId(gistId: string): Promise<void> {
    this.gistId = gistId;
    localStorage.setItem(STORAGE_KEY_GIST_ID, gistId);
  }

  getGistId(): string | null {
    return this.gistId;
  }
}

export default new GitHubService();
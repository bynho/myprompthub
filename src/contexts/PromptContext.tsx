import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {Folder, Prompt, PromptType, Variable} from '../types';
import {getUserRating, loadPrompts, ratePrompt} from '../services/promptService';
import {v4 as uuidv4} from 'uuid';
import analyticsService from '../services/analyticsService';
import githubService from '../services/secureGithubService';
import {isSupabaseConfigured} from '../services/supabaseClient';

interface GistSyncResult {
  lastSynced: string;
}

interface PromptContextType {
  prompts: Prompt[];
  savedPrompts: Prompt[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  savePrompt: (prompt: Prompt) => void;
  removeSavedPrompt: (id: string) => void;
  updatePrompt: (prompt: Prompt) => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  movePromptToFolder: (promptId: string, folderId: string | undefined) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  categories: string[];
  tags: string[];
  getAllTags: () => string[];
  createPromptTemplate: (prompt: Prompt) => void;
  updatePromptTemplate: (prompt: Prompt) => void;
  deletePromptTemplate: (id: string) => void;
  extractVariablesFromContent: (content: string) => Variable[];
  exportToGitHub: (savedPrompts: Prompt[], customPrompts: Prompt[], folders: Folder[]) => Promise<GistSyncResult>;
  importFromGitHub: () => Promise<GistSyncResult | null>;
  ratePrompt: (promptId: string, rating: boolean) => Promise<void>;
  isSupabaseEnabled: boolean;
  refreshPrompts: () => Promise<void>;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSupabaseEnabled] = useState<boolean>(isSupabaseConfigured());

  // Load prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const loadedPrompts = await loadPrompts();
      
      // Load custom prompts from local storage
      const customPromptsJson = localStorage.getItem('custom-prompts');
      let customPrompts: Prompt[] = [];
      if (customPromptsJson) {
        customPrompts = JSON.parse(customPromptsJson);
      }

      // Load saved prompts from local storage
      let saved: Prompt[] = [];
      const savedPromptsJson = localStorage.getItem('saved-prompts');
      if (savedPromptsJson) {
        saved = JSON.parse(savedPromptsJson) ?? [];
      }

      setSavedPrompts(saved);

      // Combine built-in and custom prompts
      const allPrompts = [...loadedPrompts, ...customPrompts, ...saved];
      setPrompts(allPrompts);
      
      // Extract categories and tags
      const uniqueCategories = Array.from(new Set(allPrompts.map(p => p.category)));
      setCategories(uniqueCategories);
      
      const allTags = new Set<string>();
      allPrompts.forEach(prompt => {
        prompt.tags?.forEach(tag => allTags.add(tag));
      });
      setTags(Array.from(allTags));
      


      // Load folders from local storage
      const foldersJson = localStorage.getItem('folders');
      if (foldersJson) {
        setFolders(JSON.parse(foldersJson));
      }
      
      // If Supabase is enabled, load user ratings
      if (isSupabaseEnabled) {
        await loadUserRatings(allPrompts);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load prompts');
      console.error('Error loading prompts:', err);
      analyticsService.trackError('Failed to load prompts', true);
    } finally {
      setLoading(false);
    }
  };

  // Load prompts on initial render
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Refresh prompts (for example after language change)
  const refreshPrompts = async () => {
    await fetchPrompts();
  };

  // Load user ratings for prompts
  const loadUserRatings = async (promptsToLoad: Prompt[]) => {
    if (!isSupabaseEnabled) return;

    try {
      const updatedPrompts = [...promptsToLoad];
      
      // Load ratings for each prompt
      for (const prompt of updatedPrompts) {
        const userRating = await getUserRating(prompt.id);
        prompt.userRating = userRating;
      }
      
      setPrompts(updatedPrompts);
    } catch (error) {
      console.error('Error loading user ratings:', error);
    }
  };

  // Save changes to localStorage whenever savedPrompts changes
  useEffect(() => {
    if (savedPrompts.length > 0) {
      console.warn('Saving savedPrompts', savedPrompts);
      localStorage.setItem('saved-prompts', JSON.stringify(savedPrompts));
    }
  }, [savedPrompts]);

  // Save changes to localStorage whenever folders changes
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('folders', JSON.stringify(folders));
    }
  }, [folders]);

  // Extract variables from prompt content
  const extractVariablesFromContent = (content: string): Variable[] => {
    const variableRegex = /{([^{}]+)}/g;
    const matches = content.match(variableRegex) || [];
    
    // Extract unique variable names
    const uniqueVars = new Set<string>();
    matches.forEach(match => {
      const varName = match.slice(1, -1); // Remove { and }
      uniqueVars.add(varName);
    });
    
    // Create variable objects
    return Array.from(uniqueVars).map(varName => {
      // Convert variable_name to Variable Name
      const readableName = varName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        id: varName,
        name: readableName,
        description: `Enter value for ${readableName}`,
        type: 'text',
        placeholder: `e.g., value for ${varName}`
      };
    });
  };

  // Create a new prompt template
  const createPromptTemplate = (prompt: Prompt) => {
    try {
      const newPrompt = {
        ...prompt,
        id: prompt.id || `custom-${uuidv4()}`,
        createdAt: new Date().toISOString(),
        isCustom: PromptType.LOCAL_TEMPLATE
      };
      
      setPrompts(prevPrompts => [...prevPrompts, newPrompt]);
      
      // Update categories if needed
      if (!categories.includes(newPrompt.category)) {
        setCategories(prev => [...prev, newPrompt.category]);
      }
      
      // Update tags if needed
      const newTags = newPrompt.tags.filter(tag => !tags.includes(tag));
      if (newTags.length > 0) {
        setTags(prev => [...prev, ...newTags]);
      }
      
      // Save custom prompts to localStorage
      const customPrompts = prompts.filter(p => p.type === PromptType.LOCAL_TEMPLATE).concat(newPrompt);
      localStorage.setItem('custom-prompts', JSON.stringify(customPrompts));
      
      analyticsService.event('Prompt', 'create_template', newPrompt.title);
      
      return newPrompt;
    } catch (err) {
      setError('Failed to create prompt template');
      console.error('Error creating prompt template:', err);
      analyticsService.trackError('Failed to create prompt template');
      throw err;
    }
  };

  // Update a prompt template
  const updatePromptTemplate = (prompt: Prompt) => {
    try {
      setPrompts(prevPrompts => 
        prevPrompts.map(p => p.id === prompt.id ? { ...prompt, isCustom: true } : p)
      );
      
      // Update categories if needed
      if (!categories.includes(prompt.category)) {
        setCategories(prev => [...prev, prompt.category]);
      }
      
      // Update tags if needed
      const newTags = prompt.tags.filter(tag => !tags.includes(tag));
      if (newTags.length > 0) {
        setTags(prev => [...prev, ...newTags]);
      }
      
      // Save custom prompts to localStorage
      const customPrompts = prompts
        .filter(p => p.type === PromptType.LOCAL_TEMPLATE && p.id !== prompt.id);

      localStorage.setItem('custom-prompts', JSON.stringify(customPrompts));
      
      analyticsService.event('Prompt', 'update_template', prompt.title);
    } catch (err) {
      setError('Failed to update prompt template');
      console.error('Error updating prompt template:', err);
      analyticsService.trackError('Failed to update prompt template');
    }
  };

  // Delete a prompt template
  const deletePromptTemplate = (id: string) => {
    try {
      const promptToDelete = prompts.find(p => p.id === id);
      if (promptToDelete?.type === PromptType.SYSTEM_TEMPLATE) {
        throw new Error('Cannot delete system prompt templates');
      }
      
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== id));
      
      // Save custom prompts to localStorage
      const customPrompts = prompts.filter(p => p.type === PromptType.LOCAL_TEMPLATE && p.id !== id);
      localStorage.setItem('custom-prompts', JSON.stringify(customPrompts));
      
      analyticsService.event('Prompt', 'delete_template', promptToDelete?.title);
    } catch (err) {
      setError('Failed to delete prompt template');
      console.error('Error deleting prompt template:', err);
      analyticsService.trackError('Failed to delete prompt template');
    }
  };

  // Save a prompt
  const savePrompt = (prompt: Prompt) => {
    try {
      const newPrompt = {
        ...prompt,
        id: prompt.id || `saved-${uuidv4()}`,
        type: PromptType.LOCAL,
        savedAt: new Date().toISOString()
      };

      console.warn('Save prompt:', newPrompt);

      setSavedPrompts(prevPrompts => {
        const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
        
        if (existingIndex >= 0) {
          // Update existing prompt
          const updatedPrompts = [...prevPrompts];
          updatedPrompts[existingIndex] = newPrompt;
          return updatedPrompts;
        } else {
          // Add new prompt
          return [...prevPrompts, newPrompt];
        }
      });
    } catch (err) {
      setError('Failed to save prompt');
      console.error('Error saving prompt:', err);
      analyticsService.trackError('Failed to save prompt');
    }
  };

  // Remove a saved prompt
  const removeSavedPrompt = (id: string) => {
    try {
      setSavedPrompts(prevPrompts => prevPrompts.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to remove prompt');
      console.error('Error removing prompt:', err);
      analyticsService.trackError('Failed to remove prompt');
    }
  };

  // Update a saved prompt
  const updatePrompt = (prompt: Prompt) => {
    try {
      setSavedPrompts(prevPrompts => 
        prevPrompts.map(p => p.id === prompt.id ? prompt : p)
      );
    } catch (err) {
      setError('Failed to update prompt');
      console.error('Error updating prompt:', err);
      analyticsService.trackError('Failed to update prompt');
    }
  };

  // Create a folder
  const createFolder = (name: string) => {
    try {
      const newFolder: Folder = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString()
      };
      
      setFolders(prevFolders => [...prevFolders, newFolder]);
      analyticsService.trackOrganization('create_folder', 'folder', name);
      
      return newFolder;
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
      analyticsService.trackError('Failed to create folder');
      throw err;
    }
  };

  // Delete a folder
  const deleteFolder = (id: string) => {
    try {
      // Get folder name for analytics before deletion
      const folder = folders.find(f => f.id === id);
      
      setFolders(prevFolders => prevFolders.filter(f => f.id !== id));
      
      // Update saved prompts to remove folder reference
      setSavedPrompts(prevPrompts => 
        prevPrompts.map(prompt => {
          if (prompt.folder === id) {
            return { ...prompt, folder: undefined };
          }
          return prompt;
        })
      );
      
      if (folder) {
        analyticsService.trackOrganization('delete_folder', 'folder', folder.name);
      }
    } catch (err) {
      setError('Failed to delete folder');
      console.error('Error deleting folder:', err);
      analyticsService.trackError('Failed to delete folder');
    }
  };

  // Move a prompt to a folder
  const movePromptToFolder = (promptId: string, folderId: string | undefined) => {
    try {
      setSavedPrompts(prevPrompts => 
        prevPrompts.map(prompt => {
          if (prompt.id === promptId) {
            return { ...prompt, folder: folderId };
          }
          return prompt;
        })
      );
      
      // Track the move action
      const prompt = savedPrompts.find(p => p.id === promptId);
      const folder = folders.find(f => f.id === folderId);
      
      if (prompt) {
        analyticsService.trackOrganization(
          'move_prompt', 
          'folder', 
          folder ? folder.name : 'No folder'
        );
      }
    } catch (err) {
      setError('Failed to move prompt');
      console.error('Error moving prompt:', err);
      analyticsService.trackError('Failed to move prompt');
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string): Promise<boolean> => {
    return analyticsService.copyToClipboard(text);
  };

  // Get all tags from saved prompts
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    savedPrompts.forEach(prompt => {
      prompt.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Export data to GitHub Gist
  const exportToGitHub = async (
    savedPrompts: Prompt[],
    customPrompts: Prompt[],
    folders: Folder[]
  ): Promise<GistSyncResult> => {
    if (!githubService.isAuthenticated()) {
      throw new Error('Not authenticated with GitHub');
    }

    try {
      const result = await githubService.syncData(savedPrompts, customPrompts, folders);
      return {
        lastSynced: result.lastSynced
      };
    } catch (error) {
      console.error('Error exporting to GitHub:', error);
      throw error;
    }
  };

  // Import data from GitHub Gist
  const importFromGitHub = async (): Promise<GistSyncResult | null> => {
    if (!githubService.isAuthenticated() || !githubService.hasGist()) {
      throw new Error('Not authenticated with GitHub or no Gist ID');
    }

    try {
      const gistContent = await githubService.getGistContent();
      
      if (!gistContent) {
        return null;
      }

      // Update state with imported data
      if (gistContent.savedPrompts) {
        setSavedPrompts(gistContent.savedPrompts);
      }
      
      if (gistContent.folders) {
        setFolders(gistContent.folders);
      }
      
      if (gistContent.customPrompts) {
        // Merge custom prompts with built-in prompts
        const builtInPrompts = prompts.filter(p => p.type === PromptType.SYSTEM_TEMPLATE);
        setPrompts([...builtInPrompts, ...gistContent.customPrompts]);
        
        // Save custom prompts to localStorage
        localStorage.setItem('custom-prompts', JSON.stringify(gistContent.customPrompts));
      }
      
      // Update localStorage
      localStorage.setItem('saved-prompts', JSON.stringify(gistContent.savedPrompts));
      localStorage.setItem('folders', JSON.stringify(gistContent.folders));
      
      return {
        lastSynced: gistContent.lastSynced
      };
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      throw error;
    }
  };

  // Rate a prompt
  const handleRatePrompt = async (promptId: string, rating: boolean) => {
    try {
      // Update local state first for immediate feedback
      setPrompts(prevPrompts => 
        prevPrompts.map(p => {
          if (p.id === promptId) {
            // Update rating counts
            const positiveRatings = p.positiveRatings || 0;
            const negativeRatings = p.negativeRatings || 0;
            
            // If user already rated, adjust the previous rating count
            if (p.userRating !== null) {
              if (p.userRating === true && rating === false) {
                // Changed from positive to negative
                return {
                  ...p,
                  positiveRatings: Math.max(0, positiveRatings - 1),
                  negativeRatings: negativeRatings + 1,
                  userRating: rating
                };
              } else if (p.userRating === false && rating === true) {
                // Changed from negative to positive
                return {
                  ...p,
                  positiveRatings: positiveRatings + 1,
                  negativeRatings: Math.max(0, negativeRatings - 1),
                  userRating: rating
                };
              }
              // Rating didn't change
              return { ...p, userRating: rating };
            } else {
              // New rating
              return {
                ...p,
                positiveRatings: rating ? positiveRatings + 1 : positiveRatings,
                negativeRatings: rating ? negativeRatings : negativeRatings + 1,
                userRating: rating
              };
            }
          }
          return p;
        })
      );
      
      // Save to Supabase if enabled
      if (isSupabaseEnabled) {
        await ratePrompt(promptId, rating);
      }
      
      // Track rating event
      analyticsService.event('Prompt', 'rate_prompt', `${promptId}:${rating ? 'positive' : 'negative'}`);
    } catch (error) {
      console.error('Error rating prompt:', error);
      setError('Failed to rate prompt');
    }
  };

  const value = {
    prompts,
    savedPrompts,
    folders,
    loading,
    error,
    savePrompt,
    removeSavedPrompt,
    updatePrompt,
    createFolder,
    deleteFolder,
    movePromptToFolder,
    copyToClipboard,
    categories,
    tags,
    getAllTags,
    createPromptTemplate,
    updatePromptTemplate,
    deletePromptTemplate,
    extractVariablesFromContent,
    exportToGitHub,
    importFromGitHub,
    ratePrompt: handleRatePrompt,
    isSupabaseEnabled,
    refreshPrompts
  };

  return (
    <PromptContext.Provider value={value}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompts = (): PromptContextType => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
};

export const usePromptContext = usePrompts;

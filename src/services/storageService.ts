import { SavedPrompt, Folder } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const SAVED_PROMPTS_KEY = 'research-prompt-hub-saved-prompts';
const FOLDERS_KEY = 'research-prompt-hub-folders';

// Get all saved prompts
export const getSavedPrompts = (): SavedPrompt[] => {
  try {
    const savedPromptsJson = localStorage.getItem(SAVED_PROMPTS_KEY);
    return savedPromptsJson ? JSON.parse(savedPromptsJson) : [];
  } catch (error) {
    console.error('Error getting saved prompts:', error);
    return [];
  }
};

// Save a prompt
export const savePrompt = (prompt: SavedPrompt): SavedPrompt => {
  try {
    const savedPrompts = getSavedPrompts();
    const newPrompt = {
      ...prompt,
      savedAt: new Date().toISOString()
    };
    
    // Check if prompt already exists
    const existingIndex = savedPrompts.findIndex(p => p.id === prompt.id);
    
    if (existingIndex >= 0) {
      // Update existing prompt
      savedPrompts[existingIndex] = newPrompt;
    } else {
      // Add new prompt
      savedPrompts.push(newPrompt);
    }
    
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
    return newPrompt;
  } catch (error) {
    console.error('Error saving prompt:', error);
    throw new Error('Failed to save prompt');
  }
};

// Delete a saved prompt
export const deleteSavedPrompt = (id: string): boolean => {
  try {
    const savedPrompts = getSavedPrompts();
    const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== id);
    
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updatedPrompts));
    return true;
  } catch (error) {
    console.error('Error deleting saved prompt:', error);
    return false;
  }
};

// Update a saved prompt
export const updateSavedPrompt = (updatedPrompt: SavedPrompt): SavedPrompt => {
  try {
    const savedPrompts = getSavedPrompts();
    const index = savedPrompts.findIndex(prompt => prompt.id === updatedPrompt.id);
    
    if (index === -1) {
      throw new Error('Prompt not found');
    }
    
    savedPrompts[index] = {
      ...updatedPrompt,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
    return savedPrompts[index];
  } catch (error) {
    console.error('Error updating saved prompt:', error);
    throw new Error('Failed to update prompt');
  }
};

// Get all folders
export const getFolders = (): Folder[] => {
  try {
    const foldersJson = localStorage.getItem(FOLDERS_KEY);
    return foldersJson ? JSON.parse(foldersJson) : [];
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
};

// Create a new folder
export const createFolder = (name: string): Folder => {
  try {
    const folders = getFolders();
    
    // Check if folder with same name already exists
    if (folders.some(folder => folder.name === name)) {
      throw new Error('Folder with this name already exists');
    }
    
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString()
    };
    
    folders.push(newFolder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    
    return newFolder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Delete a folder
export const deleteFolder = (id: string): boolean => {
  try {
    const folders = getFolders();
    const updatedFolders = folders.filter(folder => folder.id !== id);
    
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
    
    // Update saved prompts to remove folder reference
    const savedPrompts = getSavedPrompts();
    const updatedPrompts = savedPrompts.map(prompt => {
      if (prompt.folder === id) {
        return { ...prompt, folder: undefined };
      }
      return prompt;
    });
    
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updatedPrompts));
    
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
};

// Move a prompt to a folder
export const movePromptToFolder = (promptId: string, folderId: string | undefined): SavedPrompt | null => {
  try {
    const savedPrompts = getSavedPrompts();
    const promptIndex = savedPrompts.findIndex(prompt => prompt.id === promptId);
    
    if (promptIndex === -1) {
      throw new Error('Prompt not found');
    }
    
    // If folderId is provided, verify folder exists
    if (folderId) {
      const folders = getFolders();
      const folderExists = folders.some(folder => folder.id === folderId);
      
      if (!folderExists) {
        throw new Error('Folder not found');
      }
    }
    
    // Update prompt with new folder
    savedPrompts[promptIndex] = {
      ...savedPrompts[promptIndex],
      folder: folderId
    };
    
    localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
    
    return savedPrompts[promptIndex];
  } catch (error) {
    console.error('Error moving prompt to folder:', error);
    return null;
  }
};
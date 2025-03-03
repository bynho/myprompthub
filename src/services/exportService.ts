import { SavedPrompt } from '../types';

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Export a single prompt as JSON
export const exportPromptAsJson = (prompt: SavedPrompt): string => {
  return JSON.stringify(prompt, null, 2);
};

// Export multiple prompts as JSON
export const exportPromptsAsJson = (prompts: SavedPrompt[]): string => {
  return JSON.stringify(prompts, null, 2);
};

// Download content as a file
export const downloadAsFile = (content: string, filename: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
};

// Export prompt as text file
export const exportPromptAsText = (prompt: SavedPrompt): string => {
  return `# ${prompt.title}\n\n${prompt.description}\n\n${prompt.content}`;
};

// Export prompts as markdown
export const exportPromptsAsMarkdown = (prompts: SavedPrompt[]): string => {
  return prompts.map(prompt => {
    return `# ${prompt.title}\n\n${prompt.description}\n\n${prompt.content}\n\n---\n\n`;
  }).join('');
};

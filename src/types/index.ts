export interface Variable {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'select';
  placeholder: string;
  options?: string[]; // For select type
}

export interface Prompt {
  id: string;
  slug?: string; // URL-friendly identifier
  title: string;
  category: string;
  description: string;
  content: string;
  variables: Variable[];
  tags: string[];
  createdAt: string;
  isCustom?: boolean;
  positiveRatings?: number;
  negativeRatings?: number;
  userRating?: boolean | null; // true for positive, false for negative, null for no rating
}

export interface SavedPrompt {
  id: string;
  originalPromptId: string;
  title: string;
  category: string;
  description: string;
  generatedContent: string;
  tags: string[];
  folder?: string;
  savedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface PromptRating {
  id: string;
  promptId: string;
  rating: boolean; // true for positive, false for negative
  createdAt: string;
  userId?: string | null;
}
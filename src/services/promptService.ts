import { Prompt } from '../types';
import { supabase, isSupabaseConfigured, safeSupabaseQuery } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Load prompts from a local file (fallback)
export const loadPromptsFromFile = async (): Promise<Prompt[]> => {
  try {
    const response = await fetch('/src/data/prompts-engb.json');
    if (!response.ok) {
      throw new Error('Failed to load prompts from file');
    }

    const data = await response.json();
    return data.prompts.map((prompt: Prompt) => ({
      ...prompt,
      createdAt: prompt.createdAt || new Date().toISOString(),
      isCustom: false,
      positiveRatings: 0,
      negativeRatings: 0,
      userRating: null
    }));
  } catch (error) {
    console.error('Error loading prompts from file:', error);
    return [];
  }
};

// Load prompts from Supabase
export const loadPromptsFromSupabase = async (): Promise<Prompt[]> => {
  return safeSupabaseQuery(async () => {
    // Query prompts with their translations in English
    const { data, error } = await supabase
        .from('prompts')
        .select(`
        id,
        slug,
        category,
        created_at,
        is_custom,
        positive_ratings,
        negative_ratings,
        variables,
        tags,
        prompt_translations (
          id,
          language,
          title,
          description,
          content,
          created_at
        )
      `)
        .eq('prompt_translations.language', 'en');

    if (error) {
      console.error('Error loading prompts from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform data to match Prompt type
    return data.map(item => {
      const translation = item.prompt_translations?.[0];
      if (!translation) {
        console.warn(`No English translation found for prompt ${item.id}`);
        return null;
      }

      return {
        id: item.id.toString(),
        slug: item.slug,
        title: translation.title,
        category: item.category,
        description: translation.description,
        content: translation.content,
        variables: item.variables || [],
        tags: item.tags || [],
        createdAt: item.created_at,
        isCustom: item.is_custom,
        positiveRatings: item.positive_ratings || 0,
        negativeRatings: item.negative_ratings || 0,
        userRating: null
      };
    }).filter(Boolean);
  }, []);
};

// Main function to load prompts, with fallback
export const loadPrompts = async (): Promise<Prompt[]> => {
  try {
    if (isSupabaseConfigured()) {
      try {
        console.log('Loading prompts from Supabase...');
        const supabasePrompts = await loadPromptsFromSupabase();
        if (supabasePrompts.length > 0) {
          return supabasePrompts;
        }
        console.warn('No prompts found in Supabase, falling back to file');
      } catch (error) {
        console.error('Failed to load from Supabase, falling back to file:', error);
      }
    }

    console.log('Loading prompts from file...');
    return await loadPromptsFromFile();
  } catch (error) {
    console.error('Error loading prompts:', error);
    return [];
  }
};

// Get the numeric ID from a prompt ID string
export const getNumericIdFromPromptId = async (promptId: string): Promise<number | null> => {
  return safeSupabaseQuery(async () => {
    // If the ID starts with 'custom-', it's a local custom prompt
    if (promptId.startsWith('custom-')) {
      return null;
    }

    // If the ID is already numeric, return it
    if (!isNaN(Number(promptId))) {
      return Number(promptId);
    }

    // Otherwise, look up the ID by slug
    const { data, error } = await supabase
        .from('prompts')
        .select('id')
        .eq('slug', promptId)
        .maybeSingle();

    if (error) {
      console.error('Error getting numeric ID from prompt ID:', error);
      return null;
    }

    return data?.id || null;
  }, null);
};

// Rate a prompt
export const ratePrompt = async (
    promptId: string,
    rating: boolean,
    userId?: string
): Promise<boolean> => {
  return safeSupabaseQuery(async () => {
    const numericId = await getNumericIdFromPromptId(promptId);

    if (numericId === null) {
      console.log('Custom prompt or prompt not found in database, rating stored locally only');
      return true;
    }

    // Check for existing rating
    const { data: existingRatings, error: fetchError } = await supabase
        .from('prompt_ratings')
        .select('*')
        .eq('prompt_id', numericId)
        .eq('user_id', userId || 'anonymous');

    if (fetchError) {
      console.error('Error fetching existing ratings:', fetchError);
      return false;
    }

    const existingRating = existingRatings && existingRatings.length > 0 ? existingRatings[0] : null;

    if (existingRating) {
      // Update existing rating if different
      if (existingRating.rating !== rating) {
        const { error: updateError } = await supabase
            .from('prompt_ratings')
            .update({ rating })
            .eq('id', existingRating.id);

        if (updateError) {
          console.error('Error updating rating:', updateError);
          return false;
        }

        await updatePromptRatingCounts(numericId);
      }
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
          .from('prompt_ratings')
          .insert({
            id: uuidv4(),
            prompt_id: numericId,
            rating,
            user_id: userId || 'anonymous',
            created_at: new Date().toISOString()
          });

      if (insertError) {
        console.error('Error inserting rating:', insertError);
        return false;
      }

      await updatePromptRatingCounts(numericId);
    }

    return true;
  }, true);
};

// Get a user's rating for a prompt
export const getUserRating = async (
    promptId: string,
    userId?: string
): Promise<boolean | null> => {
  return safeSupabaseQuery(async () => {
    if (promptId.startsWith('custom-')) {
      return null;
    }

    const numericId = await getNumericIdFromPromptId(promptId);

    if (numericId === null) {
      return null;
    }

    const { data, error } = await supabase
        .from('prompt_ratings')
        .select('rating')
        .eq('prompt_id', numericId)
        .eq('user_id', userId || 'anonymous')
        .maybeSingle();

    if (error) {
      console.error('Error getting user rating:', error);
      return null;
    }

    return data ? data.rating : null;
  }, null);
};

// Update the rating counts for a prompt
const updatePromptRatingCounts = async (numericId: number): Promise<void> => {
  return safeSupabaseQuery(async () => {
    // Count positive ratings
    const { count: positiveCount, error: positiveError } = await supabase
        .from('prompt_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', numericId)
        .eq('rating', true);

    if (positiveError) {
      console.error('Error counting positive ratings:', positiveError);
      return;
    }

    // Count negative ratings
    const { count: negativeCount, error: negativeError } = await supabase
        .from('prompt_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', numericId)
        .eq('rating', false);

    if (negativeError) {
      console.error('Error counting negative ratings:', negativeError);
      return;
    }

    // Update the prompt with the new counts
    const { error: updateError } = await supabase
        .from('prompts')
        .update({
          positive_ratings: positiveCount || 0,
          negative_ratings: negativeCount || 0
        })
        .eq('id', numericId);

    if (updateError) {
      console.error('Error updating prompt rating counts:', updateError);
    }
  }, undefined);
};

// Generate prompt content by replacing variables with values
export const generatePromptContent = (
    promptContent: string,
    variableValues: Record<string, string>
): string => {
  let generatedContent = promptContent;

  Object.entries(variableValues).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value || `{${key}}`);
  });

  return generatedContent;
};

// Get a prompt by ID
export const getPromptById = (prompts: Prompt[], id: string): Prompt | undefined => {
  return prompts.find(prompt => prompt.id === id);
};

// Get categories from prompts
export const getCategories = (prompts: Prompt[]): string[] => {
  const categories = new Set(prompts.map(prompt => prompt.category));
  return Array.from(categories);
};

// Get all tags from prompts
export const getAllTags = (prompts: Prompt[]): string[] => {
  const tagsSet = new Set<string>();

  prompts.forEach(prompt => {
    prompt.tags?.forEach(tag => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
};

// Filter prompts by search term, category, and tags
export const filterPrompts = (
    prompts: Prompt[],
    searchTerm: string = '',
    category: string = '',
    selectedTags: string[] = []
): Prompt[] => {
  return prompts.filter(prompt => {
    // Filter by search term
    const matchesSearch = searchTerm === '' ||
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category
    const matchesCategory = category === '' || prompt.category === category;

    // Filter by tags
    const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => prompt.tags?.includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });
};

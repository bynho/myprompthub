import ReactGA from 'react-ga4';

// Replace with your actual Google Analytics measurement ID
const MEASUREMENT_ID = 'G-XXXXXXXXXX';
// Replace with your actual Microsoft Clarity project ID
const CLARITY_PROJECT_ID = 'xxxxxxxx';

interface AnalyticsPreferences {
  ga: boolean;
  clarity: boolean;
}

/**
 * Analytics service for tracking user interactions
 */
const analyticsService = {
  /**
   * Initialize analytics services based on user preferences
   * @param preferences - User preferences for analytics services
   */
  init: (preferences?: AnalyticsPreferences) => {
    // Get preferences from localStorage if not provided
    if (!preferences) {
      try {
        const storedPreferences = localStorage.getItem('analytics-preferences');
        if (storedPreferences) {
          preferences = JSON.parse(storedPreferences);
        } else {
          // Default to enabled if no preferences are stored
          preferences = { ga: true, clarity: true };
        }
      } catch (error) {
        console.error('Error reading analytics preferences:', error);
        preferences = { ga: true, clarity: true };
      }
    }

    // Initialize Google Analytics if enabled
    if (preferences?.ga && import.meta.env.PROD) {
      ReactGA.initialize(MEASUREMENT_ID);
      console.log('Google Analytics initialized');
    }

    // Initialize Microsoft Clarity if enabled
    if (preferences?.clarity && import.meta.env.PROD) {
      initClarity();
      console.log('Microsoft Clarity initialized');
    }
  },

  /**
   * Track page views
   * @param path - The current page path
   * @param title - The page title
   */
  pageView: (path: string, title?: string) => {
    if (import.meta.env.PROD) {
      // Check if GA is enabled
      const preferences = getAnalyticsPreferences();
      if (preferences.ga) {
        ReactGA.send({ 
          hitType: "pageview", 
          page: path,
          title: title
        });
      }
    }
  },

  /**
   * Track events
   * @param category - Event category
   * @param action - Event action
   * @param label - Event label (optional)
   * @param value - Event value (optional)
   */
  event: (category: string, action: string, label?: string, value?: number) => {
    if (import.meta.env.PROD) {
      // Check if GA is enabled
      const preferences = getAnalyticsPreferences();
      if (preferences.ga) {
        ReactGA.event({
          category,
          action,
          label,
          value
        });
      }
    }
  },

  /**
   * Track prompt interactions
   * @param action - The action performed
   * @param promptId - The prompt ID
   * @param promptTitle - The prompt title
   */
  trackPromptInteraction: (action: string, promptId: string, promptTitle: string) => {
    analyticsService.event('Prompt', action, `${promptTitle} (${promptId})`);
  },

  /**
   * Track search and filter actions
   * @param action - The action performed
   * @param query - The search query or filter value
   */
  trackSearch: (action: string, query: string) => {
    analyticsService.event('Search', action, query);
  },

  /**
   * Track organization actions (folders, tags)
   * @param action - The action performed
   * @param itemType - The type of item (folder, tag)
   * @param itemName - The name of the item
   */
  trackOrganization: (action: string, itemType: string, itemName: string) => {
    analyticsService.event('Organization', action, `${itemType}: ${itemName}`);
  },

  /**
   * Track export actions
   * @param action - The action performed
   * @param format - The export format
   */
  trackExport: (action: string, format: string) => {
    analyticsService.event('Export', action, format);
  },

  /**
   * Track errors
   * @param description - Error description
   * @param fatal - Whether the error is fatal
   */
  trackError: (description: string, fatal: boolean = false) => {
    if (import.meta.env.PROD) {
      // Check if GA is enabled
      const preferences = getAnalyticsPreferences();
      if (preferences.ga) {
        ReactGA.event({
          category: 'Error',
          action: fatal ? 'Fatal Error' : 'Error',
          label: description
        });
      }
    }
  },

  /**
   * Track user timing
   * @param category - Timing category
   * @param variable - Timing variable
   * @param value - Time in milliseconds
   * @param label - Timing label (optional)
   */
  timing: (category: string, variable: string, value: number, label?: string) => {
    if (import.meta.env.PROD) {
      // Check if GA is enabled
      const preferences = getAnalyticsPreferences();
      if (preferences.ga) {
        ReactGA.send({
          hitType: "timing",
          timingCategory: category,
          timingVar: variable,
          timingValue: value,
          timingLabel: label
        });
      }
    }
  },

  /**
   * Copy text to clipboard
   * @param text - The text to copy
   * @returns Promise resolving to boolean indicating success
   */
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      analyticsService.event('Interaction', 'copy_to_clipboard');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      analyticsService.trackError('Failed to copy to clipboard');
      return false;
    }
  }
};

/**
 * Initialize Microsoft Clarity
 */
function initClarity() {
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    
    // Add the script to the document head
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  }
}

/**
 * Get analytics preferences from localStorage
 * @returns Analytics preferences
 */
function getAnalyticsPreferences(): AnalyticsPreferences {
  try {
    const storedPreferences = localStorage.getItem('analytics-preferences');
    if (storedPreferences) {
      return JSON.parse(storedPreferences);
    }
  } catch (error) {
    console.error('Error reading analytics preferences:', error);
  }
  
  // Default to enabled if no preferences are stored or error occurs
  return { ga: true, clarity: true };
}

export default analyticsService;

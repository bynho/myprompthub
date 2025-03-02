import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import analyticsService from '../services/analyticsService';

const AnalyticsSettings: React.FC = () => {
  const navigate = useNavigate();
  const [gaEnabled, setGaEnabled] = useState(true);
  const [clarityEnabled, setClarityEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load current settings
  useEffect(() => {
    const analyticsPreferences = localStorage.getItem('analytics-preferences');
    if (analyticsPreferences) {
      try {
        const preferences = JSON.parse(analyticsPreferences);
        setGaEnabled(preferences.ga !== undefined ? preferences.ga : true);
        setClarityEnabled(preferences.clarity !== undefined ? preferences.clarity : true);
      } catch (error) {
        console.error('Error parsing analytics preferences:', error);
      }
    }
  }, []);

  const handleSave = () => {
    const preferences = { ga: gaEnabled, clarity: clarityEnabled };
    localStorage.setItem('analytics-preferences', JSON.stringify(preferences));
    
    // Re-initialize analytics with new preferences
    analyticsService.init(preferences);
    
    // Show saved message
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // Track settings change
    if (gaEnabled) {
      analyticsService.event('Settings', 'update_analytics_preferences', 
        `GA: ${gaEnabled}, Clarity: ${clarityEnabled}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Settings</h1>
        <p className="text-gray-600">
          Control which analytics services are enabled for this application
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
              <input
                id="ga-analytics"
                type="checkbox"
                checked={gaEnabled}
                onChange={(e) => setGaEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="ga-analytics" className="font-medium text-gray-700">Google Analytics</label>
              <p className="text-gray-500">
                Helps us understand how you use the application, which features are popular, and how we can improve your experience.
              </p>
            </div>
          </div>
          
          <div className="flex items-start mb-4">
            <div className="flex items-center h-5">
              <input
                id="clarity-analytics"
                type="checkbox"
                checked={clarityEnabled}
                onChange={(e) => setClarityEnabled(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="clarity-analytics" className="font-medium text-gray-700">Microsoft Clarity</label>
              <p className="text-gray-500">
                Provides heatmaps and session recordings to help us understand how you interact with the interface and identify usability issues.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Changes will take effect after saving and refreshing the page.
          </div>
          
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Preferences
          </button>
        </div>
        
        {saved && (
          <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm">
            Settings saved successfully!
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Analytics</h2>
        <p className="text-gray-600 mb-4">
          We use analytics to understand how our application is used and to improve the user experience. All data is collected anonymously and is not used to identify individual users.
        </p>
        <p className="text-gray-600 mb-4">
          <strong>Google Analytics</strong> helps us understand general usage patterns, popular features, and user journeys through the application.
        </p>
        <p className="text-gray-600 mb-4">
          <strong>Microsoft Clarity</strong> provides heatmaps and session recordings that help us identify usability issues and improve the interface.
        </p>
        <p className="text-gray-600">
          You can change these settings at any time. If you disable analytics, no data will be collected about your usage of the application.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, Database } from 'lucide-react';
import GitHubSync from '../components/GitHubSync';
import analyticsService from '../services/analyticsService';
import { isSupabaseConfigured } from '../services/supabaseClient';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const isSupabaseEnabled = isSupabaseConfigured();
  
  const [gaEnabled, setGaEnabled] = useState(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('analytics-preferences') || '{}');
      return preferences.ga !== undefined ? preferences.ga : true;
    } catch {
      return true;
    }
  });
  
  const [clarityEnabled, setClarityEnabled] = useState(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('analytics-preferences') || '{}');
      return preferences.clarity !== undefined ? preferences.clarity : true;
    } catch {
      return true;
    }
  });
  
  const handleSaveAnalytics = () => {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      </div>
      
      <div className="space-y-6">
        {/* GitHub Integration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <GitHubSync />
        </div>
        
        {/* Supabase Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-500" />
            Supabase Integration
          </h2>
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Supabase provides cloud storage for prompts and translations.
            </p>
            <div className="flex items-center mt-4">
              <span className="text-sm font-medium text-gray-700 mr-2">Supabase Status:</span>
              {isSupabaseEnabled ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Not Connected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
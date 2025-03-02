import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, Database, AlertCircle, Loader } from 'lucide-react';
import GitHubSync from '../components/GitHubSync';
import analyticsService from '../services/analyticsService';
import { isSupabaseConfigured, checkSupabaseConnection } from '../services/supabaseClient';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [isSupabaseEnabled] = useState<boolean>(isSupabaseConfigured());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(false);

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

  useEffect(() => {
    const checkConnection = async () => {
      if (isSupabaseEnabled) {
        setCheckingConnection(true);
        try {
          const connected = await checkSupabaseConnection();
          setIsSupabaseConnected(connected);
        } catch (error) {
          console.error('Error checking Supabase connection:', error);
          setIsSupabaseConnected(false);
        } finally {
          setCheckingConnection(false);
        }
      } else {
        setIsSupabaseConnected(false);
      }
    };

    checkConnection();
  }, [isSupabaseEnabled]);

  const handleSaveAnalytics = () => {
    const preferences = { ga: gaEnabled, clarity: clarityEnabled };
    localStorage.setItem('analytics-preferences', JSON.stringify(preferences));
    analyticsService.init(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

          {/* Supabase Integration */}
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
                <span className="text-sm font-medium text-gray-700 mr-2">Supabase Configuration:</span>
                {isSupabaseEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Configured
                </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </span>
                )}
              </div>

              <div className="flex items-center mt-2">
                <span className="text-sm font-medium text-gray-700 mr-2">Connection Status:</span>
                {checkingConnection ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </span>
                ) : isSupabaseConnected ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </span>
                )}
              </div>
            </div>

            {isSupabaseEnabled && !isSupabaseConnected && !checkingConnection && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                  <p className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                    <span>
                  Supabase is configured but not connected. Make sure your database is set up correctly
                  and your API keys are valid. Run <code className="bg-yellow-100 px-1 py-0.5 rounded text-xs">npm run setup-db</code> to
                  create the necessary tables and policies.
                </span>
                  </p>
                </div>
            )}

            {!isSupabaseEnabled && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                  <p className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                    <span>
                  To enable Supabase integration, create a <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">.env</code> file
                  with your Supabase URL and anon key. You can use the <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">.env.example</code> file
                  as a template.
                </span>
                  </p>
                </div>
            )}
          </div>

          {/* Analytics Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Settings</h2>
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
                  onClick={handleSaveAnalytics}
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
        </div>
      </div>
  );
};

export default SettingsPage;

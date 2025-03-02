import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Check, Github, ExternalLink } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import githubService from '../services/githubService';
import GitHubLogin from './GitHubLogin';

const GitHubSync: React.FC = () => {
  const { 
    savedPrompts, 
    prompts,
    folders,
    importFromGitHub,
    exportToGitHub
  } = usePromptContext();
  
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const isLoggedIn = githubService.isAuthenticated();
  const hasGist = githubService.hasGist();
  
  useEffect(() => {
    // Check if we have a last synced timestamp
    const checkLastSync = async () => {
      if (isLoggedIn && hasGist) {
        try {
          const gistContent = await githubService.getGistContent();
          if (gistContent && gistContent.lastSynced) {
            setLastSynced(gistContent.lastSynced);
          }
        } catch (error) {
          console.error('Error checking last sync:', error);
        }
      }
    };
    
    checkLastSync();
  }, [isLoggedIn, hasGist]);
  
  const handleSync = async () => {
    if (!isLoggedIn) {
      setSyncStatus('error');
      setStatusMessage('You need to login with GitHub first');
      return;
    }
    
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      // Get custom prompts (filter out built-in prompts)
      const customPrompts = prompts.filter(p => p.isCustom);
      
      // Export data to GitHub
      const result = await exportToGitHub(savedPrompts, customPrompts, folders);
      
      setLastSynced(result.lastSynced);
      setSyncStatus('success');
      setStatusMessage('Successfully synced with GitHub');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setStatusMessage('Error syncing with GitHub');
    } finally {
      setSyncing(false);
    }
  };
  
  const handleImport = async () => {
    if (!isLoggedIn || !hasGist) {
      setSyncStatus('error');
      setStatusMessage('You need to login with GitHub first');
      return;
    }
    
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      // Import data from GitHub
      const result = await importFromGitHub();
      
      if (result) {
        setLastSynced(result.lastSynced);
        setSyncStatus('success');
        setStatusMessage('Successfully synced with GitHub');
      }
    } catch (error) {
      console.error('Import error:', error);
      setSyncStatus('error');
      setStatusMessage('Error syncing with GitHub');
    } finally {
      setSyncing(false);
    }
  };
  
  const handleLoginSuccess = () => {
    setSyncStatus('success');
    setStatusMessage('Login successful');
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Sync with GitHub</h3>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Why sync with GitHub?</h4>
        <p className="text-sm text-gray-600 mb-2">
          Syncing with GitHub allows you to:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">
          <li>Back up your saved prompts and custom templates</li>
          <li>Access your prompts from different devices</li>
          <li>Share your prompt collection with others</li>
        </ul>
        <p className="text-sm text-gray-600">
          Your data is stored in a GitHub Gist (a simple way to share code snippets) under your GitHub account.
        </p>
      </div>
      
      {!isLoggedIn ? (
        <GitHubLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="space-y-4">
          {lastSynced && (
            <p className="text-sm text-gray-600">
              Last synced: {new Date(lastSynced).toLocaleString()}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {syncing ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Export to Gist
            </button>
            
            {hasGist && (
              <button
                onClick={handleImport}
                disabled={syncing}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {syncing ? (
                  <span className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full mr-2"></span>
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                Import from Gist
              </button>
            )}
          </div>
          
          {syncStatus && (
            <div className={`p-3 rounded-md text-sm flex items-start ${
              syncStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {syncStatus === 'success' ? (
                <Check className="h-4 w-4 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
          
          {hasGist && (
            <div className="mt-2">
              <a 
                href={`https://gist.github.com/${githubService.getGistId()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View your Gist on GitHub <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubSync;
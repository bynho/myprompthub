import React, { useState } from 'react';
import { Github, LogOut, AlertCircle, ExternalLink } from 'lucide-react';
import githubService from '../services/secureGithubService';

interface GitHubLoginProps {
  onLoginSuccess?: () => void;
  onLogout?: () => void;
}

const GitHubLogin: React.FC<GitHubLoginProps> = ({ onLoginSuccess, onLogout }) => {
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isLoggedIn = githubService.isAuthenticated();

  const handleLogin = async () => {
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await githubService.login(token);
      if (success) {
        setToken('');
        setShowTokenInput(false);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError('Invalid token or authentication failed');
      }
    } catch (err) {
      setError('Authentication failed. Please check your token and try again.');
      console.error('GitHub login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    githubService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  if (isLoggedIn) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm text-green-600">
          <Github className="h-4 w-4 mr-1" />
          <span>Connected to GitHub</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout from GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showTokenInput ? (
        <button
          onClick={() => setShowTokenInput(true)}
          className="flex items-center px-3 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700"
        >
          <Github className="h-4 w-4 mr-2" />
          Login with GitHub
        </button>
      ) : (
        <div className="space-y-3 p-4 border border-gray-200 rounded-md">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">How to create a GitHub Personal Access Token:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to your GitHub account settings</li>
              <li>Select <strong>Developer settings</strong> from the sidebar</li>
              <li>Click on <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong></li>
              <li>Click <strong>Generate new token</strong> → <strong>Generate new token (classic)</strong></li>
              <li>Give your token a descriptive name</li>
              <li>Select the <strong>gist</strong> scope (this is the only permission needed)</li>
              <li>Click <strong>Generate token</strong> at the bottom of the page</li>
              <li>Copy the generated token (you won't be able to see it again!)</li>
            </ol>
            <p className="mt-2">
              <a 
                href="https://github.com/settings/tokens/new?scopes=gist&description=MyPromptHub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Create token directly <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </p>
          </div>
          
          <div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="GitHub Personal Access Token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {error && (
            <div className="p-2 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowTokenInput(false)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex justify-center items-center"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              Login with GitHub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubLogin;

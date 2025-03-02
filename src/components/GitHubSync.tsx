import React, {useEffect, useState} from 'react';
import {AlertCircle, Check, ExternalLink, ImportIcon, RefreshCw} from 'lucide-react';
import {usePromptContext} from '../contexts/PromptContext';
import githubService from '../services/secureGithubService';
import GitHubLogin from './GitHubLogin';
import {useToast} from "../contexts/ToastContext.tsx";

const GitHubSync: React.FC = ({
                                  hideInfo
                              }: { hideInfo: boolean }) => {
    const {
        savedPrompts,
        prompts,
        folders,
        importFromGitHub,
        exportToGitHub,
    } = usePromptContext();

    const [syncing, setSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<string | null>(null);
    const [status, setStatus] = useState<{ success: boolean, message: string } | null>(null);
    const {addToast} = useToast();

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

    useEffect(() => {
        if (status) {
            addToast({
                type: status.success ? 'success' : 'error',
                message: status.message,
                duration: 5000
            });
        }

    }, [status]);

    const handleSync = async () => {
        if (!isLoggedIn) {
            setStatus({
                success: false,
                message: 'You need to login with GitHub first'
            });
            return;
        }

        setSyncing(true);
        setStatus(null);

        try {
            // Get custom prompts (filter out built-in prompts)
            const customPrompts = prompts.filter(p => p.isCustom);

            // Export data to GitHub
            const result = await exportToGitHub(savedPrompts, customPrompts, folders);

            setLastSynced(result.lastSynced);
            setStatus({
                success: true,
                message: 'Successfully synced with GitHub'
            });
        } catch (error) {
            console.error('Sync error:', error);
            setStatus({
                success: false,
                message: 'Error syncing with GitHub'
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleImport = async () => {
        if (!isLoggedIn || !hasGist) {
            setStatus({
                success: false,
                message: 'You need to login with GitHub first'
            });
            return;
        }

        setSyncing(true);
        setStatus(null);

        try {
            // Import data from GitHub
            const result = await importFromGitHub();

            if (result) {
                setLastSynced(result.lastSynced);
                setStatus({
                    success: true,
                    message: 'Successfully synced with GitHub'
                });
            }
        } catch (error) {
            console.error('Import error:', error);
            setStatus({
                success: false,
                message: 'Error syncing with GitHub'
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleLoginSuccess = () => {
        setStatus({
            success: true,
            message: 'Login successful'
        });
    };

    const handleLogoutSuccess = () => {
        setStatus({
            success: true,
            message: 'Logout successful'
        });
    };

    return (
        <div className="space-y-4">
            {
                !hideInfo && (
                    <>
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
                                Your data is stored in a GitHub Gist (a simple way to share code snippets) under your GitHub
                                account.
                            </p>
                        </div>
                    </>
                )

            }


            <div className="space-y-4">
                {
                    isLoggedIn && (
                        <a
                            href={`https://gist.github.com/${githubService.getGistId()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            View your Gist on GitHub <ExternalLink className="h-3 w-3 ml-1"/>
                        </a>
                    )
                }


                <div className="flex flex-col sm:flex-row justify-between gap-2">

                    <GitHubLogin onLoginSuccess={handleLoginSuccess} onLogout={handleLogoutSuccess}/>
                    <div className="flex flex-row gap-2 items-start">
                        {
                            isLoggedIn && (
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {syncing ? (
                                        <span
                                            className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2"/>
                                    )}
                                    Sync with GitHub
                                </button>
                            )

                        }
                        {isLoggedIn && hasGist && (
                            <>
                                <button
                                    onClick={handleImport}
                                    disabled={syncing}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {syncing ? (
                                        <span
                                            className="animate-spin h-4 w-4 border-2 border-gray-700 border-t-transparent rounded-full mr-2"></span>
                                    ) : (
                                        <ImportIcon className="h-4 w-4 mr-2"/>
                                    )}
                                    Import from GitHub
                                </button>


                            </>
                        )}
                    </div>

                </div>

                {isLoggedIn && lastSynced && (
                    <p className="text-sm text-gray-600">
                        Last synced: {new Date(lastSynced).toLocaleString()}
                    </p>
                )}

                {status && (
                    <div className={`p-3 rounded-md text-sm flex items-start ${
                        status.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        {status.success ? (
                            <Check className="h-4 w-4 mr-2 mt-0.5"/>
                        ) : (
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5"/>
                        )}
                        <span>{status.message}</span>
                    </div>
                )}

            </div>

        </div>
    );
};

export default GitHubSync;

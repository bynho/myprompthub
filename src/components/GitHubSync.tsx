import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Link,
    Paper,
    Typography
} from '@mui/material';
import { AlertCircle, Check, ExternalLink, ImportIcon, RefreshCw } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import githubService from '../services/secureGithubService';
import GitHubLogin from './GitHubLogin';
import { useToast } from "../contexts/ToastContext";
import { PromptType } from "../types";

interface GitHubSyncProps {
    hideInfo?: boolean
}

const GitHubSync: React.FC<GitHubSyncProps> = ({
                                                   hideInfo
                                               }) => {
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
    const { addToast } = useToast();

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
    }, [status, addToast]);

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
            const customPrompts = prompts.filter(p => p.type === PromptType.LOCAL_TEMPLATE);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!hideInfo && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Sync with GitHub
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            bgcolor: 'rgba(249, 250, 251, 0.8)',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 2
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Why sync with GitHub?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Syncing with GitHub allows you to:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Back up your saved prompts and custom templates
                                </Typography>
                            </Box>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Access your prompts from different devices
                                </Typography>
                            </Box>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Share your prompt collection with others
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Your data is stored in a GitHub Gist (a simple way to share code snippets) under your GitHub account.
                        </Typography>
                    </Paper>
                </>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isLoggedIn && (
                    <Link
                        href={`https://gist.github.com/${githubService.getGistId()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            color: 'primary.main'
                        }}
                    >
                        View your Gist on GitHub <ExternalLink size={14} style={{ marginLeft: 4 }} />
                    </Link>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        gap: 2
                    }}
                >
                    <GitHubLogin onLoginSuccess={handleLoginSuccess} onLogout={handleLogoutSuccess} />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {isLoggedIn && (
                            <Button
                                onClick={handleSync}
                                disabled={syncing}
                                variant="contained"
                                color="primary"
                                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
                            >
                                Sync with GitHub
                            </Button>
                        )}

                        {isLoggedIn && hasGist && (
                            <Button
                                onClick={handleImport}
                                disabled={syncing}
                                variant="outlined"
                                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <ImportIcon size={16} />}
                            >
                                Import from GitHub
                            </Button>
                        )}
                    </Box>
                </Box>

                {isLoggedIn && lastSynced && (
                    <Typography variant="caption" color="text.secondary">
                        Last synced: {new Date(lastSynced).toLocaleString()}
                    </Typography>
                )}

                <Collapse in={!!status}>
                    <Alert
                        severity={status?.success ? 'success' : 'error'}
                        icon={status?.success ? <Check size={16} /> : <AlertCircle size={16} />}
                    >
                        {status?.message}
                    </Alert>
                </Collapse>
            </Box>
        </Box>
    );
};

export default GitHubSync;

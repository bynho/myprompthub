import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { AlertCircle, ExternalLink } from 'lucide-react';
import githubService from '../services/secureGithubService';
import { SiGithub } from "@icons-pack/react-simple-icons";

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
              onClick={handleLogout}
              variant="outlined"
              startIcon={<SiGithub size={16} />}
          >
            Logout
          </Button>
        </Box>
    );
  }

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!showTokenInput ? (
            <Button
                onClick={() => setShowTokenInput(true)}
                variant="contained"
                color="inherit"
                startIcon={<SiGithub size={16} />}
                sx={{
                  bgcolor: '#24292e',
                  color: '#fff',
                  '&:hover': { bgcolor: '#373e47' }
                }}
            >
              Login with GitHub
            </Button>
        ) : (
            <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                  How to create a GitHub Personal Access Token:
                </Typography>
                <List dense sx={{ pl: 2 }}>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary="Go to your GitHub account settings" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary={<>Select <strong>Developer settings</strong> from the sidebar</>} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary={<>Click on <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong></>} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary={<>Click <strong>Generate new token</strong> → <strong>Generate new token (classic)</strong></>} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary="Give your token a descriptive name" />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary={<>Select the <strong>gist</strong> scope (this is the only permission needed)</>} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary={<>Click <strong>Generate token</strong> at the bottom of the page</>} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', listStyleType: 'decimal' }}>
                    <ListItemText primary="Copy the generated token (you won't be able to see it again!)" />
                  </ListItem>
                </List>
                <Link
                    href="https://github.com/settings/tokens/new?scopes=gist&description=MyPromptHub"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 1,
                      color: 'primary.main'
                    }}
                >
                  Create token directly <ExternalLink size={14} style={{ marginLeft: 4 }} />
                </Link>
              </Box>

              <TextField
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="GitHub Personal Access Token"
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
              />

              <Collapse in={!!error}>
                <Alert
                    severity="error"
                    icon={<AlertCircle size={16} />}
                    sx={{ mb: 2 }}
                >
                  {error}
                </Alert>
              </Collapse>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    onClick={() => setShowTokenInput(false)}
                    variant="outlined"
                    fullWidth
                >
                  Cancel
                </Button>
                <Button
                    onClick={handleLogin}
                    disabled={loading}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SiGithub size={16} />}
                >
                  Login
                </Button>
              </Box>
            </Paper>
        )}
      </Box>
  );
};

export default GitHubLogin;

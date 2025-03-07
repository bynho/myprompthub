import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Stack
} from '@mui/material';
import { ArrowLeft, Check, Database, AlertCircle } from 'lucide-react';
import GitHubSync from '../components/GitHubSync';
import { isSupabaseConfigured, checkSupabaseConnection } from '../services/supabaseClient';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSupabaseEnabled] = useState<boolean>(isSupabaseConfigured());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(false);

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

  return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowLeft size={18} />}
            sx={{ color: 'primary.main', mb: 3 }}
        >
          Back
        </Button>

        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Settings
        </Typography>

        <Stack spacing={3}>
          {/* GitHub Integration */}
          <Paper sx={{ p: 3 }}>
            <GitHubSync />
          </Paper>

          {/* Supabase Integration */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Database size={20} style={{ color: '#3b82f6', marginRight: 8 }} />
              <Typography variant="h6">
                Supabase Integration
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Your saved prompts / own prompt templates are not stored by us. They are stored locally on your browser and optionally synced with Github
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary" paragraph>
              Supabase provides cloud storage for default prompts and translations.
            </Typography>

            <Box sx={{ my: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mr: 1 }}>
                  Supabase Configuration:
                </Typography>
                {isSupabaseEnabled ? (
                    <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          color: 'rgb(5, 150, 105)',
                        }}
                    >
                      <Check size={12} style={{ marginRight: 4 }} />
                      Configured
                    </Box>
                ) : (
                    <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          color: 'rgb(220, 38, 38)',
                        }}
                    >
                      <AlertCircle size={12} style={{ marginRight: 4 }} />
                      Not Configured
                    </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mr: 1 }}>
                  Connection Status:
                </Typography>
                {checkingConnection ? (
                    <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(156, 163, 175, 0.1)',
                          color: 'text.secondary',
                        }}
                    >
                      <CircularProgress size={12} sx={{ mr: 0.5 }} />
                      Checking...
                    </Box>
                ) : isSupabaseConnected ? (
                    <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          color: 'rgb(5, 150, 105)',
                        }}
                    >
                      <Check size={12} style={{ marginRight: 4 }} />
                      Connected
                    </Box>
                ) : (
                    <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.5,
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          color: 'rgb(220, 38, 38)',
                        }}
                    >
                      <AlertCircle size={12} style={{ marginRight: 4 }} />
                      Not Connected
                    </Box>
                )}
              </Box>
            </Box>

            {isSupabaseEnabled && !isSupabaseConnected && !checkingConnection && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Supabase is configured but not connected. Make sure your database is set up correctly
                    and your API keys are valid. Run <Box component="code" sx={{ bgcolor: 'rgba(251, 191, 36, 0.1)', px: 0.5, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem' }}>npm run setup-db</Box> to
                    create the necessary tables and policies.
                  </Typography>
                </Alert>
            )}

            {!isSupabaseEnabled && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    To enable Supabase integration, create a <Box component="code" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', px: 0.5, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem' }}>.env</Box> file
                    with your Supabase URL and anon key. You can use the <Box component="code" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', px: 0.5, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem' }}>.env.example</Box> file
                    as a template.
                  </Typography>
                </Alert>
            )}
          </Paper>
        </Stack>
      </Container>
  );
};

export default SettingsPage;

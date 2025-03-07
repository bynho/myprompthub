import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CardContent,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography
} from '@mui/material';
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowLeft size={18} />}
            sx={{ mb: 3, color: 'primary.main' }}
        >
          Back
        </Button>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Analytics Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control which analytics services are enabled for this application
          </Typography>
        </Box>

        <Paper sx={{ mb: 4 }} elevation={2}>
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <FormControlLabel
                  control={
                    <Switch
                        checked={gaEnabled}
                        onChange={(e) => setGaEnabled(e.target.checked)}
                        name="gaAnalytics"
                        color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Google Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Helps us understand how you use the application, which features are popular, and how we can improve your experience.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', ml: 0 }}
              />
            </Box>

            <FormControlLabel
                control={
                  <Switch
                      checked={clarityEnabled}
                      onChange={(e) => setClarityEnabled(e.target.checked)}
                      name="clarityAnalytics"
                      color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Microsoft Clarity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provides heatmaps and session recordings to help us understand how you interact with the interface and identify usability issues.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', ml: 0 }}
            />

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AlertCircle size={16} style={{ marginRight: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  Changes will take effect after saving and refreshing the page.
                </Typography>
              </Box>

              <Button
                  onClick={handleSave}
                  variant="contained"
                  color="primary"
                  startIcon={<Save size={18} />}
              >
                Save Preferences
              </Button>
            </Box>

            {saved && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  Settings saved successfully!
                </Alert>
            )}
          </CardContent>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: 'rgba(249, 250, 251, 0.8)' }}>
          <Typography variant="h6" gutterBottom>
            About Analytics
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            We use analytics to understand how our application is used and to improve the user experience. All data is collected anonymously and is not used to identify individual users.
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            <strong>Google Analytics</strong> helps us understand general usage patterns, popular features, and user journeys through the application.
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            <strong>Microsoft Clarity</strong> provides heatmaps and session recordings that help us identify usability issues and improve the interface.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can change these settings at any time. If you disable analytics, no data will be collected about your usage of the application.
          </Typography>
        </Paper>
      </Container>
  );
};

export default AnalyticsSettings;

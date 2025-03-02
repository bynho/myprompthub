import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PromptProvider } from './contexts/PromptContext';
import { ToastProvider, registerErrorToastHandler, useToast } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BrowsePromptsPage from './pages/BrowsePromptsPage';
import PromptDetailPage from './pages/PromptDetailPage';
import SavedPromptsPage from './pages/SavedPromptsPage';
import CreatePromptPage from './pages/CreatePromptPage';
import AnalyticsSettings from './components/AnalyticsSettings';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import analyticsService from './services/analyticsService';

// Initialize analytics service
analyticsService.init();

// Component to track analytics
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    analyticsService.pageView(location.pathname);
  }, [location]);

  return null;
};

// Component to register error handlers
const ErrorHandlerRegistration: React.FC = () => {
  const { addToast } = useToast();

  useEffect(() => {
    // Register error handler for toast notifications
    registerErrorToastHandler(addToast);
  }, [addToast]);

  return null;
};

// Main application component
function App() {
  return (
      <ErrorBoundary>
        <ToastProvider>
          <Router>
            <ErrorHandlerRegistration />
            <AnalyticsTracker />
            <PromptProvider>
              <Layout>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/browse" element={<BrowsePromptsPage />} />
                    <Route path="/prompt/:id" element={<PromptDetailPage />} />
                    <Route path="/saved" element={<SavedPromptsPage />} />
                    <Route path="/create" element={<CreatePromptPage />} />
                    <Route path="/create/:id" element={<CreatePromptPage />} />
                    <Route path="/settings/analytics" element={<AnalyticsSettings />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </ErrorBoundary>
              </Layout>
            </PromptProvider>
          </Router>
        </ToastProvider>
      </ErrorBoundary>
  );
}

export default App;

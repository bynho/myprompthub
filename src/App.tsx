import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PromptProvider } from './contexts/PromptContext';
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

// Initialize analytics
analyticsService.init();

// Analytics tracker component
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view on route change
    analyticsService.pageView(location.pathname);
  }, [location]);
  
  return null;
};

function App() {
  return (
    <Router>
      <PromptProvider>
        <AnalyticsTracker />
        <Layout>
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
        </Layout>
      </PromptProvider>
    </Router>
  );
}

export default App;
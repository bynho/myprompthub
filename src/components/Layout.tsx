import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Save, Home, Menu, X, Settings, Globe } from 'lucide-react';
import analyticsService from '../services/analyticsService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Track navigation events
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    analyticsService.event('Navigation', 'page_view', pageName);
  }, [location]);

  const getPageName = (path: string): string => {
    if (path === '' || path === '/') return 'Home';
    if (path === '/browse') return 'Browse';
    if (path === '/saved') return 'Saved';
    if (path.startsWith('/prompt/')) return 'Prompt Detail';
    if (path === '/settings/analytics') return 'Analytics Settings';
    if (path === '/settings') return 'Settings';
    if (path === '/create') return 'Create Template';
    if (path.startsWith('/create/')) return 'Edit Template';
    return 'Unknown';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    analyticsService.event(
      'Navigation',
      isMenuOpen ? 'close_menu' : 'open_menu'
    );
  };

  const handleNavClick = (navItem: string) => {
    setIsMenuOpen(false);
    analyticsService.event('Navigation', 'nav_click', navItem);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/"
              className="flex items-center"
              onClick={() => handleNavClick('logo')}
            >
              <Search className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">
                MyPromptHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`flex items-center text-sm font-medium ${
                  getPageName(location.pathname) === 'Home'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => handleNavClick('home')}
              >
                <Home className="h-5 w-5 mr-1" />
                Home
              </Link>
              <Link
                to="/browse"
                className={`flex items-center text-sm font-medium ${
                  getPageName(location.pathname) === 'Browse'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => handleNavClick('browse')}
              >
                <Search className="h-5 w-5 mr-1" />
                Browse
              </Link>
              <Link
                to="/saved"
                className={`flex items-center text-sm font-medium ${
                  getPageName(location.pathname) === 'Saved'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => handleNavClick('saved')}
              >
                <Save className="h-5 w-5 mr-1" />
                Saved
              </Link>
              <Link 
                to="/settings"
                className={`flex items-center text-sm font-medium ${
                  location.pathname.includes('/settings')
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => handleNavClick('settings')}
              >
                <Settings className="h-5 w-5 mr-1" />
                Settings
              </Link>
            </nav>

            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <nav className="flex flex-col px-4 py-2">
            <Link
              to="/"
              className={`flex items-center py-3 text-sm font-medium ${
                getPageName(location.pathname) === 'Home' ? 'text-blue-600' : 'text-gray-700'
              }`}
              onClick={() => handleNavClick('home_mobile')}
            >
              <Home className="h-5 w-5 mr-2" />
              Home
            </Link>
            <Link
              to="/browse"
              className={`flex items-center py-3 text-sm font-medium ${
                getPageName(location.pathname) === 'Browse'
                  ? 'text-blue-600'
                  : 'text-gray-700'
              }`}
              onClick={() => handleNavClick('browse_mobile')}
            >
              <Search className="h-5 w-5 mr-2" />
              Browse
            </Link>
            <Link
              to="/saved"
              className={`flex items-center py-3 text-sm font-medium ${
                getPageName(location.pathname) === 'Saved'
                  ? 'text-blue-600'
                  : 'text-gray-700'
              }`}
              onClick={() => handleNavClick('saved_mobile')}
            >
              <Save className="h-5 w-5 mr-2" />
              Saved
            </Link>
            <Link
              to="/settings"
              className={`flex items-center py-3 text-sm font-medium ${
                location.pathname.includes('/settings')
                  ? 'text-blue-600'
                  : 'text-gray-700'
              }`}
              onClick={() => handleNavClick('settings_mobile')}
            >
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </Link>
          </nav>
        </div>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {Search, Save, Home, Menu as MenuIcon, Settings, XIcon} from 'lucide-react';
import analyticsService from '../services/analyticsService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Track navigation events
  React.useEffect(() => {
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

  const isActive = (path: string) => {
    return getPageName(location.pathname) === path;
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Browse', path: '/browse', icon: <Search size={20} /> },
    { name: 'Saved', path: '/saved', icon: <Save size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ];

  return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
          <Container maxWidth="lg">
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
              <Link
                  component={RouterLink}
                  to="/"
                  underline="none"
                  onClick={() => handleNavClick('logo')}
                  sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
              >
                <Search size={24} color={theme.palette.primary.main} style={{ marginRight: 8 }} />
                <Typography variant="h6" fontWeight="bold">
                  MyPromptHub
                </Typography>
              </Link>

              {/* Desktop navigation */}
              {!isMobile && (
                  <Box component="nav" sx={{ display: 'flex', gap: 3 }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            component={RouterLink}
                            to={item.path}
                            underline="none"
                            onClick={() => handleNavClick(item.name.toLowerCase())}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              fontWeight: 500,
                              py: 1,
                              px: 1,
                              borderRadius: 1,
                              color: isActive(item.name) ? 'primary.main' : 'text.secondary',
                              '&:hover': {
                                color: 'primary.main',
                                bgcolor: 'background.default'
                              }
                            }}
                        >
                          {React.cloneElement(item.icon, { style: { marginRight: 4 } })}
                          {item.name}
                        </Link>
                    ))}
                  </Box>
              )}

              {/* Mobile menu button */}
              {isMobile && (
                  <IconButton
                      edge="end"
                      color="inherit"
                      aria-label="menu"
                      onClick={toggleMenu}
                      sx={{ p: 1 }}
                  >
                    {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                  </IconButton>
              )}
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile drawer menu */}
        <Drawer
            anchor="top"
            open={isMobile && isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                top: '56px',
                height: 'auto',
                boxShadow: 3
              }
            }}
        >
          <List sx={{ py: 1 }}>
            {navItems.map((item) => (
                <ListItem
                    key={item.name}
                    component={RouterLink}
                    to={item.path}
                    onClick={() => handleNavClick(`${item.name.toLowerCase()}_mobile`)}
                    sx={{
                      color: isActive(item.name) ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        bgcolor: 'background.default'
                      }
                    }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItem>
            ))}
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
  );
};

export default Layout;

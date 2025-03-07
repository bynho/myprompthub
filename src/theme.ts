import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#3b82f6', // Equivalent to Tailwind's blue-600
            light: '#60a5fa', // blue-500
            dark: '#2563eb', // blue-700
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#6b7280', // Equivalent to Tailwind's gray-500
            light: '#9ca3af', // gray-400
            dark: '#4b5563', // gray-600
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444', // Equivalent to Tailwind's red-500
            light: '#f87171', // red-400
            dark: '#dc2626', // red-600
        },
        warning: {
            main: '#f59e0b', // Equivalent to Tailwind's amber-500
            light: '#fbbf24', // amber-400
            dark: '#d97706', // amber-600
        },
        info: {
            main: '#3b82f6', // Equivalent to Tailwind's blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
        },
        success: {
            main: '#10b981', // Equivalent to Tailwind's emerald-500
            light: '#34d399', // emerald-400
            dark: '#059669', // emerald-600
        },
        background: {
            default: '#f9fafb', // Equivalent to Tailwind's gray-50
            paper: '#ffffff',
        },
        text: {
            primary: '#111827', // Equivalent to Tailwind's gray-900
            secondary: '#4b5563', // gray-600
            disabled: '#9ca3af', // gray-400
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h5: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        subtitle1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        subtitle2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 6,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    '&:hover': {
                        backgroundColor: '#2563eb', // Tailwind blue-700
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontSize: '0.75rem',
                    height: '1.5rem',
                },
            },
        },
    },
});

export default theme;

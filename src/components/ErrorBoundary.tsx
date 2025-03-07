import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import errorService from '../services/errorService';

interface Props {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Report the error
        errorService.handleError(error, {
            context: { componentStack: errorInfo.componentStack },
            severity: 'high',
            userMessage: 'Something went wrong in this component'
        });

        // Call the onError prop if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    resetErrorBoundary = (): void => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function' && this.state.error) {
                    return this.props.fallback(this.state.error, this.resetErrorBoundary);
                }
                return this.props.fallback as ReactNode;
            }

            // Default fallback UI
            return (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        backgroundColor: 'error.light',
                        color: 'error.dark',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'error.main'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <AlertTriangle sx={{ mr: 1, mt: 0.5, color: 'error.main' }} />
                        <Box>
                            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                Something went wrong
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    An error occurred in this component:
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        fontFamily: 'monospace',
                                        p: 1,
                                        my: 1,
                                        bgcolor: 'rgba(239, 68, 68, 0.2)',
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        maxHeight: '8rem'
                                    }}
                                >
                                    {this.state.error?.message || 'Unknown error'}
                                </Box>
                            </Box>
                            <Button
                                onClick={this.resetErrorBoundary}
                                startIcon={<RefreshCw size={16} />}
                                variant="outlined"
                                color="error"
                                size="small"
                                sx={{ mt: 2 }}
                            >
                                Try Again
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

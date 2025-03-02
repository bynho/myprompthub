import { Component, ErrorInfo, ReactNode } from 'react';
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
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="p-4 bg-red-50 rounded-md border border-red-200 text-red-800">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-600" />
                        <div>
                            <h3 className="text-lg font-medium">Something went wrong</h3>
                            <div className="mt-2 text-sm">
                                <p>An error occurred in this component:</p>
                                <p className="font-mono bg-red-100 p-2 rounded my-2 overflow-auto max-h-32">
                                    {this.state.error?.message || 'Unknown error'}
                                </p>
                            </div>
                            <button
                                onClick={this.resetErrorBoundary}
                                className="mt-3 flex items-center px-3 py-1.5 text-sm font-medium bg-white border border-red-300 rounded-md hover:bg-red-50"
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

import analyticsService from './analyticsService';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorOptions {
    context?: Record<string, any>;
    severity?: ErrorSeverity;
    userMessage?: string;
    retry?: () => Promise<any>;
    reportToAnalytics?: boolean;
}

class ErrorService {
    private errorHandlers: Array<(error: Error, options?: ErrorOptions) => void> = [];

    /**
     * Register a function to handle errors
     */
    registerErrorHandler(handler: (error: Error, options?: ErrorOptions) => void): void {
        this.errorHandlers.push(handler);
    }

    /**
     * Handle an error by passing it to all registered error handlers
     */
    handleError(error: Error | string, options: ErrorOptions = {}): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error;

        // Set default severity if not provided
        const severity = options.severity || 'medium';

        // Log to console with appropriate level based on severity
        if (severity === 'critical' || severity === 'high') {
            console.error('Error:', errorObj, 'Context:', options.context);
        } else {
            console.warn('Error:', errorObj, 'Context:', options.context);
        }

        // Report to analytics if enabled
        if (options.reportToAnalytics !== false) {
            analyticsService.trackError(
                `${errorObj.name}: ${errorObj.message}`,
                severity === 'critical'
            );
        }

        // Call all registered error handlers
        this.errorHandlers.forEach(handler => {
            try {
                handler(errorObj, options);
            } catch (handlerError) {
                // Don't let handler errors cause issues
                console.error('Error in error handler:', handlerError);
            }
        });
    }

    /**
     * Wrap a promise with error handling
     */
    async handlePromise<T>(
        promise: Promise<T>,
        options: ErrorOptions = {}
    ): Promise<T> {
        try {
            return await promise;
        } catch (error) {
            this.handleError(error as Error, options);
            throw error; // Re-throw to allow caller to handle as needed
        }
    }

    /**
     * Create a function that catches errors from the provided function
     * and handles them with the error service
     */
    createErrorBoundary<T extends (...args: any[]) => any>(
        fn: T,
        options: ErrorOptions = {}
    ): (...args: Parameters<T>) => ReturnType<T> {
        return (...args: Parameters<T>): ReturnType<T> => {
            try {
                const result = fn(...args);

                // Handle promises
                if (result instanceof Promise) {
                    return this.handlePromise(result, options) as ReturnType<T>;
                }

                return result;
            } catch (error) {
                this.handleError(error as Error, options);
                throw error; // Re-throw to allow caller to handle as needed
            }
        };
    }
}

// Create singleton instance
const errorService = new ErrorService();
export default errorService;

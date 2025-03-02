import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number; // milliseconds
    action?: {
        label: string;
        onClick: () => void;
    };
}

type ToastAction =
    | { type: 'ADD_TOAST'; toast: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; id: string };

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
    switch (action.type) {
        case 'ADD_TOAST':
            return [...state, { ...action.toast, id: Date.now().toString() }];
        case 'REMOVE_TOAST':
            return state.filter(toast => toast.id !== action.id);
        default:
            return state;
    }
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, dispatch] = useReducer(toastReducer, []);

    const addToast = (toast: Omit<Toast, 'id'>): string => {
        const id = Date.now().toString();
        dispatch({ type: 'ADD_TOAST', toast });

        // Auto-remove toast after duration
        if (toast.duration !== 0) {
            const duration = toast.duration || 5000; // Default: 5 seconds
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    };

    const removeToast = (id: string): void => {
        dispatch({ type: 'REMOVE_TOAST', id });
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast icon map
const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'error':
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        case 'info':
        default:
            return <Info className="h-5 w-5 text-blue-500" />;
    }
};

// Toast container component
const ToastContainer: React.FC<{
    toasts: Toast[];
    removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center p-3 rounded-md shadow-md animate-slideIn ${
                        toast.type === 'success' ? 'bg-green-50 border border-green-200' :
                            toast.type === 'error' ? 'bg-red-50 border border-red-200' :
                                toast.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                                    'bg-blue-50 border border-blue-200'
                    }`}
                >
                    <div className="mr-3">
                        <ToastIcon type={toast.type} />
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${
                            toast.type === 'success' ? 'text-green-800' :
                                toast.type === 'error' ? 'text-red-800' :
                                    toast.type === 'warning' ? 'text-amber-800' :
                                        'text-blue-800'
                        }`}>
                            {toast.message}
                        </p>
                    </div>
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className={`text-xs font-medium px-2 py-1 rounded-md mr-2 ${
                                toast.type === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                    toast.type === 'error' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                        toast.type === 'warning' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                                            'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                        >
                            {toast.action.label}
                        </button>
                    )}
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            ))}
        </div>
    );
};

// Register error handler to automatically show error toasts
export const registerErrorToastHandler = (
    addToast: (toast: Omit<Toast, 'id'>) => string
): void => {
    import('../services/errorService').then(({ default: errorService }) => {
        errorService.registerErrorHandler((error, options) => {
            if (options?.userMessage) {
                addToast({
                    type: 'error',
                    message: options.userMessage,
                    duration: 7000
                });
            }
        });
    });
};

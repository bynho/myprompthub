import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from 'lucide-react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    isLoading?: boolean;
    loadingText?: string;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
                                                         children,
                                                         isLoading = false,
                                                         loadingText,
                                                         icon,
                                                         variant = 'primary',
                                                         size = 'md',
                                                         className = '',
                                                         disabled,
                                                         ...props
                                                     }) => {
    // Size classes
    const sizeClasses = {
        sm: 'py-1 px-2 text-xs',
        md: 'py-2 px-4 text-sm',
        lg: 'py-2.5 px-5 text-base'
    };

    // Variant classes
    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent focus:ring-blue-500',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-transparent focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
        outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-blue-500'
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isLoading ? 'opacity-90 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {icon && <span className="mr-2">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default LoadingButton;

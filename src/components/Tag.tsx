import React, { ReactNode } from "react";
import { X } from 'lucide-react';

interface TagProps {
  children: ReactNode;
  icon?: ReactNode;
  onRemove?: () => void;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ children, icon, onRemove, className }) => {
  if (!className) {
      className = "inline-flex items-center text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full";
  }

    return (
    <span className={className}>
      {icon && (
        <span className="mr-1">
          {icon}
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 p-0.5 rounded-full hover:bg-gray-200 focus:outline-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default Tag;

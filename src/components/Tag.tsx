import React, { ReactNode } from "react";
import { Chip, ChipProps } from '@mui/material';
import { X } from 'lucide-react';

interface TagProps {
  children: ReactNode;
  icon?: ReactNode;
  onRemove?: () => void;
  size?: 'small' | 'medium';
  sx?: ChipProps['sx'];
}

const Tag: React.FC<TagProps> = ({
                                   children,
                                   icon,
                                   onRemove,
                                   size = 'small',
                                   sx = {}
                                 }) => {
  return (
      <Chip
          label={children}
          size={size}
          icon={icon ? <>{icon}</> : undefined}
          onDelete={onRemove ? onRemove : undefined}
          deleteIcon={onRemove ? <X size={14} /> : undefined}
          sx={{
            fontSize: '0.75rem',
            height: 'auto',
            py: 0.5,
            bgcolor: 'rgba(75, 85, 99, 0.1)',
            color: 'text.secondary',
            mr: 0.5,
            mb: 0.5,
            ...sx
          }}
      />
  );
};

export default Tag;

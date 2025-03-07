import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { Variable } from '../types';

interface VariableInputProps {
  variable: Variable;
  value: string;
  onChange: (value: string) => void;
}

const VariableInput: React.FC<VariableInputProps> = ({ variable, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    onChange(e.target.value as string);
  };

  const renderInput = () => {
    const commonProps = {
      id: `variable-${variable.id}`,
      value,
      onChange: handleChange,
      placeholder: variable.placeholder || '',
      fullWidth: true,
      size: 'small' as const,
      sx: { mb: 1 }
    };

    switch (variable.type) {
      case 'textarea':
        return (
            <TextField
                {...commonProps}
                multiline
                rows={4}
            />
        );
      case 'select':
        return (
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel id={`variable-select-${variable.id}-label`}>
                {variable.placeholder || 'Select an option'}
              </InputLabel>
              <Select
                  labelId={`variable-select-${variable.id}-label`}
                  id={`variable-${variable.id}`}
                  value={value}
                  onChange={handleChange}
                  label={variable.placeholder || 'Select an option'}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {variable.options?.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
        );
      default:
        return (
            <TextField
                {...commonProps}
                type={variable.type || 'text'}
            />
        );
    }
  };

  return (
      <Box sx={{ mb: 2 }}>
        <Typography
            variant="subtitle2"
            component="label"
            htmlFor={`variable-${variable.id}`}
            gutterBottom
        >
          {variable.name}
        </Typography>

        {variable.description && (
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
            >
              {variable.description}
            </Typography>
        )}

        {renderInput()}
      </Box>
  );
};

export default VariableInput;

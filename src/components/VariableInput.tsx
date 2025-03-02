import React from 'react';
import { Variable } from '../types';

interface VariableInputProps {
  variable: Variable;
  value: string;
  onChange: (value: string) => void;
}

const VariableInput: React.FC<VariableInputProps> = ({ variable, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const renderInput = () => {
    switch (variable.type) {
      case 'textarea':
        return (
          <textarea
            id={`variable-${variable.id}`}
            value={value}
            onChange={handleChange}
            placeholder={variable.placeholder || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            id={`variable-${variable.id}`}
            value={value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            {variable.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={variable.type || 'text'}
            id={`variable-${variable.id}`}
            value={value}
            onChange={handleChange}
            placeholder={variable.placeholder || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={`variable-${variable.id}`} className="block text-sm font-medium text-gray-700">
        {variable.name}
        {variable.description && (
          <span className="ml-1 text-xs text-gray-500">({variable.description})</span>
        )}
      </label>
      {renderInput()}
    </div>
  );
};

export default VariableInput;
import React, { useState } from 'react';
import { Variable } from '../types';
import { Plus, Trash, Edit, Save, X } from 'lucide-react';

interface VariableEditorProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

const VariableEditor: React.FC<VariableEditorProps> = ({ variables, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newVariable, setNewVariable] = useState<Variable>({
    id: '',
    name: '',
    description: '',
    type: 'text',
    placeholder: ''
  });

  const handleAddVariable = () => {
    // Generate ID from name if not provided
    if (!newVariable.id && newVariable.name) {
      newVariable.id = newVariable.name.toLowerCase().replace(/\s+/g, '_');
    }

    if (newVariable.id && newVariable.name) {
      onChange([...variables, { ...newVariable }]);
      setNewVariable({
        id: '',
        name: '',
        description: '',
        type: 'text',
        placeholder: ''
      });
    }
  };

  const handleUpdateVariable = (index: number) => {
    const updatedVariables = [...variables];
    updatedVariables[index] = { ...newVariable };
    onChange(updatedVariables);
    setEditingIndex(null);
    setNewVariable({
      id: '',
      name: '',
      description: '',
      type: 'text',
      placeholder: ''
    });
  };

  const handleEditVariable = (index: number) => {
    setEditingIndex(index);
    setNewVariable({ ...variables[index] });
  };

  const handleDeleteVariable = (index: number) => {
    const updatedVariables = [...variables];
    updatedVariables.splice(index, 1);
    onChange(updatedVariables);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewVariable({
      id: '',
      name: '',
      description: '',
      type: 'text',
      placeholder: ''
    });
  };

  const handleInputChange = (field: keyof Variable, value: string) => {
    setNewVariable(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate ID from name if editing ID field
    if (field === 'name' && !newVariable.id) {
      const generatedId = value.toLowerCase().replace(/\s+/g, '_');
      setNewVariable(prev => ({ ...prev, id: generatedId }));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Variables</h3>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Variables are placeholders in your prompt content surrounded by curly braces, like {'{variable_name}'}. 
          Each variable will generate an input field for users to customize the prompt.
        </p>
      </div>
      
      <div className="space-y-4">
        {variables.map((variable, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-md ${
              editingIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            {editingIndex === index ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <input
                      type="text"
                      value={newVariable.id}
                      onChange={(e) => handleInputChange('id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="variable_name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newVariable.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Variable Name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newVariable.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of this variable"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newVariable.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={newVariable.placeholder}
                      onChange={(e) => handleInputChange('placeholder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Enter a value..."
                    />
                  </div>
                </div>
                
                {newVariable.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newVariable.options?.join(', ') || ''}
                      onChange={(e) => {
                        const options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                        setNewVariable(prev => ({ ...prev, options }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateVariable(index)}
                    className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{variable.name}</h4>
                    <p className="text-sm text-gray-500">ID: {variable.id}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleEditVariable(index)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVariable(index)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{variable.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    Type: {variable.type}
                  </span>
                  {variable.placeholder && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      Placeholder: {variable.placeholder}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {editingIndex === null && (
        <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
          <h4 className="text-md font-medium text-gray-900 mb-3">Add New Variable</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  value={newVariable.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="variable_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newVariable.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Variable Name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newVariable.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of this variable"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newVariable.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Text Area</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                <input
                  type="text"
                  value={newVariable.placeholder}
                  onChange={(e) => handleInputChange('placeholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Enter a value..."
                />
              </div>
            </div>
            
            {newVariable.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={newVariable.options?.join(', ') || ''}
                  onChange={(e) => {
                    const options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                    setNewVariable(prev => ({ ...prev, options }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddVariable}
                className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableEditor;
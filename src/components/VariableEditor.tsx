import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Plus, Trash, Edit, Save, X } from 'lucide-react';
import { Variable } from '../types';

interface VariableEditorProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

const VariableEditor: React.FC<VariableEditorProps> = ({ variables, onChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newVariable, setNewVariable] = useState<Variable>({
    options: [], value: "",
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
        options: [], value: "",
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
      options: [], value: "",
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
      options: [], value: "",
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

  const VariableForm = ({ isEditing = false, onSubmit }: { isEditing?: boolean, onSubmit: () => void }) => (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="ID"
                value={newVariable.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="variable_name"
                size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Name"
                value={newVariable.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Variable Name"
                size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
                fullWidth
                label="Description"
                value={newVariable.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of this variable"
                size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="variable-type-label">Type</InputLabel>
              <Select
                  labelId="variable-type-label"
                  id="variable-type"
                  value={newVariable.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Type"
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="textarea">Text Area</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="url">URL</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="select">Select</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Placeholder"
                value={newVariable.placeholder}
                onChange={(e) => handleInputChange('placeholder', e.target.value)}
                placeholder="e.g., Enter a value..."
                size="small"
            />
          </Grid>

          {newVariable.type === 'select' && (
              <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Options (comma-separated)"
                    value={newVariable.options?.join(', ') || ''}
                    onChange={(e) => {
                      const options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                      setNewVariable(prev => ({ ...prev, options }));
                    }}
                    placeholder="Option 1, Option 2, Option 3"
                    size="small"
                />
              </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              {isEditing && (
                  <Button
                      onClick={handleCancelEdit}
                      variant="outlined"
                      color="inherit"
                      startIcon={<X size={16} />}
                  >
                    Cancel
                  </Button>
              )}
              <Button
                  onClick={onSubmit}
                  variant="contained"
                  color="primary"
                  startIcon={isEditing ? <Save size={16} /> : <Plus size={16} />}
              >
                {isEditing ? 'Save' : 'Add Variable'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
  );

  return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Variables
        </Typography>

        <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider'
            }}
        >
          <Typography variant="body2" color="text.secondary" paragraph>
            Variables are placeholders in your prompt content surrounded by curly braces, like {'{variable_name}'}.
            Each variable will generate an input field for users to customize the prompt.
          </Typography>
        </Paper>

        <Box sx={{ mb: 4 }}>
          {variables.map((variable, index) => (
              <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: editingIndex === index ? 'primary.main' : 'divider',
                    bgcolor: editingIndex === index ? 'rgba(59, 130, 246, 0.05)' : 'background.paper'
                  }}
              >
                {editingIndex === index ? (
                    <VariableForm
                        isEditing={true}
                        onSubmit={() => handleUpdateVariable(index)}
                    />
                ) : (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {variable.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {variable.id}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <IconButton
                              size="small"
                              onClick={() => handleEditVariable(index)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'primary.main' }
                              }}
                          >
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                              size="small"
                              onClick={() => handleDeleteVariable(index)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' }
                              }}
                          >
                            <Trash size={16} />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {variable.description}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={`Type: ${variable.type}`}
                            size="small"
                            sx={{ bgcolor: 'rgba(75, 85, 99, 0.1)', color: 'text.secondary' }}
                        />
                        {variable.placeholder && (
                            <Chip
                                label={`Placeholder: ${variable.placeholder}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(75, 85, 99, 0.1)', color: 'text.secondary' }}
                            />
                        )}
                      </Box>
                    </Box>
                )}
              </Paper>
          ))}
        </Box>

        {editingIndex === null && (
            <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
            >
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Add New Variable
              </Typography>
              <VariableForm onSubmit={handleAddVariable} />
            </Paper>
        )}
      </Box>
  );
};

export default VariableEditor;

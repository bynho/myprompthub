import React, { useState } from 'react';
import {
  Autocomplete,
  Chip,
  ListItem,
  Paper,
  Popper,
  TextField,
  Typography
} from '@mui/material';
import { Plus, Tag as TagIcon } from 'lucide-react';

interface TagSelectorProps {
  availableTags?: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allowCustomTags?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({
                                                   availableTags = [],
                                                   selectedTags,
                                                   onChange,
                                                   allowCustomTags = true
                                                 }) => {
  const [inputValue, setInputValue] = useState('');

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && inputValue.trim() && allowCustomTags) {
      event.preventDefault();
      if (!selectedTags.includes(inputValue.trim())) {
        onChange([...selectedTags, inputValue.trim()]);
      }
      setInputValue('');
    } else if (event.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Filter available tags
  const filteredTags = Array.isArray(availableTags)
      ? availableTags.filter(tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.includes(tag)
      )
      : [];

  return (
      <Autocomplete
          multiple
          freeSolo
          id="tags-selector"
          options={filteredTags}
          value={selectedTags}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            onChange(newValue as string[]);
          }}
          renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                  <Chip
                      label={option}
                      size="small"
                      icon={<TagIcon size={14} />}
                      {...getTagProps({ index })}
                      sx={{
                        height: 24,
                        mr: 0.5,
                        mb: 0.5,
                        bgcolor: 'rgba(75, 85, 99, 0.1)',
                        color: 'text.secondary'
                      }}
                  />
              ))
          }
          renderInput={(params) => (
              <TextField
                  {...params}
                  variant="outlined"
                  placeholder={selectedTags.length > 0 ? '' : 'Select or type tags...'}
                  size="small"
                  onKeyDown={handleInputKeyDown}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      pl: 1,
                      minHeight: 42,
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }
                  }}
              />
          )}
          renderOption={(props, option) => (
              <ListItem {...props}>
                <TagIcon size={14} style={{ marginRight: 8 }} />
                <Typography variant="body2">{option}</Typography>
              </ListItem>
          )}
          noOptionsText={
            inputValue && allowCustomTags ? (
                <ListItem
                    button
                    onClick={() => handleTagClick(inputValue)}
                    sx={{ py: 0.5, px: 1 }}
                >
                  <Plus size={14} style={{ marginRight: 8 }} />
                  <Typography variant="body2">Create "{inputValue}"</Typography>
                </ListItem>
            ) : (
                <Typography variant="body2" sx={{ p: 1 }}>No matching tags</Typography>
            )
          }
          PopperComponent={(props) => (
              <Popper
                  {...props}
                  placement="bottom-start"
                  sx={{ width: props.anchorEl?.clientWidth }}
              >
                <Paper elevation={3} sx={{ mt: 0.5 }}>
                  {props.children}
                </Paper>
              </Popper>
          )}
      />
  );
};

export default TagSelector;

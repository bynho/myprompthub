import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Collapse,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Search, Filter, FolderOpen, Tag as TagIcon } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import SavedPromptCard from '../components/SavedPromptCard';
import analyticsService from '../services/analyticsService';

const SavedPromptsPage: React.FC = () => {
  const { savedPrompts, folders, getAllTags } = usePromptContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState(savedPrompts);
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Get all tags from saved prompts
  useEffect(() => {
    setAllTags(getAllTags());
  }, [savedPrompts, getAllTags]);

  // Filter saved prompts
  useEffect(() => {
    let filtered = [...savedPrompts];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt =>
          prompt.title.toLowerCase().includes(query) ||
          prompt.content.toLowerCase().includes(query)
      );
    }

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(prompt => prompt.folder === selectedFolder);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(prompt =>
          selectedTags.every(tag => prompt.tags?.includes(tag))
      );
    }

    setFilteredPrompts(filtered);
  }, [savedPrompts, searchQuery, selectedFolder, selectedTags]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Track search after a short delay
    if (query.length > 2) {
      const timer = setTimeout(() => {
        analyticsService.trackSearch('search_saved', query);
      }, 1000);

      return () => clearTimeout(timer);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const folder = e.target.value as string;
    setSelectedFolder(folder);

    // Track folder filter
    if (folder) {
      analyticsService.trackOrganization('filter_folder', 'folder', folder);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
          ? prev.filter(t => t !== tag)
          : [...prev, tag];

      // Track tag filter
      analyticsService.trackOrganization('filter_tag', 'tag', tag);

      return newTags;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFolder('');
    setSelectedTags([]);

    // Track clear filters
    analyticsService.event('Organization', 'clear_filters');
  };

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Saved Prompts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and organize your saved research prompts
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={9}>
              <TextField
                  fullWidth
                  placeholder="Search saved prompts..."
                  value={searchQuery}
                  onChange={handleSearch}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                          <Search size={20} color="action" />
                        </InputAdornment>
                    ),
                  }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<Filter size={18} />}
                  sx={{ height: '100%' }}
              >
                Filters {(selectedFolder || selectedTags.length > 0) ? '(Active)' : ''}
              </Button>
            </Grid>
          </Grid>

          <Collapse in={showFilters}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="folder-select-label">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FolderOpen size={16} style={{ marginRight: 4 }} />
                        Folder
                      </Box>
                    </InputLabel>
                    <Select
                        labelId="folder-select-label"
                        id="folder-select"
                        value={selectedFolder}
                        onChange={handleFolderChange}
                        label="Folder"
                    >
                      <MenuItem value="">All Folders</MenuItem>
                      {folders.map(folder => (
                          <MenuItem key={folder.id} value={folder.name}>
                            {folder.name}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TagIcon size={18} style={{ marginRight: 8 }} />
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {allTags.map(tag => (
                      <Chip
                          key={tag}
                          label={tag}
                          onClick={() => handleTagToggle(tag)}
                          color={selectedTags.includes(tag) ? "primary" : "default"}
                          variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                          size="small"
                      />
                  ))}
                </Box>
              </Box>

              {(selectedFolder || selectedTags.length > 0) && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={clearFilters}
                        color="primary"
                        size="small"
                    >
                      Clear Filters
                    </Button>
                  </Box>
              )}
            </Paper>
          </Collapse>
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedFolder ? `Folder: ${selectedFolder}` : 'All Saved Prompts'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
              </Typography>
            </Box>

            {filteredPrompts.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary" gutterBottom>
                    No saved prompts found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {savedPrompts.length > 0
                        ? "Try adjusting your filters"
                        : "Browse prompts and save them to see them here"}
                  </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                  {filteredPrompts.map(prompt => (
                      <Grid item xs={12} md={6} key={prompt.id}>
                        <SavedPromptCard prompt={prompt} />
                      </Grid>
                  ))}
                </Grid>
            )}
          </Box>
        </Paper>
      </Container>
  );
};

export default SavedPromptsPage;

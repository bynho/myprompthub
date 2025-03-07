import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Collapse
} from '@mui/material';
import { Search, Filter, Plus } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import PromptList from '../components/PromptList';
import analyticsService from '../services/analyticsService';

const BrowsePromptsPage: React.FC = () => {
  const { prompts, categories, tags } = usePromptContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState(prompts);
  const [showFilters, setShowFilters] = useState(false);

  // Filter prompts based on search query, category, and tags
  useEffect(() => {
    let filtered = [...prompts];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt =>
          prompt.title.toLowerCase().includes(query) ||
          prompt.description.toLowerCase().includes(query) ||
          prompt.content.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(prompt =>
          selectedTags.every(tag => prompt.tags?.includes(tag))
      );
    }

    setFilteredPrompts(filtered);
  }, [prompts, searchQuery, selectedCategory, selectedTags]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Track search after a short delay
    if (query.length > 2) {
      const timer = setTimeout(() => {
        analyticsService.trackSearch('search', query);
      }, 1000);

      return () => clearTimeout(timer);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const category = e.target.value as string;
    setSelectedCategory(category);

    // Track category filter
    if (category) {
      analyticsService.trackSearch('filter_category', category);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
          ? prev.filter(t => t !== tag)
          : [...prev, tag];

      // Track tag filter
      analyticsService.trackSearch('filter_tag', tag);

      return newTags;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);

    // Track clear filters
    analyticsService.event('Search', 'clear_filters');
  };

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Browse Research Prompts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Discover and customize research prompts for your projects
            </Typography>
          </Box>

          <Button
              component={RouterLink}
              to="/create"
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              sx={{ whiteSpace: 'nowrap' }}
          >
            Create Template
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={9}>
              <TextField
                  fullWidth
                  placeholder="Search prompts..."
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
                Filters {(selectedCategory || selectedTags.length > 0) ? '(Active)' : ''}
              </Button>
            </Grid>
          </Grid>

          <Collapse in={showFilters}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                        labelId="category-select-label"
                        id="category-select"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map(tag => (
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

              {(selectedCategory || selectedTags.length > 0) && (
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

        <PromptList prompts={filteredPrompts} />

        {filteredPrompts.length === 0 && (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                No prompts found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Paper>
        )}
      </Container>
  );
};

export default BrowsePromptsPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Browse Research Prompts</h1>
          <p className="text-gray-600">
            Discover and customize research prompts for your projects
          </p>
        </div>
        
        <Link
          to="/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search prompts..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:w-auto"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters {selectedCategory || selectedTags.length > 0 ? '(Active)' : ''}
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {(selectedCategory || selectedTags.length > 0) && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <PromptList prompts={filteredPrompts} />
      
      {filteredPrompts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-2">No prompts found</p>
          <p className="text-gray-600">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowsePromptsPage;
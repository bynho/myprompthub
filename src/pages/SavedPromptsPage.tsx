import React, { useState, useEffect } from 'react';
import { Search, Filter, FolderOpen, Tag } from 'lucide-react';
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
        prompt.generatedContent.toLowerCase().includes(query)
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
  
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const folder = e.target.value;
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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Prompts</h1>
        <p className="text-gray-600">
          Manage and organize your saved research prompts
        </p>
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
              placeholder="Search saved prompts..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:w-auto"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters {selectedFolder || selectedTags.length > 0 ? '(Active)' : ''}
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-1">
                  <FolderOpen className="h-4 w-4 inline mr-1" />
                  Folder
                </label>
                <select
                  id="folder"
                  value={selectedFolder}
                  onChange={handleFolderChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  <option value="">All Folders</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
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
            
            {(selectedFolder || selectedTags.length > 0) && (
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
      
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedFolder ? `Folder: ${selectedFolder}` : 'All Saved Prompts'}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
            </span>
          </div>
          
          <div>
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 mb-4">No saved prompts found</p>
                <p className="text-gray-600 mb-6">
                  {savedPrompts.length > 0
                    ? "Try adjusting your filters"
                    : "Browse prompts and save them to see them here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPrompts.map(prompt => (
                  <SavedPromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPromptsPage;
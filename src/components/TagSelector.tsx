import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';

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
  allowCustomTags = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && allowCustomTags) {
      e.preventDefault();
      if (!selectedTags.includes(inputValue.trim())) {
        onChange([...selectedTags, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Ensure availableTags is an array before filtering
  const filteredTags = Array.isArray(availableTags) 
    ? availableTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) && 
        !selectedTags.includes(tag)
      )
    : [];

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        {selectedTags.map(tag => (
          <div key={tag} className="flex items-center badge badge-primary py-1 pl-2 pr-1">
            <Tag className="h-3 w-3 mr-1" />
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <div className="flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            placeholder={selectedTags.length > 0 ? "" : "Select or type tags..."}
            className="w-full border-none focus:ring-0 p-0 text-sm"
          />
        </div>
      </div>
      
      {isDropdownOpen && (inputValue || filteredTags.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          {filteredTags.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredTags.map(tag => (
                <li
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-4 py-2 flex items-center text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <Tag className="h-4 w-4 mr-2 text-gray-500" />
                  {tag}
                </li>
              ))}
            </ul>
          ) : inputValue && allowCustomTags ? (
            <div
              onClick={() => handleTagClick(inputValue)}
              className="px-4 py-2 flex items-center text-sm hover:bg-gray-100 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2 text-gray-500" />
              Create "{inputValue}"
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No matching tags</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
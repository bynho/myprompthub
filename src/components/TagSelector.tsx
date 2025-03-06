import React, { useState } from 'react';
import { Plus, Tag as TagIcon } from 'lucide-react';
import Tag from './Tag';

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

  // Filter available tags
  const filteredTags = Array.isArray(availableTags)
      ? availableTags.filter(tag =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.includes(tag)
      )
      : [];

  return (
      <div className="relative">
        {/* Container with fixed min-height to avoid layout shift */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 min-h-[42px]">
          {selectedTags.map(tag => (
              <Tag
                  key={tag}
                  icon={<TagIcon className="h-3 w-3" />}
                  onRemove={() => handleRemoveTag(tag)}
              >
                {tag}
              </Tag>
          ))}
          <div className="flex-1 min-w-[100px]">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder={selectedTags.length > 0 ? '' : 'Select or type tags...'}
                className="w-full border-none focus:ring-0 p-0 text-sm leading-5"
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
                          <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
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

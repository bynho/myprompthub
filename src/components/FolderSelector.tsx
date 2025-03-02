import React, { useState } from 'react';
import { Folder, FolderPlus, X } from 'lucide-react';
import { usePrompts } from '../contexts/PromptContext';

interface FolderSelectorProps {
  selectedFolder?: string;
  onChange: (folderId: string | undefined) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolder,
  onChange,
}) => {
  const { folders, createFolder } = usePrompts();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleFolderSelect = (folderId: string | undefined) => {
    onChange(folderId);
    setIsDropdownOpen(false);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const selectedFolderName = selectedFolder
    ? folders.find((f) => f.id === selectedFolder)?.name
    : 'Select folder';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <div className="flex items-center">
          <span className="truncate">{selectedFolderName}</span>
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          <ul className="divide-y divide-gray-100">
            <li
              onClick={() => handleFolderSelect(undefined)}
              className="px-4 py-2 flex items-center text-sm hover:bg-gray-100 cursor-pointer"
            >
              <span className="text-gray-500">No folder</span>
            </li>

            {folders.map((folder) => (
              <li
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id)}
                className={`px-4 py-2 flex items-center text-sm hover:bg-gray-100 cursor-pointer ${
                  selectedFolder === folder.id ? 'bg-indigo-50' : ''
                }`}
              >
                {folder.name}
              </li>
            ))}

            {isCreatingFolder ? (
              <li className="px-4 py-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="ml-2 p-1 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="ml-1 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ) : (
              <li
                onClick={() => setIsCreatingFolder(true)}
                className="px-4 py-2 flex items-center text-sm text-indigo-600 hover:bg-gray-100 cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create new folder
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FolderSelector;

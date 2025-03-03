import React from 'react';
import {Link} from 'react-router-dom';
import {Calendar, Copy, Edit, Folder, Tag, Trash} from 'lucide-react';
import {SavedPrompt} from '../types';
import {usePromptContext} from '../contexts/PromptContext';
import analyticsService from '../services/analyticsService';

interface SavedPromptCardProps {
    prompt: SavedPrompt;
}

const SavedPromptCard: React.FC<SavedPromptCardProps> = ({prompt}) => {
    const {removeSavedPrompt, copyToClipboard} = usePromptContext();

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(prompt.content);

        // Track copy event
        analyticsService.trackPromptInteraction('copy_to_clipboard', prompt.id, prompt.title);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this saved prompt?')) {
            removeSavedPrompt(prompt.id);

            // Track delete event
            analyticsService.trackPromptInteraction('delete_saved_prompt', prompt.id, prompt.title);
        }
    };

    const handleCardClick = () => {
        // Track saved prompt card click
        analyticsService.trackPromptInteraction('view_saved_prompt', prompt.id, prompt.title);
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <Link
                        to={`/prompt/${prompt.originalPromptId}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                        onClick={handleCardClick}
                    >
                        {prompt.title}
                    </Link>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {prompt.category}
          </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">{prompt.content}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {prompt.folder && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Folder className="h-4 w-4 mr-1"/>
                            <span>{prompt.folder}</span>
                        </div>
                    )}

                    {prompt.createdAt && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1"/>
                            <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        <Tag className="h-4 w-4 text-gray-400"/>
                        {prompt.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                            >
                {tag}
              </span>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Copy to clipboard"
                    >
                        <Copy className="h-5 w-5"/>
                    </button>
                    <Link
                        to={`/prompt/${prompt.originalPromptId}`}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Edit"
                    >
                        <Edit className="h-5 w-5"/>
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                    >
                        <Trash className="h-5 w-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SavedPromptCard;

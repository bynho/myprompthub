import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Calendar, Edit, TagsIcon, ThumbsDown, ThumbsUp} from 'lucide-react';
import {Prompt, PromptType} from '../types';
import analyticsService from '../services/analyticsService';
import Tag from "./Tag.tsx";

interface PromptCardProps {
    prompt: Prompt;
}

const PromptCard: React.FC<PromptCardProps> = ({prompt}) => {
    const navigate = useNavigate();
    const positiveRatings = prompt.positiveRatings ?? 0;
    const negativeRatings = prompt.negativeRatings ?? 0;

    const handleCardClick = () => {
        // Track prompt card click
        analyticsService.trackPromptInteraction('view_details', prompt.id, prompt.title);
        // Navigate to prompt detail page
        navigate(`/prompt/${prompt.id}`);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        analyticsService.event('Prompt', 'edit_template_from_card', prompt.title);
        navigate(`/create/${prompt.id}`);
    };

    return (
        <div
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{prompt.title}</h3>
                    <div className="flex items-center">

              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mr-2">
                {prompt.type === PromptType.LOCAL ? 'Local' : prompt.type === PromptType.LOCAL_TEMPLATE ? 'Local Template' : 'System Template'}
              </span>

                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {prompt.category}
            </span>
                    </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">{prompt.description}</p>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-1"/>
                    <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>

                    {prompt.type === PromptType.LOCAL_TEMPLATE && (
                        <div className="ml-auto">
                            <button
                                onClick={handleEditClick}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            >
                                <Edit className="h-4 w-4"/>
                            </button>
                        </div>
                    )}
                </div>

                {/* Ratings display */}
                {(positiveRatings > 0 || negativeRatings > 0) && (
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                        <div className="flex items-center mr-3">
                            <ThumbsUp className="h-3 w-3 mr-1 text-green-500"/>
                            <span>{positiveRatings}</span>
                        </div>
                        <div className="flex items-center">
                            <ThumbsDown className="h-3 w-3 mr-1 text-red-500"/>
                            <span>{negativeRatings}</span>
                        </div>
                    </div>
                )}

                {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        <TagsIcon className="h-4 w-4 text-gray-400"/>
                        {prompt.tags.slice(0, 3).map((tag, index) => (
                            <Tag
                                key={index}
                            >{tag}</Tag>
                        ))}
                        {prompt.tags.length > 3 && (
                            <Tag>
                                +{prompt.tags.length - 3}
                            </Tag>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptCard;

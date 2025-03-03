import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';

interface PromptRatingProps {
  promptId: string;
  positiveCount: number;
  negativeCount: number;
}

const PromptRating: React.FC<PromptRatingProps> = ({
  promptId,
  positiveCount = 0,
  negativeCount = 0
}) => {
  const { ratePrompt, isSupabaseEnabled } = usePromptContext();

  const handleRate = async (rating: boolean) => {
    await ratePrompt(promptId, rating);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <button
          onClick={() => handleRate(true)}
          className={`p-1 rounded-full ${
            positiveCount > negativeCount
              ? 'bg-green-100 text-green-600'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
          title="Rate Positive"
          aria-label="Rate Positive"
        >
          <ThumbsUp className="h-5 w-5" />
        </button>
        <span className="ml-1 text-sm text-gray-600">{positiveCount}</span>
      </div>
      
      <div className="flex items-center">
        <button
          onClick={() => handleRate(false)}
          className={`p-1 rounded-full ${
            positiveCount < negativeCount
              ? 'bg-red-100 text-red-600'
              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Rate Negative"
          aria-label="Rate Negative"
        >
          <ThumbsDown className="h-5 w-5" />
        </button>
        <span className="ml-1 text-sm text-gray-600">{negativeCount}</span>
      </div>
      
      {!isSupabaseEnabled && (
        <span className="text-xs text-gray-500 italic">
          Ratings stored locally only
        </span>
      )}
    </div>
  );
};

export default PromptRating;

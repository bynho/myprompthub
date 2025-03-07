import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
              onClick={() => handleRate(true)}
              sx={{
                p: 0.5,
                borderRadius: '50%',
                color: positiveCount > negativeCount ? 'success.main' : 'text.disabled',
                bgcolor: positiveCount > negativeCount ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: 'success.main'
                }
              }}
              aria-label="Rate Positive"
          >
            <ThumbsUp size={20} />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {positiveCount}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
              onClick={() => handleRate(false)}
              sx={{
                p: 0.5,
                borderRadius: '50%',
                color: positiveCount < negativeCount ? 'error.main' : 'text.disabled',
                bgcolor: positiveCount < negativeCount ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: 'error.main'
                }
              }}
              aria-label="Rate Negative"
          >
            <ThumbsDown size={20} />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {negativeCount}
          </Typography>
        </Box>

        {!isSupabaseEnabled && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Ratings stored locally only
            </Typography>
        )}
      </Box>
  );
};

export default PromptRating;

import React from 'react';
import { Box, Grid, Paper, Skeleton, Typography } from '@mui/material';
import { Prompt } from '../types';
import PromptCard from './PromptCard';

interface PromptListProps {
  prompts: Prompt[];
  loading?: boolean;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, loading = false }) => {
  if (loading) {
    return (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ p: 2.5, height: '100%' }}>
                  <Skeleton variant="rectangular" width="75%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" width="25%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="rectangular" width="85%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="33%" height={16} sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </Box>
                </Paper>
              </Grid>
          ))}
        </Grid>
    );
  }

  if (prompts.length === 0) {
    return (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography color="text.secondary">No prompts found</Typography>
        </Box>
    );
  }

  return (
      <Grid container spacing={3}>
        {prompts.map(prompt => (
            <Grid item xs={12} sm={6} md={4} key={prompt.id}>
              <PromptCard prompt={prompt} />
            </Grid>
        ))}
      </Grid>
  );
};

export default PromptList;

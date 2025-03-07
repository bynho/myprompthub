import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    Link,
    Stack,
    Typography
} from '@mui/material';
import { Calendar, Copy, Edit, Folder, Tag as TagIcon, Trash } from 'lucide-react';
import { Prompt } from '../types';
import { usePromptContext } from '../contexts/PromptContext';
import analyticsService from '../services/analyticsService';

interface SavedPromptCardProps {
    prompt: Prompt;
}

const SavedPromptCard: React.FC<SavedPromptCardProps> = ({ prompt }) => {
    const { removeSavedPrompt, copyToClipboard } = usePromptContext();

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
        <Card sx={{
            height: '100%',
            transition: 'all 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
            }
        }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Link
                        component={RouterLink}
                        to={`/prompt/${prompt.id}`}
                        onClick={handleCardClick}
                        sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1
                        }}
                        variant="h6"
                    >
                        {prompt.title}
                    </Link>
                    <Chip
                        label={prompt.category}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                            color: 'rgb(37, 99, 235)',
                            fontSize: '0.75rem'
                        }}
                    />
                </Box>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {prompt.content}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {prompt.folder && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Folder size={16} style={{ marginRight: 4 }} />
                            <Typography variant="caption" color="text.secondary">
                                {prompt.folder}
                            </Typography>
                        </Box>
                    )}

                    {prompt.createdAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Calendar size={16} style={{ marginRight: 4 }} />
                            <Typography variant="caption" color="text.secondary">
                                {new Date(prompt.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {prompt.tags && prompt.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
                        <TagIcon size={16} style={{ color: '#9ca3af', marginTop: 4 }} />
                        {prompt.tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    bgcolor: 'rgba(75, 85, 99, 0.1)',
                                    color: 'text.secondary',
                                    mb: 0.5
                                }}
                            />
                        ))}
                    </Stack>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 'auto' }}>
                    <IconButton
                        onClick={handleCopy}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)', color: 'primary.main' }
                        }}
                        title="Copy to clipboard"
                    >
                        <Copy size={20} />
                    </IconButton>
                    <IconButton
                        component={RouterLink}
                        to={`/prompt/${prompt.id}`}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'success.main' }
                        }}
                        title="Edit"
                    >
                        <Edit size={20} />
                    </IconButton>
                    <IconButton
                        onClick={handleDelete}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main' }
                        }}
                        title="Delete"
                    >
                        <Trash size={20} />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SavedPromptCard;

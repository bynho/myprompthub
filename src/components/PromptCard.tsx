import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Stack,
    IconButton
} from '@mui/material';
import { Calendar, Edit, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Prompt, PromptType } from '../types';
import analyticsService from '../services/analyticsService';
import Tag from "./Tag";

interface PromptCardProps {
    prompt: Prompt;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
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

    const getPromptTypeLabel = () => {
        switch (prompt.type) {
            case PromptType.LOCAL:
                return 'Local';
            case PromptType.LOCAL_TEMPLATE:
                return 'Local Template';
            default:
                return 'System Template';
        }
    };

    return (
        <Card
            onClick={handleCardClick}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                }
            }}
        >
            <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2
                        }}
                    >
                        {prompt.title}
                    </Typography>
                    <Box>
                        <Chip
                            label={getPromptTypeLabel()}
                            size="small"
                            sx={{
                                mr: 1,
                                bgcolor: 'rgba(147, 51, 234, 0.1)',
                                color: 'rgb(107, 33, 168)',
                                fontSize: '0.75rem'
                            }}
                        />
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
                    {prompt.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Calendar size={16} style={{ marginRight: 4 }} />
                    <Typography variant="caption" color="text.secondary">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                    </Typography>

                    {prompt.type === PromptType.LOCAL_TEMPLATE && (
                        <Box sx={{ ml: 'auto' }}>
                            <IconButton
                                size="small"
                                onClick={handleEditClick}
                                sx={{
                                    p: 0.5,
                                    color: 'text.secondary',
                                    '&:hover': {
                                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                <Edit size={16} />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                {/* Ratings display */}
                {(positiveRatings > 0 || negativeRatings > 0) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
                            <ThumbsUp size={14} style={{ marginRight: 4, color: '#10b981' }} />
                            <Typography variant="caption">{positiveRatings}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ThumbsDown size={14} style={{ marginRight: 4, color: '#ef4444' }} />
                            <Typography variant="caption">{negativeRatings}</Typography>
                        </Box>
                    </Box>
                )}

                {prompt.tags && prompt.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {prompt.tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                        ))}
                        {prompt.tags.length > 3 && (
                            <Tag>+{prompt.tags.length - 3}</Tag>
                        )}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

export default PromptCard;

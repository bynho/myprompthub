import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Link,
    Avatar,
    Chip
} from '@mui/material';
import { Clock, Save, Search } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import analyticsService from '../services/analyticsService';

const HomePage: React.FC = () => {
    const { prompts, savedPrompts } = usePromptContext();

    // Track homepage view
    useEffect(() => {
        analyticsService.event('Navigation', 'view_homepage');
    }, []);

    // Get recent prompts (last 3)
    const recentPrompts = prompts.slice(0, 3);

    const handleFeatureClick = (feature: string) => {
        analyticsService.event('Navigation', 'feature_click', feature);
    };

    const FeatureCard = ({
                             title,
                             description,
                             icon,
                             path,
                             featureId,
                             chip
                         }: {
        title: string;
        description: string;
        icon: React.ReactNode;
        path: string;
        featureId: string;
        chip?: React.ReactNode;
    }) => (
        <Paper
            component={RouterLink}
            to={path}
            onClick={() => handleFeatureClick(featureId)}
            sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                }
            }}
        >
            <Avatar
                sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    color: 'primary.main',
                    width: 56,
                    height: 56,
                    mb: 2
                }}
            >
                {icon}
            </Avatar>
            <Typography variant="h6" component="h2" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {description}
            </Typography>
            {chip}
        </Paper>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    MyPromptHub
                </Typography>
                <Typography variant="h5" component="p" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                    Browse, customize, and organize research prompts for your projects
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
                    <FeatureCard
                        title="Browse Prompts"
                        description="Discover research prompts for various purposes and customize them to your needs"
                        icon={<Search size={28} />}
                        path="/browse"
                        featureId="browse"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <FeatureCard
                        title="Saved Prompts"
                        description="Access your saved prompts and organize them for easy reference"
                        icon={<Save size={28} />}
                        path="/saved"
                        featureId="saved"
                        chip={
                            savedPrompts.length > 0 ? (
                                <Chip
                                    label={`${savedPrompts.length} saved`}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                                        color: 'rgb(5, 150, 105)',
                                        mt: 1
                                    }}
                                />
                            ) : undefined
                        }
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Avatar
                                sx={{
                                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                                    color: 'rgb(217, 119, 6)',
                                    width: 56,
                                    height: 56,
                                    mb: 2
                                }}
                            >
                                <Clock size={28} />
                            </Avatar>
                            <Typography variant="h6" component="h2" gutterBottom>
                                Recent Prompts
                            </Typography>

                            {recentPrompts.length > 0 ? (
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    {recentPrompts.map((prompt) => (
                                        <Link
                                            key={prompt.id}
                                            component={RouterLink}
                                            to={`/prompt/${prompt.id}`}
                                            sx={{
                                                display: 'block',
                                                mb: 1,
                                                color: 'text.primary',
                                                textDecoration: 'none',
                                                '&:hover': { color: 'primary.main' }
                                            }}
                                        >
                                            <Typography variant="body2" noWrap>
                                                {prompt.title}
                                            </Typography>
                                        </Link>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No recent prompts
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default HomePage;

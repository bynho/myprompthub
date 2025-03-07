import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    py: 6
                }}
            >
                <Typography
                    variant="h1"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: { xs: '4rem', sm: '6rem' } }}
                >
                    404
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
                    Page not found
                </Typography>

                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    The page you are looking for doesn't exist or has been moved.
                </Typography>

                <Button
                    component={RouterLink}
                    to="/"
                    variant="contained"
                    color="primary"
                    startIcon={<Home size={20} />}
                    size="large"
                >
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
};

export default NotFoundPage;

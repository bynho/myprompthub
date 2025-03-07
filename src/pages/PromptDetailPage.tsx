import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import { ArrowLeft, Copy, Edit, Save, Trash } from 'lucide-react';
import { usePromptContext } from '../contexts/PromptContext';
import TagSelector from '../components/TagSelector';
import FolderSelector from '../components/FolderSelector';
import VariableInput from '../components/VariableInput';
import PromptRating from '../components/PromptRating';
import analyticsService from '../services/analyticsService';
import { Prompt, PromptType, Variable } from "../types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "../contexts/ToastContext";


const PromptDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        prompts,
        savedPrompts,
        deletePromptTemplate,
        savePrompt,
        copyToClipboard,
        tags
    } = usePromptContext();

    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const { addToast } = useToast();

    // Find the prompt by ID
    useEffect(() => {
        if (id) {
            console.warn('Looking for prompt with ID:', id);

            // First look in the combined prompts array
            let foundPrompt = prompts.find(p => p.id === id);

            // If not found in the combined array, check specifically in savedPrompts
            if (!foundPrompt) {
                console.warn('Not found in combined prompts, checking savedPrompts');
                foundPrompt = savedPrompts.find(p => p.id === id);
            }

            if (foundPrompt) {
                console.warn('Found prompt:', foundPrompt);
                setPrompt(foundPrompt);

                // Initialize variable values
                const initialValues: Record<string, string> = {};
                foundPrompt.variables?.forEach(variable => {
                    initialValues[variable.id] = variable.value || '';
                });
                setVariableValues(initialValues);

                // Set the initial tags and folder if present
                if (foundPrompt.tags && foundPrompt.tags.length > 0) {
                    setSelectedTags(foundPrompt.tags);
                }

                if (foundPrompt.folder) {
                    setSelectedFolder(foundPrompt.folder);
                }

                // Track prompt view
                analyticsService.trackPromptInteraction('view', foundPrompt.id, foundPrompt.title);
            } else {
                console.warn('Prompt not found with ID:', id);
                setPrompt(null);
            }
        }
    }, [id, prompts, savedPrompts, navigate]);

    // Generate content when variable values change
    useEffect(() => {
        if (prompt) {
            let content = prompt.content;

            // Replace variables with values
            Object.entries(variableValues).forEach(([key, value]) => {
                const regex = new RegExp(`{${key}}`, 'g');
                value = `<b>${value}</b>`;
                content = content.replace(regex, value || `{${key}}`);
            });

            setGeneratedContent(content);
        }
    }, [prompt, variableValues]);

    const handleVariableChange = (variableId: string, value: string) => {
        setVariableValues(prev => ({
            ...prev,
            [variableId]: value
        }));

        // Track variable change
        analyticsService.event('Prompt', 'variable_change', variableId);
    };

    const handleSave = () => {
        if (prompt) {
            console.warn('Saving prompt', prompt);
            const newId = uuidv4();

            const newPrompt = {
                ...prompt,
                id: newId,
                type: PromptType.LOCAL,
                originalPromptId: prompt.id,
                content: generatedContent,
                tags: selectedTags,
                folder: selectedFolder,
                createdAt: new Date().toISOString(),
                variables: prompt.variables?.map(variable => ({
                    ...variable,
                    value: variableValues[variable.id]
                }))
            };

            savePrompt(newPrompt);
            setIsSaved(true);

            // Navigate to the new prompt immediately
            navigate(`/prompt/${newId}`, { replace: true });

            addToast({ message: 'Prompt saved successfully', type: 'success' });

            // Track save event
            analyticsService.trackPromptInteraction('save', prompt.id, prompt.title);
        }
    };

    const handleCopy = () => {
        copyToClipboard(generatedContent);

        // Track copy event
        analyticsService.trackPromptInteraction('copy', prompt?.id || '', prompt?.title || '');
    };

    const handleTagChange = (tags: string[]) => {
        setSelectedTags(tags);

        // Track tag change
        analyticsService.trackOrganization('change_tags', 'tags', tags.join(', '));
    };

    const handleDeleteItem = () => {
        if (prompt === null) {
            return;
        }
        deletePromptTemplate(prompt.id);
        navigate('/browse');

        // Track delete event
        analyticsService.trackPromptInteraction('delete', prompt?.id || '', prompt?.title || '');
    };

    const handleFolderChange = (folderId: string | undefined) => {
        setSelectedFolder(folderId);

        // Track folder change
        analyticsService.trackOrganization('change_folder', 'folder', folderId || 'none');
    };

    const handleEditTemplate = () => {
        if (prompt) {
            navigate(`/create/${prompt.id}`);
        }
    };

    if (!prompt) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Button
                    onClick={() => navigate(-1)}
                    startIcon={<ArrowLeft size={18} />}
                    sx={{ mb: 3, color: 'primary.main' }}
                >
                    Back
                </Button>

                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Prompt not found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        The prompt you are looking for could not be found.
                    </Typography>
                    <Button
                        onClick={() => navigate('/browse')}
                        variant="contained"
                        color="primary"
                    >
                        Browse Prompts
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button
                onClick={() => navigate(-1)}
                startIcon={<ArrowLeft size={18} />}
                sx={{ mb: 3, color: 'primary.main' }}
            >
                Back
            </Button>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {prompt.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip
                                label={prompt.category}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'rgb(37, 99, 235)',
                                    fontSize: '0.75rem'
                                }}
                            />
                            {prompt.tags && prompt.tags.map((tag: string, index: number) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(75, 85, 99, 0.1)',
                                        color: 'text.secondary',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            ))}
                        </Box>

                        <Typography variant="body1" color="text.secondary" paragraph>
                            {prompt.description}
                        </Typography>
                    </Box>

                    {prompt.type === PromptType.LOCAL_TEMPLATE && (
                        <Button
                            onClick={handleEditTemplate}
                            variant="outlined"
                            size="small"
                            startIcon={<Edit size={16} />}
                            sx={{ ml: 2 }}
                        >
                            Edit Template
                        </Button>
                    )}
                </Box>

                {/* Prompt rating component */}
                <Box sx={{ mb: 3 }}>
                    <PromptRating
                        promptId={prompt.id}
                        positiveCount={prompt.positiveRatings || 0}
                        negativeCount={prompt.negativeRatings || 0}
                    />
                </Box>

                {prompt.variables && prompt.variables.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Customize Prompt
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {prompt.variables.map((variable: Variable) => (
                                <VariableInput
                                    key={variable.id}
                                    variable={variable}
                                    value={variableValues[variable.id] || ''}
                                    onChange={(value) => handleVariableChange(variable.id, value)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Generated Prompt
                    </Typography>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            bgcolor: 'rgba(249, 250, 251, 0.8)',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap'
                        }}
                        dangerouslySetInnerHTML={{ __html: generatedContent }}
                    />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            Tags
                        </Typography>
                        <TagSelector
                            availableTags={tags}
                            selectedTags={selectedTags}
                            onChange={handleTagChange}
                            allowCustomTags={true}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            Folder
                        </Typography>
                        <FolderSelector
                            selectedFolder={selectedFolder}
                            onChange={handleFolderChange}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {prompt.type === PromptType.LOCAL_TEMPLATE && (
                        <Button
                            onClick={handleDeleteItem}
                            variant="contained"
                            color="error"
                            startIcon={<Trash size={16} />}
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        onClick={handleCopy}
                        variant="outlined"
                        color="primary"
                        startIcon={<Copy size={16} />}
                    >
                        Copy
                    </Button>
                    {!isSaved && (
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            color="primary"
                            startIcon={<Save size={16} />}
                        >
                            Save
                        </Button>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default PromptDetailPage;

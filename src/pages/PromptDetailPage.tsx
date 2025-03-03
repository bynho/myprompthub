import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    ArrowLeft,
    Copy,
    Edit,
    Folder,
    Save,
    Tag,
    Trash,
} from 'lucide-react';
import {usePromptContext} from '../contexts/PromptContext';
import TagSelector from '../components/TagSelector';
import FolderSelector from '../components/FolderSelector';
import VariableInput from '../components/VariableInput';
import PromptRating from '../components/PromptRating';
import analyticsService from '../services/analyticsService';
import {Prompt, Variable} from "../types";
import Button from "../components/Button.tsx";

const PromptDetailPage: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        prompts,
        deletePromptTemplate,
        savedPrompts,
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

    // Find the prompt by ID
    useEffect(() => {
        if (id && prompts.length > 0) {
            const foundPrompt = prompts.find(p => p.id === id);
            if (foundPrompt) {
                console.warn('Prompt found:', foundPrompt);
                setPrompt(foundPrompt);

                // Initialize variable values
                const initialValues: Record<string, string> = {};
                foundPrompt.variables?.forEach(variable => {
                    initialValues[variable.id] = '';
                });
                setVariableValues(initialValues);

                // Track prompt view
                analyticsService.trackPromptInteraction('view', foundPrompt.id, foundPrompt.title);
            } else {
                navigate('/browse');
            }
        }
    }, [id, prompts, navigate]);

    // Check if this prompt is already saved
    useEffect(() => {
        if (id && savedPrompts.length > 0) {
            const savedPrompt = savedPrompts.find(p => p.originalPromptId === id);
            if (savedPrompt) {
                setIsSaved(true);
                setSelectedTags(savedPrompt.tags || []);
                setSelectedFolder(savedPrompt.folder);
            } else {
                setIsSaved(false);
            }
        }
    }, [id, savedPrompts]);

    // Generate content when variable values change
    useEffect(() => {
        if (prompt) {
            let content = prompt.content;

            // Replace variables with values
            Object.entries(variableValues).forEach(([key, value]) => {
                const regex = new RegExp(`{${key}}`, 'g');
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
            savePrompt({
                id: `saved-${Date.now()}`,
                originalPromptId: prompt.id,
                title: prompt.title,
                category: prompt.category,
                description: prompt.description,
                generatedContent,
                tags: selectedTags,
                folder: selectedFolder,
                savedAt: new Date().toISOString()
            });

            setIsSaved(true);

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
        // Track delete event
        analyticsService.trackPromptInteraction('delete', prompt?.id || '', prompt?.title || '');
    }

    const handleFolderChange = (folderId: string | undefined) => {
        setSelectedFolder(folderId);

        // Track folder change
        analyticsService.trackOrganization('change_folder', 'folder', folderId || 'none');
    };

    const handleEditTemplate = () => {
        if (prompt && prompt.isCustom) {
            navigate(`/create/${prompt.id}`);
        }
    };

    if (!prompt) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="h-5 w-5 mr-1"/>
                Back
            </button>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{prompt.title}</h1>
                        <div className="flex items-center mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mr-2">
                {prompt.category}
              </span>
                            {prompt.tags && prompt.tags.map((tag: string, index: number) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full mr-1"
                                >
                  {tag}
                </span>
                            ))}
                        </div>
                        <p className="text-gray-600 mb-6">{prompt.description}</p>
                    </div>

                    {prompt.isCustom && (
                        <button
                            onClick={handleEditTemplate}
                            className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                        >
                            <Edit className="h-4 w-4 mr-1"/>
                            Edit Template
                        </button>
                    )}
                </div>

                {/* Prompt rating component */}
                <div className="mb-6">
                    <PromptRating
                        promptId={prompt.id}
                        positiveCount={prompt.positiveRatings || 0}
                        negativeCount={prompt.negativeRatings || 0}
                    />
                </div>

                {prompt.variables && prompt.variables.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customize Prompt</h2>
                        <div className="space-y-4">
                            {prompt.variables.map((variable: Variable) => (
                                <VariableInput
                                    key={variable.id}
                                    variable={variable}
                                    value={variableValues[variable.id] || ''}
                                    onChange={(value) => handleVariableChange(variable.id, value)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Prompt</h2>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">{generatedContent}</pre>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Tag className="h-4 w-4 inline mr-1"/>
                                Tags
                            </label>
                            <TagSelector
                                availableTags={tags}
                                selectedTags={selectedTags}
                                onChange={handleTagChange}
                                allowCustomTags={true}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Folder className="h-4 w-4 inline mr-1"/>
                                Folder
                            </label>
                            <FolderSelector
                                selectedFolder={selectedFolder}
                                onChange={handleFolderChange}
                            />
                        </div>
                    </div>

                    { prompt.isCustom ? 'custom' : 'not custom' }
                    <div className="flex justify-end gap-3">
                        {
                            prompt.isCustom === true && (
                                <Button onClick={handleDeleteItem}
                                        variant={'danger'}
                                        icon={<Trash className="h-4 w-4 mx-1"/>}>
                                    Delete
                                </Button>
                            )
                        }
                        <Button
                            onClick={handleCopy}
                            variant={'secondary'}
                            icon={<Copy className="h-4 w-4 mx-1"/>}>
                            Copy
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant={'primary'}
                            disabled={isSaved}
                            icon={<Save className="h-4 w-4 mx-2"/>}>
                            {isSaved ? 'Saved' : 'Save'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptDetailPage;

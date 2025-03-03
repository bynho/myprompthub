import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AlertCircle, ArrowLeft, Save, Wand} from 'lucide-react';
import {usePromptContext} from '../contexts/PromptContext';
import TagSelector from '../components/TagSelector';
import VariableEditor from '../components/VariableEditor';
import {Prompt, PromptType, Variable} from '../types';
import analyticsService from '../services/analyticsService';
import Button from "../components/Button.tsx";
import {useToast} from "../contexts/ToastContext.tsx";

const CreatePromptPage: React.FC = () => {
    const navigate = useNavigate();
    const {id} = useParams<{ id?: string }>();
    const {
        prompts,
        categories,
        tags,
        createPromptTemplate,
        updatePromptTemplate,
        extractVariablesFromContent
    } = usePromptContext();

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [newCategory, setNewCategory] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [variables, setVariables] = useState<Variable[]>([]);
    const [showCategoryInput, setShowCategoryInput] = useState<boolean>(false);
    const [autoDetectVariables, setAutoDetectVariables] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const {addToast} = useToast();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Load prompt data if editing
    useEffect(() => {
        if (id && prompts.length > 0) {
            const promptToEdit = prompts.find(p => p.id === id);
            if (promptToEdit) {
                setIsEditing(true);
                setTitle(promptToEdit.title);
                setCategory(promptToEdit.category);
                setDescription(promptToEdit.description);
                setContent(promptToEdit.content);
                setSelectedTags(promptToEdit.tags || []);
                setVariables(promptToEdit.variables || []);
                setAutoDetectVariables(false);
            } else {
                navigate('/browse');
            }
        }
    }, [id, prompts, navigate]);

    // Auto-detect variables when content changes
    useEffect(() => {
        if (autoDetectVariables && content) {
            const detectedVariables = extractVariablesFromContent(content);

            // Only update if the variables have actually changed
            // Compare IDs to avoid infinite loop
            const currentVarIds = variables.map(v => v.id).sort().join(',');
            const newVarIds = detectedVariables.map(v => v.id).sort().join(',');

            if (currentVarIds !== newVarIds) {
                // Merge with existing variables to preserve customizations
                const mergedVariables = detectedVariables.map(newVar => {
                    const existingVar = variables.find(v => v.id === newVar.id);
                    return existingVar || newVar;
                });

                setVariables(mergedVariables);
            }
        }
    }, [content, autoDetectVariables, extractVariablesFromContent]);

    const handleSave = () => {
        try {
            setIsSaving(true);
            // Validate form
            if (!title.trim()) {
                setError('Title is required');
                return;
            }

            if (!category.trim() && !newCategory.trim()) {
                setError('Category is required');
                return;
            }

            if (!content.trim()) {
                setError('Prompt content is required');
                return;
            }

            // Create prompt object
            const promptData: Prompt = {
                id: isEditing ? id! : `custom-${Date.now()}`,
                title: title.trim(),
                category: newCategory.trim() || category.trim(),
                description: description.trim(),
                content: content.trim(),
                variables: variables,
                tags: selectedTags,
                createdAt: new Date().toISOString(),
                type: PromptType.LOCAL_TEMPLATE
            };

            // Save prompt
            if (isEditing) {
                updatePromptTemplate(promptData);
                addToast({
                    type: 'success',
                    message: 'Prompt updated successfully',
                    duration: 3000
                });
                analyticsService.event('Prompt', 'update_template', promptData.title);
            } else {
                createPromptTemplate(promptData);
                addToast({
                    type: 'success',
                    message: 'Prompt created successfully',
                    duration: 3000
                });
                analyticsService.event('Prompt', 'create_template', promptData.title);
            }

            // Navigate back to browse page
            navigate('/browse');
        } catch (err) {
            console.error('Error saving prompt template:', err);
            setError('Failed to save prompt template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleTagChange = (tags: string[]) => {
        setSelectedTags(tags);
    };

    const handleVariablesChange = (updatedVariables: Variable[]) => {
        setVariables(updatedVariables);
        setAutoDetectVariables(false);
    };

    const handleAutoDetectToggle = () => {
        if (!autoDetectVariables) {
            // Re-detect variables when turning auto-detect back on
            const detectedVariables = extractVariablesFromContent(content);
            setVariables(detectedVariables);
        }
        setAutoDetectVariables(!autoDetectVariables);
    };

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
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? 'Edit Prompt Template' : 'Create New Prompt Template'}
                </h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5"/>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter a descriptive title"
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        {showCategoryInput ? (
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter a new category"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryInput(false);
                                        setNewCategory('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex">
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInput(true)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                                >
                                    New
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief description of what this prompt does"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                            Prompt Content
                        </label>
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-2 text-sm text-gray-600">
                            <p>
                                Use {'{variable_name}'} syntax to create variables that users can customize.
                                Variables will be automatically detected and added to the variables section below.
                            </p>
                        </div>
                        <textarea
                            id="content"
                            value={content}
                            onChange={handleContentChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="Enter your prompt content with {variable_placeholders}"
                            rows={8}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Variables
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoDetectToggle}
                                className={`flex items-center text-sm ${
                                    autoDetectVariables ? 'text-blue-600' : 'text-gray-600'
                                }`}
                            >
                                <Wand className="h-4 w-4 mr-1"/>
                                {autoDetectVariables ? 'Auto-detecting' : 'Auto-detect variables'}
                            </button>
                        </div>
                        <VariableEditor
                            variables={variables}
                            onChange={handleVariablesChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                        </label>
                        <TagSelector
                            availableTags={tags}
                            selectedTags={selectedTags}
                            onChange={handleTagChange}
                            allowCustomTags={true}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            isLoading={isSaving}
                            loadingText="Saving..."
                            variant="primary"
                            onClick={handleSave}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                        >
                            <Save className="h-4 w-4 mr-2"/>
                            {isEditing ? ' Save Changes' : 'Create Template'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePromptPage;

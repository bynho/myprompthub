import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Clock, Save, Search} from 'lucide-react';
import {usePromptContext} from '../contexts/PromptContext';
import analyticsService from '../services/analyticsService';

const HomePage: React.FC = () => {
    const {prompts, savedPrompts} = usePromptContext();

    // Track homepage view
    useEffect(() => {
        analyticsService.event('Navigation', 'view_homepage');
    }, []);

    // Get recent prompts (last 3)
    const recentPrompts = prompts.slice(0, 3);

    const handleFeatureClick = (feature: string) => {
        analyticsService.event('Navigation', 'feature_click', feature);
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    MyPromptHub
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Browse, customize, and organize research prompts for your projects
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link
                    to="/browse"
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleFeatureClick('browse')}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-full mb-4">
                            <Search className="h-6 w-6 text-blue-600"/>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Browse Prompts
                        </h2>
                        <p className="text-gray-600">
                            Discover research prompts for various purposes and customize them to your needs
                        </p>
                    </div>
                </Link>

                <Link
                    to="/saved"
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handleFeatureClick('saved')}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-green-100 p-3 rounded-full mb-4">
                            <Save className="h-6 w-6 text-green-600"/>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Saved Prompts
                        </h2>
                        <p className="text-gray-600">
                            Access your saved prompts and organize them for easy reference
                        </p>
                        {savedPrompts.length > 0 && (
                            <span
                                className="mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {savedPrompts.length} saved
              </span>
                        )}
                    </div>
                </Link>

                {/*<Link*/}
                {/*    to="/settings"*/}
                {/*    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"*/}
                {/*    onClick={() => handleFeatureClick('settings')}*/}
                {/*>*/}
                {/*    <div className="flex flex-col items-center text-center">*/}
                {/*        <div className="bg-purple-100 p-3 rounded-full mb-4">*/}
                {/*            <Github className="h-6 w-6 text-purple-600"/>*/}
                {/*        </div>*/}
                {/*        <h2 className="text-xl font-semibold text-gray-900 mb-2">*/}
                {/*            Sync with GitHub*/}
                {/*        </h2>*/}
                {/*        <p className="text-gray-600">*/}
                {/*            MyPromptHub saved prompts and templates*/}
                {/*        </p>*/}
                {/*    </div>*/}
                {/*</Link>*/}

                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-yellow-100 p-3 rounded-full mb-4">
                            <Clock className="h-6 w-6 text-yellow-600"/>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Recent Prompts
                        </h2>
                        {recentPrompts.length > 0 ? (
                            recentPrompts.map((prompt) => (
                                <div key={prompt.id} className="mb-2">
                                    <Link to={`/prompt/${prompt.id}`} className="text-gray-600 hover:text-gray-800">
                                        {prompt.title}
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">No recent prompts</p>
                        )

                        }
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomePage;

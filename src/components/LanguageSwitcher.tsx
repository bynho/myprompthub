import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    // Store the language preference
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Update URL to reflect language change
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentLang = pathSegments[0];
    
    // Check if the first segment is a language code
    const isLanguageCode = ['en', 'pt-BR'].includes(currentLang);
    
    if (isLanguageCode) {
      // Replace language code in URL
      const newPath = `/${lng}/${pathSegments.slice(1).join('/')}`;
      navigate(newPath);
    } else {
      // Add language code to URL
      const newPath = `/${lng}${location.pathname}`;
      navigate(newPath);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded-md ${
          i18n.language === 'en'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('pt-BR')}
        className={`px-2 py-1 text-sm rounded-md ${
          i18n.language === 'pt-BR'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Português
      </button>
    </div>
  );
};

export default LanguageSwitcher;
import { useEffect, useState } from 'react';
import { t, getCurrentLanguage, AvailableLanguage } from '../i18n';

/**
 * Hook to use translations in components with automatic updates when language changes
 */
export function useTranslations() {
  const [language, setLanguage] = useState<AvailableLanguage>(getCurrentLanguage());
  
  useEffect(() => {
    // Update language when it changes
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail.language);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);
  
  // Return the current language and translation function
  return {
    language,
    t: (key: string, variables: Record<string, string> = {}) => t(key, variables)
  };
}
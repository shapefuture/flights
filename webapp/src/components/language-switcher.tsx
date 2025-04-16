import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { 
  AvailableLanguage, 
  changeLanguage, 
  getCurrentLanguage, 
  getAvailableLanguages 
} from '../i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<AvailableLanguage>(getCurrentLanguage());
  
  // Update state when language changes
  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setCurrentLang(e.detail.language);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);
  
  const handleLanguageSelect = async (lang: AvailableLanguage) => {
    if (lang !== currentLang) {
      await changeLanguage(lang);
      setCurrentLang(lang);
    }
  };
  
  // Get all available languages
  const languages = getAvailableLanguages();
  
  // Get current language display name
  const currentLanguageName = languages.find(lang => lang.code === currentLang)?.name || 'English';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Change language">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
          >
            <span className={currentLang === language.code ? 'font-bold' : ''}>
              {language.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
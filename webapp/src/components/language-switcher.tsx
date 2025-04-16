import React from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

// Define the AvailableLanguage type
type AvailableLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja';

export const LanguageSwitcher = () => {
  // Your component implementation
  
  const switchLanguage = async (lang: AvailableLanguage) => {
    // Your language switching logic
  };
  
  return (
    <div className="language-switcher">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button 
            variant="outline" 
            className="language-button" 
            aria-label="Select Language"
          >
            <span>🌐</span>
            <span>Language</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent>
          {['en', 'es', 'fr', 'de', 'ja'].map((lang) => (
            <DropdownMenuItem 
              key={lang as AvailableLanguage}
              onClick={() => switchLanguage(lang as AvailableLanguage)}
              className="language-option"
            >
              <span>{lang.toUpperCase()}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSwitcher;
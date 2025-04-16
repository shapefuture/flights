import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences, getUserPreferences, saveUserPreferences, applyPreferencesToUI } from '../services/preferenceService';

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences());
  
  // Apply preferences to UI when they change
  useEffect(() => {
    applyPreferencesToUI(preferences);
  }, [preferences]);
  
  // Update preferences
  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    saveUserPreferences(newPrefs);
  };
  
  // Reset preferences to defaults
  const resetPreferences = () => {
    const defaultPrefs = getUserPreferences();
    setPreferences(defaultPrefs);
  };
  
  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
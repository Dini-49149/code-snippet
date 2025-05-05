import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snippet, SortOption, Notification } from '../types';

interface AppContextType {
  snippets: Snippet[];
  setSnippets: React.Dispatch<React.SetStateAction<Snippet[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sortBy: SortOption;
  setSortBy: React.Dispatch<React.SetStateAction<SortOption>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notification: Notification | null;
  setNotification: React.Dispatch<React.SetStateAction<Notification | null>>;
  selectedSnippet: Snippet | null;
  setSelectedSnippet: React.Dispatch<React.SetStateAction<Snippet | null>>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <AppContext.Provider
      value={{
        snippets,
        setSnippets,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isDarkMode,
        toggleDarkMode,
        notification,
        setNotification,
        selectedSnippet,
        setSelectedSnippet,
        isFullscreen,
        toggleFullscreen,
        isLoading,
        setIsLoading,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 
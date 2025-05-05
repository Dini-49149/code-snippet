import React from 'react';
import { useApp } from '../context/AppContext';
import { SnippetList } from '../components/SnippetList';
import { CodeEditor } from '../components/CodeEditor';
import { Notification } from '../components/Notification';

export const MainLayout: React.FC = () => {
  const {
    snippets,
    isDarkMode,
    notification,
    selectedSnippet,
    isFullscreen,
    setSelectedSnippet,
    setSnippets,
  } = useApp();

  const handleCodeChange = (code: string) => {
    if (selectedSnippet) {
      setSnippets(prevSnippets =>
        prevSnippets.map(snippet =>
          snippet._id === selectedSnippet._id
            ? { ...snippet, code }
            : snippet
        )
      );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 ${isFullscreen ? 'hidden' : ''}`}>
            <SnippetList
              snippets={snippets}
              onSelectSnippet={setSelectedSnippet}
            />
          </div>
          <div className={`${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            <CodeEditor
              snippet={selectedSnippet}
              onCodeChange={handleCodeChange}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>
      </div>
      {notification && <Notification notification={notification} />}
    </div>
  );
}; 
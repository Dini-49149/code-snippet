import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { snippetService } from '../services/api';
import { SnippetListItem } from '../components/SnippetListItem';
import { CodeEditor } from '../components/CodeEditor';
import { Snippet } from '../types';

export const HomePage: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    snippets,
    setSnippets,
    selectedSnippet,
    setSelectedSnippet,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isFullscreen,
    toggleFullscreen,
    isLoading,
    setIsLoading,
    showNotification,
  } = useApp();

  // Fetch snippets on component mount
  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        setIsLoading(true);
        const data = await snippetService.getAll();
        setSnippets(data);
      } catch (error) {
        console.error('Error fetching snippets:', error);
        showNotification('Failed to fetch snippets. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnippets();
  }, [setSnippets, setIsLoading, showNotification]);

  // Filter and sort snippets
  const filteredSnippets = useMemo(() => {
    let result = [...snippets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        snippet =>
          snippet.title.toLowerCase().includes(query) ||
          snippet.description.toLowerCase().includes(query) ||
          snippet.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return result;
  }, [snippets, searchQuery, sortBy]);

  // Handle snippet deletion
  const handleDeleteSnippet = async (id: string) => {
    try {
      setIsLoading(true);
      await snippetService.delete(id);
      setSnippets(prev => prev.filter(snippet => snippet._id !== id));
      if (selectedSnippet?._id === id) {
        setSelectedSnippet(null);
      }
      showNotification('Snippet deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting snippet:', error);
      showNotification('Failed to delete snippet. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle snippet update
  // This function is defined but not currently used in the UI
  // It will be used in future updates for editing snippets
  const handleUpdateSnippet = async (snippet: Snippet) => {
    try {
      setIsLoading(true);
      const updatedSnippet = await snippetService.update(snippet._id, snippet);
      setSnippets(prev => prev.map(s => s._id === updatedSnippet._id ? updatedSnippet : s));
      setSelectedSnippet(null);
      showNotification('Snippet updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating snippet:', error);
      showNotification('Failed to update snippet. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle snippet creation
  // This function is defined but not currently used in the UI
  // It will be used in future updates for creating new snippets
  const handleCreateSnippet = async (snippet: Omit<Snippet, '_id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newSnippet = await snippetService.create(snippet);
      setSnippets(prev => [...prev, newSnippet]);
      showNotification('Snippet created successfully!', 'success');
    } catch (error) {
      console.error('Error creating snippet:', error);
      showNotification('Failed to create snippet. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code change
  const handleCodeChange = (code: string) => {
    if (selectedSnippet) {
      setSelectedSnippet({ ...selectedSnippet, code });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-700">Code Snippet Manager</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:w-64 p-2 rounded-lg border ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}
          />
        </div>
        <div className="w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
            className={`w-full md:w-auto p-2 rounded-lg border ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-8`}>
        {/* Snippet List */}
        <div className={`${isFullscreen ? 'hidden' : 'md:col-span-1'}`}>
          <div className={`rounded-lg shadow-md p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Your Snippets</h2>
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : filteredSnippets.length > 0 ? (
                filteredSnippets.map(snippet => (
                  <SnippetListItem
                    key={snippet._id}
                    snippet={snippet}
                    isSelected={selectedSnippet?._id === snippet._id}
                    darkMode={isDarkMode}
                    onSelect={setSelectedSnippet}
                    onDelete={handleDeleteSnippet}
                  />
                ))
              ) : (
                <div className="text-center py-4">No snippets found</div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className={`${isFullscreen ? 'md:col-span-1' : 'md:col-span-2'}`}>
          <div className={`rounded-lg shadow-md p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">
              {selectedSnippet ? 'View/Edit Snippet' : 'Create New Snippet'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <CodeEditor
                  snippet={selectedSnippet}
                  onCodeChange={handleCodeChange}
                  isFullscreen={isFullscreen}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
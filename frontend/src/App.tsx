import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Snippet } from './types';
import { snippetService } from './services/api';
import { getFolders, createFolder, updateFolder, deleteFolder, Folder } from './services/folderService';
import Editor from '@monaco-editor/react';
import { FolderTree } from './components/FolderTree';
import { 
  FaExpand, FaCompress, FaPlus, FaSearch, 
  FaSort, FaTrash, FaSave, FaTimes, FaLanguage,
  FaCopy, FaDownload, FaFilter, FaMoon, FaSun, FaHome
} from 'react-icons/fa';
import { API_ENDPOINTS } from './config/api';
import './App.css';
import { SnippetEditor } from './components/SnippetEditor';
import { PythonEnvironmentSelector } from './components/PythonEnvironmentSelector';

const App: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNewSnippetForm, setShowNewSnippetForm] = useState(false);
  const [newSnippet, setNewSnippet] = useState<Omit<Snippet, '_id' | 'createdAt'>>({
    title: '',
    code: '',
    programmingLanguage: 'javascript',
    description: '',
    tags: [],
    folder: null,
    updatedAt: new Date()
  });
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPythonEnvironmentId, setSelectedPythonEnvironmentId] = useState<string | null>(null);
  const [environmentUpdated, setEnvironmentUpdated] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('darkMode') === 'true');

  // Apply dark mode theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Fetch snippets on component mount
  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSnippets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await snippetService.getAll(controller.signal);
        if (isMounted) {
          setSnippets(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching snippets:', error);
        if (isMounted) {
          setError('Failed to connect to the server. Please ensure the backend is running and MongoDB is accessible.');
          showNotification('Failed to fetch snippets. Please try again.', 'error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSnippets();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [showNotification]);

  // Fetch folders on component mount
  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchFolders = async () => {
      try {
        const data = await getFolders(controller.signal);
        if (isMounted) {
          setFolders(data);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching folders:', error);
        if (isMounted) {
          showNotification('Failed to fetch folders. Please try again.', 'error');
        }
      }
    };

    fetchFolders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [showNotification]);

  // Get all unique tags from snippets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    snippets.forEach(snippet => {
      snippet.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [snippets]);

  // Filter tag suggestions based on input
  const tagSuggestions = useMemo(() => {
    if (!tagInput) return [];
    return allTags.filter(tag => 
      tag.toLowerCase().includes(tagInput.toLowerCase()) && 
      !newSnippet.tags.includes(tag)
    );
  }, [tagInput, allTags, newSnippet.tags]);

  // Filter and sort snippets
  const filteredSnippets = useMemo(() => {
    let result = [...snippets];

    // Apply search filter first (search across all snippets)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        snippet =>
          snippet.title.toLowerCase().includes(query) ||
          snippet.description.toLowerCase().includes(query) ||
          snippet.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply folder filter only if not searching
    if (selectedFolder !== null && !searchQuery) {
      result = result.filter(snippet => snippet.folder === selectedFolder);
    }

    // Apply tag filter
    if (filterTags.length > 0) {
      result = result.filter(snippet => 
        filterTags.every(tag => snippet.tags.includes(tag))
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
  }, [snippets, searchQuery, sortBy, filterTags, selectedFolder]);

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
  const handleUpdateSnippet = async (snippet: Snippet) => {
    try {
      setIsLoading(true);
      // Ensure folder is preserved in the update
      const updateData = {
        ...snippet,
        folder: snippet.folder || selectedFolder || null
      };
      const updatedSnippet = await snippetService.update(snippet._id, updateData);
      setSnippets(prev => prev.map(s => s._id === updatedSnippet._id ? updatedSnippet : s));
      setSelectedSnippet(null);
      setShowNewSnippetForm(false);
      showNotification('Snippet updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating snippet:', error);
      showNotification('Failed to update snippet. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle snippet creation
  const handleCreateSnippet = async () => {
    console.log('handleCreateSnippet called with newSnippet:', newSnippet);
    if (!newSnippet.title.trim()) {
      showNotification('Title is required', 'error');
      return;
    }
    
    if (!newSnippet.code.trim()) {
      showNotification('Code is required', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Creating snippet with data:', {
        ...newSnippet,
        folder: newSnippet.folder || null,
      });
      
      const createdSnippet = await snippetService.create({
        ...newSnippet,
        folder: newSnippet.folder || null,
      });
      console.log('Snippet created successfully:', createdSnippet);
      setSnippets((prevSnippets) => [...prevSnippets, createdSnippet]);
      setNewSnippet({
        title: '',
        code: '',
        programmingLanguage: 'javascript',
        description: '',
        tags: [],
        folder: null,
        updatedAt: new Date()
      });
      setShowNewSnippetForm(false);
      showNotification('Snippet created successfully', 'success');
    } catch (error) {
      console.error('Error creating snippet:', error);
      if (error instanceof Error) {
        showNotification(`Failed to create snippet: ${error.message}`, 'error');
      } else {
        showNotification('Failed to create snippet', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code change
  const handleCodeChange = (code: string | undefined) => {
    if (selectedSnippet && code !== undefined) {
      setSelectedSnippet({ ...selectedSnippet, code });
    } else if (showNewSnippetForm) {
      setNewSnippet(prev => ({ ...prev, code: code ?? '' }));
    }
  };

  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    setShowTagSuggestions(true);
  };

  // Add tag to new snippet
  const handleAddTag = (tag: string) => {
    if (!newSnippet.tags.includes(tag)) {
      setNewSnippet(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // Remove tag from new snippet
  const handleRemoveTag = (tagToRemove: string) => {
    setNewSnippet(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(prev => prev.filter(t => t !== tag));
    } else {
      setFilterTags(prev => [...prev, tag]);
    }
  };

  // Copy snippet to clipboard
  const handleCopySnippet = (snippet: Snippet) => {
    navigator.clipboard.writeText(snippet.code)
      .then(() => showNotification('Code copied to clipboard!', 'success'))
      .catch(() => showNotification('Failed to copy code', 'error'));
  };

  // Download snippet as file
  const handleDownloadSnippet = (snippet: Snippet) => {
    const blob = new Blob([snippet.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snippet.title}.${snippet.programmingLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Snippet downloaded!', 'success');
  };

  // Handle folder operations
  const handleCreateFolder = async (name: string, parentFolder: string | null) => {
    try {
      const newFolder = await createFolder(name, parentFolder);
      setFolders(prev => [...prev, newFolder]);
      showNotification('Folder created successfully!', 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('Failed to create folder. Please try again.', 'error');
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    try {
      const updatedFolder = await updateFolder(id, name);
      setFolders(prev => prev.map(f => f._id === id ? updatedFolder : f));
      showNotification('Folder updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating folder:', error);
      showNotification('Failed to update folder. Please try again.', 'error');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder(id);
      setFolders(prev => prev.filter(f => f._id !== id));
      if (selectedFolder === id) {
        setSelectedFolder(null);
      }
      showNotification('Folder deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting folder:', error);
      showNotification('Failed to delete folder. Please try again.', 'error');
    }
  };

  // Handle snippet selection
  const handleSelectSnippet = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    setShowNewSnippetForm(false);
  };

  // Handle edit snippet
  const handleEditSnippet = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    setNewSnippet({
      title: snippet.title,
      code: snippet.code,
      programmingLanguage: snippet.programmingLanguage,
      description: snippet.description,
      tags: snippet.tags,
      folder: snippet.folder,
      updatedAt: new Date()
    });
    setShowNewSnippetForm(true);
  };

  // Create new snippet form
  const handleShowNewSnippetForm = () => {
    console.log('handleShowNewSnippetForm called with selectedFolder:', selectedFolder);
    // Reset form state when opening the form
    const newSnippetData = {
      title: '',
      code: '',
      programmingLanguage: 'javascript',
      description: '',
      tags: [],
      folder: selectedFolder,
      updatedAt: new Date()
    };
    
    // Set these in this specific order to avoid race conditions
    setSelectedSnippet(null);
    setNewSnippet(newSnippetData);
    setShowNewSnippetForm(true);
    console.log('showNewSnippetForm set to true with folder:', selectedFolder);
  };

  // Load selected environment from localStorage on initial load
  useEffect(() => {
    const savedEnvironmentId = localStorage.getItem('selectedPythonEnvironmentId');
    if (savedEnvironmentId) {
      console.log('Loading saved environment from localStorage:', savedEnvironmentId);
      setSelectedPythonEnvironmentId(savedEnvironmentId);
    }
  }, []);

  // Handle environment selection
  const handleEnvironmentSelect = (envId: string | null) => {
    console.log('Environment selected in App component:', envId);
    
    // Save to localStorage
    if (envId) {
      console.log('Saving environment to localStorage:', envId);
      localStorage.setItem('selectedPythonEnvironmentId', envId);
    } else {
      console.log('Removing environment from localStorage');
      localStorage.removeItem('selectedPythonEnvironmentId');
    }
    
    // Update state and trigger re-renders
    setSelectedPythonEnvironmentId(envId);
    setEnvironmentUpdated(prev => !prev);
    
    // Force an update to any components that need to respond to environment changes
    setTimeout(() => {
      console.log('Refreshing components after environment change');
      setEnvironmentUpdated(prev => !prev);
      
      // Log current state after update
      console.log('Environment state after update:', {
        selectedPythonEnvironmentId: envId,
        storedId: localStorage.getItem('selectedPythonEnvironmentId'),
        updated: !environmentUpdated
      });
    }, 100);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <button
          title="Home"
          className="icon-button mr-2"
          onClick={() => window.location.href = '/'}
        >
          <FaHome />
        </button>
        <h1>Code Snippet Manager</h1>
        <div className="header-controls">
          <button
            title="Toggle dark mode"
            className="icon-button"
            onClick={toggleDarkMode}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <div className="flex h-screen bg-white">
        {/* Sidebar with folder tree */}
        <div className="w-72 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-semibold">Folders</h1>
            <button
              onClick={() => {
                const name = prompt('Enter folder name:');
                if (name?.trim()) {
                  handleCreateFolder(name.trim(), null);
                }
              }}
              className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Create new folder"
            >
              <FaPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="folder-tree-container">
            <FolderTree
              folders={folders}
              snippets={snippets}
              selectedFolder={selectedFolder}
              selectedSnippet={selectedSnippet ? selectedSnippet._id : null}
              onSelectFolder={setSelectedFolder}
              onSelectSnippet={handleSelectSnippet}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
              onCreateSnippet={handleShowNewSnippetForm}
              onDeleteSnippet={handleDeleteSnippet}
              onEditSnippet={handleEditSnippet}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top bar with actions */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={handleShowNewSnippetForm}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-600 transition-colors"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>Create New Snippet</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative w-72">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <PythonEnvironmentSelector 
                selectedEnvironmentId={selectedPythonEnvironmentId}
                onEnvironmentSelect={handleEnvironmentSelect}
              />
            </div>
          </div>

          {/* Snippets list or editor */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {error ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-red-500">{error}</div>
            ) : showNewSnippetForm ? (
              // Prioritize showing the new snippet form
              <div className="bg-white rounded-lg shadow-sm p-6">
                <SnippetEditor
                  key="snippet-editor-new"
                  showNewSnippetForm={showNewSnippetForm}
                  selectedSnippet={selectedSnippet}
                  newSnippet={newSnippet}
                  folders={folders}
                  isLoading={isLoading}
                  onUpdateSnippet={handleUpdateSnippet}
                  onCreateSnippet={handleCreateSnippet}
                  onEditSnippet={handleEditSnippet}
                  setNewSnippet={setNewSnippet}
                  setShowNewSnippetForm={setShowNewSnippetForm}
                  setSelectedSnippet={setSelectedSnippet}
                  selectedPythonEnvironmentId={selectedPythonEnvironmentId}
                  environmentUpdated={environmentUpdated}
                  onDeleteSnippet={handleDeleteSnippet}
                />
              </div>
            ) : isLoading && !selectedSnippet ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedSnippet ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <SnippetEditor
                  key={`snippet-editor-${selectedSnippet._id}`}
                  showNewSnippetForm={false}
                  selectedSnippet={selectedSnippet}
                  newSnippet={newSnippet}
                  folders={folders}
                  isLoading={isLoading}
                  onUpdateSnippet={handleUpdateSnippet}
                  onCreateSnippet={handleCreateSnippet}
                  onEditSnippet={handleEditSnippet}
                  setNewSnippet={setNewSnippet}
                  setShowNewSnippetForm={setShowNewSnippetForm}
                  setSelectedSnippet={setSelectedSnippet}
                  selectedPythonEnvironmentId={selectedPythonEnvironmentId}
                  environmentUpdated={environmentUpdated}
                  onDeleteSnippet={handleDeleteSnippet}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSnippets.length > 0 ? (
                  filteredSnippets.map((snippet) => (
                    <div
                      key={snippet._id}
                      className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectSnippet(snippet)}
                    >
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">{snippet.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{snippet.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {snippet.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <p className="mb-4">No snippets found</p>
                    <button
                      onClick={handleShowNewSnippetForm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create New Snippet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 
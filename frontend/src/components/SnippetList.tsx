import React, { useMemo } from 'react';
import { Snippet } from '../types';
import { useApp } from '../context/AppContext';

interface SnippetListProps {
  snippets: Snippet[];
  onSelectSnippet: (snippet: Snippet) => void;
}

export const SnippetList: React.FC<SnippetListProps> = ({ snippets, onSelectSnippet }) => {
  const { searchQuery, sortBy } = useApp();

  const filteredAndSortedSnippets = useMemo(() => {
    let filtered = snippets;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = snippets.filter(snippet => 
        snippet.title.toLowerCase().includes(query) ||
        snippet.description.toLowerCase().includes(query) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [snippets, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {filteredAndSortedSnippets.map(snippet => (
        <div
          key={snippet._id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectSnippet(snippet)}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{snippet.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{snippet.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {snippet.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {new Date(snippet.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}; 
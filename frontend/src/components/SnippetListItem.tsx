import React from 'react';
import { Snippet } from '../types';

interface SnippetListItemProps {
  snippet: Snippet;
  isSelected: boolean;
  darkMode: boolean;
  onSelect: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
}

export const SnippetListItem: React.FC<SnippetListItemProps> = ({
  snippet,
  isSelected,
  darkMode,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? darkMode
            ? 'bg-indigo-600 text-white'
            : 'bg-indigo-100 text-indigo-900'
          : darkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-white hover:bg-gray-50'
      }`}
      onClick={() => onSelect(snippet)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{snippet.title}</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {snippet.description}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(snippet._id);
          }}
          className={`text-sm px-2 py-1 rounded ${
            darkMode
              ? 'text-red-400 hover:bg-red-900/20'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          Delete
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {snippet.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-1 rounded ${
              darkMode
                ? 'bg-gray-600 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {new Date(snippet.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import Split from 'react-split';
import { Snippet } from '../types';
import { Folder } from '../services/folderService';
import { FaFolder, FaFolderOpen, FaCode, FaPlus, FaEdit, FaTrash, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import '../styles/Split.css';

interface FolderTreeProps {
  folders: Folder[];
  snippets: Snippet[];
  selectedFolder: string | null;
  selectedSnippet: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectSnippet: (snippet: Snippet) => void;
  onCreateFolder: (name: string, parentFolder: string | null) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateSnippet: () => void;
  onDeleteSnippet: (id: string) => void;
  onEditSnippet: (snippet: Snippet) => void;
}

interface FolderNodeProps extends Omit<FolderTreeProps, 'folders'> {
  folder: Folder;
  folders: Folder[];
  level: number;
  snippetToDelete: string | null;
  setSnippetToDelete: (id: string | null) => void;
  folderToDelete: string | null;
  setFolderToDelete: (id: string | null) => void;
}

const ConfirmationDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  folders,
  snippets,
  level,
  selectedFolder,
  selectedSnippet,
  onSelectFolder,
  onSelectSnippet,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onCreateSnippet,
  onDeleteSnippet,
  onEditSnippet,
  snippetToDelete,
  setSnippetToDelete,
  folderToDelete,
  setFolderToDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const childFolders = folders.filter(f => f.parentFolder === folder._id);
  const folderSnippets = snippets.filter(s => s.folder === folder._id);
  const hasChildren = childFolders.length > 0 || folderSnippets.length > 0;

  const handleToggle = () => setIsExpanded(!isExpanded);

  const handleSelect = () => onSelectFolder(folder._id);

  const handleEdit = () => {
    setIsEditing(true);
    setNewName(folder.name);
  };

  const handleSave = () => {
    if (newName.trim()) {
      onUpdateFolder(folder._id, newName.trim());
      setIsEditing(false);
    }
  };

  const handleCreateSubfolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), folder._id);
      setNewFolderName('');
      setShowNewFolderInput(false);
      setIsExpanded(true);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center p-1 hover:bg-gray-100 ${
          selectedFolder === folder._id ? 'bg-blue-100' : ''
        }`}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        <button onClick={handleToggle} className="p-1">
          {hasChildren ? (
            isExpanded ? (
              <FaChevronDown className="w-4 h-4" />
            ) : (
              <FaChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>
        {isExpanded ? <FaFolderOpen className="w-5 h-5 text-gray-500 mr-1" /> : <FaFolder className="w-5 h-5 text-gray-500 mr-1" />}
        {isEditing ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="border rounded px-1 py-0.5 text-sm"
            autoFocus
          />
        ) : (
          <>
            <span
              onClick={handleSelect}
              className="flex-grow cursor-pointer truncate"
              title={folder.name}
            >
              {folder.name}
            </span>
            <div className="flex space-x-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewFolderInput(true);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Create subfolder"
              >
                <FaPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleEdit}
                className="p-1 hover:bg-gray-200 rounded"
                title="Rename folder"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderToDelete(folder._id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="Delete folder"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
      {showNewFolderInput && (
        <div
          className="flex items-center p-1"
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          <FaFolder className="w-5 h-5 text-gray-500 mr-1" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => setShowNewFolderInput(false)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSubfolder()}
            className="border rounded px-1 py-0.5 text-sm"
            placeholder="New folder name"
            autoFocus
          />
        </div>
      )}
      {isExpanded && hasChildren && (
        <div>
          {childFolders.map((childFolder) => (
            <FolderNode
              key={childFolder._id}
              folder={childFolder}
              folders={folders}
              snippets={snippets}
              level={level + 1}
              selectedFolder={selectedFolder}
              selectedSnippet={selectedSnippet}
              onSelectFolder={onSelectFolder}
              onSelectSnippet={onSelectSnippet}
              onCreateFolder={onCreateFolder}
              onUpdateFolder={onUpdateFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateSnippet={onCreateSnippet}
              onDeleteSnippet={onDeleteSnippet}
              onEditSnippet={onEditSnippet}
              snippetToDelete={snippetToDelete}
              setSnippetToDelete={setSnippetToDelete}
              folderToDelete={folderToDelete}
              setFolderToDelete={setFolderToDelete}
            />
          ))}
          {folderSnippets.map((snippet) => (
            <div
              key={snippet._id}
              className={`flex items-center p-2 rounded cursor-pointer ${
                selectedSnippet === snippet._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={{ paddingLeft: `${(level + 1) * 12}px` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSnippet(snippet);
              }}
            >
              <div className="flex items-center flex-grow min-w-0">
                <FaCode className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate" title={snippet.title}>{snippet.title}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSnippet(snippet);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnippetToDelete(snippet._id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  snippets,
  selectedFolder,
  selectedSnippet,
  onSelectFolder,
  onSelectSnippet,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onCreateSnippet,
  onDeleteSnippet,
  onEditSnippet,
}) => {
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [unorganizedExpanded, setUnorganizedExpanded] = useState(true);
  const [snippetToDelete, setSnippetToDelete] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const rootFolders = folders.filter(f => !f.parentFolder);
  const unorganizedSnippets = snippets.filter(s => !s.folder);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), null);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleUnorganized = () => setUnorganizedExpanded(exp => !exp);

  const renderFolderContents = (folder: Folder) => {
    const childFolders = folders.filter(f => f.parentFolder === folder._id);
    const folderSnippets = snippets.filter(s => s.folder === folder._id);
    const isExpanded = expandedFolders.has(folder._id);

    return (
      <FolderNode
        key={folder._id}
        folder={folder}
        folders={folders}
        snippets={snippets}
        level={0}
        selectedFolder={selectedFolder}
        selectedSnippet={selectedSnippet}
        onSelectFolder={onSelectFolder}
        onSelectSnippet={onSelectSnippet}
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
        onCreateSnippet={onCreateSnippet}
        onDeleteSnippet={onDeleteSnippet}
        onEditSnippet={onEditSnippet}
        snippetToDelete={snippetToDelete}
        setSnippetToDelete={setSnippetToDelete}
        folderToDelete={folderToDelete}
        setFolderToDelete={setFolderToDelete}
      />
    );
  };

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="p-4">
          {showNewFolderInput && (
            <div className="mb-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleCreateFolder}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Root folders */}
          <div className="space-y-1 mb-4">
            {rootFolders.map(folder => renderFolderContents(folder))}
          </div>

          {/* Unorganized folder node */}
          <div className="mt-4">
            <div
              className={`flex items-center p-2 rounded cursor-pointer mb-1 ${selectedFolder === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => onSelectFolder(null)}
            >
              <span onClick={e => { e.stopPropagation(); toggleUnorganized(); }} className="mr-2">
                {unorganizedExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </span>
              <span className="font-medium">Unorganized</span>
            </div>
            {unorganizedExpanded && (
              <div className="ml-6">
                {unorganizedSnippets.map(snippet => (
                  <div
                    key={snippet._id}
                    className={`flex items-center p-2 rounded cursor-pointer ${selectedSnippet === snippet._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectSnippet(snippet);
                    }}
                  >
                    <div className="flex items-center flex-grow min-w-0">
                      <FaCode className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate" title={snippet.title}>{snippet.title}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onEditSnippet(snippet);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSnippetToDelete(snippet._id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={!!snippetToDelete}
        title="Delete Snippet"
        message="Are you sure you want to delete this snippet? This action cannot be undone."
        onConfirm={() => {
          if (snippetToDelete) onDeleteSnippet(snippetToDelete);
          setSnippetToDelete(null);
        }}
        onCancel={() => setSnippetToDelete(null)}
      />
      <ConfirmationDialog
        open={!!folderToDelete}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? This action cannot be undone."
        onConfirm={() => {
          if (folderToDelete) onDeleteFolder(folderToDelete);
          setFolderToDelete(null);
        }}
        onCancel={() => setFolderToDelete(null)}
      />
    </>
  );
};
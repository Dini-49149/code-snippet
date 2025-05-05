import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FaPlus, FaPlay, FaTimes, FaCompress, FaExpand, FaTrash } from 'react-icons/fa';
import { Snippet } from '../types';
import { Folder } from '../services/folderService';
import { codeExecutionService } from '../services/codeExecutionService';
import { PythonEnvironmentManager } from './PythonEnvironmentManager';
import { CodeEditor } from './CodeEditor';

interface ValidationField {
  isValid: boolean;
  message?: string;
}

interface SnippetValidation {
  title: ValidationField;
  code: ValidationField;
  description: ValidationField;
}

interface SnippetEditorProps {
  showNewSnippetForm: boolean;
  selectedSnippet: Snippet | null;
  newSnippet: Omit<Snippet, '_id' | 'createdAt'>;
  folders: Folder[];
  isLoading: boolean;
  onUpdateSnippet: (snippet: Snippet) => void;
  onCreateSnippet: () => void;
  onEditSnippet: (snippet: Snippet) => void;
  setNewSnippet: (snippet: Omit<Snippet, '_id' | 'createdAt'>) => void;
  setShowNewSnippetForm: (show: boolean) => void;
  setSelectedSnippet: (snippet: Snippet | null) => void;
  selectedPythonEnvironmentId: string | null;
  environmentUpdated: boolean;
  onExitFullscreen?: () => void;
  onDeleteSnippet: (id: string) => void;
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

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

export const SnippetEditor: React.FC<SnippetEditorProps> = ({
  showNewSnippetForm,
  selectedSnippet,
  newSnippet,
  folders,
  isLoading,
  onUpdateSnippet,
  onCreateSnippet,
  onEditSnippet,
  setNewSnippet,
  setShowNewSnippetForm,
  setSelectedSnippet,
  selectedPythonEnvironmentId,
  environmentUpdated,
  onExitFullscreen,
  onDeleteSnippet,
}) => {
  const [validation, setValidation] = useState<SnippetValidation>({
    title: { isValid: true },
    code: { isValid: true },
    description: { isValid: true }
  });
  const [executionResult, setExecutionResult] = useState<{ 
    output: string; 
    error?: string; 
    stderr?: string; 
    executionTime?: number;
    environment?: {
      python?: boolean;
      packages?: string[];
      virtualEnv?: boolean;
      name?: string;
      packageInstallResults?: string[];
    }
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stdinInput, setStdinInput] = useState<string>('');
  const [showExecutionOptions, setShowExecutionOptions] = useState<boolean>(false);
  const [pythonPackages, setPythonPackages] = useState<string>('');
  const [useVirtualEnv, setUseVirtualEnv] = useState<boolean>(false);
  const [environmentsChanged, setEnvironmentsChanged] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't reset the form state on unmount, as this can conflict with state changes
      // setShowNewSnippetForm(false);
      // setSelectedSnippet(null);
      // setNewSnippet({
      //   title: '',
      //   code: '',
      //   programmingLanguage: 'javascript',
      //   description: '',
      //   tags: [],
      //   folder: null,
      //   updatedAt: new Date()
      // });
    };
  }, []);

  useEffect(() => {
    // Log when form state changes
    if (showNewSnippetForm) {
      console.log('Form state:', {
        newSnippet,
        selectedSnippet,
        showNewSnippetForm
      });
    }
  }, [newSnippet, selectedSnippet, showNewSnippetForm]);

  // Add debug logging to see component props
  useEffect(() => {
    console.log('SnippetEditor rendered with props:', {
      showNewSnippetForm,
      selectedSnippet: selectedSnippet ? 'Present' : 'Not present',
      newSnippet,
      isLoading
    });
  }, [showNewSnippetForm, selectedSnippet, newSnippet, isLoading]);

  // Force re-render when showNewSnippetForm changes
  useEffect(() => {
    console.log('showNewSnippetForm changed to:', showNewSnippetForm);
    
    // If form is shown, make sure we have a clean state
    if (showNewSnippetForm && !selectedSnippet) {
      console.log('Form shown with clean state');
    }
  }, [showNewSnippetForm, selectedSnippet]);

  // Effect to clear execution results when the environment changes
  useEffect(() => {
    if (executionResult && selectedSnippet?.programmingLanguage === 'python') {
      setExecutionResult(null);
    }
  }, [environmentUpdated, selectedSnippet]);

  const validateForm = (): boolean => {
    console.log('Validating form with data:', newSnippet);
    const newValidation: SnippetValidation = {
      title: { isValid: true },
      code: { isValid: true },
      description: { isValid: true }
    };

    if (!newSnippet.title.trim()) {
      newValidation.title = { isValid: false, message: 'Title is required' };
    } else if (newSnippet.title.length > MAX_TITLE_LENGTH) {
      newValidation.title = { isValid: false, message: `Title must be less than ${MAX_TITLE_LENGTH} characters` };
    }

    if (!newSnippet.code.trim()) {
      newValidation.code = { isValid: false, message: 'Code is required' };
    }

    if (newSnippet.description.length > MAX_DESCRIPTION_LENGTH) {
      newValidation.description = { isValid: false, message: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` };
    }

    console.log('Validation result:', newValidation);
    setValidation(newValidation);
    return Object.values(newValidation).every((field: ValidationField) => field.isValid);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      console.log('Form validation failed', validation);
      return;
    }

    console.log('Form is valid, submitting...', selectedSnippet ? 'update' : 'create');

    if (selectedSnippet) {
      // Ensure we have the latest state before updating
      const updatedSnippet = {
        ...selectedSnippet,
        ...newSnippet,
        updatedAt: new Date()
      };
      onUpdateSnippet(updatedSnippet);
    } else {
      onCreateSnippet();
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setNewSnippet({ 
      ...newSnippet, 
      code: value ?? '',
      updatedAt: new Date()
    });
  };

  // Handle code execution
  const handleRunCode = async () => {
    if (!selectedSnippet) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      let result;
      
      // Handle JavaScript execution locally for demo purposes
      if (selectedSnippet.programmingLanguage === 'javascript') {
        result = codeExecutionService.executeJavaScriptLocally(selectedSnippet.code, stdinInput);
      } 
      // Python with environment selection
      else if (selectedSnippet.programmingLanguage === 'python') {
        result = await codeExecutionService.execute({
          code: selectedSnippet.code,
          language: selectedSnippet.programmingLanguage,
          stdin: stdinInput,
          pythonEnvironmentId: selectedPythonEnvironmentId || undefined
        });
      }
      // For other languages, use the backend execution service
      else {
        result = await codeExecutionService.execute({
          code: selectedSnippet.code, 
          language: selectedSnippet.programmingLanguage,
          stdin: stdinInput
        });
      }
      
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (showNewSnippetForm) {
    console.log('Rendering snippet form');
    return (
      <>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {selectedSnippet ? 'Edit Snippet' : 'Create New Snippet'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">Title</label>
            <input
              type="text"
              placeholder="Enter snippet title"
              value={newSnippet.title}
              onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value.slice(0, MAX_TITLE_LENGTH) })}
              className={`w-full p-2 rounded border ${!validation.title.isValid ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {!validation.title.isValid && (
              <p className="mt-1 text-sm text-red-500">{validation.title.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{newSnippet.title.length}/{MAX_TITLE_LENGTH}</p>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Programming Language</label>
            <select
              value={newSnippet.programmingLanguage}
              onChange={(e) => setNewSnippet({ ...newSnippet, programmingLanguage: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="cpp">C++</option>
              <option value="ruby">Ruby</option>
              <option value="php">PHP</option>
              <option value="swift">Swift</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Description</label>
            <textarea
              placeholder="Enter snippet description"
              value={newSnippet.description}
              onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH) })}
              className={`w-full p-2 rounded border ${!validation.description.isValid ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={3}
            />
            {!validation.description.isValid && (
              <p className="mt-1 text-sm text-red-500">{validation.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{newSnippet.description.length}/{MAX_DESCRIPTION_LENGTH}</p>
          </div>

          <div className="code-input mb-6">
            <label className="block text-gray-700 mb-2">Code</label>
            <div className="relative">
              <div className="code-editor-card">
                <CodeEditor
                  snippet={{
                    code: newSnippet.code,
                    programmingLanguage: newSnippet.programmingLanguage
                  }}
                  onCodeChange={handleEditorChange}
                  isFullscreen={false}
                />
              </div>
            </div>
            {!validation.code.isValid && (
              <p className="text-red-500 text-sm mt-1">{validation.code.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Folder</label>
            <select
              value={newSnippet.folder ?? ''}
              onChange={(e) => setNewSnippet({ ...newSnippet, folder: e.target.value || null })}
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No folder</option>
              {folders.map(folder => (
                <option key={folder._id} value={folder._id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                console.log('Cancel button clicked');
                setShowNewSnippetForm(false);
                setSelectedSnippet(null);
                setNewSnippet({
                  title: '',
                  code: '',
                  programmingLanguage: 'javascript',
                  description: '',
                  tags: [],
                  folder: null,
                  updatedAt: new Date()
                });
              }}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Create/Save button clicked');
                handleSubmit();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : selectedSnippet ? 'Save Changes' : 'Create Snippet'}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (selectedSnippet) {
    // Create a simpler button container to handle button display when in fullscreen
    const ControlButtons = () => {
      if (!selectedSnippet) return null;
      
      return (
        <div 
          className="control-buttons-container" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            marginBottom: '1rem',
            position: 'relative',
            zIndex: 50,
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <h3 className="text-xl font-semibold text-gray-800">{selectedSnippet.title}</h3>
          <div className="snippet-action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleRunCode}
              className="action-button run-button px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center"
              disabled={isExecuting}
            >
              <FaPlay className="mr-1 w-3 h-3" />
              {isExecuting ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={() => onEditSnippet(selectedSnippet)}
              className="action-button edit-button px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setSelectedSnippet(null)}
              className="action-button close-button px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Close
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="action-button delete-button px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center"
            >
              <FaTrash className="mr-1 w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 snippet-editor-container">
        {/* Always render the control buttons separately */}
        <div className="mb-4"><ControlButtons /></div>
        
        {selectedSnippet.description && (
          <p className="text-gray-600 mt-2 mb-4">{selectedSnippet.description}</p>
        )}
        
        {selectedSnippet.tags && selectedSnippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSnippet.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">
              Standard Input (stdin)
            </label>
            <textarea
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="Enter input values here, one per line..."
              className="w-full p-2 border rounded text-sm font-mono"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Each line will be provided as input when the program requests it
            </p>
          </div>
        </div>
        
        <div className="editor-container" style={{
          position: 'relative',
          width: '100%',
          margin: '0',
          padding: '0',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}>
          <div className="relative">
            <div className="code-editor-card">
              <CodeEditor 
                snippet={selectedSnippet}
                onCodeChange={(code) => {
                  if (selectedSnippet && code !== undefined) {
                    setSelectedSnippet({ ...selectedSnippet, code });
                  }
                }}
                isFullscreen={false}
              />
            </div>
          </div>
        </div>

        {executionResult && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Execution Result</h4>
              {executionResult.executionTime && (
                <span className="text-xs text-gray-500">
                  Executed in {executionResult.executionTime.toFixed(2)}ms
                </span>
              )}
            </div>
            
            {/* Environment info for Python */}
            {executionResult.environment && executionResult.environment.python && (
              <div className="mb-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <p className="font-semibold">Environment:</p>
                <p>Python {executionResult.environment.virtualEnv ? 'virtual environment' : 'interpreter'}</p>
                {executionResult.environment.name && (
                  <p>Name: {executionResult.environment.name}</p>
                )}
                {executionResult.environment.packages && executionResult.environment.packages.length > 0 && (
                  <p>Packages: {executionResult.environment.packages.join(', ')}</p>
                )}
                
                {/* Show package installation results if available */}
                {executionResult.environment.packageInstallResults && executionResult.environment.packageInstallResults.length > 0 && (
                  <div className="mt-1">
                    <p className="font-semibold">Package Installation:</p>
                    <div className="max-h-20 overflow-y-auto bg-gray-50 p-1 rounded text-xs">
                      {executionResult.environment.packageInstallResults.map((result, index) => (
                        <div key={index} className={result.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="border rounded-lg p-4 bg-gray-50 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-64">
              {executionResult.error ? (
                <div className="text-red-600">{executionResult.error}</div>
              ) : executionResult.stderr && executionResult.stderr.trim() ? (
                <div>
                  <div className="text-gray-700 mb-2">{executionResult.output}</div>
                  <div className="text-yellow-600 border-t pt-2 mt-2">
                    <div className="font-bold mb-1">Standard Error:</div>
                    {executionResult.stderr}
                  </div>
                </div>
              ) : executionResult.output ? (
                <div>{executionResult.output}</div>
              ) : (
                <div className="text-gray-500 italic">No output</div>
              )}
            </div>
          </div>
        )}
        <ConfirmationDialog
          open={showDeleteDialog}
          title="Delete Snippet"
          message="Are you sure you want to delete this snippet? This action cannot be undone."
          onConfirm={() => {
            if (selectedSnippet) onDeleteSnippet(selectedSnippet._id);
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-gray-500 mb-4">Select a snippet to view or create a new one</p>
      <button
        onClick={() => {
          console.log('Create button clicked in SnippetEditor');
          // Force immediate UI update and then set the form state
          setTimeout(() => {
            setShowNewSnippetForm(true);
            console.log('setShowNewSnippetForm(true) called from SnippetEditor');
          }, 0);
        }}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <FaPlus className="mr-2" /> Create New Snippet
      </button>
    </div>
  );
}; 
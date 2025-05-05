import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave } from 'react-icons/fa';
import { PythonEnvironment, pythonEnvironmentService } from '../services/pythonEnvironmentService';

interface PythonEnvironmentManagerProps {
  selectedEnvironmentId: string | null;
  onEnvironmentSelect: (envId: string | null) => void;
  onEnvironmentChange: () => void;
}

export const PythonEnvironmentManager: React.FC<PythonEnvironmentManagerProps> = ({
  selectedEnvironmentId,
  onEnvironmentSelect,
  onEnvironmentChange
}) => {
  const [environments, setEnvironments] = useState<PythonEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEnvironmentId, setEditingEnvironmentId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPackages, setFormPackages] = useState('');

  // Load environments on component mount
  useEffect(() => {
    console.log('Environment Manager mounted, loading environments');
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const envs = await pythonEnvironmentService.getEnvironments();
      console.log('Environment Manager - Environments loaded:', envs.length, envs);
      
      // Ensure each environment has an id field (handle _id from MongoDB)
      const processedEnvs = envs.map(env => {
        if (!env.id && (env as any)._id) {
          return {
            ...env,
            id: (env as any)._id
          };
        }
        return env;
      });
      
      setEnvironments(processedEnvs);
      
      // If no environment is selected but we have environments, select the first one
      if (!selectedEnvironmentId && processedEnvs.length > 0) {
        console.log('Auto-selecting first environment:', processedEnvs[0].name);
        onEnvironmentSelect(processedEnvs[0].id);
      }
    } catch (err) {
      setError('Failed to load Python environments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPackages('');
    setShowAddForm(false);
    setEditingEnvironmentId(null);
  };

  const handleAddEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName.trim()) {
      setError('Environment name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const packagesArray = formPackages
      .split('\n')
      .map(pkg => pkg.trim())
      .filter(pkg => pkg);
    
    try {
      const newEnv = await pythonEnvironmentService.createEnvironment({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        packages: packagesArray
      });
      
      if (newEnv) {
        console.log('Created new environment:', newEnv);
        resetForm();
        await loadEnvironments();
        onEnvironmentChange();
        
        // Select the new environment
        onEnvironmentSelect(newEnv.id);
      } else {
        setError('Failed to create environment');
      }
    } catch (err) {
      setError('Failed to create environment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEnvironmentId || !formName.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const packagesArray = formPackages
      .split('\n')
      .map(pkg => pkg.trim())
      .filter(pkg => pkg);
    
    try {
      const updatedEnv = await pythonEnvironmentService.updateEnvironment(
        editingEnvironmentId,
        {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          packages: packagesArray
        }
      );
      
      if (updatedEnv) {
        console.log('Updated environment:', updatedEnv);
        resetForm();
        await loadEnvironments();
        onEnvironmentChange();
      } else {
        setError('Failed to update environment');
      }
    } catch (err) {
      setError('Failed to update environment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEnvironment = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this environment?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await pythonEnvironmentService.deleteEnvironment(id);
      
      if (success) {
        console.log('Deleted environment with ID:', id);
        // If the deleted environment was selected, clear the selection
        if (selectedEnvironmentId === id) {
          onEnvironmentSelect(null);
        }
        
        await loadEnvironments();
        onEnvironmentChange();
      } else {
        setError('Failed to delete environment');
      }
    } catch (err) {
      setError('Failed to delete environment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEnvironment = (env: PythonEnvironment, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFormName(env.name);
    setFormDescription(env.description || '');
    setFormPackages(env.packages.join('\n'));
    setEditingEnvironmentId(env.id);
    setShowAddForm(true);
  };
  
  const handleRadioChange = (envId: string) => {
    console.log('Environment selection changed in manager to:', envId);
    onEnvironmentSelect(envId);
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Python Environments</h3>
        
        {!showAddForm && (
          <button
            onClick={handleShowAddForm}
            className="px-2 py-1 bg-blue-600 text-white rounded text-sm flex items-center"
            disabled={isLoading}
            type="button"
          >
            <FaPlus className="mr-1" /> New Environment
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      {showAddForm && (
        <form 
          className="bg-gray-50 p-4 rounded-lg mb-4"
          onSubmit={editingEnvironmentId ? handleUpdateEnvironment : handleAddEnvironment}
        >
          <h4 className="font-medium mb-2">
            {editingEnvironmentId ? 'Edit Environment' : 'Create New Environment'}
          </h4>
          
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Data Science, Web Development, etc."
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Brief description of this environment"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">
              Packages (one per line)
            </label>
            <textarea
              value={formPackages}
              onChange={(e) => setFormPackages(e.target.value)}
              className="w-full p-2 border rounded text-sm font-mono"
              rows={5}
              placeholder="numpy
pandas
matplotlib
scikit-learn"
            />
            <p className="text-xs text-gray-500 mt-1">
              These packages will be installed in the virtual environment
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded flex items-center"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (
                <>
                  <FaSave className="mr-1" />
                  {editingEnvironmentId ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
      
      <div className="space-y-2">
        {environments.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            {isLoading ? 'Loading environments...' : 'No Python environments found'}
          </div>
        ) : (
          environments.map((env) => (
            <div 
              key={env.id}
              className={`p-3 rounded-lg border ${selectedEnvironmentId === env.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="pythonEnvironment"
                        checked={selectedEnvironmentId === env.id}
                        onChange={() => handleRadioChange(env.id)}
                        className="mr-2"
                      />
                      <span className="font-medium">{env.name}</span>
                    </label>
                  </div>
                  
                  {env.description && (
                    <p className="text-sm text-gray-600 mt-1 ml-5">{env.description}</p>
                  )}
                  
                  {env.packages.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 ml-5">
                      Packages: {env.packages.join(', ')}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleEditEnvironment(env, e)}
                    className="p-1 text-gray-500 hover:text-blue-500"
                    title="Edit environment"
                    type="button"
                  >
                    <FaEdit size={14} />
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteEnvironment(env.id, e)}
                    className="p-1 text-gray-500 hover:text-red-500"
                    title="Delete environment"
                    type="button"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 
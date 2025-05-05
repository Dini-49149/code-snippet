import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaPlus, FaEdit, FaTrash, FaCog } from 'react-icons/fa';
import { PythonEnvironment, pythonEnvironmentService } from '../services/pythonEnvironmentService';
import { PythonEnvironmentManager } from './PythonEnvironmentManager';

interface PythonEnvironmentSelectorProps {
  selectedEnvironmentId: string | null;
  onEnvironmentSelect: (envId: string | null) => void;
}

export const PythonEnvironmentSelector: React.FC<PythonEnvironmentSelectorProps> = ({
  selectedEnvironmentId,
  onEnvironmentSelect,
}) => {
  const [environments, setEnvironments] = useState<PythonEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<PythonEnvironment | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load environments immediately on mount
  useEffect(() => {
    console.log('Component mounted, loading environments');
    loadEnvironments();
  }, []);

  // Effect to handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to update the selectedEnvironment when selectedEnvironmentId changes
  useEffect(() => {
    console.log('selectedEnvironmentId changed:', selectedEnvironmentId);
    
    if (!selectedEnvironmentId) {
      setSelectedEnvironment(null);
      return;
    }
    
    // Check if we already have this environment in our list
    const existingEnv = environments.find(env => {
      // Handle both id and _id fields for compatibility
      return (env.id === selectedEnvironmentId || 
              (env as any)._id === selectedEnvironmentId);
    });
    
    if (existingEnv) {
      console.log('Found environment in list:', existingEnv.name);
      setSelectedEnvironment(existingEnv);
    } else {
      // If not found in our list, fetch it directly
      pythonEnvironmentService.getEnvironmentById(selectedEnvironmentId)
        .then(env => {
          if (env) {
            console.log('Fetched environment directly:', env.name);
            setSelectedEnvironment(env);
            // Update our environments list
            setEnvironments(prev => [...prev.filter(e => e.id !== env.id), env]);
          } else {
            console.error('Environment not found after direct fetch');
            setSelectedEnvironment(null);
          }
        })
        .catch(err => {
          console.error('Error fetching environment by ID:', err);
          setSelectedEnvironment(null);
        });
    }
  }, [selectedEnvironmentId, environments]);

  const loadEnvironments = async () => {
    console.log('Loading environments');
    setIsLoading(true);
    try {
      const envs = await pythonEnvironmentService.getEnvironments();
      console.log('Environments loaded:', envs.length, envs);
      
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
      
      // If we have a selected environment ID, find the matching environment
      if (selectedEnvironmentId) {
        const env = processedEnvs.find(e => 
          e.id === selectedEnvironmentId || 
          (e as any)._id === selectedEnvironmentId
        );
        
        if (env) {
          console.log('Found selected environment:', env.name);
          setSelectedEnvironment(env);
        } else {
          console.warn('Selected environment not found in loaded environments');
        }
      }
    } catch (err) {
      console.error('Failed to load Python environments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    const newState = !isDropdownOpen;
    console.log(`Toggling dropdown to ${newState}`);
    
    // If opening the dropdown, reload environments
    if (newState) {
      loadEnvironments();
    }
    
    setIsDropdownOpen(newState);
    setShowEnvironmentManager(false);
  };

  const handleEnvironmentChange = () => {
    console.log('Environment changed, reloading...');
    loadEnvironments();
    setShowEnvironmentManager(false);
  };

  const getSelectedEnvironmentName = () => {
    if (selectedEnvironment) {
      return selectedEnvironment.name;
    }
    
    if (selectedEnvironmentId) {
      // We have an ID but no environment object yet
      const env = environments.find(e => e.id === selectedEnvironmentId);
      return env ? env.name : 'Loading...';
    }
    
    return 'No Environment';
  };

  const handleSelectEnvironment = (envId: string | null) => {
    console.log('Environment selected:', envId);
    
    if (envId) {
      const env = environments.find(e => e.id === envId);
      if (env) {
        console.log('Setting selected environment:', env.name);
        setSelectedEnvironment(env);
      } else {
        console.warn('Selected environment not found in list');
      }
    } else {
      console.log('Clearing selected environment');
      setSelectedEnvironment(null);
    }
    
    // Force immediate callback to parent
    onEnvironmentSelect(envId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center cursor-pointer border rounded-md px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
        onClick={toggleDropdown}
        data-testid="python-environment-selector"
      >
        <span className="mr-2">Python Environment:</span>
        <span className="font-medium" data-testid="selected-environment-name">{getSelectedEnvironmentName()}</span>
        <FaChevronDown className="ml-2 text-gray-500" />
      </div>

      {isDropdownOpen && (
        <div className="absolute right-0 z-10 mt-1 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {/* Environment Selection */}
            {!showEnvironmentManager && (
              <>
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  SELECT ENVIRONMENT
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  <div
                    className={`w-full text-left px-4 py-2 text-sm ${!selectedEnvironmentId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} hover:bg-gray-100 cursor-pointer`}
                    onClick={() => handleSelectEnvironment(null)}
                    data-testid="no-environment-option"
                  >
                    No Environment
                  </div>
                  
                  {environments.map((env) => (
                    <div
                      key={env.id}
                      className={`w-full text-left px-4 py-2 text-sm ${selectedEnvironmentId === env.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} hover:bg-gray-100 cursor-pointer`}
                      onClick={() => handleSelectEnvironment(env.id)}
                      data-testid={`environment-option-${env.id}`}
                    >
                      {env.name}
                      {env.packages.length > 0 && (
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Packages: {env.packages.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {environments.length === 0 && !isLoading && (
                    <div className="px-4 py-2 text-sm text-gray-500 italic">
                      No environments found
                    </div>
                  )}
                  
                  {isLoading && (
                    <div className="px-4 py-2 text-sm text-gray-500 italic">
                      Loading environments...
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <div
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  onClick={() => setShowEnvironmentManager(true)}
                  data-testid="manage-environments-button"
                >
                  <FaCog className="mr-2" /> Manage Environments
                </div>
              </>
            )}
            
            {/* Environment Manager */}
            {showEnvironmentManager && (
              <div className="p-3">
                <div
                  className="text-sm text-blue-600 mb-2 hover:underline cursor-pointer"
                  onClick={() => setShowEnvironmentManager(false)}
                >
                  ← Back to Environment Selection
                </div>
                
                <PythonEnvironmentManager
                  selectedEnvironmentId={selectedEnvironmentId}
                  onEnvironmentSelect={handleSelectEnvironment}
                  onEnvironmentChange={handleEnvironmentChange}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 
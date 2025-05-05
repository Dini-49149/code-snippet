import { API_ENDPOINTS, DEFAULT_HEADERS } from '../config/api';

export interface PythonEnvironment {
  id: string;
  name: string;
  description?: string;
  packages: string[];
  created: Date;
  lastUsed?: Date;
}

// Service for managing Python environments
export const pythonEnvironmentService = {
  // Get all environments
  getEnvironments: async (): Promise<PythonEnvironment[]> => {
    try {
      console.log('Fetching all Python environments');
      const response = await fetch(`${API_ENDPOINTS.PYTHON_ENVIRONMENTS}`, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        console.error(`Error fetching environments: ${response.status}`);
        throw new Error(`Error fetching environments: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.length} environments`);
      
      // Ensure each environment has an id field
      const processedData = data.map((env: any) => {
        // If we have _id but no id, create id from _id
        if (!env.id && env._id) {
          return {
            ...env,
            id: env._id
          };
        }
        return env;
      });
      
      return processedData;
    } catch (error) {
      console.error('Error fetching Python environments:', error);
      return [];
    }
  },

  // Get a single environment by ID
  getEnvironmentById: async (id: string): Promise<PythonEnvironment | null> => {
    try {
      console.log(`Fetching Python environment with ID: ${id}`);
      const response = await fetch(`${API_ENDPOINTS.PYTHON_ENVIRONMENT(id)}`, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Environment with ID ${id} not found`);
          return null;
        }
        console.error(`Error fetching environment: ${response.status}`);
        throw new Error(`Error fetching environment: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched environment: ${data.name}`);
      
      // Ensure the environment has an id field
      if (!data.id && data._id) {
        return {
          ...data,
          id: data._id
        };
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching Python environment ${id}:`, error);
      return null;
    }
  },

  // Create a new environment
  createEnvironment: async (environment: Omit<PythonEnvironment, 'id' | 'created'>): Promise<PythonEnvironment | null> => {
    try {
      console.log(`Creating new Python environment: ${environment.name}`);
      const response = await fetch(`${API_ENDPOINTS.PYTHON_ENVIRONMENTS}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(environment),
      });

      if (!response.ok) {
        console.error(`Error creating environment: ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error creating environment: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully created environment with ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('Error creating Python environment:', error);
      return null;
    }
  },

  // Update an existing environment
  updateEnvironment: async (id: string, updates: Partial<PythonEnvironment>): Promise<PythonEnvironment | null> => {
    try {
      console.log(`Updating Python environment with ID: ${id}`);
      const response = await fetch(`${API_ENDPOINTS.PYTHON_ENVIRONMENT(id)}`, {
        method: 'PUT',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error(`Error updating environment: ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error updating environment: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully updated environment: ${data.name}`);
      return data;
    } catch (error) {
      console.error('Error updating Python environment:', error);
      return null;
    }
  },

  // Delete an environment
  deleteEnvironment: async (id: string): Promise<boolean> => {
    try {
      console.log(`Deleting Python environment with ID: ${id}`);
      const response = await fetch(`${API_ENDPOINTS.PYTHON_ENVIRONMENT(id)}`, {
        method: 'DELETE',
        headers: DEFAULT_HEADERS,
      });

      if (response.ok) {
        console.log(`Successfully deleted environment with ID: ${id}`);
      } else {
        console.error(`Error deleting environment: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('Error deleting Python environment:', error);
      return false;
    }
  }
}; 
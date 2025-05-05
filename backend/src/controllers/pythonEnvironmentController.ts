import { Request, Response } from 'express';
import PythonEnvironment from '../models/pythonEnvironment';
import { createPythonVirtualEnv, deletePythonVirtualEnv } from '../services/pythonEnvironmentService';

// Helper function to transform environment document for frontend
const transformEnvironment = (env: any) => {
  return {
    id: env._id.toString(),
    name: env.name,
    description: env.description,
    packages: env.packages || [],
    created: env.created,
    lastUsed: env.lastUsed,
    isInstalled: env.isInstalled || false
  };
};

// Get all Python environments
export const getPythonEnvironments = async (req: Request, res: Response) => {
  try {
    const environments = await PythonEnvironment.find().sort({ name: 1 });
    // Transform environments for frontend
    const transformedEnvs = environments.map(env => transformEnvironment(env));
    res.status(200).json(transformedEnvs);
  } catch (error) {
    console.error('Error fetching Python environments:', error);
    res.status(500).json({ error: 'Failed to fetch Python environments' });
  }
};

// Get a single Python environment by ID
export const getPythonEnvironmentById = async (req: Request, res: Response) => {
  try {
    const environment = await PythonEnvironment.findById(req.params.id);
    
    if (!environment) {
      return res.status(404).json({ error: 'Python environment not found' });
    }
    
    // Transform environment for frontend
    const transformedEnv = transformEnvironment(environment);
    res.status(200).json(transformedEnv);
  } catch (error) {
    console.error('Error fetching Python environment:', error);
    res.status(500).json({ error: 'Failed to fetch Python environment' });
  }
};

// Create a new Python environment
export const createPythonEnvironment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { name, packages } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Environment name is required' });
    }
    
    // Create the environment document
    const newEnvironment = new PythonEnvironment({
      name,
      description: req.body.description,
      packages: packages || [],
      isInstalled: false
    });
    
    // Save the environment to the database first to get an ID
    const savedEnvironment = await newEnvironment.save();
    
    // Start the environment creation in the background
    createEnvironmentInBackground(savedEnvironment._id.toString(), packages || []);
    
    // Return the created environment immediately
    const transformedEnv = transformEnvironment(savedEnvironment);
    res.status(201).json(transformedEnv);
  } catch (error) {
    console.error('Error creating Python environment:', error);
    res.status(500).json({ error: 'Failed to create Python environment' });
  }
};

// Function to create environment in the background
const createEnvironmentInBackground = async (environmentId: string, packages: string[]) => {
  try {
    // Create the virtual environment
    console.log(`Creating virtual environment for ${environmentId} with packages:`, packages);
    const result = await createPythonVirtualEnv(environmentId, packages);
    
    if (result.success) {
      // Update the environment document with the virtual environment path
      await PythonEnvironment.findByIdAndUpdate(environmentId, {
        virtualEnvPath: result.envPath,
        isInstalled: true
      });
      console.log(`Successfully created virtual environment for ${environmentId}`);
    } else {
      // Update with error
      await PythonEnvironment.findByIdAndUpdate(environmentId, {
        installationError: result.error,
        isInstalled: false
      });
      console.error(`Failed to create virtual environment for ${environmentId}:`, result.error);
    }
  } catch (error) {
    console.error(`Error in background environment creation for ${environmentId}:`, error);
    // Update with error
    await PythonEnvironment.findByIdAndUpdate(environmentId, {
      installationError: error instanceof Error ? error.message : String(error),
      isInstalled: false
    });
  }
};

// Update a Python environment
export const updatePythonEnvironment = async (req: Request, res: Response) => {
  try {
    const { name, description, packages } = req.body;
    const environmentId = req.params.id;
    
    // Get existing environment to check for package changes
    const existingEnvironment = await PythonEnvironment.findById(environmentId);
    if (!existingEnvironment) {
      return res.status(404).json({ error: 'Python environment not found' });
    }
    
    // Check if packages have changed
    const packagesChanged = JSON.stringify(existingEnvironment.packages.sort()) !== 
                           JSON.stringify((packages || []).sort());
    
    // Update the environment
    const updateData: any = {
      name,
      description,
      packages,
      ...(req.body.lastUsed && { lastUsed: new Date() })
    };
    
    // If packages changed, set isInstalled to false to trigger reinstallation
    if (packagesChanged) {
      updateData.isInstalled = false;
      
      // Delete the existing virtual environment if it exists
      if (existingEnvironment.virtualEnvPath) {
        try {
          await deletePythonVirtualEnv(existingEnvironment.virtualEnvPath);
        } catch (error) {
          console.error('Error deleting existing virtual environment:', error);
          // Continue even if deletion fails
        }
      }
    }
    
    // Find and update the environment
    const updatedEnvironment = await PythonEnvironment.findByIdAndUpdate(
      environmentId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedEnvironment) {
      return res.status(404).json({ error: 'Python environment not found' });
    }
    
    // If packages changed, trigger reinstallation in background
    if (packagesChanged) {
      createEnvironmentInBackground(environmentId, packages || []);
    }
    
    // Transform environment for frontend
    const transformedEnv = transformEnvironment(updatedEnvironment);
    res.status(200).json(transformedEnv);
  } catch (error) {
    console.error('Error updating Python environment:', error);
    res.status(500).json({ error: 'Failed to update Python environment' });
  }
};

// Delete a Python environment
export const deletePythonEnvironment = async (req: Request, res: Response) => {
  try {
    const deletedEnvironment = await PythonEnvironment.findByIdAndDelete(req.params.id);
    
    if (!deletedEnvironment) {
      return res.status(404).json({ error: 'Python environment not found' });
    }
    
    // Delete the virtual environment if it exists
    if (deletedEnvironment.virtualEnvPath) {
      try {
        await deletePythonVirtualEnv(deletedEnvironment.virtualEnvPath);
      } catch (error) {
        console.error('Error deleting virtual environment:', error);
        // Continue even if deletion fails
      }
    }
    
    res.status(200).json({ message: 'Python environment deleted successfully' });
  } catch (error) {
    console.error('Error deleting Python environment:', error);
    res.status(500).json({ error: 'Failed to delete Python environment' });
  }
}; 
import mongoose from 'mongoose';
import PythonEnvironment from '../models/pythonEnvironment';
import { createPythonVirtualEnv } from '../services/pythonEnvironmentService';

// Seed data for Python environments
const pythonEnvironments = [
  {
    name: 'gen_ai',
    description: 'Environment for AI/ML development',
    packages: ['numpy', 'pandas', 'matplotlib', 'langchain', 'openai'],
    created: new Date(),
    isInstalled: false
  },
  {
    name: 'web_dev',
    description: 'Environment for web development',
    packages: ['flask', 'django', 'fastapi', 'sqlalchemy'],
    created: new Date(),
    isInstalled: false
  },
  {
    name: 'data_science',
    description: 'Environment for data science',
    packages: ['pandas', 'numpy', 'scipy', 'scikit-learn', 'matplotlib', 'seaborn'],
    created: new Date(),
    isInstalled: false
  }
];

// Seed the database with initial data
export const seedPythonEnvironments = async () => {
  try {
    // Check if there are existing environments
    const count = await PythonEnvironment.countDocuments();
    if (count === 0) {
      console.log('No Python environments found. Seeding database...');
      
      // Insert the environments
      const createdEnvironments = await PythonEnvironment.insertMany(pythonEnvironments);
      console.log('Python environments seeded successfully!');
      
      // Start installing the environments in the background
      console.log('Starting environment installations in the background...');
      
      createdEnvironments.forEach(async (env) => {
        try {
          console.log(`Installing environment: ${env.name} (${env._id})`);
          createPythonVirtualEnv(env._id.toString(), env.packages);
        } catch (error) {
          console.error(`Failed to start installation for environment ${env.name}:`, error);
        }
      });
    } else {
      console.log(`Found ${count} Python environments. Skipping seed.`);
      
      // Check for any environments that need installation
      const uninstalledEnvironments = await PythonEnvironment.find({ isInstalled: false });
      if (uninstalledEnvironments.length > 0) {
        console.log(`Found ${uninstalledEnvironments.length} environments that need installation. Starting installations...`);
        
        uninstalledEnvironments.forEach(async (env) => {
          try {
            console.log(`Installing environment: ${env.name} (${env._id})`);
            createPythonVirtualEnv(env._id.toString(), env.packages);
          } catch (error) {
            console.error(`Failed to start installation for environment ${env.name}:`, error);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error seeding Python environments:', error);
  }
}; 
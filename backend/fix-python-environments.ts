import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import PythonEnvironment from './src/models/pythonEnvironment';
import { createPythonVirtualEnv } from './src/services/pythonEnvironmentService';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/code-snippets';

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
};

// Reset all environments to trigger reinstallation
const resetAllEnvironments = async () => {
  try {
    // Find all environments
    const environments = await PythonEnvironment.find({});
    console.log(`Found ${environments.length} environments to reset`);
    
    // Reset each environment
    for (const env of environments) {
      console.log(`Resetting environment: ${env.name} (${env._id})`);
      
      // Mark as not installed
      await PythonEnvironment.findByIdAndUpdate(env._id, {
        isInstalled: false,
        installationError: null,
        virtualEnvPath: null
      });
      
      // Start reinstallation
      console.log(`Triggering reinstallation for: ${env.name}`);
      await createPythonVirtualEnv(env._id.toString(), env.packages);
    }
    
    console.log('All environments have been reset and are reinstalling');
  } catch (error) {
    console.error('Error resetting environments:', error);
  }
};

// Main function
const main = async () => {
  const connected = await connectToMongoDB();
  
  if (connected) {
    await resetAllEnvironments();
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  
  console.log('Fix script completed');
};

// Run the main function
main().catch(error => {
  console.error('Error in fix script:', error);
  process.exit(1);
}); 
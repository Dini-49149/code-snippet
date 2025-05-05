import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import snippetRoutes from './routes/snippetRoutes';
import folderRoutes from './routes/folderRoutes';
import executionRoutes from './routes/executionRoutes';
import pythonEnvironmentRoutes from './routes/pythonEnvironmentRoutes';
import { seedPythonEnvironments } from './config/seed';
import PythonEnvironment from './models/pythonEnvironment';
import { createPythonVirtualEnv } from './services/pythonEnvironmentService';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/code-snippets';

// Environment data directory
const BASE_ENV_DIR = process.env.PYTHON_ENV_DIR || path.join(os.homedir(), '.code-snippets', 'python-envs');

// Make sure the environment directory exists
if (!fs.existsSync(BASE_ENV_DIR)) {
  fs.mkdirSync(BASE_ENV_DIR, { recursive: true });
  console.log(`Created Python environments directory at ${BASE_ENV_DIR}`);
}

// MongoDB connection options
const mongooseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  retryWrites: true
};

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Successfully connected to MongoDB');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    // Seed the database with initial data
    await seedPythonEnvironments();
    
    // Check if there are any environments marked as installed but missing their virtual environments
    const installedEnvironments = await PythonEnvironment.find({ isInstalled: true });
    console.log(`Found ${installedEnvironments.length} installed Python environments`);
    
    for (const env of installedEnvironments) {
      try {
        const isWindows = process.platform === 'win32';
        
        // Skip path check if virtualEnvPath is undefined
        if (!env.virtualEnvPath) {
          console.log(`Environment path is missing for ${env.name} (${env._id})`);
          console.log('Triggering reinstallation...');
          
          // Update to trigger reinstallation
          await PythonEnvironment.findByIdAndUpdate(env._id, {
            isInstalled: false,
            installationError: 'Virtual environment path is missing'
          });
          
          // Start reinstallation
          createPythonVirtualEnv(env._id.toString(), env.packages);
          continue;
        }
        
        const pythonExePath = isWindows 
          ? path.join(env.virtualEnvPath, 'Scripts', 'python.exe')
          : path.join(env.virtualEnvPath, 'bin', 'python');
        
        console.log(`Checking Python environment: ${env.name} (${env._id})`);
        console.log(`Python path: ${pythonExePath}`);
        
        // Check if environment path or Python executable is missing
        if (!fs.existsSync(env.virtualEnvPath) || !fs.existsSync(pythonExePath)) {
          console.log(`Found environment with invalid virtual environment: ${env.name} (${env._id})`);
          
          if (!fs.existsSync(env.virtualEnvPath)) {
            console.log(`Environment path doesn't exist: ${env.virtualEnvPath}`);
          } else {
            console.log(`Python executable not found at: ${pythonExePath}`);
          }
          
          console.log('Triggering reinstallation...');
          
          // Update to trigger reinstallation
          await PythonEnvironment.findByIdAndUpdate(env._id, {
            isInstalled: false,
            installationError: 'Virtual environment verification failed on server startup'
          });
          
          // Start reinstallation
          createPythonVirtualEnv(env._id.toString(), env.packages);
        } else {
          console.log(`Environment ${env.name} verified successfully`);
        }
      } catch (error) {
        console.error(`Error verifying environment ${env.name}:`, error);
        
        // Mark environment for reinstallation
        await PythonEnvironment.findByIdAndUpdate(env._id, {
          isInstalled: false,
          installationError: `Error during verification: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Start reinstallation
        createPythonVirtualEnv(env._id.toString(), env.packages);
      }
    }
  } catch (error) {
    console.error('MongoDB connection error details:', error);
    console.log('Connection options used:', mongooseOptions);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error details:', error);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected. Full connection details:', mongoose.connection);
  console.log('Attempting to reconnect...');
  connectWithRetry();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/snippets', snippetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/execute', executionRoutes);
app.use('/api/python-environments', pythonEnvironmentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
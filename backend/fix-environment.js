const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/code-snippets';

// Base environment directory
const BASE_ENV_DIR = process.env.PYTHON_ENV_DIR || path.join(os.homedir(), '.code-snippets', 'python-envs');

// Environment name to fix
const ENV_NAME = process.argv[2] || 'my_env';

// Make sure the base directory exists
if (!fs.existsSync(BASE_ENV_DIR)) {
  fs.mkdirSync(BASE_ENV_DIR, { recursive: true });
  console.log(`Created Python environments directory at ${BASE_ENV_DIR}`);
}

// Function to execute command with output
function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, { 
      shell: true,
      stdio: 'inherit'  // This will show output in real-time
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function fixEnvironment() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Load the models dynamically
    const PythonEnvironment = mongoose.model('PythonEnvironment', new mongoose.Schema({
      name: String,
      description: String,
      packages: [String],
      created: Date,
      lastUsed: Date,
      virtualEnvPath: String,
      isInstalled: Boolean,
      installationError: String
    }), 'pythonenvironments');
    
    // Find the environment by name
    const environment = await PythonEnvironment.findOne({ name: ENV_NAME });
    
    if (!environment) {
      console.log(`Environment with name '${ENV_NAME}' not found.`);
      mongoose.connection.close();
      return;
    }
    
    console.log(`Found environment: ${environment.name} (${environment._id})`);
    console.log(`Packages: ${environment.packages.join(', ')}`);
    console.log(`Installation status: ${environment.isInstalled ? 'Installed' : 'Not installed'}`);
    
    if (environment.virtualEnvPath) {
      console.log(`Virtual environment path: ${environment.virtualEnvPath}`);
      
      if (fs.existsSync(environment.virtualEnvPath)) {
        console.log('Virtual environment directory exists');
      } else {
        console.log('Virtual environment directory does not exist');
      }
    } else {
      console.log('No virtual environment path set');
    }
    
    // Create a new environment path
    const envId = environment._id.toString();
    const envName = `env_${envId}`;
    const envPath = path.join(BASE_ENV_DIR, envName);
    
    console.log(`Creating new virtual environment at: ${envPath}`);
    
    // Delete existing environment directory if it exists
    if (fs.existsSync(envPath)) {
      console.log('Removing existing directory...');
      fs.rmSync(envPath, { recursive: true, force: true });
    }
    
    // Create the directory
    fs.mkdirSync(envPath, { recursive: true });
    
    // Create virtual environment
    await executeCommand('python', ['-m', 'venv', envPath]);
    
    // Get Python and pip executables
    const isWindows = process.platform === 'win32';
    const pythonExe = isWindows 
      ? path.join(envPath, 'Scripts', 'python.exe')
      : path.join(envPath, 'bin', 'python');
    
    // Check if Python executable exists
    if (!fs.existsSync(pythonExe)) {
      throw new Error(`Python executable not found at ${pythonExe}`);
    }
    
    // Upgrade pip
    try {
      await executeCommand(pythonExe, ['-m', 'pip', 'install', '--upgrade', 'pip']);
    } catch (err) {
      console.log('Failed to upgrade pip, but continuing...');
    }
    
    // Install packages
    if (environment.packages && environment.packages.length > 0) {
      console.log(`Installing packages: ${environment.packages.join(', ')}`);
      
      try {
        // Install all packages at once
        await executeCommand(pythonExe, ['-m', 'pip', 'install', ...environment.packages]);
        
        // Check installed packages
        await executeCommand(pythonExe, ['-m', 'pip', 'list']);
      } catch (err) {
        console.error('Error installing packages:', err);
        throw err;
      }
    }
    
    // Update environment record in database
    await PythonEnvironment.findByIdAndUpdate(environment._id, {
      virtualEnvPath: envPath,
      isInstalled: true,
      installationError: null
    });
    
    console.log('Environment successfully fixed!');
    
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    try {
      mongoose.connection.close();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

// Run the fix
fixEnvironment(); 
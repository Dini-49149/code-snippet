import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import PythonEnvironment from '../models/pythonEnvironment';

// Base directory for storing persistent virtual environments
const BASE_ENV_DIR = process.env.PYTHON_ENV_DIR || path.join(os.homedir(), '.code-snippets', 'python-envs');

// Make sure the base directory exists
if (!fs.existsSync(BASE_ENV_DIR)) {
  fs.mkdirSync(BASE_ENV_DIR, { recursive: true });
  console.log(`Created Python environments directory at ${BASE_ENV_DIR}`);
}

// Execute command with timeout and return stdout and stderr
const executeWithTimeout = (
  command: string, 
  args: string[], 
  options: { timeout?: number; stdin?: string } = {}
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 60000; // Default 60 seconds
    const child = spawn(command, args, { shell: true });
    
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    // Set timeout
    const timer = setTimeout(() => {
      killed = true;
      child.kill();
      reject(new Error(`Execution timed out after ${timeout}ms`));
    }, timeout);
    
    // Handle stdin if provided
    if (options.stdin) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    }
    
    // Collect stdout
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    child.on('close', (code) => {
      clearTimeout(timer);
      
      if (!killed) {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      }
    });
    
    // Handle process errors
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

// Create a Python virtual environment and install packages
export const createPythonVirtualEnv = async (
  environmentId: string,
  packages: string[]
): Promise<{ success: boolean; envPath?: string; error?: string }> => {
  try {
    // Generate a unique name for the environment directory
    const envName = `env_${environmentId}`;
    const envPath = path.join(BASE_ENV_DIR, envName);
    
    console.log(`Creating Python virtual environment at ${envPath}`);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(envPath)) {
      fs.mkdirSync(envPath, { recursive: true });
    }
    
    // Create virtual environment
    await executeWithTimeout('python', ['-m', 'venv', envPath], { timeout: 60000 });
    
    // Get path to pip and python
    const isWindows = process.platform === 'win32';
    const pythonExe = isWindows 
      ? path.join(envPath, 'Scripts', 'python.exe')
      : path.join(envPath, 'bin', 'python');
    
    const pipExe = isWindows 
      ? path.join(envPath, 'Scripts', 'pip.exe')
      : path.join(envPath, 'bin', 'pip');
    
    // Verify that python executable exists
    if (!fs.existsSync(pythonExe)) {
      throw new Error(`Python executable not found at ${pythonExe} after environment creation`);
    }
    
    // Upgrade pip using the Python executable directly
    try {
      console.log('Upgrading pip...');
      await executeWithTimeout(pythonExe, ['-m', 'pip', 'install', '--upgrade', 'pip'], { timeout: 120000 });
    } catch (error) {
      console.warn('Failed to upgrade pip:', error);
      // Continue even if pip upgrade fails
    }
    
    // Install all packages
    if (packages.length > 0) {
      console.log(`Installing packages: ${packages.join(', ')}`);
      
      // Install packages with a longer timeout using the Python executable
      try {
        await executeWithTimeout(pythonExe, ['-m', 'pip', 'install', ...packages], { timeout: 300000 }); // 5 minutes timeout
      } catch (error) {
        console.error('Failed to install packages:', error);
        return { 
          success: false, 
          envPath, 
          error: `Failed to install packages: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }
    
    // Verify installation by listing installed packages
    try {
      const { stdout } = await executeWithTimeout(pythonExe, ['-m', 'pip', 'list'], { timeout: 30000 });
      console.log('Installed packages:', stdout);
    } catch (error) {
      console.warn('Failed to list installed packages:', error);
      // Continue even if package listing fails
    }
    
    return { success: true, envPath };
  } catch (error) {
    console.error('Failed to create Python virtual environment:', error);
    return { 
      success: false, 
      error: `Failed to create Python virtual environment: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

// Execute Python code using an existing virtual environment
export const executePythonWithEnv = async (
  filePath: string,
  envPath: string,
  options: { timeout?: number; stdin?: string } = {}
): Promise<{ stdout: string; stderr: string }> => {
  console.log(`Executing Python code with environment at ${envPath}`);
  
  const isWindows = process.platform === 'win32';
  const pythonExe = isWindows 
    ? path.join(envPath, 'Scripts', 'python.exe')
    : path.join(envPath, 'bin', 'python');
  
  // Verify python executable exists
  if (!fs.existsSync(pythonExe)) {
    throw new Error(`Python executable not found at ${pythonExe}`);
  }
  
  console.log(`Using Python executable: ${pythonExe}`);
  
  // Execute with timeout
  return executeWithTimeout(pythonExe, [filePath], {
    timeout: options.timeout || 60000,
    stdin: options.stdin
  });
};

// Delete a Python virtual environment
export const deletePythonVirtualEnv = async (envPath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(envPath)) {
      console.log(`Deleting Python virtual environment at ${envPath}`);
      fs.rmSync(envPath, { recursive: true, force: true });
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete Python virtual environment at ${envPath}:`, error);
    return false;
  }
}; 
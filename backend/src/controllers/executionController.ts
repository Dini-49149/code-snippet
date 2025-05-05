import { Request, Response } from 'express';
import { exec, spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { body, validationResult } from 'express-validator';
import PythonEnvironment from '../models/pythonEnvironment';

// Interface for language configuration
interface LanguageConfig {
  extension: string;
  command: string;
  commandArgs?: string[];
  setupCommands?: string[];
  memoryLimit?: number; // in MB
  timeoutMs?: number; // in milliseconds
}

// Add a new interface for Python environment configuration
interface PythonEnvironmentConfig {
  packages: string[];
  pythonVersion?: string;
  useVirtualEnv: boolean;
}

// Default constraints
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const DEFAULT_MEMORY_LIMIT = 100; // 100 MB

// Define supported languages and their execution commands
const languageConfigs: Record<string, LanguageConfig> = {
  javascript: {
    extension: 'js',
    command: 'node',
    commandArgs: ['--max-old-space-size=100'], // Limit Node.js memory
    timeoutMs: 5000,
  },
  typescript: {
    extension: 'ts',
    command: 'ts-node',
    timeoutMs: 5000,
  },
  python: {
    extension: 'py',
    command: 'python',
    commandArgs: ['-u'], // Unbuffered output
    timeoutMs: 5000,
  },
  java: {
    extension: 'java',
    command: 'java',
    setupCommands: ['javac'],
    timeoutMs: 10000,
  },
  csharp: {
    extension: 'cs',
    command: 'dotnet',
    commandArgs: ['run'],
    timeoutMs: 8000,
  },
  cpp: {
    extension: 'cpp',
    command: 'g++',
    commandArgs: ['-o', 'temp_executable'],
    timeoutMs: 8000,
  },
  ruby: {
    extension: 'rb',
    command: 'ruby',
    timeoutMs: 5000,
  },
  php: {
    extension: 'php',
    command: 'php',
    timeoutMs: 5000,
  },
  swift: {
    extension: 'swift',
    command: 'swift',
    timeoutMs: 8000,
  },
  go: {
    extension: 'go',
    command: 'go',
    commandArgs: ['run'],
    timeoutMs: 5000,
  },
  rust: {
    extension: 'rs',
    command: 'rustc',
    commandArgs: ['-o', 'temp_executable'],
    timeoutMs: 8000,
  },
};

// Middleware for validating the execution request
export const validateExecutionRequest = [
  body('code').notEmpty().withMessage('Code is required'),
  body('language').notEmpty().withMessage('Programming language is required')
    .isIn(Object.keys(languageConfigs)).withMessage('Unsupported programming language'),
  body('stdin').optional().isString().withMessage('Standard input must be a string'),
  body('timeout').optional().isInt({ min: 1000, max: 30000 }).withMessage('Timeout must be between 1-30 seconds'),
  body('pythonEnvironmentId').optional().isString().withMessage('Environment ID must be a string'),
];

interface ExecutionOptions {
  timeout?: number;
  stdin?: string;
}

// Function to execute a command with timeout
const executeWithTimeout = (
  command: string, 
  args: string[], 
  options: ExecutionOptions = {}
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
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
          reject(new Error(`Process exited with code ${code}`));
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

// Function to set up a Python virtual environment
const setupPythonVirtualEnv = async (
  tempDir: string,
  config: PythonEnvironmentConfig
): Promise<{ envPath: string; success: boolean; error?: string; packageInstallResults?: string[] }> => {
  const venvName = `venv_${Date.now()}`;
  const venvPath = path.join(tempDir, venvName);
  const activateScript = process.platform === 'win32' 
    ? path.join(venvPath, 'Scripts', 'activate')
    : path.join(venvPath, 'bin', 'activate');
  
  console.log(`Creating Python virtual environment at ${venvPath}`);
  
  try {
    // Create virtual environment with increased timeout
    await executeWithTimeout('python', ['-m', 'venv', venvPath], { timeout: 60000 });
    
    // Install packages if specified
    const packageResults: string[] = [];
    
    if (config.packages && config.packages.length > 0) {
      console.log(`Installing packages: ${config.packages.join(', ')}`);
      
      const pipCommand = process.platform === 'win32' 
        ? path.join(venvPath, 'Scripts', 'pip')
        : path.join(venvPath, 'bin', 'pip');
      
      // First, upgrade pip to ensure we have the latest version
      try {
        console.log('Upgrading pip...');
        const pipUpgradeResult = await executeWithTimeout(pipCommand, ['install', '--upgrade', 'pip'], { timeout: 120000 });
        packageResults.push(`Pip upgrade: Success`);
      } catch (err) {
        const errorMsg = `Failed to upgrade pip: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.warn(errorMsg);
        packageResults.push(errorMsg);
        // Continue with package installation even if pip upgrade fails
      }
      
      // Install each package with extended timeout
      for (const pkg of config.packages) {
        // Sanitize package name to prevent command injection
        const sanitizedPkg = pkg.replace(/[;&|`$><!(){}[\]\\]/g, '').trim();
        
        if (!sanitizedPkg) {
          continue;
        }
        
        try {
          console.log(`Installing package: ${sanitizedPkg}`);
          // Use a longer timeout for package installation (3 minutes per package)
          await executeWithTimeout(pipCommand, ['install', sanitizedPkg], { timeout: 180000 });
          packageResults.push(`Installed ${sanitizedPkg}: Success`);
        } catch (err) {
          const errorMessage = `Failed to install package ${sanitizedPkg}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          packageResults.push(errorMessage);
          console.error(errorMessage);
          // Continue with other packages even if one fails
        }
      }
      
      // Verify installations
      try {
        console.log('Verifying package installations...');
        const freezeResult = await executeWithTimeout(pipCommand, ['freeze'], { timeout: 30000 });
        const installedPackages = freezeResult.stdout.split('\n').map(line => line.trim());
        packageResults.push(`Installed packages: ${installedPackages.join(', ')}`);
      } catch (err) {
        console.warn('Failed to get list of installed packages:', err);
      }
    }
    
    return { 
      envPath: venvPath, 
      success: true,
      packageInstallResults: packageResults 
    };
  } catch (err) {
    console.error('Failed to create Python virtual environment:', err);
    return { 
      envPath: venvPath, 
      success: false, 
      error: `Failed to create Python virtual environment: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
};

// Function to execute Python code with a virtual environment
const executePythonWithVenv = async (
  filePath: string,
  venvPath: string,
  options: ExecutionOptions = {}
): Promise<{ stdout: string; stderr: string }> => {
  console.log(`Executing Python code with environment at ${venvPath}`);
  
  const pythonExe = process.platform === 'win32' 
    ? path.join(venvPath, 'Scripts', 'python')
    : path.join(venvPath, 'bin', 'python');
  
  // Verify python executable exists
  if (!fs.existsSync(pythonExe)) {
    throw new Error(`Python executable not found at ${pythonExe}`);
  }
  
  console.log(`Using Python executable: ${pythonExe}`);
  
  // Execute with increased timeout (2 minutes)
  const execOptions = { 
    ...options,
    timeout: options.timeout || 120000 
  };
  
  return executeWithTimeout(pythonExe, [filePath], execOptions);
};

// Function to clean up Python environment
const cleanupPythonEnvironment = (envPath: string): void => {
  try {
    if (fs.existsSync(envPath)) {
      console.log(`Cleaning up Python environment at ${envPath}`);
      fs.rmSync(envPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to clean up Python environment at ${envPath}:`, err);
  }
};

// Controller to execute code
export const executeCode = async (req: Request, res: Response) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, language, stdin } = req.body;
  const timeout = req.body.timeout ? parseInt(req.body.timeout) : undefined;
  const pythonEnvironmentId = req.body.pythonEnvironmentId;
  
  // Check if language is supported
  if (!language || !languageConfigs[language]) {
    return res.status(400).json({ error: 'Unsupported programming language' });
  }

  const config = languageConfigs[language];
  const tempDir = os.tmpdir();
  const tempFilename = `code_${Date.now()}.${config.extension}`;
  const tempFilePath = path.join(tempDir, tempFilename);
  const executionStartTime = Date.now();
  let pythonEnvPath: string | null = null;
  let pythonEnvironment = null;

  try {
    // Load Python environment if specified
    if (language === 'python' && pythonEnvironmentId) {
      try {
        pythonEnvironment = await PythonEnvironment.findById(pythonEnvironmentId);
        
        if (!pythonEnvironment) {
          return res.status(404).json({
            success: false,
            error: 'Python environment not found'
          });
        }
        
        // Update last used timestamp
        await PythonEnvironment.findByIdAndUpdate(pythonEnvironmentId, {
          lastUsed: new Date()
        });
        
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch Python environment'
        });
      }
    }

    // Write code to temporary file
    fs.writeFileSync(tempFilePath, code);
    
    // Log execution attempt
    console.log(`Executing ${language} code, file: ${tempFilePath}`);
    
    // Prepare execution options
    const executionOptions: ExecutionOptions = {
      timeout: timeout || config.timeoutMs || DEFAULT_TIMEOUT_MS,
      stdin
    };

    // Special handling for Python with environment
    if (language === 'python' && pythonEnvironment) {
      try {
        console.log(`Using Python environment: ${pythonEnvironment.name}`);
        
        // Update last used timestamp
        await PythonEnvironment.findByIdAndUpdate(pythonEnvironmentId, {
          lastUsed: new Date()
        });
        
        // Check if the environment is installed
        if (!pythonEnvironment.isInstalled || !pythonEnvironment.virtualEnvPath) {
          return res.status(400).json({
            success: false,
            error: 'Python environment not ready',
            details: pythonEnvironment.installationError || 'Environment is still being installed. Please try again later.'
          });
        }
        
        // Verify environment path exists
        if (!fs.existsSync(pythonEnvironment.virtualEnvPath)) {
          console.error(`Virtual environment path doesn't exist: ${pythonEnvironment.virtualEnvPath}`);
          
          // Mark as not installed to trigger reinstallation
          await PythonEnvironment.findByIdAndUpdate(pythonEnvironmentId, {
            isInstalled: false,
            installationError: 'Virtual environment path not found'
          });
          
          return res.status(400).json({
            success: false,
            error: 'Python environment not found',
            details: 'The virtual environment was not found and will be reinstalled. Please try again later.'
          });
        }
        
        // Execute Python code with existing virtual environment
        console.log('Executing Python code with persistent virtual environment');
        
        // Use the Python executable from the virtual environment
        const isWindows = process.platform === 'win32';
        const pythonExe = isWindows 
          ? path.join(pythonEnvironment.virtualEnvPath, 'Scripts', 'python.exe')
          : path.join(pythonEnvironment.virtualEnvPath, 'bin', 'python');
        
        console.log(`Checking Python executable at: ${pythonExe}`);
        
        // Verify python executable exists
        if (!fs.existsSync(pythonExe)) {
          console.error(`Python executable not found at ${pythonExe}`);
          
          // Mark as not installed to trigger reinstallation
          await PythonEnvironment.findByIdAndUpdate(pythonEnvironmentId, {
            isInstalled: false,
            installationError: 'Python executable not found in virtual environment'
          });
          
          return res.status(400).json({
            success: false,
            error: 'Python executable not found',
            details: 'The Python executable was not found in the virtual environment. The environment will be reinstalled. Please try again later.'
          });
        }
        
        // Execute with the specified Python executable
        console.log(`Running with Python executable: ${pythonExe}`);
        const result = await executeWithTimeout(pythonExe, [tempFilePath], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime,
          environment: {
            python: true,
            packages: pythonEnvironment.packages,
            virtualEnv: true,
            name: pythonEnvironment.name
          }
        });
      } catch (error) {
        // Clean up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Python execution error:', errorMessage);
        
        return res.status(500).json({
          success: false,
          error: 'Python execution failed',
          details: errorMessage
        });
      }
    }
    // Special handling for compiled languages
    else if (language === 'cpp') {
      try {
        const executablePath = path.join(tempDir, 'temp_executable');
        
        // Compile the code
        await executeWithTimeout('g++', [tempFilePath, '-o', executablePath], {
          timeout: executionOptions.timeout
        });
        
        // Run the compiled executable
        const result = await executeWithTimeout(executablePath, [], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        try { fs.unlinkSync(executablePath); } catch (e) { /* ignore cleanup errors */ }
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        try { fs.unlinkSync(path.join(tempDir, 'temp_executable')); } catch (e) { /* ignore cleanup errors */ }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    } 
    // Special handling for Rust
    else if (language === 'rust') {
      try {
        const executablePath = path.join(tempDir, 'temp_executable');
        
        // Compile the code
        await executeWithTimeout('rustc', [tempFilePath, '-o', executablePath], {
          timeout: executionOptions.timeout
        });
        
        // Run the compiled executable
        const result = await executeWithTimeout(executablePath, [], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        try { fs.unlinkSync(executablePath); } catch (e) { /* ignore cleanup errors */ }
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        try { fs.unlinkSync(path.join(tempDir, 'temp_executable')); } catch (e) { /* ignore cleanup errors */ }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
    // Special handling for Java
    else if (language === 'java') {
      try {
        // For Java, extract class name from the code - assuming public class
        const classNameMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'Main';
        
        // Rename the file to match the class name
        const javaFilePath = path.join(tempDir, `${className}.java`);
        fs.renameSync(tempFilePath, javaFilePath);
        
        // Compile Java code
        await executeWithTimeout('javac', [javaFilePath], {
          timeout: executionOptions.timeout
        });
        
        // Run the compiled class
        const result = await executeWithTimeout('java', ['-cp', tempDir, className], executionOptions);
        
        // Clean up
        fs.unlinkSync(javaFilePath);
        try { fs.unlinkSync(path.join(tempDir, `${className}.class`)); } catch (e) { /* ignore cleanup errors */ }
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        try { fs.unlinkSync(path.join(tempDir, '*.java')); } catch (e) { /* ignore cleanup errors */ }
        try { fs.unlinkSync(path.join(tempDir, '*.class')); } catch (e) { /* ignore cleanup errors */ }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
    // Special handling for Go
    else if (language === 'go') {
      try {
        // Go run handles compilation and execution in one step
        const result = await executeWithTimeout('go', ['run', tempFilePath], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
    // Special handling for C#
    else if (language === 'csharp') {
      try {
        // Create a temporary project directory
        const projectDir = path.join(tempDir, `csharp_project_${Date.now()}`);
        fs.mkdirSync(projectDir, { recursive: true });
        
        // Move the file to the project directory
        const csharpFilePath = path.join(projectDir, 'Program.cs');
        fs.renameSync(tempFilePath, csharpFilePath);
        
        // Create a simple project file
        const projectFile = path.join(projectDir, 'project.csproj');
        fs.writeFileSync(projectFile, `
          <Project Sdk="Microsoft.NET.Sdk">
            <PropertyGroup>
              <OutputType>Exe</OutputType>
              <TargetFramework>net6.0</TargetFramework>
            </PropertyGroup>
          </Project>
        `);
        
        // Run dotnet
        const result = await executeWithTimeout('dotnet', ['run', '--project', projectFile], executionOptions);
        
        // Clean up
        try { 
          fs.rmSync(projectDir, { recursive: true, force: true }); 
        } catch (e) { 
          console.error('Failed to clean up C# project directory:', e);
        }
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
    // Python without environment - use system Python
    else if (language === 'python') {
      try {
        console.log('Running Python code without specific environment (using system Python)');
        const commandArgs = config.commandArgs || [];
        
        // Check if system Python is available
        try {
          await executeWithTimeout('python', ['--version'], { timeout: 5000 });
        } catch (err) {
          return res.status(500).json({
            success: false,
            error: 'System Python is not available',
            details: 'Please install Python or select a virtual environment'
          });
        }
        
        const result = await executeWithTimeout(config.command, [...commandArgs, tempFilePath], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime,
          environment: {
            python: true,
            virtualEnv: false
          }
        });
      } catch (error) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
    // Standard handling for interpreted languages
    else {
      try {
        const commandArgs = config.commandArgs || [];
        const result = await executeWithTimeout(config.command, [...commandArgs, tempFilePath], executionOptions);
        
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const executionTime = Date.now() - executionStartTime;
        return res.status(200).json({
          success: true,
          output: result.stdout,
          stderr: result.stderr,
          executionTime
        });
      } catch (error) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          success: false,
          error: 'Execution failed',
          details: errorMessage
        });
      }
    }
  } catch (error: unknown) {
    // Clean up temporary file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      success: false,
      error: 'Failed to execute code',
      details: errorMessage
    });
  }
}; 
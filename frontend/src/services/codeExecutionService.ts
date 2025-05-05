import { API_ENDPOINTS, DEFAULT_HEADERS } from '../config/api';

interface ExecutionResult {
  output: string;
  error?: string;
  stderr?: string;
  executionTime?: number;
  environment?: {
    python?: boolean;
    packages?: string[];
    virtualEnv?: boolean;
    name?: string;
    packageInstallResults?: string[];
  };
}

interface ExecutionOptions {
  code: string;
  language: string;
  stdin?: string;
  timeout?: number;
  pythonEnvironmentId?: string; // Use environment ID instead of custom config
}

// Service for executing code snippets in their respective language environments
export const codeExecutionService = {
  // Execute code in the appropriate language environment
  execute: async ({ code, language, stdin, timeout, pythonEnvironmentId }: ExecutionOptions): Promise<ExecutionResult> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CODE_EXECUTION}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          code,
          language,
          stdin,
          timeout,
          pythonEnvironmentId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error executing code: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing code:', error);
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred during execution',
      };
    }
  },

  // Local execution for JavaScript (useful for simple scripts without backend)
  executeJavaScriptLocally: (code: string, stdin?: string): ExecutionResult => {
    const startTime = performance.now();
    let output = '';
    let error = undefined;

    try {
      // Capture console.log output
      const originalConsoleLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };

      // Mock stdin if provided
      if (stdin) {
        // Create a simple mock readline implementation
        const stdinLines = stdin.split('\n');
        let currentLine = 0;
        
        // @ts-ignore - add a global prompt function for simple scripts
        global.prompt = (message?: string) => {
          if (message) logs.push(message);
          return currentLine < stdinLines.length ? stdinLines[currentLine++] : '';
        };
      }

      // Execute the code in a try-catch block
      // Note: this is not secure for production use - only for demo purposes
      // eslint-disable-next-line no-new-func
      const result = Function(`
        "use strict";
        ${code}
      `)();

      // Restore console.log
      console.log = originalConsoleLog;

      // Format output
      if (logs.length > 0) {
        output = logs.join('\n');
      }
      
      if (result !== undefined) {
        output += (output ? '\n' : '') + String(result);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
    }

    const executionTime = performance.now() - startTime;
    
    return {
      output,
      error,
      executionTime,
    };
  },
  
  // Simulate execution for other languages
  simulateExecution: (code: string, language: string): ExecutionResult => {
    // In a real application, this would call a backend service
    // Here we're just simulating the execution for demo purposes
    return {
      output: `[Simulated ${language.toUpperCase()} execution]:\nThis is a simulation of running the code:\n\n${code}\n\nIn a real environment, this would execute using a backend service.`,
      executionTime: 100,
    };
  }
}; 
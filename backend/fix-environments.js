// JavaScript script to compile and run the TypeScript fix file
const { exec } = require('child_process');
const path = require('path');

console.log('Compiling TypeScript file...');

// Compile TypeScript
exec('npx tsc fix-python-environments.ts --esModuleInterop', (err, stdout, stderr) => {
  if (err) {
    console.error('Error compiling TypeScript:', err);
    console.error(stderr);
    return;
  }
  
  console.log('TypeScript compiled successfully!');
  console.log('Running fix script...');
  
  // Run the compiled JavaScript
  exec('node fix-python-environments.js', (err, stdout, stderr) => {
    if (err) {
      console.error('Error running fix script:', err);
      console.error(stderr);
      return;
    }
    
    console.log(stdout);
    console.log('Fix script completed!');
  });
}); 
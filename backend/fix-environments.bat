@echo off
echo Fixing Python environments...
echo.

echo Building TypeScript fix script...
call npx tsc fix-python-environments.ts --esModuleInterop

if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to compile TypeScript file
  exit /b %ERRORLEVEL%
)

echo Running fix script...
echo.
node fix-python-environments.js

echo.
echo Done! All environments should be reinstalled.
echo Restart the backend server to use the fixed environments.
echo. 
# Kill existing server at port 5000
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes) {
    foreach ($process in $processes) {
        Stop-Process -Id $process -Force
        Write-Host "Stopped process with ID $process"
    }
}

# Navigate to backend directory
cd .\backend

# Build and start the server
npm run build
npm start 
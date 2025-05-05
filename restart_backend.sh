# Kill existing server at port 5000
kill $(lsof -t -i:5000)

# Navigate to backend directory
cd backend

# Build and start the server
npm run build && npm start 
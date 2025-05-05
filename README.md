# Code Snippet Manager

A modern web application for managing and organizing code snippets with syntax highlighting and search capabilities.

## Features

- 🎨 Modern UI with dark/light mode support
- 💻 Monaco Editor integration for code editing
- 🔍 Advanced search and filtering
- 🏷️ Tag-based organization
- ⌨️ Keyboard shortcuts
- 📱 Responsive design
- ⚡ Real-time updates

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Monaco Editor for code editing

### Backend
- Node.js with Express
- TypeScript
- MongoDB for data storage
- Mongoose for ODM

## Project Structure

```
code-snippet/
├── frontend/                # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main application component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── backend/               # Backend Node.js application
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── server.ts     # Main server file
│   └── package.json      # Backend dependencies
│
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd code-snippet
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Update the MongoDB connection string and other variables

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3002`

## Development

### Frontend Development
- Uses Vite for fast development and building
- Tailwind CSS for styling
- TypeScript for type safety
- Monaco Editor for code editing

### Backend Development
- Express.js for API routing
- Mongoose for MongoDB interactions
- TypeScript for type safety
- Environment variables for configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
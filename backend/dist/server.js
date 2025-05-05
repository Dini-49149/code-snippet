"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const snippetRoutes_1 = __importDefault(require("./routes/snippetRoutes"));
const folderRoutes_1 = __importDefault(require("./routes/folderRoutes"));
const executionRoutes_1 = __importDefault(require("./routes/executionRoutes"));
const pythonEnvironmentRoutes_1 = __importDefault(require("./routes/pythonEnvironmentRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/code-snippets';
// MongoDB connection options
const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    retryWrites: true
};
// Connect to MongoDB with retry logic
const connectWithRetry = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
        yield mongoose_1.default.connect(MONGODB_URI, mongooseOptions);
        console.log('Successfully connected to MongoDB');
        console.log('MongoDB connection state:', mongoose_1.default.connection.readyState);
    }
    catch (error) {
        console.error('MongoDB connection error details:', error);
        console.log('Connection options used:', mongooseOptions);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
});
// Initial connection attempt
connectWithRetry();
// Handle MongoDB connection events
mongoose_1.default.connection.on('error', (error) => {
    console.error('MongoDB connection error details:', error);
});
mongoose_1.default.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});
mongoose_1.default.connection.on('disconnected', () => {
    console.error('MongoDB disconnected. Full connection details:', mongoose_1.default.connection);
    console.log('Attempting to reconnect...');
    connectWithRetry();
});
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3002', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use('/api/snippets', snippetRoutes_1.default);
app.use('/api/folders', folderRoutes_1.default);
app.use('/api/execute', executionRoutes_1.default);
app.use('/api/python-environments', pythonEnvironmentRoutes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

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
exports.deletePythonEnvironment = exports.updatePythonEnvironment = exports.createPythonEnvironment = exports.getPythonEnvironmentById = exports.getPythonEnvironments = void 0;
const pythonEnvironment_1 = __importDefault(require("../models/pythonEnvironment"));
// Helper function to transform environment document for frontend
const transformEnvironment = (env) => {
    return {
        id: env._id.toString(),
        name: env.name,
        description: env.description,
        packages: env.packages || [],
        created: env.created,
        lastUsed: env.lastUsed
    };
};
// Get all Python environments
const getPythonEnvironments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const environments = yield pythonEnvironment_1.default.find().sort({ name: 1 });
        // Transform environments for frontend
        const transformedEnvs = environments.map(env => transformEnvironment(env));
        res.status(200).json(transformedEnvs);
    }
    catch (error) {
        console.error('Error fetching Python environments:', error);
        res.status(500).json({ error: 'Failed to fetch Python environments' });
    }
});
exports.getPythonEnvironments = getPythonEnvironments;
// Get a single Python environment by ID
const getPythonEnvironmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const environment = yield pythonEnvironment_1.default.findById(req.params.id);
        if (!environment) {
            return res.status(404).json({ error: 'Python environment not found' });
        }
        // Transform environment for frontend
        const transformedEnv = transformEnvironment(environment);
        res.status(200).json(transformedEnv);
    }
    catch (error) {
        console.error('Error fetching Python environment:', error);
        res.status(500).json({ error: 'Failed to fetch Python environment' });
    }
});
exports.getPythonEnvironmentById = getPythonEnvironmentById;
// Create a new Python environment
const createPythonEnvironment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate input
        const { name, packages } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Environment name is required' });
        }
        // Create the environment
        const newEnvironment = new pythonEnvironment_1.default({
            name,
            description: req.body.description,
            packages: packages || [],
        });
        const savedEnvironment = yield newEnvironment.save();
        // Transform environment for frontend
        const transformedEnv = transformEnvironment(savedEnvironment);
        res.status(201).json(transformedEnv);
    }
    catch (error) {
        console.error('Error creating Python environment:', error);
        res.status(500).json({ error: 'Failed to create Python environment' });
    }
});
exports.createPythonEnvironment = createPythonEnvironment;
// Update a Python environment
const updatePythonEnvironment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, packages } = req.body;
        // Find and update the environment
        const updatedEnvironment = yield pythonEnvironment_1.default.findByIdAndUpdate(req.params.id, Object.assign({ name,
            description,
            packages }, (req.body.lastUsed && { lastUsed: new Date() })), { new: true, runValidators: true });
        if (!updatedEnvironment) {
            return res.status(404).json({ error: 'Python environment not found' });
        }
        // Transform environment for frontend
        const transformedEnv = transformEnvironment(updatedEnvironment);
        res.status(200).json(transformedEnv);
    }
    catch (error) {
        console.error('Error updating Python environment:', error);
        res.status(500).json({ error: 'Failed to update Python environment' });
    }
});
exports.updatePythonEnvironment = updatePythonEnvironment;
// Delete a Python environment
const deletePythonEnvironment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedEnvironment = yield pythonEnvironment_1.default.findByIdAndDelete(req.params.id);
        if (!deletedEnvironment) {
            return res.status(404).json({ error: 'Python environment not found' });
        }
        res.status(200).json({ message: 'Python environment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting Python environment:', error);
        res.status(500).json({ error: 'Failed to delete Python environment' });
    }
});
exports.deletePythonEnvironment = deletePythonEnvironment;

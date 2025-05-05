"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pythonEnvironmentController_1 = require("../controllers/pythonEnvironmentController");
const router = express_1.default.Router();
// GET /api/python-environments - Get all environments
router.get('/', pythonEnvironmentController_1.getPythonEnvironments);
// GET /api/python-environments/:id - Get environment by ID
router.get('/:id', pythonEnvironmentController_1.getPythonEnvironmentById);
// POST /api/python-environments - Create new environment
router.post('/', pythonEnvironmentController_1.createPythonEnvironment);
// PUT /api/python-environments/:id - Update environment
router.put('/:id', pythonEnvironmentController_1.updatePythonEnvironment);
// DELETE /api/python-environments/:id - Delete environment
router.delete('/:id', pythonEnvironmentController_1.deletePythonEnvironment);
exports.default = router;

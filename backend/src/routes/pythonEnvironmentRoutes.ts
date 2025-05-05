import express from 'express';
import {
  getPythonEnvironments,
  getPythonEnvironmentById,
  createPythonEnvironment,
  updatePythonEnvironment,
  deletePythonEnvironment
} from '../controllers/pythonEnvironmentController';

const router = express.Router();

// GET /api/python-environments - Get all environments
router.get('/', getPythonEnvironments);

// GET /api/python-environments/:id - Get environment by ID
router.get('/:id', getPythonEnvironmentById);

// POST /api/python-environments - Create new environment
router.post('/', createPythonEnvironment);

// PUT /api/python-environments/:id - Update environment
router.put('/:id', updatePythonEnvironment);

// DELETE /api/python-environments/:id - Delete environment
router.delete('/:id', deletePythonEnvironment);

export default router; 
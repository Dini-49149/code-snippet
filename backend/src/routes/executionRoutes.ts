import express from 'express';
import { executeCode } from '../controllers/executionController';

const router = express.Router();

// POST /api/execute - Execute code snippet
router.post('/', executeCode);

export default router; 
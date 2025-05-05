import express from 'express';
import {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
} from '../controllers/folderController';

const router = express.Router();

router.post('/', createFolder);
router.get('/', getFolders);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router; 
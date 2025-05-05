import express from 'express';
import {
  getSnippets,
  getSnippet,
  createSnippet,
  updateSnippet,
  deleteSnippet,
} from '../controllers/snippetController';
import { Snippet } from '../models/Snippet';

const router = express.Router();

// Get all snippets
router.get('/', getSnippets);

// Get a single snippet
router.get('/:id', getSnippet);

// Create a new snippet
router.post('/', createSnippet);

// Update a snippet
router.put('/:id', updateSnippet);

// Delete a snippet
router.delete('/:id', deleteSnippet);

// Search snippets
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const snippets = await Snippet.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ message: 'Error searching snippets' });
  }
});

export default router; 
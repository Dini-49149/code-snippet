import { Request, Response } from 'express';
import { Snippet } from '../models/Snippet';

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CODE_LENGTH = 50000; // 50KB

// Validation function
const validateSnippet = (data: any) => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Title is required');
  } else if (data.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  if (!data.code?.trim()) {
    errors.push('Code is required');
  } else if (data.code.length > MAX_CODE_LENGTH) {
    errors.push(`Code must be less than ${MAX_CODE_LENGTH} characters`);
  }

  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  if (!data.programmingLanguage) {
    errors.push('Programming language is required');
  }

  return errors;
};

// Get all snippets
export const getSnippets = async (req: Request, res: Response) => {
  try {
    const snippets = await Snippet.find().sort({ createdAt: -1 });
    res.json(snippets);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json({ 
      message: 'Error fetching snippets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a single snippet
export const getSnippet = async (req: Request, res: Response) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    res.json(snippet);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({ 
      message: 'Error fetching snippet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new snippet
export const createSnippet = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationErrors = validateSnippet(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Sanitize input
    const sanitizedData = {
      ...req.body,
      title: req.body.title.trim(),
      code: req.body.code.trim(),
      description: req.body.description?.trim() || '',
      tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag: string) => tag.trim()) : []
    };

    const newSnippet = new Snippet(sanitizedData);
    const savedSnippet = await newSnippet.save();
    res.status(201).json(savedSnippet);
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ 
      message: 'Error creating snippet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update a snippet
export const updateSnippet = async (req: Request, res: Response) => {
  try {
    // Check if snippet exists
    const existingSnippet = await Snippet.findById(req.params.id);
    if (!existingSnippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      title: req.body.title?.trim(),
      code: req.body.code?.trim(),
      description: req.body.description?.trim(),
      tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag: string) => tag.trim()) : existingSnippet.tags,
      folder: req.body.folder || existingSnippet.folder,
      updatedAt: new Date()
    };

    // Validate input
    const validationErrors = validateSnippet(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const updatedSnippet = await Snippet.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedSnippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    res.json(updatedSnippet);
  } catch (error) {
    console.error('Error updating snippet:', error);
    res.status(500).json({ 
      message: 'Error updating snippet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a snippet
export const deleteSnippet = async (req: Request, res: Response) => {
  try {
    const deletedSnippet = await Snippet.findByIdAndDelete(req.params.id);
    if (!deletedSnippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({ 
      message: 'Error deleting snippet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 
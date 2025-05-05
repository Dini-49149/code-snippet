import { Request, Response } from 'express';
import { Folder } from '../models/Folder';
import { Snippet } from '../models/Snippet';

export const createFolder = async (req: Request, res: Response) => {
  try {
    const { name, parentFolder } = req.body;
    const folder = new Folder({ name, parentFolder });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error creating folder', error });
  }
};

export const getFolders = async (req: Request, res: Response) => {
  try {
    const folders = await Folder.find().sort({ name: 1 });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching folders', error });
  }
};

export const updateFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentFolder } = req.body;
    const folder = await Folder.findByIdAndUpdate(
      id,
      { name, parentFolder },
      { new: true }
    );
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating folder', error });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Helper to find all descendant folder IDs recursively
    async function getAllDescendantFolderIds(folderId: string): Promise<string[]> {
      const children = await Folder.find({ parentFolder: folderId });
      let ids: string[] = [];
      for (const child of children) {
        ids.push(child._id.toString());
        ids = ids.concat(await getAllDescendantFolderIds(child._id.toString()));
      }
      return ids;
    }

    // Get all descendant folder IDs
    const descendantFolderIds = await getAllDescendantFolderIds(id);
    // All folders to delete: the folder itself + all descendants
    const allFolderIds = [id, ...descendantFolderIds];

    // Delete all snippets in these folders
    await Snippet.deleteMany({ folder: { $in: allFolderIds } });

    // Delete all folders
    await Folder.deleteMany({ _id: { $in: allFolderIds } });

    res.json({ message: 'Folder and all its subfolders/snippets deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting folder', error });
  }
}; 
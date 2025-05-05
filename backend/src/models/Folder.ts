import mongoose from 'mongoose';

export interface IFolder {
  _id: string;
  name: string;
  parentFolder?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new mongoose.Schema<IFolder>({
  name: { type: String, required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
folderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for folder name search
folderSchema.index({ name: 'text' });

export const Folder = mongoose.model<IFolder>('Folder', folderSchema); 
import mongoose from 'mongoose';

export interface ISnippet {
  _id: string;
  title: string;
  code: string;
  programmingLanguage: string;
  description: string;
  tags: string[];
  folder?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const snippetSchema = new mongoose.Schema<ISnippet>({
  title: { type: String, required: true },
  code: { type: String, required: true },
  programmingLanguage: { type: String, required: true, default: 'javascript' },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
snippetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create text index for search functionality
snippetSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Snippet = mongoose.model<ISnippet>('Snippet', snippetSchema); 
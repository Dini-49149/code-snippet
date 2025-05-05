export interface Snippet {
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
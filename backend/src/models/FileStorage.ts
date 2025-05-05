import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ISnippet {
  _id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

class FileStorage {
  private dataPath: string;
  private snippets: ISnippet[] = [];

  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    this.loadData();
  }

  private loadData(): void {
    const filePath = path.join(this.dataPath, 'snippets.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        this.snippets = JSON.parse(data);
      } catch (error) {
        console.error('Error loading data:', error);
        this.snippets = [];
      }
    } else {
      this.snippets = [];
      this.saveData();
    }
  }

  private saveData(): void {
    const filePath = path.join(this.dataPath, 'snippets.json');
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.snippets, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async find(): Promise<ISnippet[]> {
    return this.snippets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<ISnippet | null> {
    return this.snippets.find(snippet => snippet._id === id) || null;
  }

  async create(snippetData: Omit<ISnippet, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISnippet> {
    const now = new Date();
    const newSnippet: ISnippet = {
      ...snippetData,
      _id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    this.snippets.push(newSnippet);
    this.saveData();
    
    return newSnippet;
  }

  async findByIdAndUpdate(
    id: string, 
    update: Partial<ISnippet>, 
    options: { new: boolean } = { new: true }
  ): Promise<ISnippet | null> {
    const index = this.snippets.findIndex(snippet => snippet._id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedSnippet = {
      ...this.snippets[index],
      ...update,
      updatedAt: new Date()
    };
    
    this.snippets[index] = updatedSnippet;
    this.saveData();
    
    return options.new ? updatedSnippet : this.snippets[index];
  }

  async findByIdAndDelete(id: string): Promise<ISnippet | null> {
    const index = this.snippets.findIndex(snippet => snippet._id === id);
    
    if (index === -1) {
      return null;
    }
    
    const deletedSnippet = this.snippets[index];
    this.snippets.splice(index, 1);
    this.saveData();
    
    return deletedSnippet;
  }

  async search(query: string): Promise<ISnippet[]> {
    const lowercaseQuery = query.toLowerCase();
    
    return this.snippets.filter(snippet => 
      snippet.title.toLowerCase().includes(lowercaseQuery) ||
      snippet.description.toLowerCase().includes(lowercaseQuery) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export default new FileStorage(); 
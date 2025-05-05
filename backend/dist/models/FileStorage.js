"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class FileStorage {
    constructor() {
        this.snippets = [];
        this.dataPath = path_1.default.join(__dirname, '../../data');
        // Create data directory if it doesn't exist
        if (!fs_1.default.existsSync(this.dataPath)) {
            fs_1.default.mkdirSync(this.dataPath, { recursive: true });
        }
        this.loadData();
    }
    loadData() {
        const filePath = path_1.default.join(this.dataPath, 'snippets.json');
        if (fs_1.default.existsSync(filePath)) {
            try {
                const data = fs_1.default.readFileSync(filePath, 'utf8');
                this.snippets = JSON.parse(data);
            }
            catch (error) {
                console.error('Error loading data:', error);
                this.snippets = [];
            }
        }
        else {
            this.snippets = [];
            this.saveData();
        }
    }
    saveData() {
        const filePath = path_1.default.join(this.dataPath, 'snippets.json');
        try {
            fs_1.default.writeFileSync(filePath, JSON.stringify(this.snippets, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Error saving data:', error);
        }
    }
    find() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.snippets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.snippets.find(snippet => snippet._id === id) || null;
        });
    }
    create(snippetData) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const newSnippet = Object.assign(Object.assign({}, snippetData), { _id: (0, uuid_1.v4)(), createdAt: now, updatedAt: now });
            this.snippets.push(newSnippet);
            this.saveData();
            return newSnippet;
        });
    }
    findByIdAndUpdate(id_1, update_1) {
        return __awaiter(this, arguments, void 0, function* (id, update, options = { new: true }) {
            const index = this.snippets.findIndex(snippet => snippet._id === id);
            if (index === -1) {
                return null;
            }
            const updatedSnippet = Object.assign(Object.assign(Object.assign({}, this.snippets[index]), update), { updatedAt: new Date() });
            this.snippets[index] = updatedSnippet;
            this.saveData();
            return options.new ? updatedSnippet : this.snippets[index];
        });
    }
    findByIdAndDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.snippets.findIndex(snippet => snippet._id === id);
            if (index === -1) {
                return null;
            }
            const deletedSnippet = this.snippets[index];
            this.snippets.splice(index, 1);
            this.saveData();
            return deletedSnippet;
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const lowercaseQuery = query.toLowerCase();
            return this.snippets.filter(snippet => snippet.title.toLowerCase().includes(lowercaseQuery) ||
                snippet.description.toLowerCase().includes(lowercaseQuery) ||
                snippet.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
    }
}
exports.default = new FileStorage();

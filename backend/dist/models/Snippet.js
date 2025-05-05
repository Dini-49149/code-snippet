"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snippet = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const snippetSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    code: { type: String, required: true },
    programmingLanguage: { type: String, required: true, default: 'javascript' },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    folder: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Folder', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Update the updatedAt field before saving
snippetSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create text index for search functionality
snippetSchema.index({ title: 'text', description: 'text', tags: 'text' });
exports.Snippet = mongoose_1.default.model('Snippet', snippetSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Folder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const folderSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    parentFolder: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Folder', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Update the updatedAt field before saving
folderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create index for folder name search
folderSchema.index({ name: 'text' });
exports.Folder = mongoose_1.default.model('Folder', folderSchema);

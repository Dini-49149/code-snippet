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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolder = exports.updateFolder = exports.getFolders = exports.createFolder = void 0;
const Folder_1 = require("../models/Folder");
const Snippet_1 = require("../models/Snippet");
const createFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, parentFolder } = req.body;
        const folder = new Folder_1.Folder({ name, parentFolder });
        yield folder.save();
        res.status(201).json(folder);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating folder', error });
    }
});
exports.createFolder = createFolder;
const getFolders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folders = yield Folder_1.Folder.find().sort({ name: 1 });
        res.json(folders);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching folders', error });
    }
});
exports.getFolders = getFolders;
const updateFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, parentFolder } = req.body;
        const folder = yield Folder_1.Folder.findByIdAndUpdate(id, { name, parentFolder }, { new: true });
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }
        res.json(folder);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating folder', error });
    }
});
exports.updateFolder = updateFolder;
const deleteFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Move all snippets in this folder to root (null folder)
        yield Snippet_1.Snippet.updateMany({ folder: id }, { folder: null });
        // Delete the folder
        const folder = yield Folder_1.Folder.findByIdAndDelete(id);
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }
        // Move all subfolders to root
        yield Folder_1.Folder.updateMany({ parentFolder: id }, { parentFolder: null });
        res.json({ message: 'Folder deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting folder', error });
    }
});
exports.deleteFolder = deleteFolder;

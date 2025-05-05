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
exports.deleteSnippet = exports.updateSnippet = exports.createSnippet = exports.getSnippet = exports.getSnippets = void 0;
const Snippet_1 = require("../models/Snippet");
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CODE_LENGTH = 50000; // 50KB
// Validation function
const validateSnippet = (data) => {
    var _a, _b;
    const errors = [];
    if (!((_a = data.title) === null || _a === void 0 ? void 0 : _a.trim())) {
        errors.push('Title is required');
    }
    else if (data.title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
    }
    if (!((_b = data.code) === null || _b === void 0 ? void 0 : _b.trim())) {
        errors.push('Code is required');
    }
    else if (data.code.length > MAX_CODE_LENGTH) {
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
const getSnippets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snippets = yield Snippet_1.Snippet.find().sort({ createdAt: -1 });
        res.json(snippets);
    }
    catch (error) {
        console.error('Error fetching snippets:', error);
        res.status(500).json({
            message: 'Error fetching snippets',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getSnippets = getSnippets;
// Get a single snippet
const getSnippet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snippet = yield Snippet_1.Snippet.findById(req.params.id);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found' });
        }
        res.json(snippet);
    }
    catch (error) {
        console.error('Error fetching snippet:', error);
        res.status(500).json({
            message: 'Error fetching snippet',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getSnippet = getSnippet;
// Create a new snippet
const createSnippet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const sanitizedData = Object.assign(Object.assign({}, req.body), { title: req.body.title.trim(), code: req.body.code.trim(), description: ((_a = req.body.description) === null || _a === void 0 ? void 0 : _a.trim()) || '', tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag) => tag.trim()) : [] });
        const newSnippet = new Snippet_1.Snippet(sanitizedData);
        const savedSnippet = yield newSnippet.save();
        res.status(201).json(savedSnippet);
    }
    catch (error) {
        console.error('Error creating snippet:', error);
        res.status(500).json({
            message: 'Error creating snippet',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.createSnippet = createSnippet;
// Update a snippet
const updateSnippet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Check if snippet exists
        const existingSnippet = yield Snippet_1.Snippet.findById(req.params.id);
        if (!existingSnippet) {
            return res.status(404).json({ message: 'Snippet not found' });
        }
        // Validate input
        const validationErrors = validateSnippet(Object.assign(Object.assign({}, existingSnippet.toObject()), req.body));
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        // Sanitize input
        const sanitizedData = Object.assign(Object.assign({}, req.body), { title: (_a = req.body.title) === null || _a === void 0 ? void 0 : _a.trim(), code: (_b = req.body.code) === null || _b === void 0 ? void 0 : _b.trim(), description: (_c = req.body.description) === null || _c === void 0 ? void 0 : _c.trim(), tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag) => tag.trim()) : undefined, updatedAt: new Date() });
        const updatedSnippet = yield Snippet_1.Snippet.findByIdAndUpdate(req.params.id, { $set: sanitizedData }, { new: true, runValidators: true });
        if (!updatedSnippet) {
            return res.status(404).json({ message: 'Snippet not found' });
        }
        res.json(updatedSnippet);
    }
    catch (error) {
        console.error('Error updating snippet:', error);
        res.status(500).json({
            message: 'Error updating snippet',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.updateSnippet = updateSnippet;
// Delete a snippet
const deleteSnippet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedSnippet = yield Snippet_1.Snippet.findByIdAndDelete(req.params.id);
        if (!deletedSnippet) {
            return res.status(404).json({ message: 'Snippet not found' });
        }
        res.json({ message: 'Snippet deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting snippet:', error);
        res.status(500).json({
            message: 'Error deleting snippet',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.deleteSnippet = deleteSnippet;

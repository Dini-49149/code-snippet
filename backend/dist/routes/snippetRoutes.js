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
const express_1 = __importDefault(require("express"));
const snippetController_1 = require("../controllers/snippetController");
const Snippet_1 = require("../models/Snippet");
const router = express_1.default.Router();
// Get all snippets
router.get('/', snippetController_1.getSnippets);
// Get a single snippet
router.get('/:id', snippetController_1.getSnippet);
// Create a new snippet
router.post('/', snippetController_1.createSnippet);
// Update a snippet
router.put('/:id', snippetController_1.updateSnippet);
// Delete a snippet
router.delete('/:id', snippetController_1.deleteSnippet);
// Search snippets
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const snippets = yield Snippet_1.Snippet.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
        res.json(snippets);
    }
    catch (error) {
        res.status(500).json({ message: 'Error searching snippets' });
    }
}));
exports.default = router;

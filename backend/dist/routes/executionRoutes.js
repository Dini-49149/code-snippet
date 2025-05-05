"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const executionController_1 = require("../controllers/executionController");
const router = express_1.default.Router();
// POST /api/execute - Execute code snippet
router.post('/', executionController_1.executeCode);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const folderController_1 = require("../controllers/folderController");
const router = express_1.default.Router();
router.post('/', folderController_1.createFolder);
router.get('/', folderController_1.getFolders);
router.put('/:id', folderController_1.updateFolder);
router.delete('/:id', folderController_1.deleteFolder);
exports.default = router;

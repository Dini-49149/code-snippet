"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Python environment schema
const pythonEnvironmentSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    packages: [{
            type: String,
            trim: true,
        }],
    created: {
        type: Date,
        default: Date.now,
    },
    lastUsed: {
        type: Date,
    }
});
// Export the model
const PythonEnvironment = mongoose_1.default.model('PythonEnvironment', pythonEnvironmentSchema);
exports.default = PythonEnvironment;

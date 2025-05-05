import mongoose from 'mongoose';

// Python environment schema
const pythonEnvironmentSchema = new mongoose.Schema({
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
  },
  virtualEnvPath: {
    type: String,
    trim: true,
  },
  isInstalled: {
    type: Boolean,
    default: false,
  },
  installationError: {
    type: String,
    trim: true,
  }
});

// Export the model
const PythonEnvironment = mongoose.model('PythonEnvironment', pythonEnvironmentSchema);

export default PythonEnvironment; 
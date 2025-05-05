// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  SNIPPETS: `${API_BASE_URL}/snippets`,
  SNIPPET: (id: string) => `${API_BASE_URL}/snippets/${id}`,
  FOLDERS: `${API_BASE_URL}/folders`,
  FOLDER: (id: string) => `${API_BASE_URL}/folders/${id}`,
  CODE_EXECUTION: `${API_BASE_URL}/execute`,
  PYTHON_ENVIRONMENTS: `${API_BASE_URL}/python-environments`,
  PYTHON_ENVIRONMENT: (id: string) => `${API_BASE_URL}/python-environments/${id}`,
};

// Request configuration
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Error messages
export const ERROR_MESSAGES = {
  FETCH_ERROR: 'Failed to fetch data. Please try again.',
  CREATE_ERROR: 'Failed to create resource. Please try again.',
  UPDATE_ERROR: 'Failed to update resource. Please try again.',
  DELETE_ERROR: 'Failed to delete resource. Please try again.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in.',
  FORBIDDEN: 'Access denied.',
}; 
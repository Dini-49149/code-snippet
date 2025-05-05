import { API_ENDPOINTS, DEFAULT_HEADERS, ERROR_MESSAGES } from '../config/api';
import { Snippet } from '../types';

// Generic fetch wrapper with error handling
const fetchWithErrorHandling = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      } else if (response.status === 400) {
        const data = await response.json();
        throw new Error(data.message || ERROR_MESSAGES.VALIDATION_ERROR);
      } else if (response.status === 429) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
      }
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('API Error:', error);
      throw error;
    }
    throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

// Snippet API service
export const snippetService = {
  // Get all snippets
  getAll: async (signal?: AbortSignal): Promise<Snippet[]> => {
    return fetchWithErrorHandling<Snippet[]>(API_ENDPOINTS.SNIPPETS, { signal });
  },

  // Get a single snippet by ID
  getById: async (id: string, signal?: AbortSignal): Promise<Snippet> => {
    return fetchWithErrorHandling<Snippet>(API_ENDPOINTS.SNIPPET(id), { signal });
  },

  // Create a new snippet
  create: async (snippet: Omit<Snippet, '_id' | 'createdAt'>, signal?: AbortSignal): Promise<Snippet> => {
    // Validate snippet before sending
    if (!snippet.title?.trim()) {
      throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }
    if (!snippet.code?.trim()) {
      throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }
    if (snippet.title.length > 100) {
      throw new Error('Title must be less than 100 characters');
    }
    if (snippet.description && snippet.description.length > 500) {
      throw new Error('Description must be less than 500 characters');
    }

    return fetchWithErrorHandling<Snippet>(API_ENDPOINTS.SNIPPETS, {
      method: 'POST',
      body: JSON.stringify(snippet),
      signal,
    });
  },

  // Update an existing snippet
  update: async (id: string, snippet: Partial<Snippet>, signal?: AbortSignal): Promise<Snippet> => {
    // Validate snippet before sending
    if (snippet.title && !snippet.title.trim()) {
      throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }
    if (snippet.code && !snippet.code.trim()) {
      throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }
    if (snippet.title && snippet.title.length > 100) {
      throw new Error('Title must be less than 100 characters');
    }
    if (snippet.description && snippet.description.length > 500) {
      throw new Error('Description must be less than 500 characters');
    }

    return fetchWithErrorHandling<Snippet>(API_ENDPOINTS.SNIPPET(id), {
      method: 'PUT',
      body: JSON.stringify(snippet),
      signal,
    });
  },

  // Delete a snippet
  delete: async (id: string, signal?: AbortSignal): Promise<void> => {
    return fetchWithErrorHandling<void>(API_ENDPOINTS.SNIPPET(id), {
      method: 'DELETE',
      signal,
    });
  },
}; 
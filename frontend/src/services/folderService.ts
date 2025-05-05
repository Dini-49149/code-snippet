import { API_ENDPOINTS, DEFAULT_HEADERS, ERROR_MESSAGES } from '../config/api';

export interface Folder {
  _id: string;
  name: string;
  parentFolder: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
      }
      throw new Error(ERROR_MESSAGES.SERVER_ERROR);
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getFolders = async (signal?: AbortSignal): Promise<Folder[]> => {
  return fetchWithErrorHandling<Folder[]>(API_ENDPOINTS.FOLDERS, { signal });
};

export const createFolder = async (name: string, parentFolder: string | null, signal?: AbortSignal): Promise<Folder> => {
  return fetchWithErrorHandling<Folder>(API_ENDPOINTS.FOLDERS, {
    method: 'POST',
    body: JSON.stringify({ name, parentFolder }),
    signal,
  });
};

export const updateFolder = async (id: string, name: string, signal?: AbortSignal): Promise<Folder> => {
  return fetchWithErrorHandling<Folder>(API_ENDPOINTS.FOLDER(id), {
    method: 'PUT',
    body: JSON.stringify({ name }),
    signal,
  });
};

export const deleteFolder = async (id: string, signal?: AbortSignal): Promise<void> => {
  return fetchWithErrorHandling<void>(API_ENDPOINTS.FOLDER(id), {
    method: 'DELETE',
    signal,
  });
}; 
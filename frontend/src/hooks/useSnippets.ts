import { useState, useCallback } from 'react';
import { Snippet } from '../types';
import { API_ENDPOINTS } from '../config/api';

export const useSnippets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnippets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.SNIPPETS);
      if (!response.ok) throw new Error('Failed to fetch snippets');
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSnippet = useCallback(async (snippet: Omit<Snippet, '_id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.SNIPPETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet),
      });
      if (!response.ok) throw new Error('Failed to create snippet');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSnippet = useCallback(async (id: string, snippet: Partial<Snippet>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.SNIPPET(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet),
      });
      if (!response.ok) throw new Error('Failed to update snippet');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSnippet = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.SNIPPET(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete snippet');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
  };
}; 
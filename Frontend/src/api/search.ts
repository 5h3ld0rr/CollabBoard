import { request } from './client';
import type { GlobalSearchResults } from '../types';
import { getCachedBoards } from '../db';

export interface SearchResponse {
  data: GlobalSearchResults;
}

/**
 * Execute a global search across workspaces, boards, and tasks.
 * Falls back gracefully to cached data if offline or network is unavailable.
 */
export async function searchGlobal(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<GlobalSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      workspaces: [],
      boards: [],
      tasks: [],
      total: 0,
    };
  }

  // 1. If online, attempt live backend search
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const res = await request<SearchResponse>(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
        { signal: options?.signal }
      );
      if (res && res.data) {
        return res.data;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('[GlobalSearch] Backend search failed, falling back to local cache:', err);
    }
  }

  // 2. Offline fallback: search locally cached boards from PouchDB
  try {
    const cachedBoards = await getCachedBoards();
    const queryLower = trimmed.toLowerCase();

    const matchedBoards = cachedBoards.filter((b) => {
      const titleMatch = b.title?.toLowerCase().includes(queryLower);
      const descMatch = b.description?.toLowerCase().includes(queryLower);
      const tagMatch = b.tags?.some((t) => t.toLowerCase().includes(queryLower));
      return titleMatch || descMatch || tagMatch;
    });

    return {
      workspaces: [],
      boards: matchedBoards.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        workspaceId: b.workspaceId,
        workspaceName: b.workspaceName || 'My Workspace',
        tags: b.tags,
        isFavorite: b.isFavorite,
        stats: b.stats,
        createdAt: b.createdAt,
      })),
      tasks: [],
      total: matchedBoards.length,
    };
  } catch {
    return {
      workspaces: [],
      boards: [],
      tasks: [],
      total: 0,
    };
  }
}

import { request } from './client';
import type { Board } from '../types';

export interface BoardListResponse {
  data: Board[];
}

export interface BoardResponse {
  data: Board;
}

let inFlightBoardsPromise: Promise<Board[]> | null = null;

/**
 * Fetch all available boards for the authenticated user
 */
export async function getBoards(): Promise<Board[]> {
  if (inFlightBoardsPromise) {
    return inFlightBoardsPromise;
  }
  inFlightBoardsPromise = (async () => {
    try {
      const res = await request<BoardListResponse>('/api/boards');
      return res.data || [];
    } catch {
      return [];
    } finally {
      inFlightBoardsPromise = null;
    }
  })();
  return inFlightBoardsPromise;
}

/**
 * Fetch a single board by ID
 */
export async function getBoardById(boardId: string, shareToken?: string): Promise<Board | null> {
  try {
    const url = shareToken
      ? `/api/boards/${boardId}?shareToken=${encodeURIComponent(shareToken)}`
      : `/api/boards/${boardId}`;
    const res = await request<BoardResponse>(url);
    return res.data || null;
  } catch {
    return null;
  }
}

/**
 * Create a new board
 */
export async function createBoard(
  boardData: Partial<Board> & { title: string }
): Promise<Board> {
  const res = await request<BoardResponse>('/api/boards', {
    method: 'POST',
    body: JSON.stringify(boardData),
  });
  return res.data;
}

/**
 * Update an existing board
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<Board>
): Promise<Board> {
  const res = await request<BoardResponse>(`/api/boards/${boardId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return res.data;
}

/**
 * Delete a board by ID
 */
export async function deleteBoard(boardId: string): Promise<boolean> {
  await request(`/api/boards/${boardId}`, {
    method: 'DELETE',
  });
  return true;
}

/**
 * Add a member to a board by user ID with optional role
 */
export async function addBoardMember(
  boardId: string,
  userId: string,
  role?: 'Admin' | 'Editor' | 'Viewer'
): Promise<Board> {
  const res = await request<BoardResponse>(`/api/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify(role ? { userId, role } : { userId }),
  });
  return res.data;
}

/**
 * Update a member's role on a board
 */
export async function updateBoardMemberRole(
  boardId: string,
  memberId: string,
  role: 'Admin' | 'Editor' | 'Viewer'
): Promise<Board> {
  const res = await request<BoardResponse>(`/api/boards/${boardId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return res.data;
}

/**
 * Remove a member from a board
 */
export async function removeBoardMember(boardId: string, memberId: string): Promise<Board> {
  const res = await request<BoardResponse>(`/api/boards/${boardId}/members/${memberId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export interface ShareTokenResponse {
  data: {
    token: string;
    expiresAt: string | null;
    expiresIn: '1h' | '24h' | '7d' | 'never';
    boardId: string;
  };
}

/**
 * Generate a temporary view-only share token URL
 */
export async function generateShareToken(
  boardId: string,
  expiresIn: '1h' | '24h' | '7d' | 'never' = '24h'
): Promise<{ token: string; expiresAt: string | null; expiresIn: string; shareUrl: string }> {
  const res = await request<ShareTokenResponse>(`/api/boards/${boardId}/share-token`, {
    method: 'POST',
    body: JSON.stringify({ expiresIn }),
  });
  const data = res.data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/boards/${boardId}?shareToken=${encodeURIComponent(data.token)}`;
  return {
    ...data,
    shareUrl,
  };
}

/**
 * Reset/revoke all existing temporary share tokens for a board
 */
export async function resetShareToken(boardId: string): Promise<boolean> {
  await request(`/api/boards/${boardId}/share-token/reset`, {
    method: 'POST',
  });
  return true;
}

/**
 * Fetch the currently active share token for a board, if one exists
 */
export async function getActiveShareToken(
  boardId: string
): Promise<{ token: string; expiresAt: string | null; expiresIn: '1h' | '24h' | '7d' | 'never'; shareUrl: string } | null> {
  try {
    const res = await request<{ data: ShareTokenResponse['data'] | null }>(`/api/boards/${boardId}/share-token`);
    if (!res?.data?.token) return null;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/boards/${boardId}?shareToken=${encodeURIComponent(res.data.token)}`;
    return {
      ...res.data,
      shareUrl,
    };
  } catch {
    return null;
  }
}


import { request } from './client';
import type { Board } from '../types';

export interface BoardListResponse {
  data: Board[];
}

export interface BoardResponse {
  data: Board;
}

/**
 * Fetch all available boards for the authenticated user
 */
export async function getBoards(): Promise<Board[]> {
  try {
    const res = await request<BoardListResponse>('/api/boards');
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single board by ID
 */
export async function getBoardById(boardId: string): Promise<Board | null> {
  try {
    const res = await request<BoardResponse>(`/api/boards/${boardId}`);
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
 * Add a member to a board by email
 */
export async function addBoardMember(boardId: string, email: string): Promise<Board> {
  const res = await request<BoardResponse>(`/api/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
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

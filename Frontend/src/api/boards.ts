import { MOCK_BOARDS } from '../data/mockData';
import type { Board } from '../types';

let boardsStorage: Board[] = JSON.parse(JSON.stringify(MOCK_BOARDS));

/**
 * Fetch all available boards
 */
export async function getBoards(): Promise<Board[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [...boardsStorage];
}

/**
 * Fetch a single board by ID
 */
export async function getBoardById(boardId: string): Promise<Board | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const found = boardsStorage.find((b) => b.id === boardId);
  return found || null;
}

/**
 * Create a new board
 */
export async function createBoard(
  boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
): Promise<Board> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const newBoard: Board = {
    ...boardData,
    id: `board-${Date.now()}`,
    stats: {
      totalTasks: 0,
      todoCount: 0,
      inProgressCount: 0,
      doneCount: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
  };

  boardsStorage = [newBoard, ...boardsStorage];
  return newBoard;
}

/**
 * Update an existing board
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<Omit<Board, 'id' | 'createdAt'>>
): Promise<Board> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const index = boardsStorage.findIndex((b) => b.id === boardId);
  if (index !== -1) {
    const updated: Board = {
      ...boardsStorage[index],
      ...updates,
      updatedAt: 'Just now',
    };
    boardsStorage[index] = updated;
    return updated;
  }

  throw new Error(`Board with id "${boardId}" not found`);
}

/**
 * Delete a board by ID
 */
export async function deleteBoard(boardId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const initialLength = boardsStorage.length;
  boardsStorage = boardsStorage.filter((b) => b.id !== boardId);
  return boardsStorage.length < initialLength;
}

/**
 * Toggle board favorite status
 */
export async function toggleFavoriteBoard(boardId: string): Promise<Board> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const board = boardsStorage.find((b) => b.id === boardId);
  if (board) {
    board.isFavorite = !board.isFavorite;
    return board;
  }

  throw new Error(`Board with id "${boardId}" not found`);
}

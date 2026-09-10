import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as tasksApi from '../api/tasks';
import * as boardsApi from '../api/boards';
import {
  saveBoardsToCache,
  saveBoardToCache,
  getCachedBoards,
  getCachedBoard,
  saveTasksToCache,
  getCachedTasks,
  updateCachedTask,
  deleteCachedTask,
  deleteCachedBoard,
  clearCachedBoardTasks,
  enqueueMutation,
} from '../db';
import { flushSyncQueue } from '../sync';
import type { Board, Task, TaskStatus, User } from '../types';
import { hasBoardsChanged, hasBoardChanged, hasTasksChanged } from '../utils';

/* ==========================================================================
   State & Action Types
   ========================================================================== */

export interface BoardState {
  boards: Board[];
  activeBoard: Board | null;
  tasks: Task[];
  boardMembers: User[];
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
}

export type BoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_BOARDS'; payload: Board[] }
  | { type: 'SET_ACTIVE_BOARD'; payload: { board: Board | null; tasks: Task[] } }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'MOVE_TASK_STATUS'; payload: { taskId: string; newStatus: TaskStatus } }
  | { type: 'CLEAR_BOARD_TASKS'; payload: { boardId: string } }
  | { type: 'ADD_BOARD'; payload: Board }
  | { type: 'UPDATE_BOARD'; payload: Board }
  | { type: 'DELETE_BOARD'; payload: { boardId: string } }
  | { type: 'TOGGLE_FAVORITE_BOARD'; payload: { boardId: string } }
  | { type: 'ADD_BOARD_MEMBER'; payload: { boardId: string; user: User } }
  | { type: 'REMOVE_BOARD_MEMBER'; payload: { boardId: string; userId: string } };

/* ==========================================================================
   useReducer Implementation for Task & Board Management
   ========================================================================== */

export const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SYNCING':
      return {
        ...state,
        isSyncing: action.payload,
      };

    case 'SET_OFFLINE':
      return {
        ...state,
        isOffline: action.payload,
      };

    case 'SET_BOARDS':
      return {
        ...state,
        boards: action.payload,
      };

    case 'SET_ACTIVE_BOARD': {
      const { board, tasks } = action.payload;
      return {
        ...state,
        activeBoard: board,
        boardMembers: board?.members || [],
        tasks: tasks,
        isLoading: false,
      };
    }

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload.taskId),
      };

    case 'MOVE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                status: action.payload.newStatus,
                updatedAt: new Date().toISOString(),
              }
            : task
        ),
      };

    case 'CLEAR_BOARD_TASKS':
      return {
        ...state,
        tasks: [],
      };

    case 'ADD_BOARD':
      return {
        ...state,
        boards: [action.payload, ...state.boards],
      };

    case 'UPDATE_BOARD':
      return {
        ...state,
        activeBoard:
          state.activeBoard?.id === action.payload.id
            ? action.payload
            : state.activeBoard,
        boardMembers:
          state.activeBoard?.id === action.payload.id
            ? action.payload.members
            : state.boardMembers,
        boards: state.boards.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };

    case 'DELETE_BOARD':
      return {
        ...state,
        activeBoard:
          state.activeBoard?.id === action.payload.boardId ? null : state.activeBoard,
        tasks:
          state.activeBoard?.id === action.payload.boardId ? [] : state.tasks,
        boards: state.boards.filter((b) => b.id !== action.payload.boardId),
      };

    case 'TOGGLE_FAVORITE_BOARD': {
      const updatedBoards = state.boards.map((b) =>
        b.id === action.payload.boardId ? { ...b, isFavorite: !b.isFavorite } : b
      );
      const updatedActive =
        state.activeBoard?.id === action.payload.boardId
          ? { ...state.activeBoard, isFavorite: !state.activeBoard.isFavorite }
          : state.activeBoard;

      return {
        ...state,
        boards: updatedBoards,
        activeBoard: updatedActive,
      };
    }

    case 'ADD_BOARD_MEMBER': {
      const updatedBoards = state.boards.map((b) => {
        if (b.id !== action.payload.boardId) return b;
        const exists = b.members.some((m) => m.id === action.payload.user.id);
        return exists ? b : { ...b, members: [...b.members, action.payload.user] };
      });
      const updatedActive =
        state.activeBoard?.id === action.payload.boardId
          ? {
              ...state.activeBoard,
              members: state.activeBoard.members.some(
                (m) => m.id === action.payload.user.id
              )
                ? state.activeBoard.members
                : [...state.activeBoard.members, action.payload.user],
            }
          : state.activeBoard;

      return {
        ...state,
        boards: updatedBoards,
        activeBoard: updatedActive,
        boardMembers: updatedActive?.members || state.boardMembers,
      };
    }

    case 'REMOVE_BOARD_MEMBER': {
      const updatedBoards = state.boards.map((b) =>
        b.id === action.payload.boardId
          ? {
              ...b,
              members: b.members.filter((m) => m.id !== action.payload.userId),
            }
          : b
      );
      const updatedActive =
        state.activeBoard?.id === action.payload.boardId
          ? {
              ...state.activeBoard,
              members: state.activeBoard.members.filter(
                (m) => m.id !== action.payload.userId
              ),
            }
          : state.activeBoard;

      return {
        ...state,
        boards: updatedBoards,
        activeBoard: updatedActive,
        boardMembers: updatedActive?.members || state.boardMembers,
      };
    }

    default:
      return state;
  }
};

/* ==========================================================================
   Initial State & Context Definition
   ========================================================================== */

const initialState: BoardState = {
  boards: [],
  activeBoard: null,
  tasks: [],
  boardMembers: [],
  isLoading: false,
  isSyncing: false,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
};

export interface BoardContextValue {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
  loadBoards: (forceRefresh?: boolean) => Promise<void>;
  loadBoard: (boardId: string, forceRefresh?: boolean) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  addTask: (boardId: string, taskInput: Partial<Task> & { title: string }) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  clearBoardTasks: (boardId: string) => Promise<void>;
  addBoard: (boardInput: Partial<Board> & { title: string }) => Promise<Board>;
  updateBoard: (board: Board) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;
  toggleFavoriteBoard: (boardId: string) => void;
  addBoardMember: (boardId: string, email: string) => Promise<void>;
  removeBoardMember: (boardId: string, memberId: string) => Promise<void>;
  syncLocalCache: () => Promise<void>;
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

/* ==========================================================================
   BoardProvider Component
   ========================================================================== */

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { token } = useAuth();

  const loadBoards = useCallback(async (forceRefresh = false) => {
    // 1. Instant Cache Hydration from PouchDB (0ms delay)
    const cachedBoards = await getCachedBoards();
    if (cachedBoards && cachedBoards.length > 0) {
      dispatch({ type: 'SET_BOARDS', payload: cachedBoards });
    } else {
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    // Do NOT fire HTTP requests over network while offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SYNCING', payload: false });
      return;
    }

    // 2. Background Revalidation from API
    try {
      const serverBoards = await boardsApi.getBoards();
      if (serverBoards && serverBoards.length >= 0) {
        const changed = forceRefresh || hasBoardsChanged(cachedBoards, serverBoards);
        if (changed) {
          dispatch({ type: 'SET_BOARDS', payload: serverBoards });
          await saveBoardsToCache(serverBoards);
        }
      }
    } catch (err) {
      console.warn('[LocalFirst] Background loadBoards failed, retaining cached data:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  const loadBoard = useCallback(async (boardId: string, forceRefresh = false) => {
    // 1. Instant Cache Hydration from PouchDB (0ms delay)
    const [cachedBoard, cachedTasks] = await Promise.all([
      getCachedBoard(boardId),
      getCachedTasks(boardId),
    ]);

    if (cachedBoard) {
      dispatch({
        type: 'SET_ACTIVE_BOARD',
        payload: { board: cachedBoard, tasks: cachedTasks || [] },
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    // Do NOT fire HTTP requests over network while offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SYNCING', payload: false });
      return;
    }

    // 2. Background Revalidation from API
    try {
      const [serverBoard, serverTasks] = await Promise.all([
        boardsApi.getBoardById(boardId),
        tasksApi.getBoardTasks(boardId),
      ]);

      if (serverBoard) {
        const boardChanged = forceRefresh || hasBoardChanged(cachedBoard, serverBoard);
        const tasksChanged = forceRefresh || hasTasksChanged(cachedTasks, serverTasks);

        if (boardChanged || tasksChanged) {
          dispatch({
            type: 'SET_ACTIVE_BOARD',
            payload: { board: serverBoard, tasks: serverTasks },
          });
          await Promise.all([
            saveBoardToCache(serverBoard),
            saveTasksToCache(serverTasks, boardId),
          ]);
        }
      } else if (!cachedBoard) {
        dispatch({
          type: 'SET_ACTIVE_BOARD',
          payload: { board: null, tasks: [] },
        });
      }
    } catch (err) {
      console.warn(`[LocalFirst] Background loadBoard for ${boardId} failed, retaining cached data:`, err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, []);

  const addTask = useCallback(async (boardId: string, taskInput: Partial<Task> & { title: string }) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      const localTask: Task = {
        id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        boardId,
        title: taskInput.title,
        description: taskInput.description || '',
        status: taskInput.status || 'todo',
        priority: taskInput.priority || 'medium',
        tags: taskInput.tags || [],
        order: taskInput.order ?? 0,
        dueDate: taskInput.dueDate,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TASK', payload: localTask });
      await updateCachedTask(localTask);
      await enqueueMutation({
        type: 'CREATE_TASK',
        entityId: localTask.id,
        payload: { ...taskInput, boardId },
      });
      return localTask;
    }

    const created = await tasksApi.createTask(boardId, taskInput);
    dispatch({ type: 'ADD_TASK', payload: created });
    await updateCachedTask(created);
    return created;
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      const updatedLocalTask: Task = {
        ...task,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedLocalTask });
      await updateCachedTask(updatedLocalTask);
      await enqueueMutation({
        type: 'UPDATE_TASK',
        entityId: task.id,
        payload: updatedLocalTask,
      });
      return updatedLocalTask;
    }

    try {
      const updated = await tasksApi.updateTask(task.id, task);
      dispatch({ type: 'UPDATE_TASK', payload: updated });
      await updateCachedTask(updated);
      return updated;
    } catch (err: any) {
      // If network suddenly dropped mid-request
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const fallbackTask: Task = {
          ...task,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_TASK', payload: fallbackTask });
        await updateCachedTask(fallbackTask);
        await enqueueMutation({
          type: 'UPDATE_TASK',
          entityId: task.id,
          payload: fallbackTask,
        });
        return fallbackTask;
      }
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { taskId } });
    await deleteCachedTask(taskId);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      await enqueueMutation({
        type: 'DELETE_TASK',
        entityId: taskId,
        payload: {},
      });
      return;
    }

    try {
      await tasksApi.deleteTask(taskId);
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueMutation({
          type: 'DELETE_TASK',
          entityId: taskId,
          payload: {},
        });
        return;
      }
      throw err;
    }
  }, []);

  const moveTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    dispatch({ type: 'MOVE_TASK_STATUS', payload: { taskId, newStatus } });
    const existing = state.tasks.find((t) => t.id === taskId);
    if (existing) {
      await updateCachedTask({
        ...existing,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      await enqueueMutation({
        type: 'MOVE_TASK_STATUS',
        entityId: taskId,
        payload: { status: newStatus },
      });
      return;
    }

    try {
      const updated = await tasksApi.moveTaskStatus(taskId, newStatus);
      dispatch({ type: 'UPDATE_TASK', payload: updated });
      await updateCachedTask(updated);
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueMutation({
          type: 'MOVE_TASK_STATUS',
          entityId: taskId,
          payload: { status: newStatus },
        });
        return;
      }
      if (state.activeBoard) {
        await loadBoard(state.activeBoard.id);
      }
      throw err;
    }
  }, [state.tasks, state.activeBoard, loadBoard]);

  const clearBoardTasks = useCallback(async (boardId: string) => {
    dispatch({ type: 'CLEAR_BOARD_TASKS', payload: { boardId } });
    await clearCachedBoardTasks(boardId);
  }, []);

  const addBoard = useCallback(async (boardInput: Partial<Board> & { title: string }) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      const localBoard: Board = {
        id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: boardInput.title,
        description: boardInput.description || '',
        workspaceId: boardInput.workspaceId || '',
        workspaceName: boardInput.workspaceName || '',
        color: boardInput.color || '#6366f1',
        icon: boardInput.icon || 'Layout',
        isFavorite: boardInput.isFavorite || false,
        members: boardInput.members || [],
        tags: boardInput.tags || [],
        stats: {
          totalTasks: 0,
          todoCount: 0,
          inProgressCount: 0,
          doneCount: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_BOARD', payload: localBoard });
      await saveBoardToCache(localBoard);
      await enqueueMutation({
        type: 'CREATE_BOARD',
        entityId: localBoard.id,
        payload: boardInput,
      });
      return localBoard;
    }

    const created = await boardsApi.createBoard(boardInput);
    dispatch({ type: 'ADD_BOARD', payload: created });
    await saveBoardToCache(created);
    return created;
  }, []);

  const updateBoard = useCallback(async (board: Board) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      dispatch({ type: 'UPDATE_BOARD', payload: board });
      await saveBoardToCache(board);
      await enqueueMutation({
        type: 'UPDATE_BOARD',
        entityId: board.id,
        payload: board,
      });
      return board;
    }

    const updated = await boardsApi.updateBoard(board.id, board);
    dispatch({ type: 'UPDATE_BOARD', payload: updated });
    await saveBoardToCache(updated);
    return updated;
  }, []);

  const deleteBoard = useCallback(async (boardId: string) => {
    dispatch({ type: 'DELETE_BOARD', payload: { boardId } });
    await deleteCachedBoard(boardId);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      await enqueueMutation({
        type: 'DELETE_BOARD',
        entityId: boardId,
        payload: {},
      });
      return;
    }

    await boardsApi.deleteBoard(boardId);
  }, []);

  const toggleFavoriteBoard = useCallback(async (boardId: string) => {
    const targetBoard = state.boards.find((b) => b.id === boardId);
    const nextFavorite = targetBoard ? !targetBoard.isFavorite : true;

    dispatch({ type: 'TOGGLE_FAVORITE_BOARD', payload: { boardId } });

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      if (targetBoard) {
        await saveBoardToCache({ ...targetBoard, isFavorite: nextFavorite });
      }
      await enqueueMutation({
        type: 'UPDATE_BOARD',
        entityId: boardId,
        payload: { isFavorite: nextFavorite },
      });
      return;
    }

    try {
      const updated = await boardsApi.updateBoard(boardId, { isFavorite: nextFavorite });
      await saveBoardToCache(updated);
    } catch {
      dispatch({ type: 'TOGGLE_FAVORITE_BOARD', payload: { boardId } });
    }
  }, [state.boards]);

  const addBoardMember = useCallback(async (boardId: string, email: string) => {
    const updatedBoard = await boardsApi.addBoardMember(boardId, email);
    dispatch({ type: 'UPDATE_BOARD', payload: updatedBoard });
  }, []);

  const removeBoardMember = useCallback(async (boardId: string, memberId: string) => {
    const updatedBoard = await boardsApi.removeBoardMember(boardId, memberId);
    dispatch({ type: 'UPDATE_BOARD', payload: updatedBoard });
  }, []);

  const syncLocalCache = useCallback(async () => {
    await loadBoards();
  }, [loadBoards]);

  // Reactively load boards when token changes
  useEffect(() => {
    if (token) {
      loadBoards();
    } else {
      dispatch({ type: 'SET_BOARDS', payload: [] });
    }
  }, [token, loadBoards]);

  // Auto-sync active board and boards list when connection is restored
  useEffect(() => {
    const handleOnline = async () => {
      dispatch({ type: 'SET_OFFLINE', payload: false });
      try {
        const { processed } = await flushSyncQueue();
        if (processed > 0) {
          console.log(`[BoardContext] Flushed ${processed} offline mutations`);
        }
      } catch (err) {
        console.warn('[BoardContext] flushSyncQueue failed on reconnect:', err);
      }
      loadBoards(true);
      if (state.activeBoard) {
        loadBoard(state.activeBoard.id, true);
      }
    };
    const handleOffline = () => {
      dispatch({ type: 'SET_OFFLINE', payload: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadBoards, loadBoard, state.activeBoard]);

  return (
    <BoardContext.Provider
      value={{
        state,
        dispatch,
        loadBoards,
        loadBoard,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        clearBoardTasks,
        addBoard,
        updateBoard,
        deleteBoard,
        toggleFavoriteBoard,
        addBoardMember,
        removeBoardMember,
        syncLocalCache,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

/* ==========================================================================
   useBoard Custom Hook
   ========================================================================== */

export const useBoard = (): BoardContextValue => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

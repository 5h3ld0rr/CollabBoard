/* oxlint-disable react/only-export-components */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useOptionalNotifications } from './NotificationContext';
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
import {
  flushSyncQueue,
  getSocketClient,
  joinBoardRoom,
  leaveBoardRoom,
  subscribeTaskCreated,
  subscribeTaskUpdated,
  subscribeTaskDeleted,
  subscribeBoardUpdated,
} from '../sync';
import type { Board, Task, TaskStatus, User } from '../types';
import { hasBoardsChanged, hasBoardChanged, hasTasksChanged, playCardDropSound } from '../utils';

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

    case 'ADD_TASK': {
      const exists = state.tasks.some((t) => t.id === action.payload.id);
      if (exists) {
        return {
          ...state,
          tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
        };
      }
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    }

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
  loadBoard: (boardId: string, forceRefresh?: boolean, shareToken?: string) => Promise<void>;
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
  const { token, user } = useAuth();
  const notificationCtx = useOptionalNotifications();
  const addNotification = notificationCtx?.addNotification;

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

  const loadBoard = useCallback(async (boardId: string, forceRefresh = false, shareToken?: string) => {
    // 1. Instant Cache Hydration from PouchDB (0ms delay) - skip if guest with shareToken
    const [cachedBoard, cachedTasks] = await Promise.all([
      getCachedBoard(boardId),
      getCachedTasks(boardId),
    ]);

    if (cachedBoard && !shareToken) {
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
        boardsApi.getBoardById(boardId, shareToken),
        tasksApi.getBoardTasks(boardId, shareToken ? { shareToken } : undefined),
      ]);

      if (serverBoard) {
        const boardChanged = forceRefresh || Boolean(shareToken) || hasBoardChanged(cachedBoard, serverBoard);
        const tasksChanged = forceRefresh || Boolean(shareToken) || hasTasksChanged(cachedTasks, serverTasks);

        if (boardChanged || tasksChanged) {
          dispatch({
            type: 'SET_ACTIVE_BOARD',
            payload: { board: serverBoard, tasks: serverTasks },
          });
          if (!shareToken) {
            await Promise.all([
              saveBoardToCache(serverBoard),
              saveTasksToCache(serverTasks, boardId),
            ]);
          }
        }
      } else if (!cachedBoard || shareToken) {
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
    playCardDropSound();
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

    const payload: Partial<Board> = {
      title: board.title,
      description: board.description,
      color: board.color,
      icon: board.icon,
      tags: board.tags,
      isFavorite: board.isFavorite,
      workspaceId: board.workspaceId,
      workspaceName: board.workspaceName,
    };
    if (board.members && Array.isArray(board.members)) {
      payload.members = board.members.map((m: any) =>
        typeof m === 'object' && m !== null
          ? {
              id: String(m.id || m.email),
              name: m.name,
              email: m.email,
              boardRole: m.boardRole || m.role,
            }
          : String(m)
      ) as any;
    }

    const updated = await boardsApi.updateBoard(board.id, payload);
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

  // Socket.io Room Lifecycle (Join / Leave board room)
  useEffect(() => {
    if (!token) return;

    getSocketClient(token);

    if (state.activeBoard?.id) {
      joinBoardRoom(state.activeBoard.id);
    }

    return () => {
      if (state.activeBoard?.id) {
        leaveBoardRoom(state.activeBoard.id);
      }
    };
  }, [token, state.activeBoard?.id]);

  // Real-Time Task & Board Event Subscriptions with OCC Version Guard & Echo Prevention
  useEffect(() => {
    if (!state.activeBoard?.id) return;

    const activeBoardId = state.activeBoard.id;

    // Handle incoming board:updated (Slide 15 & 17)
    const unsubBoard = subscribeBoardUpdated(async (payload) => {
      if (payload.boardId !== activeBoardId) return;

      // Echo Loop Guard (Slide 17): skip redundant state reload if current user made the change
      if (payload.actorId && user?.id && String(payload.actorId) === String(user.id)) {
        return;
      }

      if (payload.board) {
        // Preserve active user's local favorite status since isFavorite is per-user
        const currentFavorite = state.activeBoard?.id === payload.board.id ? state.activeBoard.isFavorite : undefined;
        const boardWithUserFavorite = currentFavorite !== undefined
          ? { ...payload.board, isFavorite: currentFavorite }
          : payload.board;

        dispatch({ type: 'UPDATE_BOARD', payload: boardWithUserFavorite });
        try {
          await saveBoardToCache(boardWithUserFavorite);
        } catch (err) {
          console.warn('[BoardContext] Failed to cache board:updated:', err);
        }
      }
    });

    // Handle incoming task:created
    const unsubCreated = subscribeTaskCreated(async (payload) => {
      if (String(payload.boardId) !== String(activeBoardId)) return;

      // Echo Loop Guard (Slide 17)
      if (payload.actorId && user?.id && String(payload.actorId) === String(user.id)) {
        return;
      }

      const incoming = payload.task;
      if (!incoming) return;
      dispatch({ type: 'ADD_TASK', payload: incoming });
      try {
        await updateCachedTask(incoming);
      } catch (err) {
        console.warn('[BoardContext] Failed to cache task:created:', err);
      }

      const actor = state.boardMembers.find(
        (m) => String(m.id || (m as any)._id || '') === String(payload.actorId)
      );
      const actorName = actor?.name || 'A teammate';

      if (addNotification) {
        await addNotification({
          title: 'New Task Created',
          message: `${actorName} added "${incoming.title}"`,
          type: 'task_assigned',
          linkUrl: `/boards/${payload.boardId}`,
          actor: actor
            ? {
                name: actor.name,
                initials: actor.initials || actor.name.slice(0, 2).toUpperCase(),
                color: actor.color,
              }
            : undefined,
          meta: {
            taskId: incoming.id,
            boardId: payload.boardId,
          },
        });
      } else {
        playCardDropSound();
      }
    });

    // Handle incoming task:updated with OCC Version Guard
    const unsubUpdated = subscribeTaskUpdated(async (payload) => {
      if (String(payload.boardId) !== String(activeBoardId)) return;

      // Echo Loop Guard (Slide 17)
      if (payload.actorId && user?.id && String(payload.actorId) === String(user.id)) {
        return;
      }

      const incoming = payload.task;
      if (!incoming) return;

      const incomingId = String(incoming.id || (incoming as any)._id || '');
      const current = state.tasks.find(
        (t) => String(t.id || (t as any)._id || '') === incomingId
      );

      // OCC Version Guard: apply if new or version >= current
      if (!current || Number(incoming.version || 1) >= Number(current.version || 0)) {
        dispatch({ type: 'UPDATE_TASK', payload: incoming });
        try {
          await updateCachedTask(incoming);
        } catch (err) {
          console.warn('[BoardContext] Failed to cache task:updated:', err);
        }

        const isStatusMoved = !current || current.status !== incoming.status;
        const actor = state.boardMembers.find(
          (m) => String(m.id || (m as any)._id || '') === String(payload.actorId)
        );
        const actorName = actor?.name || 'A teammate';

        if (isStatusMoved) {
          const statusLabels: Record<string, string> = {
            todo: 'To Do',
            'in-progress': 'In Progress',
            done: 'Completed',
          };
          const newStatusLabel = statusLabels[incoming.status] || incoming.status;

          if (addNotification) {
            await addNotification({
              title: 'Task Moved',
              message: `${actorName} moved "${incoming.title}" to ${newStatusLabel}`,
              type: 'task_status',
              linkUrl: `/boards/${payload.boardId}`,
              actor: actor
                ? {
                    name: actor.name,
                    initials: actor.initials || actor.name.slice(0, 2).toUpperCase(),
                    color: actor.color,
                  }
                : undefined,
              meta: {
                taskId: incoming.id,
                boardId: payload.boardId,
                status: incoming.status,
              },
            });
          } else {
            playCardDropSound();
          }
        } else {
          // Task content was edited/updated by a teammate
          if (addNotification) {
            await addNotification({
              title: 'Task Updated',
              message: `${actorName} updated "${incoming.title}"`,
              type: 'task_status',
              linkUrl: `/boards/${payload.boardId}`,
              actor: actor
                ? {
                    name: actor.name,
                    initials: actor.initials || actor.name.slice(0, 2).toUpperCase(),
                    color: actor.color,
                  }
                : undefined,
              meta: {
                taskId: incoming.id,
                boardId: payload.boardId,
                status: incoming.status,
              },
            });
          } else {
            playCardDropSound();
          }
        }
      } else {
        console.warn(
          `[OCC Guard] Dropped stale/out-of-order task:updated event for task ${incoming.id}: incoming v${incoming.version} <= current v${current.version}`
        );
      }
    });

    // Handle incoming task:deleted for instant column item removal
    const unsubDeleted = subscribeTaskDeleted(async (payload) => {
      if (String(payload.boardId) !== String(activeBoardId)) return;

      // Echo Loop Guard (Slide 17)
      if (payload.actorId && user?.id && String(payload.actorId) === String(user.id)) {
        return;
      }

      const existingTask = state.tasks.find(
        (t) => String(t.id || (t as any)._id || '') === String(payload.taskId)
      );
      dispatch({ type: 'DELETE_TASK', payload: { taskId: payload.taskId } });
      try {
        await deleteCachedTask(payload.taskId);
      } catch (err) {
        console.warn('[BoardContext] Failed to delete cached task from socket event:', err);
      }

      const actor = state.boardMembers.find(
        (m) => String(m.id || (m as any)._id || '') === String(payload.actorId)
      );
      const actorName = actor?.name || 'A teammate';

      if (addNotification) {
        await addNotification({
          title: 'Task Deleted',
          message: existingTask ? `${actorName} deleted "${existingTask.title}"` : `${actorName} removed a task`,
          type: 'system',
          linkUrl: `/boards/${payload.boardId}`,
          actor: actor
            ? {
                name: actor.name,
                initials: actor.initials || actor.name.slice(0, 2).toUpperCase(),
                color: actor.color,
              }
            : undefined,
          meta: {
            taskId: payload.taskId,
            boardId: payload.boardId,
          },
        });
      }
    });

    return () => {
      unsubBoard();
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [state.activeBoard?.id, state.tasks, user?.id, addNotification]);

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

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as tasksApi from '../api/tasks';
import * as boardsApi from '../api/boards';
import type { Board, Task, TaskStatus, User } from '../types';

/* ==========================================================================
   State & Action Types
   ========================================================================== */

export interface BoardState {
  boards: Board[];
  activeBoard: Board | null;
  tasks: Task[];
  boardMembers: User[];
  isLoading: boolean;
}

export type BoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
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
};

export interface BoardContextValue {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
  loadBoards: () => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
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
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

/* ==========================================================================
   BoardProvider Component
   ========================================================================== */

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { token } = useAuth();

  const loadBoards = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const boards = await boardsApi.getBoards();
      dispatch({ type: 'SET_BOARDS', payload: boards });
    } catch (err) {
      console.warn('Failed to load boards:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadBoard = useCallback(async (boardId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [board, boardTasks] = await Promise.all([
        boardsApi.getBoardById(boardId),
        tasksApi.getBoardTasks(boardId),
      ]);

      if (board) {
        dispatch({
          type: 'SET_ACTIVE_BOARD',
          payload: { board, tasks: boardTasks },
        });
      } else {
        dispatch({
          type: 'SET_ACTIVE_BOARD',
          payload: { board: null, tasks: [] },
        });
      }
    } catch {
      dispatch({
        type: 'SET_ACTIVE_BOARD',
        payload: { board: null, tasks: [] },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, []);

  const addTask = useCallback(async (boardId: string, taskInput: Partial<Task> & { title: string }) => {
    const created = await tasksApi.createTask(boardId, taskInput);
    dispatch({ type: 'ADD_TASK', payload: created });
    return created;
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    const updated = await tasksApi.updateTask(task.id, task);
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    return updated;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await tasksApi.deleteTask(taskId);
    dispatch({ type: 'DELETE_TASK', payload: { taskId } });
  }, []);

  const moveTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    dispatch({ type: 'MOVE_TASK_STATUS', payload: { taskId, newStatus } });
    try {
      await tasksApi.moveTaskStatus(taskId, newStatus);
    } catch (err) {
      if (state.activeBoard) {
        loadBoard(state.activeBoard.id);
      }
      throw err;
    }
  }, [state.activeBoard, loadBoard]);

  const clearBoardTasks = useCallback(async (boardId: string) => {
    dispatch({ type: 'CLEAR_BOARD_TASKS', payload: { boardId } });
  }, []);

  const addBoard = useCallback(async (boardInput: Partial<Board> & { title: string }) => {
    const created = await boardsApi.createBoard(boardInput);
    dispatch({ type: 'ADD_BOARD', payload: created });
    return created;
  }, []);

  const updateBoard = useCallback(async (board: Board) => {
    const updated = await boardsApi.updateBoard(board.id, board);
    dispatch({ type: 'UPDATE_BOARD', payload: updated });
    return updated;
  }, []);

  const deleteBoard = useCallback(async (boardId: string) => {
    await boardsApi.deleteBoard(boardId);
    dispatch({ type: 'DELETE_BOARD', payload: { boardId } });
  }, []);

  const toggleFavoriteBoard = useCallback(async (boardId: string) => {
    const targetBoard = state.boards.find((b) => b.id === boardId);
    const nextFavorite = targetBoard ? !targetBoard.isFavorite : true;

    dispatch({ type: 'TOGGLE_FAVORITE_BOARD', payload: { boardId } });

    try {
      await boardsApi.updateBoard(boardId, { isFavorite: nextFavorite });
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

  // Reactively load boards when token changes
  useEffect(() => {
    if (token) {
      loadBoards();
    } else {
      dispatch({ type: 'SET_BOARDS', payload: [] });
    }
  }, [token, loadBoards]);

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

export default BoardContext;

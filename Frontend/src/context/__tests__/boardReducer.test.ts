import { describe, it, expect } from 'vitest';
import { boardReducer, type BoardState, type BoardAction } from '../BoardContext';
import type { Task, TaskStatus, Board, User } from '../../types';

describe('boardReducer State Machine Tests', () => {
  const initialState: BoardState = {
    boards: [],
    activeBoard: null,
    tasks: [],
    boardMembers: [],
    isLoading: false,
    isSyncing: false,
    isOffline: false,
  };

  const sampleTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    status: 'todo' as TaskStatus,
    boardId: 'board-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    order: 0,
    priority: 'medium',
    version: 1,
    description: '',
    tags: [],
  } as Task;

  const sampleBoard: Board = {
    id: 'board-1',
    workspaceId: 'w1',
    title: 'Roadmap',
    members: [{ id: 'u1', name: 'User 1' }] as any,
    isFavorite: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as Board;

  it('handles SET_LOADING, SET_SYNCING, and SET_OFFLINE flags', () => {
    let state = boardReducer(initialState, { type: 'SET_LOADING', payload: true });
    expect(state.isLoading).toBe(true);

    state = boardReducer(state, { type: 'SET_SYNCING', payload: true });
    expect(state.isSyncing).toBe(true);

    state = boardReducer(state, { type: 'SET_OFFLINE', payload: true });
    expect(state.isOffline).toBe(true);
  });

  it('handles SET_BOARDS and SET_ACTIVE_BOARD', () => {
    let state = boardReducer(initialState, { type: 'SET_BOARDS', payload: [sampleBoard] });
    expect(state.boards).toHaveLength(1);

    state = boardReducer(state, {
      type: 'SET_ACTIVE_BOARD',
      payload: { board: sampleBoard, tasks: [sampleTask] },
    });
    expect(state.activeBoard).toEqual(sampleBoard);
    expect(state.boardMembers).toEqual(sampleBoard.members);
    expect(state.tasks).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('handles ADD_BOARD, UPDATE_BOARD, DELETE_BOARD, and TOGGLE_FAVORITE_BOARD', () => {
    let state = boardReducer(initialState, { type: 'ADD_BOARD', payload: sampleBoard });
    expect(state.boards).toHaveLength(1);

    const activeState: BoardState = {
      ...state,
      activeBoard: sampleBoard,
      tasks: [sampleTask],
    };

    // Update board
    const updatedBoard = { ...sampleBoard, title: 'Updated Roadmap' };
    state = boardReducer(activeState, { type: 'UPDATE_BOARD', payload: updatedBoard });
    expect(state.activeBoard?.title).toBe('Updated Roadmap');
    expect(state.boards[0].title).toBe('Updated Roadmap');

    // Toggle favorite
    state = boardReducer(state, { type: 'TOGGLE_FAVORITE_BOARD', payload: { boardId: 'board-1' } });
    expect(state.activeBoard?.isFavorite).toBe(true);
    expect(state.boards[0].isFavorite).toBe(true);

    // Delete board
    state = boardReducer(state, { type: 'DELETE_BOARD', payload: { boardId: 'board-1' } });
    expect(state.activeBoard).toBeNull();
    expect(state.tasks).toHaveLength(0);
    expect(state.boards).toHaveLength(0);
  });

  it('handles ADD_BOARD_MEMBER and REMOVE_BOARD_MEMBER', () => {
    const activeState: BoardState = {
      ...initialState,
      boards: [sampleBoard],
      activeBoard: sampleBoard,
      boardMembers: sampleBoard.members,
    };

    const newUser: User = { id: 'u2', name: 'User 2', email: 'u2@example.com' } as any;

    // Add new member
    let state = boardReducer(activeState, {
      type: 'ADD_BOARD_MEMBER',
      payload: { boardId: 'board-1', user: newUser },
    });
    expect(state.activeBoard?.members).toHaveLength(2);
    expect(state.boards[0].members).toHaveLength(2);

    // Duplicate add should be ignored
    state = boardReducer(state, {
      type: 'ADD_BOARD_MEMBER',
      payload: { boardId: 'board-1', user: newUser },
    });
    expect(state.activeBoard?.members).toHaveLength(2);

    // Remove member
    state = boardReducer(state, {
      type: 'REMOVE_BOARD_MEMBER',
      payload: { boardId: 'board-1', userId: 'u2' },
    });
    expect(state.activeBoard?.members).toHaveLength(1);
    expect(state.boards[0].members).toHaveLength(1);
  });

  it('handles ADD_TASK, UPDATE_TASK, DELETE_TASK, and CLEAR_BOARD_TASKS', () => {
    let state = boardReducer(initialState, { type: 'ADD_TASK', payload: sampleTask });
    expect(state.tasks).toHaveLength(1);

    const updatedTask = { ...sampleTask, title: 'Updated Title' };
    state = boardReducer(state, { type: 'UPDATE_TASK', payload: updatedTask });
    expect(state.tasks[0].title).toBe('Updated Title');

    const newTask2 = { ...sampleTask, id: 'task-2', title: 'Task 2' };
    state = boardReducer(state, { type: 'ADD_TASK', payload: newTask2 });
    expect(state.tasks).toHaveLength(2);

    state = boardReducer(state, { type: 'DELETE_TASK', payload: { taskId: 'task-1' } });
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].id).toBe('task-2');

    state = boardReducer(state, { type: 'CLEAR_BOARD_TASKS', payload: { boardId: 'board-1' } });
    expect(state.tasks).toHaveLength(0);
  });

  it('handles MOVE_TASK_STATUS with timestamp update', () => {
    const stateWithTask: BoardState = {
      ...initialState,
      tasks: [sampleTask],
    };

    const action: BoardAction = {
      type: 'MOVE_TASK_STATUS',
      payload: { taskId: 'task-1', newStatus: 'in-progress' as TaskStatus },
    };

    const newState = boardReducer(stateWithTask, action);
    expect(newState.tasks[0].status).toBe('in-progress');
    expect(newState.tasks[0].updatedAt).not.toBe('2023-01-01');
  });

  it('returns unchanged state for unhandled action types', () => {
    const unhandledAction = { type: 'UNKNOWN_ACTION' } as any;
    const unchanged = boardReducer(initialState, unhandledAction);
    expect(unchanged).toBe(initialState);
  });
});

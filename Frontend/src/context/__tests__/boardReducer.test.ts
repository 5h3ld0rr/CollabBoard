import { describe, it, expect } from 'vitest';
import { boardReducer, BoardState, BoardAction } from '../BoardContext';
import { Task, TaskStatus } from '../../types';

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

  it('handles moving tasks between columns (MOVE_TASK_STATUS)', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'TODO' as TaskStatus,
      boardId: 'board-1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      position: 0,
      description: '',
      assigneeIds: [],
      tags: [],
    };

    const stateWithTask: BoardState = {
      ...initialState,
      tasks: [task],
    };

    const action: BoardAction = {
      type: 'MOVE_TASK_STATUS',
      payload: { taskId: 'task-1', newStatus: 'IN_PROGRESS' as TaskStatus },
    };

    const newState = boardReducer(stateWithTask, action);

    expect(newState.tasks[0].status).toBe('IN_PROGRESS');
    expect(newState.tasks[0].updatedAt).not.toBe('2023-01-01');
  });

  it('handles updating optimistic local state (UPDATE_TASK)', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Old Title',
      status: 'TODO' as TaskStatus,
      boardId: 'board-1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      position: 0,
      description: '',
      assigneeIds: [],
      tags: [],
    };

    const stateWithTask: BoardState = {
      ...initialState,
      tasks: [task],
    };

    const updatedTask = { ...task, title: 'New Title' };
    const action: BoardAction = {
      type: 'UPDATE_TASK',
      payload: updatedTask,
    };

    const newState = boardReducer(stateWithTask, action);
    expect(newState.tasks[0].title).toBe('New Title');
  });

  it('handles conflict rollbacks via replacing tasks (SET_TASKS)', () => {
    const oldTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'IN_PROGRESS' as TaskStatus,
      boardId: 'board-1',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      position: 0,
      description: '',
      assigneeIds: [],
      tags: [],
    };

    const stateWithTask: BoardState = {
      ...initialState,
      tasks: [oldTask],
    };

    const serverTask = { ...oldTask, status: 'TODO' as TaskStatus }; // Server's source of truth

    const action: BoardAction = {
      type: 'SET_TASKS',
      payload: [serverTask],
    };

    const newState = boardReducer(stateWithTask, action);
    expect(newState.tasks[0].status).toBe('TODO'); // Reverted to server truth
  });
});

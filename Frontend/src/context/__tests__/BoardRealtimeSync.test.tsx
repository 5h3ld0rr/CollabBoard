import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BoardProvider, useBoard } from '../BoardContext';
import * as socketClient from '../../sync/socketClient';
import * as db from '../../db';
import * as boardsApi from '../../api/boards';
import * as tasksApi from '../../api/tasks';
import type { Task } from '../../types';

// Mock DB and APIs
vi.mock('../../db');
vi.mock('../../api/boards');
vi.mock('../../api/tasks');
vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Nishitha', email: 'nishitha@nsbm.lk' },
    token: 'jwt-token-123',
    isAuthenticated: true,
  }),
}));

vi.mock('../../sync/socketClient', () => {
  return {
    getSocketClient: vi.fn(),
    joinBoardRoom: vi.fn(),
    leaveBoardRoom: vi.fn(),
    subscribeTaskCreated: vi.fn(),
    subscribeTaskUpdated: vi.fn(),
    subscribeTaskDeleted: vi.fn(),
  };
});

// Test component to observe tasks in BoardProvider
const TestHarness: React.FC = () => {
  const { state, loadBoard } = useBoard();

  React.useEffect(() => {
    loadBoard('board-sync-1');
  }, [loadBoard]);

  return (
    <div>
      <div data-testid="active-board-title">{state.activeBoard?.title || 'No active board'}</div>
      <ul data-testid="task-list">
        {state.tasks.map((task) => (
          <li key={task.id} data-testid={`task-${task.id}`}>
            <span data-testid={`task-title-${task.id}`}>{task.title}</span>
            <span data-testid={`task-version-${task.id}`}>{task.version}</span>
            <span data-testid={`task-status-${task.id}`}>{task.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('BoardContext Real-Time Task Sync & OCC Version Guard Suite', () => {
  let taskCreatedHandler: ((payload: any) => void) | null = null;
  let taskUpdatedHandler: ((payload: any) => void) | null = null;
  let taskDeletedHandler: ((payload: any) => void) | null = null;

  const mockBoard = {
    id: 'board-sync-1',
    title: 'Real-Time Sync Board',
    members: [],
    tags: [],
    columns: [{ id: 'todo', title: 'To Do', position: 0 }],
  };

  const initialTask: Task = {
    id: 't-1',
    boardId: 'board-sync-1',
    title: 'Initial Task',
    status: 'todo',
    priority: 'medium',
    version: 1,
    order: 0,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(db, 'getCachedBoards').mockResolvedValue([mockBoard as any]);
    vi.spyOn(db, 'getCachedBoard').mockResolvedValue(mockBoard as any);
    vi.spyOn(db, 'getCachedTasks').mockResolvedValue([initialTask]);
    vi.spyOn(boardsApi, 'getBoards').mockResolvedValue([mockBoard as any]);
    vi.spyOn(boardsApi, 'getBoardById').mockResolvedValue(mockBoard as any);
    vi.spyOn(tasksApi, 'getBoardTasks').mockResolvedValue([initialTask]);

    (socketClient.subscribeTaskCreated as any).mockImplementation((cb: any) => {
      taskCreatedHandler = cb;
      return () => {
        taskCreatedHandler = null;
      };
    });

    (socketClient.subscribeTaskUpdated as any).mockImplementation((cb: any) => {
      taskUpdatedHandler = cb;
      return () => {
        taskUpdatedHandler = null;
      };
    });

    (socketClient.subscribeTaskDeleted as any).mockImplementation((cb: any) => {
      taskDeletedHandler = cb;
      return () => {
        taskDeletedHandler = null;
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('joins active board room and registers task event listeners', async () => {
    const { unmount } = render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );

    expect(socketClient.getSocketClient).toHaveBeenCalledWith('jwt-token-123');
    unmount();
  });

  it('handles task:created event and adds new task to state', async () => {
    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );

    // Wait for initial task to be hydrated
    const taskItem = await screen.findByTestId('task-t-1');
    expect(taskItem).toBeDefined();

    // Trigger task:created event for another task
    const newTask: Task = {
      id: 't-2',
      boardId: 'board-sync-1',
      title: 'Real-Time Created Task',
      status: 'in-progress',
      priority: 'high',
      version: 1,
      order: 1,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      taskCreatedHandler?.({
        task: newTask,
        boardId: 'board-sync-1',
        actorId: 'u2',
        version: 1,
      });
    });

    expect(await screen.findByTestId('task-t-2')).toBeDefined();
    expect(screen.getByTestId('task-title-t-2').textContent).toBe('Real-Time Created Task');
  });

  it('enforces OCC Version Guard: applies newer versions and drops out-of-order/stale versions', async () => {
    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );

    // 1. Initial version is 1
    const versionEl = await screen.findByTestId('task-version-t-1');
    expect(versionEl.textContent).toBe('1');

    // 2. Incoming update with version 3 (newer) -> Applied
    act(() => {
      taskUpdatedHandler?.({
        task: {
          ...initialTask,
          title: 'Updated to Version 3',
          version: 3,
        },
        boardId: 'board-sync-1',
        actorId: 'u2',
        version: 3,
      });
    });

    expect(screen.getByTestId('task-title-t-1').textContent).toBe('Updated to Version 3');
    expect(screen.getByTestId('task-version-t-1').textContent).toBe('3');

    // 3. Incoming out-of-order update with version 2 (stale packet delivered late) -> Dropped
    act(() => {
      taskUpdatedHandler?.({
        task: {
          ...initialTask,
          title: 'Stale Version 2 Overwrite Attempt',
          version: 2,
        },
        boardId: 'board-sync-1',
        actorId: 'u2',
        version: 2,
      });
    });

    // Content should STILL remain version 3, not overwritten by stale version 2
    expect(screen.getByTestId('task-title-t-1').textContent).toBe('Updated to Version 3');
    expect(screen.getByTestId('task-version-t-1').textContent).toBe('3');
  });

  it('handles task:deleted event and removes task in real time', async () => {
    render(
      <BoardProvider>
        <TestHarness />
      </BoardProvider>
    );

    expect(await screen.findByTestId('task-t-1')).toBeDefined();

    act(() => {
      taskDeletedHandler?.({
        taskId: 't-1',
        boardId: 'board-sync-1',
        actorId: 'u2',
        version: 1,
      });
    });

    expect(screen.queryByTestId('task-t-1')).toBeNull();
  });
});

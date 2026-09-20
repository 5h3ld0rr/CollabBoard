import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { BoardView } from '../BoardView';
import { BoardProvider } from '../../context/BoardContext';
import { NotificationProvider } from '../../context/NotificationContext';
import * as syncModule from '../../sync';
import * as boardsApi from '../../api/boards';
import * as tasksApi from '../../api/tasks';
import * as db from '../../db';

vi.mock('../../api/boards');
vi.mock('../../api/tasks');
vi.mock('../../db');
vi.mock('../../context/AuthContext', async () => {
  const React = await import('react');
  const mockAuth = {
    user: { id: 'usr-xenon', name: '32BitXenon', email: 'ruwinikanchana1976@gmail.com' },
    token: 'jwt-token-xenon',
    isAuthenticated: true,
  };
  return {
    AuthContext: React.createContext(mockAuth as any),
    useAuth: () => mockAuth,
  };
});

vi.mock('../../sync', async () => {
  const actual = await vi.importActual('../../sync');
  return {
    ...actual,
    getSocketClient: vi.fn(),
    joinBoardRoom: vi.fn(),
    leaveBoardRoom: vi.fn(),
    emitBoardJoin: vi.fn(),
    emitBoardLeave: vi.fn(),
    subscribePresenceUpdate: vi.fn(),
    subscribeBoardUpdated: vi.fn(),
    subscribeTaskCreated: vi.fn(),
    subscribeTaskUpdated: vi.fn(),
    subscribeTaskDeleted: vi.fn(),
  };
});

describe('Member 2: 32BitXenon - BoardView Socket Events & Live Presence Suite', () => {
  let presenceCallback: ((users: string[]) => void) | null = null;
  let _boardUpdatedCallback: ((payload: any) => void) | null = null;

  const mockBoard = {
    id: 'b-live-1',
    title: 'Live Sprint Board',
    description: 'Real-time collaborative kanban',
    workspaceName: 'Engineering',
    workspaceId: 'ws-1',
    members: [{ id: 'usr-xenon', name: '32BitXenon' }],
    tags: ['sprint-15'],
    stats: { totalTasks: 1, todoCount: 1, inProgressCount: 0, doneCount: 0 },
  };

  const mockTask = {
    id: 'task-live-1',
    title: 'Task in Live Board',
    status: 'todo' as const,
    priority: 'high' as const,
    boardId: 'b-live-1',
    order: 0,
    version: 1,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(db, 'getCachedBoard').mockResolvedValue(mockBoard as any);
    vi.spyOn(db, 'getCachedTasks').mockResolvedValue([mockTask]);
    vi.spyOn(db, 'getCachedNotifications').mockResolvedValue([]);
    vi.spyOn(db, 'subscribeNotificationsChange').mockReturnValue(() => {});
    vi.spyOn(boardsApi, 'getBoardById').mockResolvedValue(mockBoard as any);
    vi.spyOn(tasksApi, 'getBoardTasks').mockResolvedValue([mockTask]);

    (syncModule.subscribePresenceUpdate as any).mockImplementation((cb: any) => {
      presenceCallback = cb;
      return () => {
        presenceCallback = null;
      };
    });

    (syncModule.subscribeBoardUpdated as any).mockImplementation((cb: any) => {
      _boardUpdatedCallback = cb;
      return () => {
        _boardUpdatedCallback = null;
      };
    });

    (syncModule.subscribeTaskCreated as any).mockReturnValue(() => {});
    (syncModule.subscribeTaskUpdated as any).mockReturnValue(() => {});
    (syncModule.subscribeTaskDeleted as any).mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits board:join on mount and board:leave on unmount for active board route', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/boards/b-live-1']}>
        <NotificationProvider>
          <BoardProvider>
            <Routes>
              <Route path="/boards/:id" element={<BoardView />} />
            </Routes>
          </BoardProvider>
        </NotificationProvider>
      </MemoryRouter>
    );

    expect(syncModule.emitBoardJoin).toHaveBeenCalledWith('b-live-1');

    unmount();
    expect(syncModule.emitBoardLeave).toHaveBeenCalledWith('b-live-1');
  });

  it('renders live collaborator presence indicator and updates on presence:update event', async () => {
    render(
      <MemoryRouter initialEntries={['/boards/b-live-1']}>
        <NotificationProvider>
          <BoardProvider>
            <Routes>
              <Route path="/boards/:id" element={<BoardView />} />
            </Routes>
          </BoardProvider>
        </NotificationProvider>
      </MemoryRouter>
    );

    const indicator = await screen.findByTestId('live-presence-indicator');
    expect(indicator).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-xenon')).toBeDefined();

    // Simulate presence update with 3 active collaborators
    act(() => {
      presenceCallback?.(['usr-xenon', 'usr-alex', 'usr-clara']);
    });

    expect(screen.getByTestId('presence-avatar-usr-xenon')).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-alex')).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-clara')).toBeDefined();
  });

  it('renders live column header counters matching active tasks', async () => {
    render(
      <MemoryRouter initialEntries={['/boards/b-live-1']}>
        <NotificationProvider>
          <BoardProvider>
            <Routes>
              <Route path="/boards/:id" element={<BoardView />} />
            </Routes>
          </BoardProvider>
        </NotificationProvider>
      </MemoryRouter>
    );

    const todoCounter = await screen.findByTestId('column-task-count-todo');
    expect(todoCounter.textContent).toBe('1');

    const inProgressCounter = screen.getByTestId('column-task-count-in-progress');
    expect(inProgressCounter.textContent).toBe('0');

    const doneCounter = screen.getByTestId('column-task-count-done');
    expect(doneCounter.textContent).toBe('0');
  });
});

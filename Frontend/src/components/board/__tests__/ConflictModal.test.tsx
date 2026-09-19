import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictModal } from '../ConflictModal';
import type { Task } from '../../../types';

describe('ConflictModal Component', () => {
  const mockLocalTask: Task = {
    id: 'task-101',
    title: 'Local Task Title',
    description: 'Local Task Description',
    status: 'doing',
    priority: 'urgent',
    boardId: 'board-1',
    version: 1,
    assignee: 'Alice',
    dueDate: '2026-09-20',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  };

  const mockServerTask: Task = {
    id: 'task-101',
    title: 'Server Task Title',
    description: 'Server Task Description',
    status: 'done',
    priority: 'normal',
    boardId: 'board-1',
    version: 2,
    assignee: 'Bob',
    dueDate: '2026-09-25',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  };

  const mockOnClose = vi.fn();
  const mockOnOverwrite = vi.fn().mockResolvedValue(undefined);
  const mockOnDiscard = vi.fn();
  const mockOnMerge = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConflictModal
        isOpen={false}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders conflict modal with version indicators and side-by-side details', () => {
    render(
      <ConflictModal
        isOpen={true}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    expect(screen.getByText(/version conflict detected/i)).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Local Task Title')).toBeInTheDocument();
    expect(screen.getByText('Server Task Title')).toBeInTheDocument();
  });

  it('triggers onClose when the close icon button is clicked', () => {
    render(
      <ConflictModal
        isOpen={true}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard with serverTask and closes when discard button is clicked', () => {
    render(
      <ConflictModal
        isOpen={true}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    const discardBtn = screen.getByRole('button', { name: /discard my changes & use server/i });
    fireEvent.click(discardBtn);

    expect(mockOnDiscard).toHaveBeenCalledWith(mockServerTask);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onOverwrite with local changes and latest server version base', async () => {
    render(
      <ConflictModal
        isOpen={true}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    const overwriteBtn = screen.getByRole('button', { name: /force overwrite \(use mine\)/i });
    fireEvent.click(overwriteBtn);

    await waitFor(() => {
      expect(mockOnOverwrite).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockLocalTask,
          version: 2,
        })
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('switches to interactive merge mode, toggles fields, and submits merged task', async () => {
    render(
      <ConflictModal
        isOpen={true}
        onClose={mockOnClose}
        localTask={mockLocalTask}
        serverTask={mockServerTask}
        onOverwrite={mockOnOverwrite}
        onDiscard={mockOnDiscard}
        onMerge={mockOnMerge}
      />
    );

    const mergeTab = screen.getByRole('button', { name: /interactive field merge/i });
    fireEvent.click(mergeTab);

    expect(screen.getByText(/click on the version you wish to keep for each field/i)).toBeInTheDocument();

    // Select SERVER for status
    const serverStatusBtn = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes('SERVER') && btn.textContent?.includes('done')
    );
    expect(serverStatusBtn).toBeDefined();
    if (serverStatusBtn) {
      fireEvent.click(serverStatusBtn);
    }

    const saveMergedBtn = screen.getByRole('button', { name: /save merged version/i });
    fireEvent.click(saveMergedBtn);

    await waitFor(() => {
      expect(mockOnMerge).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Local Task Title',
          status: 'done',
          version: 2,
        })
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceSkeleton, WorkspaceRedirect, WorkspaceSwitcher, CreateWorkspaceModal } from '../index';
import * as apiModule from '../../../api';

vi.mock('../../../api', () => ({
  getWorkspaces: vi.fn(),
}));

describe('workspace components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WorkspaceSkeleton', () => {
    it('renders skeleton placeholders', () => {
      const { container } = render(<WorkspaceSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('WorkspaceRedirect', () => {
    it('redirects to first workspace route on success', async () => {
      vi.spyOn(apiModule, 'getWorkspaces').mockResolvedValue([
        { id: 'ws_alpha', name: 'Alpha Corp' } as any,
      ]);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<WorkspaceRedirect />} />
            <Route path="/workspaces/:id" element={<div data-testid="workspace-target">Workspace Target</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('workspace-target')).toBeInTheDocument();
      });
    });

    it('redirects to /workspaces/default if workspace list is empty', async () => {
      vi.spyOn(apiModule, 'getWorkspaces').mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<WorkspaceRedirect />} />
            <Route path="/workspaces/default" element={<div data-testid="default-ws">Default Workspace</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('default-ws')).toBeInTheDocument();
      });
    });

    it('redirects to /login if fetching workspaces throws', async () => {
      vi.spyOn(apiModule, 'getWorkspaces').mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<WorkspaceRedirect />} />
            <Route path="/login" element={<div data-testid="login-fallback">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('login-fallback')).toBeInTheDocument();
      });
    });
  });

  describe('WorkspaceSwitcher', () => {
    const workspaces = [
      { id: 'w1', name: 'Engineering', role: 'admin' },
      { id: 'w2', name: 'Design', role: 'member' },
    ] as any;

    it('toggles dropdown and handles workspace selection', async () => {
      const handleSelect = vi.fn();
      const handleOpenCreate = vi.fn();

      render(
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspace={workspaces[0]}
          onSelectWorkspace={handleSelect}
          onOpenCreateWorkspace={handleOpenCreate}
        />
      );

      expect(screen.getByText('Engineering')).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /engineering/i }));

      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Create New Workspace')).toBeInTheDocument();

      await user.click(screen.getByText('Design'));
      expect(handleSelect).toHaveBeenCalledWith(workspaces[1]);

      await user.click(screen.getByRole('button', { name: /engineering/i }));
      await user.click(screen.getByText('Create New Workspace'));
      expect(handleOpenCreate).toHaveBeenCalled();
    });
  });

  describe('CreateWorkspaceModal', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <CreateWorkspaceModal isOpen={false} onClose={vi.fn()} onCreateWorkspace={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('submits valid form data and triggers onClose on success', async () => {
      const handleCreate = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <CreateWorkspaceModal isOpen={true} onClose={handleClose} onCreateWorkspace={handleCreate} />
      );

      expect(screen.getByText('Create New Workspace')).toBeInTheDocument();

      const user = userEvent.setup();
      const nameInput = screen.getByPlaceholderText(/infrastructure & devops/i);
      await user.type(nameInput, 'Mobile Team');

      const submitBtn = screen.getByRole('button', { name: /create workspace/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(handleCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Mobile Team',
          })
        );
        expect(handleClose).toHaveBeenCalled();
      });
    });

    it('displays error message when creation fails', async () => {
      const handleCreate = vi.fn().mockRejectedValue(new Error('Workspace name already taken'));
      const handleClose = vi.fn();

      render(
        <CreateWorkspaceModal isOpen={true} onClose={handleClose} onCreateWorkspace={handleCreate} />
      );

      const user = userEvent.setup();
      const nameInput = screen.getByPlaceholderText(/infrastructure & devops/i);
      await user.type(nameInput, 'Duplicate Team');

      const submitBtn = screen.getByRole('button', { name: /create workspace/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Workspace name already taken/i)).toBeInTheDocument();
      });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });
});

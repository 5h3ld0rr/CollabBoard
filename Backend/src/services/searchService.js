import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { taskRepo } from '../repos/taskRepo.js';

/**
 * Global search across all workspaces, boards, and tasks accessible to the user
 */
export async function searchAll(userId, queryParams = {}) {
  const { q = '', type = 'all', limit = 10 } = queryParams;
  const searchTerm = (q || '').trim().toLowerCase();

  // If search query is empty, return empty sets
  if (!searchTerm) {
    return {
      workspaces: [],
      boards: [],
      tasks: [],
      total: 0,
    };
  }

  // 1. Fetch user accessible workspaces & boards
  const [allWorkspaces, userBoards] = await Promise.all([
    workspaceRepo.listByUserId(userId),
    boardRepo.listByUserId(userId),
  ]);

  // Create lookup maps for fast enrichment
  const workspaceMap = new Map(allWorkspaces.map((ws) => [String(ws.id), ws]));
  const boardMap = new Map(userBoards.map((b) => [String(b.id), b]));
  const accessibleBoardIds = new Set(userBoards.map((b) => String(b.id)));

  const results = {
    workspaces: [],
    boards: [],
    tasks: [],
    total: 0,
  };

  // --- Search Workspaces ---
  if (type === 'all' || type === 'workspaces') {
    const matchedWorkspaces = allWorkspaces.filter((ws) => {
      const nameMatch = ws.name?.toLowerCase().includes(searchTerm);
      const descMatch = ws.description?.toLowerCase().includes(searchTerm);
      return nameMatch || descMatch;
    });

    // Enrich with live board count for the user
    results.workspaces = matchedWorkspaces.slice(0, limit).map((ws) => {
      const boardCount = userBoards.filter((b) => String(b.workspaceId) === String(ws.id)).length;
      return {
        id: String(ws.id),
        name: ws.name,
        description: ws.description || '',
        color: ws.color || 'from-indigo-600 to-violet-600',
        boardCount,
      };
    });
  }

  // --- Search Boards ---
  if (type === 'all' || type === 'boards') {
    const matchedBoards = userBoards.filter((b) => {
      const titleMatch = b.title?.toLowerCase().includes(searchTerm);
      const descMatch = b.description?.toLowerCase().includes(searchTerm);
      const tagMatch = Array.isArray(b.tags) && b.tags.some((t) => t.toLowerCase().includes(searchTerm));
      return titleMatch || descMatch || tagMatch;
    });

    results.boards = matchedBoards.slice(0, limit).map((b) => {
      const ws = b.workspaceId ? workspaceMap.get(String(b.workspaceId)) : null;
      return {
        id: String(b.id),
        title: b.title,
        description: b.description || '',
        workspaceId: b.workspaceId ? String(b.workspaceId) : '',
        workspaceName: ws?.name || 'My Workspace',
        tags: b.tags || [],
        isFavorite: Boolean(b.isFavorite),
        stats: b.stats || { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
        createdAt: b.createdAt,
      };
    });
  }

  // --- Search Tasks ---
  if (type === 'all' || type === 'tasks') {
    const allTasks = await taskRepo.findAll();

    // Only inspect tasks belonging to accessible boards
    const matchedTasks = allTasks.filter((t) => {
      if (!accessibleBoardIds.has(String(t.boardId))) return false;

      const titleMatch = t.title?.toLowerCase().includes(searchTerm);
      const descMatch = t.description?.toLowerCase().includes(searchTerm);
      const tagMatch = Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(searchTerm));
      const assigneeMatch = typeof t.assignee === 'string' && t.assignee.toLowerCase().includes(searchTerm);

      return titleMatch || descMatch || tagMatch || assigneeMatch;
    });

    results.tasks = matchedTasks.slice(0, limit).map((t) => {
      const board = boardMap.get(String(t.boardId));
      const ws = board?.workspaceId ? workspaceMap.get(String(board.workspaceId)) : null;

      return {
        id: String(t.id),
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        boardId: String(t.boardId),
        boardTitle: board?.title || 'Unknown Board',
        workspaceId: board?.workspaceId ? String(board.workspaceId) : '',
        workspaceName: ws?.name || 'My Workspace',
        tags: t.tags || [],
        dueDate: t.dueDate,
        createdAt: t.createdAt,
      };
    });
  }

  results.total = results.workspaces.length + results.boards.length + results.tasks.length;
  return results;
}

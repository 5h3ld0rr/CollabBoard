import { randomUUID } from 'node:crypto';

// In-memory boards collection with seeded test data
const boards = [
  {
    id: 'b1',
    title: 'Sprint Planning (Core Platform)',
    description: 'Sprint planning and roadmap for Project Alpha',
    workspaceId: 'ws-1',
    workspaceName: 'Core Engineering',
    color: 'from-indigo-600 to-violet-600',
    icon: 'Kanban',
    isFavorite: true,
    tags: ['Core', 'Sprint-12'],
    stats: { totalTasks: 4, todoCount: 2, inProgressCount: 1, doneCount: 1 },
    ownerId: '1',
    members: ['1', '2'],
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
  },
  {
    id: 'b2',
    title: 'Marketing Campaign (Shared)',
    description: 'Q3 Marketing launch tasks and user acquisition',
    workspaceId: 'ws-1',
    workspaceName: 'Core Engineering',
    color: 'from-emerald-600 to-teal-600',
    icon: 'Layers',
    isFavorite: false,
    tags: ['Marketing', 'Launch'],
    stats: { totalTasks: 3, todoCount: 1, inProgressCount: 1, doneCount: 1 },
    ownerId: '1',
    members: ['1', '2'],
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
  },
  {
    id: 'b3',
    title: 'Design System & UI Library',
    description: 'Component architecture, tokens, and UX guidelines',
    workspaceId: 'ws-2',
    workspaceName: 'Product & Design',
    color: 'from-fuchsia-600 to-pink-600',
    icon: 'Layers',
    isFavorite: true,
    tags: ['Design', 'UI/UX'],
    ownerId: '1',
    members: ['1'],
    createdAt: new Date().toISOString(),
    updatedAt: 'Just now',
  },
];

export const boardRepo = {
  async listByUserId(userId) {
    const uid = String(userId);
    return boards.filter(
      (b) => String(b.ownerId) === uid || (Array.isArray(b.members) && b.members.map(String).includes(uid))
    );
  },

  async findById(boardId) {
    return boards.find((b) => String(b.id) === String(boardId)) ?? null;
  },

  async countByWorkspaceId(workspaceId, userId) {
    const uid = userId ? String(userId) : null;
    return boards.filter((b) => {
      const matchWs = String(b.workspaceId) === String(workspaceId);
      if (!matchWs) return false;
      if (!uid) return true;
      return String(b.ownerId) === uid || (Array.isArray(b.members) && b.members.map(String).includes(uid));
    }).length;
  },

  async create({
    title,
    description = '',
    ownerId,
    members = [],
    color = 'from-indigo-600 to-violet-600',
    icon = 'Kanban',
    tags = ['General'],
    workspaceId = 'ws-1',
    workspaceName = 'Engineering',
  }) {
    const uniqueMembers = Array.from(new Set([String(ownerId), ...members.map(String)]));
    const newBoard = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      ownerId: String(ownerId),
      members: uniqueMembers,
      color,
      icon,
      tags: Array.isArray(tags) ? tags : ['General'],
      workspaceId,
      workspaceName,
      isFavorite: false,
      stats: { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
    };
    boards.push(newBoard);
    return newBoard;
  },

  async update(boardId, updates) {
    const index = boards.findIndex((b) => String(b.id) === String(boardId));
    if (index === -1) return null;

    const existing = boards[index];
    const updated = {
      ...existing,
      ...updates,
      ...(updates.members
        ? { members: Array.from(new Set([String(existing.ownerId), ...updates.members.map(String)])) }
        : {}),
      updatedAt: 'Just now',
    };
    boards[index] = updated;
    return updated;
  },

  async delete(boardId) {
    const index = boards.findIndex((b) => String(b.id) === String(boardId));
    if (index === -1) return false;
    boards.splice(index, 1);
    return true;
  },
};

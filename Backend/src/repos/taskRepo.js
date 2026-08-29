import { randomUUID } from 'node:crypto';

const seededUsers = {
  '1': {
    id: '1',
    name: 'User 1',
    email: 'user1@nsbm.lk',
    initials: 'U1',
    color: 'bg-indigo-600',
  },
  '2': {
    id: '2',
    name: 'User 2',
    email: 'user2@nsbm.lk',
    initials: 'U2',
    color: 'bg-emerald-600',
  },
};

// In-memory tasks collection with seeded tasks matching schema
const tasks = [
  {
    id: 't1',
    title: 'Design Dashboard Wireframes',
    description: 'Create Figma mocks for the main board layout',
    status: 'done',
    priority: 'high',
    assignee: seededUsers['1'],
    boardId: 'b1',
    tags: ['Design', 'UI/UX'],
    order: 0,
    version: 1,
    dueDate: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 't2',
    title: 'Develop REST API Pipeline',
    description: 'Setup Express server, error handling, and auth middleware',
    status: 'in-progress',
    priority: 'high',
    assignee: seededUsers['2'],
    boardId: 'b1',
    tags: ['Backend', 'API'],
    order: 1,
    version: 1,
    dueDate: '2026-09-05T00:00:00.000Z',
    createdAt: '2026-08-21T11:00:00.000Z',
    updatedAt: '2026-08-21T11:00:00.000Z',
  },
  {
    id: 't3',
    title: 'Write API Contract Documentation',
    description: 'Document REST contract endpoints in README and export Postman tests',
    status: 'todo',
    priority: 'medium',
    assignee: seededUsers['1'],
    boardId: 'b1',
    tags: ['Docs', 'Postman'],
    order: 2,
    version: 1,
    dueDate: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-08-22T14:30:00.000Z',
    updatedAt: '2026-08-22T14:30:00.000Z',
  },
  {
    id: 't4',
    title: 'Marketing Campaign Launch Plan',
    description: 'Prepare campaign materials and landing page assets',
    status: 'in-progress',
    priority: 'high',
    assignee: seededUsers['2'],
    boardId: 'b2',
    tags: ['Marketing', 'Launch'],
    order: 0,
    version: 1,
    dueDate: '2026-09-15T00:00:00.000Z',
    createdAt: '2026-08-23T09:00:00.000Z',
    updatedAt: '2026-08-23T09:00:00.000Z',
  },
  {
    id: 't5',
    title: 'Design System & Component Tokens',
    description: 'Establish Figma tokens and WCAG AA accessibility color contrast guidelines',
    status: 'in-progress',
    priority: 'high',
    assignee: seededUsers['1'],
    boardId: 'b3',
    tags: ['Design', 'Tokens'],
    order: 0,
    version: 1,
    dueDate: '2026-09-20T00:00:00.000Z',
    createdAt: '2026-08-24T10:00:00.000Z',
    updatedAt: '2026-08-24T10:00:00.000Z',
  },
  {
    id: 't6',
    title: 'Mobile Micro-interactions',
    description: 'Prototype fluid gestures and haptic feedback specs for mobile dashboard',
    status: 'todo',
    priority: 'medium',
    assignee: seededUsers['1'],
    boardId: 'b3',
    tags: ['UX', 'Mobile'],
    order: 1,
    version: 1,
    dueDate: '2026-09-25T00:00:00.000Z',
    createdAt: '2026-08-25T11:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z',
  },
];

function normalizeAssignee(assignee) {
  if (!assignee) return null;
  if (typeof assignee === 'object' && assignee !== null) return assignee;
  if (typeof assignee === 'string' && seededUsers[assignee]) return seededUsers[assignee];
  if (typeof assignee === 'string') {
    return {
      id: `usr-${Date.now()}`,
      name: assignee,
      email: `${assignee.toLowerCase().replace(/\s+/g, '')}@collabboard.io`,
      initials: assignee.slice(0, 2).toUpperCase(),
      color: 'bg-indigo-600',
    };
  }
  return null;
}

export const taskRepo = {
  async findAll() {
    return [...tasks];
  },

  async findById(taskId) {
    return tasks.find((t) => String(t.id) === String(taskId)) ?? null;
  },

  async findByBoardId(boardId) {
    return tasks.filter((t) => String(t.boardId) === String(boardId));
  },

  async create(taskData) {
    const rawStatus = taskData.status ?? 'todo';
    const status = rawStatus === 'doing' ? 'in-progress' : rawStatus;
    const newTask = {
      id: randomUUID(),
      title: taskData.title.trim(),
      description: taskData.description?.trim() ?? '',
      status,
      priority: taskData.priority ?? 'medium',
      assignee: normalizeAssignee(taskData.assignee),
      boardId: String(taskData.boardId),
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      order: typeof taskData.order === 'number' ? taskData.order : 0,
      version: 1,
      dueDate: taskData.dueDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    return newTask;
  },

  async update(taskId, updates) {
    const index = tasks.findIndex((t) => String(t.id) === String(taskId));
    if (index === -1) return null;

    const existing = tasks[index];
    const rawStatus = updates.status ?? existing.status;
    const status = rawStatus === 'doing' ? 'in-progress' : rawStatus;

    const updated = {
      ...existing,
      ...updates,
      status,
      assignee: updates.assignee !== undefined ? normalizeAssignee(updates.assignee) : existing.assignee,
      tags: updates.tags !== undefined ? (Array.isArray(updates.tags) ? updates.tags : []) : (existing.tags || []),
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    tasks[index] = updated;
    return updated;
  },

  async delete(taskId) {
    const index = tasks.findIndex((t) => String(t.id) === String(taskId));
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },
};

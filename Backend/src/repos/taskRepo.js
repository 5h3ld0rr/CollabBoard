import { randomUUID } from 'node:crypto';

// In-memory tasks collection with seeded mock tasks
const tasks = [
  {
    id: 't1',
    title: 'Design Dashboard Wireframes',
    description: 'Create Figma mocks for the main board layout',
    status: 'done',
    priority: 'high',
    assignee: 'User 1',
    boardId: 'b1',
    dueDate: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 't2',
    title: 'Develop REST API Pipeline',
    description: 'Setup Express server, error handling, and auth middleware',
    status: 'doing',
    priority: 'high',
    assignee: 'User 2',
    boardId: 'b2',
    dueDate: '2026-09-05T00:00:00.000Z',
    createdAt: '2026-08-21T11:00:00.000Z',
    updatedAt: '2026-08-21T11:00:00.000Z',
  },
  {
    id: 't3',
    title: 'Write API Contract Documentation',
    description: 'Document REST contract endpoints in README and export Postman tests',
    status: 'todo',
    priority: 'normal',
    assignee: 'User 1',
    boardId: 'b2',
    dueDate: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-08-22T14:30:00.000Z',
    updatedAt: '2026-08-22T14:30:00.000Z',
  },
  {
    id: 't4',
    title: 'Confidential Security Audit',
    description: 'Conduct security vulnerability checks strictly for User 2 project',
    status: 'todo',
    priority: 'high',
    assignee: 'User 2',
    boardId: 'b3',
    dueDate: '2026-09-15T00:00:00.000Z',
    createdAt: '2026-08-23T09:00:00.000Z',
    updatedAt: '2026-08-23T09:00:00.000Z',
  },
];

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
    const newTask = {
      id: randomUUID(),
      title: taskData.title.trim(),
      description: taskData.description?.trim() ?? '',
      status: taskData.status ?? 'todo',
      priority: taskData.priority ?? 'normal',
      assignee: taskData.assignee?.trim() ?? '',
      boardId: String(taskData.boardId),
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
    const updated = {
      ...existing,
      ...updates,
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

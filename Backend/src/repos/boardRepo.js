import { randomUUID } from 'node:crypto';

// In-memory boards collection with seeded test data
const boards = [
  {
    id: 'b1',
    title: 'Sprint Planning (User 1 Private)',
    description: 'Sprint planning and roadmap for Project Alpha',
    ownerId: '1',
    members: ['1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    title: 'Marketing Campaign (Shared)',
    description: 'Q3 Marketing launch tasks',
    ownerId: '1',
    members: ['1', '2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    title: 'User 2 Secret Project',
    description: 'Confidential work strictly for User 2',
    ownerId: '2',
    members: ['2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  async create({ title, description = '', ownerId, members = [] }) {
    const uniqueMembers = Array.from(new Set([String(ownerId), ...members.map(String)]));
    const newBoard = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      ownerId: String(ownerId),
      members: uniqueMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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

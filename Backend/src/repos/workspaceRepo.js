import { randomUUID } from 'node:crypto';

// In-memory workspaces collection with initial seeded data
const workspaces = [
  {
    id: 'ws-1',
    name: 'Core Engineering',
    description: 'Platform infrastructure, real-time sync engine, and API services',
    color: 'from-indigo-600 to-violet-600',
    ownerId: '1',
    admins: ['1', '2'],
    members: ['1', '2', '3', '4'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-2',
    name: 'Product & Design',
    description: 'UX research, design systems, and user interaction flows',
    color: 'from-fuchsia-600 to-pink-600',
    ownerId: '1',
    admins: ['1'],
    members: ['1', '2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-3',
    name: 'Marketing & Growth',
    description: 'Product launches, marketing campaigns, and user acquisition',
    color: 'from-amber-600 to-orange-600',
    ownerId: '2',
    admins: ['2'],
    members: ['1', '2', '3'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const workspaceRepo = {
  async listByUserId(userId) {
    const uid = String(userId);
    const userWorkspaces = workspaces.filter(
      (w) => String(w.ownerId) === uid || (Array.isArray(w.members) && w.members.map(String).includes(uid))
    );

    // If user has no workspaces, provision a default workspace automatically from backend
    if (userWorkspaces.length === 0) {
      const defaultWs = await this.create({
        name: 'My Workspace',
        description: 'Personal workspace for sprint boards and tasks',
        color: 'from-indigo-600 to-violet-600',
        ownerId: uid,
        admins: [uid],
        members: [uid],
      });
      return [defaultWs];
    }

    return userWorkspaces;
  },

  async findById(workspaceId) {
    return workspaces.find((w) => String(w.id) === String(workspaceId)) ?? null;
  },

  async create({
    name,
    description = '',
    color = 'from-indigo-600 to-violet-600',
    ownerId,
    admins = [],
    members = [],
  }) {
    const uniqueMembers = Array.from(new Set([String(ownerId), ...members.map(String)]));
    const uniqueAdmins = Array.from(new Set([String(ownerId), ...admins.map(String)]));
    const newWorkspace = {
      id: randomUUID(),
      name: name.trim(),
      description: description.trim(),
      color,
      ownerId: String(ownerId),
      admins: uniqueAdmins,
      members: uniqueMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workspaces.push(newWorkspace);
    return newWorkspace;
  },

  async update(workspaceId, updates) {
    const index = workspaces.findIndex((w) => String(w.id) === String(workspaceId));
    if (index === -1) return null;

    const existing = workspaces[index];
    const updated = {
      ...existing,
      ...updates,
      ...(updates.admins
        ? { admins: Array.from(new Set([String(existing.ownerId), ...updates.admins.map(String)])) }
        : {}),
      ...(updates.members
        ? { members: Array.from(new Set([String(existing.ownerId), ...updates.members.map(String)])) }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    workspaces[index] = updated;
    return updated;
  },

  async delete(workspaceId) {
    const index = workspaces.findIndex((w) => String(w.id) === String(workspaceId));
    if (index === -1) return false;
    workspaces.splice(index, 1);
    return true;
  },
};

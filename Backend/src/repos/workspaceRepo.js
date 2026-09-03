import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';

function formatWorkspace(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  return {
    ...obj,
    id: String(obj.id || obj._id),
    ownerId: String(obj.ownerId),
    admins: Array.isArray(obj.admins) ? obj.admins.map(String) : [],
    members: Array.isArray(obj.members) ? obj.members.map(String) : [],
  };
}

export const workspaceRepo = {
  async listByUserId(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    const uid = String(userId);
    const docs = await Workspace.find({
      $or: [{ ownerId: uid }, { members: uid }],
    });

    const userWorkspaces = docs.map(formatWorkspace);

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

  async findAll(query = {}) {
    const docs = await Workspace.find(query);
    return docs.map(formatWorkspace);
  },

  async findById(workspaceId) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }
    const doc = await Workspace.findById(workspaceId);
    return formatWorkspace(doc);
  },

  async create({
    name,
    description = '',
    color = 'from-indigo-600 to-violet-600',
    ownerId,
    admins = [],
    members = [],
  }) {
    const uid = String(ownerId);
    const uniqueMembers = Array.from(new Set([uid, ...members.map(String)]));
    const uniqueAdmins = Array.from(new Set([uid, ...admins.map(String)]));

    const doc = await Workspace.create({
      name: name.trim(),
      description: description.trim(),
      color,
      ownerId: uid,
      admins: uniqueAdmins,
      members: uniqueMembers,
    });

    return formatWorkspace(doc);
  },

  async update(workspaceId, updates) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }

    const existing = await this.findById(workspaceId);
    if (!existing) return null;

    const payload = { ...updates };
    if (updates.admins) {
      payload.admins = Array.from(new Set([String(existing.ownerId), ...updates.admins.map(String)]));
    }
    if (updates.members) {
      payload.members = Array.from(new Set([String(existing.ownerId), ...updates.members.map(String)]));
    }

    const doc = await Workspace.findByIdAndUpdate(workspaceId, payload, { new: true });
    return formatWorkspace(doc);
  },

  async delete(workspaceId) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return false;
    }
    const result = await Workspace.findByIdAndDelete(workspaceId);
    return Boolean(result);
  },
};

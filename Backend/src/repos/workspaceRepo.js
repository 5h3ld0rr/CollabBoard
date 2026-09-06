import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';

function formatWorkspace(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  const { _id, __v, ownerId, admins, members, ...rest } = obj;
  return {
    ...rest,
    id: String(obj.id || _id),
  };
}

export const workspaceRepo = {
  async listByUserId() {
    const docs = await Workspace.find();
    const workspaces = docs.map(formatWorkspace);

    // If no workspaces exist, provision a default workspace automatically
    if (workspaces.length === 0) {
      const defaultWs = await this.create({
        name: 'My Workspace',
        description: 'Personal workspace for sprint boards and tasks',
        color: 'from-indigo-600 to-violet-600',
      });
      return [defaultWs];
    }

    return workspaces;
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
  }) {
    const doc = await Workspace.create({
      name: name.trim(),
      description: description.trim(),
      color,
    });

    return formatWorkspace(doc);
  },

  async update(workspaceId, updates) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }

    const allowed = ['name', 'description', 'color'];
    const payload = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        payload[key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
      }
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

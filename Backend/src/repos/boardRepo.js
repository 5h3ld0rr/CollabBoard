import mongoose from 'mongoose';
import { Board } from '../models/Board.js';

function formatBoard(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  return {
    ...obj,
    id: String(obj.id || obj._id),
    workspaceId: String(obj.workspaceId),
    ownerId: String(obj.ownerId),
    members: Array.isArray(obj.members) ? obj.members.map(String) : [],
    stats: obj.stats || { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
  };
}

export const boardRepo = {
  async listByUserId(userId) {
    if (!userId) return [];
    const uid = String(userId);
    const docs = await Board.find({
      $or: [{ ownerId: uid }, { members: uid }],
    });
    return docs.map(formatBoard);
  },

  async findAll(query = {}) {
    const docs = await Board.find(query);
    return docs.map(formatBoard);
  },

  async findById(boardId) {
    if (!boardId) return null;
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(boardId)) {
      doc = await Board.findById(boardId);
    }
    if (!doc) {
      doc = await Board.collection.findOne({ _id: String(boardId) });
    }
    return formatBoard(doc);
  },

  async countByWorkspaceId(workspaceId, userId) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return 0;
    }
    const wsId = String(workspaceId);
    const query = { workspaceId: wsId };

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) return 0;
      const uid = String(userId);
      query.$or = [{ ownerId: uid }, { members: uid }];
    }

    const count = await Board.countDocuments(query);
    return count;
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
    const uid = String(ownerId);
    const uniqueMembers = Array.from(new Set([uid, ...members.map(String)]));

    const doc = await Board.create({
      title: title.trim(),
      description: description.trim(),
      ownerId: uid,
      members: uniqueMembers,
      color,
      icon,
      tags: Array.isArray(tags) ? tags : ['General'],
      workspaceId: String(workspaceId),
      workspaceName,
      isFavorite: false,
      stats: { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
    });

    return formatBoard(doc);
  },

  async update(boardId, updates) {
    if (!boardId) return null;

    const existing = await this.findById(boardId);
    if (!existing) return null;

    const payload = { ...updates };
    if (updates.members) {
      payload.members = Array.from(new Set([String(existing.ownerId), ...updates.members.map(String)]));
    }

    const doc = await Board.findByIdAndUpdate(boardId, payload, { new: true });
    return formatBoard(doc);
  },

  async delete(boardId) {
    if (!boardId) return false;
    const result = mongoose.Types.ObjectId.isValid(boardId)
      ? await Board.findByIdAndDelete(boardId)
      : await Board.findOneAndDelete({ _id: String(boardId) });
    return Boolean(result);
  },
};

import mongoose from 'mongoose';
import { Board } from '../models/Board.js';

function toSafeKey(key) {
  return String(key).replace(/\./g, '_dot_');
}

function fromSafeKey(key) {
  return String(key).replace(/_dot_/g, '.');
}

function formatBoard(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  const { _id, __v, ...rest } = obj;

  const rawRoles = obj.memberRoles instanceof Map
    ? Object.fromEntries(obj.memberRoles)
    : (obj.memberRoles && typeof obj.memberRoles === 'object' ? { ...obj.memberRoles } : {});

  const decodedRoles = {};
  for (const [k, v] of Object.entries(rawRoles)) {
    decodedRoles[fromSafeKey(k)] = v;
    decodedRoles[k] = v;
  }

  return {
    ...rest,
    id: String(obj.id || _id),
    workspaceId: String(obj.workspaceId),
    ownerId: String(obj.ownerId),
    members: Array.isArray(obj.members) ? obj.members.map(String) : [],
    memberRoles: decodedRoles,
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
    workspaceId = null,
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
      payload.members = Array.from(
        new Set([
          String(existing.ownerId),
          ...updates.members.map((m) => String(typeof m === 'object' && m !== null ? (m.id || m.email) : m)),
        ])
      );
      const newRoles = {};
      if (existing.memberRoles) {
        for (const [k, v] of Object.entries(existing.memberRoles)) {
          newRoles[toSafeKey(k)] = v;
        }
      }
      updates.members.forEach((m) => {
        if (typeof m === 'object' && m !== null && (m.id || m.email) && (m.boardRole || m.role)) {
          const key = toSafeKey(m.id || m.email);
          newRoles[key] = m.boardRole || m.role;
        }
      });
      payload.memberRoles = newRoles;
    }
    if (updates.memberRoles) {
      const safeRoles = {};
      for (const [k, v] of Object.entries(updates.memberRoles)) {
        safeRoles[toSafeKey(k)] = v;
      }
      const existingRoles = {};
      if (existing.memberRoles) {
        for (const [k, v] of Object.entries(existing.memberRoles)) {
          existingRoles[toSafeKey(k)] = v;
        }
      }
      payload.memberRoles = {
        ...existingRoles,
        ...safeRoles,
      };
    }

    // Guarantee that no key in payload.memberRoles contains a dot before sending to Mongoose Map
    if (payload.memberRoles) {
      const sanitized = {};
      for (const [k, v] of Object.entries(payload.memberRoles)) {
        sanitized[toSafeKey(k)] = v;
      }
      payload.memberRoles = sanitized;
    }

    const doc = await Board.findByIdAndUpdate(boardId, payload, { returnDocument: 'after' });
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

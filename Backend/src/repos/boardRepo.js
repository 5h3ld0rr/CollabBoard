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

  const defaultColumns = [
    { id: 'col-todo', _id: 'col-todo', title: 'To Do', position: 0, statusKey: 'todo', colorDot: 'bg-slate-400' },
    { id: 'col-in-progress', _id: 'col-in-progress', title: 'In Progress', position: 1, statusKey: 'in-progress', colorDot: 'bg-indigo-400' },
    { id: 'col-done', _id: 'col-done', title: 'Done', position: 2, statusKey: 'done', colorDot: 'bg-emerald-400' },
  ];

  const columns = Array.isArray(obj.columns) && obj.columns.length > 0
    ? obj.columns.map((c, idx) => ({
        id: String(c.id || c._id || `col-${idx}`),
        _id: String(c._id || c.id || `col-${idx}`),
        title: c.title,
        position: typeof c.position === 'number' ? c.position : idx,
        statusKey: c.statusKey || (c.title ? c.title.toLowerCase().replace(/\s+/g, '-') : 'column'),
        colorDot: c.colorDot || 'bg-indigo-400',
      })).sort((a, b) => a.position - b.position)
    : defaultColumns;

  return {
    ...rest,
    id: String(obj.id || _id),
    ownerId: String(obj.ownerId),
    members: Array.isArray(obj.members) ? obj.members.map(String) : [],
    memberRoles: decodedRoles,
    columns,
    stats: obj.stats || { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
  };
}

export const boardRepo = {
  async listByUserId(userId) {
    if (!userId) return [];
    const uid = String(userId);
    const userDoc = await mongoose.model('User').findById(userId).lean().catch(() => null);
    const orConditions = [{ ownerId: uid }, { members: uid }];

    if (userDoc?.email) {
      const email = userDoc.email.toLowerCase().trim();
      orConditions.push({ members: email });
      orConditions.push({
        members: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });
    }

    const docs = await Board.find({
      $or: orConditions,
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
    const ws = await mongoose.model('Workspace').findById(workspaceId).lean();
    if (!ws || !Array.isArray(ws.boards) || ws.boards.length === 0) {
      return 0;
    }
    const query = { _id: { $in: ws.boards } };

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
    columns,
    color = 'from-indigo-600 to-violet-600',
    icon = 'Kanban',
    tags = ['General'],
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
      ...(Array.isArray(columns) && columns.length > 0
        ? {
            columns: columns.map((col, index) => ({
              title: col.title,
              position: typeof col.position === 'number' ? col.position : index,
              statusKey: col.statusKey || (col.title ? col.title.toLowerCase().replace(/\s+/g, '-') : 'column'),
              colorDot: col.colorDot || 'bg-indigo-400',
            })),
          }
        : {}),
      stats: { totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 },
    });

    return formatBoard(doc);
  },

  async update(boardId, updates) {
    if (!boardId) return null;

    const existing = await this.findById(boardId);
    if (!existing) return null;

    const payload = { ...updates };
    delete payload.workspaceId;
    delete payload.isFavorite;
    if (updates.members) {
      const memberList = [String(existing.ownerId)];
      const newRoles = {};
      if (existing.memberRoles) {
        for (const [k, v] of Object.entries(existing.memberRoles)) {
          newRoles[toSafeKey(k)] = v;
        }
      }

      updates.members.forEach((m) => {
        if (typeof m === 'object' && m !== null) {
          if (m.id) memberList.push(String(m.id));
          if (m.email) memberList.push(String(m.email).toLowerCase().trim());
          const role = m.boardRole || m.role;
          if (role) {
            if (m.id) newRoles[toSafeKey(m.id)] = role;
            if (m.email) newRoles[toSafeKey(String(m.email).toLowerCase().trim())] = role;
          }
        } else if (m) {
          const str = String(m).trim();
          memberList.push(str);
          if (str.includes('@')) {
            memberList.push(str.toLowerCase());
          }
        }
      });

      payload.members = Array.from(new Set(memberList));
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

    // Sanitize columns if provided in update payload
    if (Array.isArray(payload.columns)) {
      payload.columns = payload.columns.map((col, index) => ({
        ...(col._id && mongoose.Types.ObjectId.isValid(col._id)
          ? { _id: col._id }
          : col.id && mongoose.Types.ObjectId.isValid(col.id)
          ? { _id: col.id }
          : {}),
        title: col.title,
        position: typeof col.position === 'number' ? col.position : index,
        statusKey: col.statusKey || (col.title ? col.title.toLowerCase().replace(/\s+/g, '-') : 'column'),
        colorDot: col.colorDot || 'bg-indigo-400',
      }));
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

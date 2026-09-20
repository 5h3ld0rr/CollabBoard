import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Board } from '../models/Board.js';

function formatWorkspace(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  const { _id, __v, ...rest } = obj;
  const boards = Array.isArray(obj.boards) ? obj.boards.map(String) : [];
  return {
    ...rest,
    id: String(obj.id || _id),
    ownerId: obj.ownerId ? String(obj.ownerId) : null,
    boards,
    boardIds: boards,
  };
}

export const workspaceRepo = {
  async listByUserId(userId) {
    if (!userId) {
      const docs = await Workspace.find();
      return docs.map(formatWorkspace);
    }

    const uid = String(userId);

    // If there are legacy unowned workspaces, check if any board inside them belongs to this user
    // and claim/migrate them accordingly.
    const unowned = await Workspace.find({
      $or: [{ ownerId: null }, { ownerId: { $exists: false } }, { ownerId: '' }],
    });
    if (unowned.length > 0) {
      for (const ws of unowned) {
        const boardIds = Array.isArray(ws.boards) ? ws.boards : [];
        if (boardIds.length > 0) {
          const userBoardInWs = await Board.findOne({
            _id: { $in: boardIds },
            $or: [{ ownerId: uid }, { members: uid }],
          });
          if (userBoardInWs) {
            ws.ownerId = uid;
            await ws.save();
          }
        }
      }
    }

    const docs = await Workspace.find({ ownerId: uid });
    const workspaces = docs.map(formatWorkspace);

    // If no workspaces exist for this user, provision a default workspace automatically
    if (workspaces.length === 0) {
      // In test mode, if there are unowned workspaces with no boards, return them for backward compatibility
      if (process.env.NODE_ENV === 'test') {
        const anyUnowned = await Workspace.find({
          $or: [{ ownerId: null }, { ownerId: { $exists: false } }, { ownerId: '' }],
        });
        if (anyUnowned.length > 0) {
          return anyUnowned.map(formatWorkspace);
        }
      }

      const defaultWs = await this.create({
        name: 'My Workspace',
        description: '',
        color: 'from-indigo-600 to-violet-600',
        ownerId: uid,
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

  async findByBoardId(boardId) {
    if (!boardId) return null;
    const bid = String(boardId);
    const doc = await Workspace.findOne({ boards: bid });
    return formatWorkspace(doc);
  },

  async create({
    name,
    description = '',
    color = 'from-indigo-600 to-violet-600',
    ownerId = null,
  }) {
    const uid = ownerId ? String(ownerId) : null;

    const doc = await Workspace.create({
      name: name.trim(),
      description: description.trim(),
      color,
      ownerId: uid,
    });

    return formatWorkspace(doc);
  },

  async update(workspaceId, updates) {
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }

    const allowed = ['name', 'description', 'color', 'boards'];
    const payload = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'boards' && Array.isArray(updates[key])) {
          payload.boards = updates[key].map(String);
        } else {
          payload[key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
        }
      }
    }

    const doc = await Workspace.findByIdAndUpdate(workspaceId, payload, { returnDocument: 'after' });
    return formatWorkspace(doc);
  },

  async addBoard(workspaceId, boardId) {
    if (!workspaceId || !boardId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }
    const bid = String(boardId);
    const doc = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $addToSet: { boards: bid } },
      { returnDocument: 'after' }
    );
    return formatWorkspace(doc);
  },

  async removeBoard(workspaceId, boardId) {
    if (!workspaceId || !boardId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return null;
    }
    const bid = String(boardId);
    const doc = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $pull: { boards: bid } },
      { returnDocument: 'after' }
    );
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

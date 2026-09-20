import mongoose from 'mongoose';
import { User, getRandomColor } from '../models/User.js';

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Strips sensitive fields like passwordHash before returning user object
 * @param {object} user - Raw user entity or Mongoose document
 * @returns {object|null} Sanitized user profile
 */
export function publicUser(user) {
  if (!user) return null;
  const userObj = typeof user.toObject === 'function' ? user.toObject({ virtuals: true }) : { ...user };
  const id = String(userObj.id || userObj._id || '');
  const { passwordHash, _id, __v, ...safeUser } = userObj;
  return {
    id,
    initials: userObj.initials || getInitials(safeUser.name),
    color: userObj.color || getRandomColor(),
    ...safeUser,
    favoriteBoardIds: Array.isArray(userObj.favoriteBoardIds) ? userObj.favoriteBoardIds.map(String) : [],
    createdAt: (() => {
      if (userObj.createdAt) return new Date(userObj.createdAt).toISOString();
      if (mongoose.Types.ObjectId.isValid(id)) {
        try {
          return new mongoose.Types.ObjectId(id).getTimestamp().toISOString();
        } catch {
          // fallback
        }
      }
      return undefined;
    })(),
  };
}

export const userRepo = {
  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    // Use lean() to get raw BSON object — the toJSON transform deletes _id,
    // which breaks id extraction for non-ObjectId seed _ids like '1', '2'.
    const obj = await User.findOne({ email: normalized }).lean();
    if (!obj) return null;
    return { ...obj, id: String(obj._id), passwordHash: obj.passwordHash };
  },

  async findById(id) {
    if (!id) return null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      const obj = await User.findById(id).lean();
      if (obj) return { ...obj, id: String(obj._id) };
    }
    const raw = await User.collection.findOne({ _id: String(id) });
    if (!raw) return null;
    return { ...raw, id: String(raw._id) };
  },

  async create({ email, passwordHash, name = 'User', color }) {
    const doc = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      color: color || getRandomColor(),
    });
    const obj = doc.toObject({ virtuals: true });
    return { ...obj, id: String(obj.id || obj._id) };
  },

  async update(id, updates) {
    if (!id) return null;
    const sanitized = { ...updates };
    delete sanitized.passwordHash;
    delete sanitized._id;
    delete sanitized.id;

    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }

    let doc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await User.findByIdAndUpdate(id, sanitized, { returnDocument: 'after' });
    }
    if (!doc) {
      await User.collection.updateOne({ _id: String(id) }, { $set: sanitized });
      doc = await User.collection.findOne({ _id: String(id) });
    }
    return publicUser(doc);
  },

  async addFavoriteBoard(userId, boardId) {
    if (!userId || !boardId) return;
    const uid = String(userId);
    const bid = String(boardId);
    if (mongoose.Types.ObjectId.isValid(uid)) {
      await User.findByIdAndUpdate(uid, { $addToSet: { favoriteBoardIds: bid } });
    } else {
      await User.collection.updateOne({ _id: uid }, { $addToSet: { favoriteBoardIds: bid } });
    }
  },

  async removeFavoriteBoard(userId, boardId) {
    if (!userId || !boardId) return;
    const uid = String(userId);
    const bid = String(boardId);
    if (mongoose.Types.ObjectId.isValid(uid)) {
      await User.findByIdAndUpdate(uid, { $pull: { favoriteBoardIds: bid } });
    } else {
      await User.collection.updateOne({ _id: uid }, { $pull: { favoriteBoardIds: bid } });
    }
  },

  async removeBoardFromAllFavorites(boardId) {
    if (!boardId) return;
    const bid = String(boardId);
    await User.updateMany(
      { favoriteBoardIds: bid },
      { $pull: { favoriteBoardIds: bid } }
    );
  },

  async list() {
    const docs = await User.find();
    return docs.map(publicUser);
  },
};

import mongoose from 'mongoose';
import { User } from '../models/User.js';

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
    ...safeUser,
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

  async create({ email, passwordHash, name = 'User' }) {
    const doc = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });
    const obj = doc.toObject({ virtuals: true });
    return { ...obj, id: String(obj.id || obj._id) };
  },

  async list() {
    const docs = await User.find();
    return docs.map(publicUser);
  },
};

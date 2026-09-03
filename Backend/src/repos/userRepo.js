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
    const doc = await User.findOne({ email: normalized });
    if (!doc) return null;
    const obj = doc.toObject({ virtuals: true });
    return { ...obj, id: String(obj.id || obj._id) };
  },

  async findById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await User.findById(id);
    if (!doc) return null;
    const obj = doc.toObject({ virtuals: true });
    return { ...obj, id: String(obj.id || obj._id) };
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

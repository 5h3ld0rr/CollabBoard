import { Session } from '../models/Session.js';

export const sessionRepo = {
  async createSession(sessionData) {
    const doc = await Session.create(sessionData);
    return doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  },

  async findActiveSessionsByUserId(userId) {
    if (!userId) return [];
    return await Session.find({ userId: String(userId), isRevoked: false })
      .sort({ lastActive: -1 })
      .lean();
  },

  async findBySessionId(sessionId) {
    if (!sessionId) return null;
    return await Session.findOne({ sessionId: String(sessionId) }).lean();
  },

  async updateLastActive(sessionId) {
    if (!sessionId) return;
    try {
      // Throttle update to once every 60s
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      await Session.updateOne(
        { sessionId: String(sessionId), lastActive: { $lt: sixtySecondsAgo } },
        { $set: { lastActive: new Date() } }
      );
    } catch {
      // Ignore update errors
    }
  },

  async revokeSession(sessionId, userId) {
    if (!sessionId || !userId) return false;
    const res = await Session.updateOne(
      { sessionId: String(sessionId), userId: String(userId) },
      { $set: { isRevoked: true } }
    );
    return res.modifiedCount > 0;
  },

  async revokeOtherSessions(userId, currentSessionId) {
    if (!userId) return 0;
    const filter = { userId: String(userId), isRevoked: false };
    if (currentSessionId) {
      filter.sessionId = { $ne: String(currentSessionId) };
    }
    const res = await Session.updateMany(filter, { $set: { isRevoked: true } });
    return res.modifiedCount;
  },

  async isSessionRevoked(sessionId) {
    if (!sessionId) return false;
    const session = await Session.findOne({ sessionId: String(sessionId) }).lean();
    if (!session) return false;
    return Boolean(session.isRevoked);
  },
};

/**
 * In-Memory Presence Tracker (Session 5 - Slide 19)
 * Structure: Map(boardId -> Map(userId -> connectionCount))
 *
 * Tracks multi-tab and multi-device connection instances per collaborator
 * without duplicate presence emissions.
 */
export class PresenceTracker {
  constructor() {
    /** @type {Map<string, Map<string, number>>} */
    this.presence = new Map();
  }

  /**
   * Registers a user connection to a board room
   * @param {string} boardId
   * @param {string} userId
   * @returns {number} The updated connection count for the user
   */
  addConnection(boardId, userId) {
    if (!boardId || !userId) return 0;
    const bId = String(boardId).trim();
    const uId = String(userId).trim();

    let boardMap = this.presence.get(bId);
    if (!boardMap) {
      boardMap = new Map();
      this.presence.set(bId, boardMap);
    }

    const currentCount = boardMap.get(uId) || 0;
    const newCount = currentCount + 1;
    boardMap.set(uId, newCount);
    return newCount;
  }

  /**
   * Decrements a user connection from a board room and cleans up empty entries
   * @param {string} boardId
   * @param {string} userId
   * @returns {number} The remaining connection count for the user (0 if removed)
   */
  removeConnection(boardId, userId) {
    if (!boardId || !userId) return 0;
    const bId = String(boardId).trim();
    const uId = String(userId).trim();

    const boardMap = this.presence.get(bId);
    if (!boardMap) return 0;

    const currentCount = boardMap.get(uId) || 1;
    const remaining = currentCount - 1;

    if (remaining <= 0) {
      boardMap.delete(uId);
    } else {
      boardMap.set(uId, remaining);
    }

    if (boardMap.size === 0) {
      this.presence.delete(bId);
    }

    return Math.max(0, remaining);
  }

  /**
   * Retrieves unique online user IDs currently connected to the board room
   * @param {string} boardId
   * @returns {string[]}
   */
  getOnlineUserIds(boardId) {
    if (!boardId) return [];
    const bId = String(boardId).trim();
    const boardMap = this.presence.get(bId);
    return boardMap ? Array.from(boardMap.keys()) : [];
  }

  /**
   * Checks the connection count of a specific user on a board
   * @param {string} boardId
   * @param {string} userId
   * @returns {number}
   */
  getUserConnectionCount(boardId, userId) {
    if (!boardId || !userId) return 0;
    const bId = String(boardId).trim();
    const uId = String(userId).trim();
    const boardMap = this.presence.get(bId);
    return boardMap ? boardMap.get(uId) || 0 : 0;
  }

  /**
   * Returns presence metrics for a board room
   * @param {string} boardId
   */
  getBoardStats(boardId) {
    if (!boardId) return { boardId, activeUserCount: 0, totalConnections: 0 };
    const bId = String(boardId).trim();
    const boardMap = this.presence.get(bId);
    if (!boardMap) return { boardId: bId, activeUserCount: 0, totalConnections: 0 };

    let totalConnections = 0;
    for (const count of boardMap.values()) {
      totalConnections += count;
    }

    return {
      boardId: bId,
      activeUserCount: boardMap.size,
      totalConnections,
    };
  }

  /**
   * Resets presence tracker state
   */
  clear() {
    this.presence.clear();
  }
}

export const presenceTracker = new PresenceTracker();

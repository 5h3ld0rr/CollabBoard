import { randomUUID } from 'node:crypto';

// In-memory comments collection with seeded discussions
const comments = [
  {
    id: 'comm-101-1',
    taskId: 'task-101',
    authorId: '2',
    authorName: 'Clara Tanaka',
    authorEmail: 'user2@nsbm.lk',
    content: 'Make sure we cap the reconnection backoff interval at 30 seconds to prevent hanging sockets.',
    createdAt: '2026-08-14T19:30:00.000Z',
  },
  {
    id: 'comm-101-2',
    taskId: 'task-101',
    authorId: '1',
    authorName: 'Alex Chen',
    authorEmail: 'user1@nsbm.lk',
    content: 'Good call Clara. I added jitter and clamped the maximum backoff to 30s with auto reconnect on focus.',
    createdAt: '2026-08-14T20:15:00.000Z',
  },
  {
    id: 'comm-103-1',
    taskId: 'task-103',
    authorId: '3',
    authorName: 'Elena Rostova',
    authorEmail: 'user3@nsbm.lk',
    content: 'Are we broadcasting cursor positions through raw WebSockets or using WebRTC data channels for lower latency?',
    createdAt: '2026-08-15T21:20:00.000Z',
  },
  {
    id: 'comm-103-2',
    taskId: 'task-103',
    authorId: '2',
    authorName: 'Clara Tanaka',
    authorEmail: 'user2@nsbm.lk',
    content: 'Using WebSocket binary packets throttled at 60Hz. It stays well under 15ms latency across our staging nodes.',
    createdAt: '2026-08-15T22:05:00.000Z',
  },
  {
    id: 'comm-104-1',
    taskId: 'task-104',
    authorId: '1',
    authorName: 'Alex Chen',
    authorEmail: 'user1@nsbm.lk',
    content: 'Conflict resolution should give priority to the most recent server timestamp if optimistic lock fails.',
    createdAt: '2026-08-15T22:45:00.000Z',
  },
];

export const commentRepo = {
  async listByTaskId(taskId) {
    return comments.filter((c) => String(c.taskId) === String(taskId));
  },

  async findById(commentId) {
    return comments.find((c) => String(c.id) === String(commentId)) ?? null;
  },

  async create({ taskId, authorId, authorName, authorEmail, content }) {
    const newComment = {
      id: randomUUID(),
      taskId: String(taskId),
      authorId: String(authorId),
      authorName: authorName.trim(),
      authorEmail: authorEmail.toLowerCase().trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    return newComment;
  },

  async delete(commentId) {
    const index = comments.findIndex((c) => String(c.id) === String(commentId));
    if (index === -1) return false;
    comments.splice(index, 1);
    return true;
  },
};

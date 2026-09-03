import mongoose from 'mongoose';
import { Task } from '../models/Task.js';

/**
 * Serializes and formats a Mongoose Task document or raw object.
 * @param {object} doc - Mongoose document or task object
 * @returns {object|null} Formatted task object
 */
export function formatTask(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  const id = String(obj.id || obj._id || '');
  return {
    ...obj,
    id,
    boardId: String(obj.boardId || ''),
    version: typeof obj.version === 'number' ? obj.version : 0,
    status: obj.status ?? 'todo',
    priority: obj.priority ?? 'normal',
    assignee: obj.assignee ?? '',
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    position: typeof obj.position === 'number' ? obj.position : (typeof obj.order === 'number' ? obj.order : 0),
  };
}

export const taskRepo = {
  /**
   * Find all tasks matching optional query criteria
   */
  async findAll(query = {}) {
    const docs = await Task.find(query);
    return docs.map(formatTask);
  },

  /**
   * Find a single task by its MongoDB ObjectId
   */
  async findById(taskId) {
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }
    const doc = await Task.findById(taskId);
    return formatTask(doc);
  },

  /**
   * Find all tasks belonging to a specific board
   */
  async findByBoardId(boardId) {
    if (!boardId) return [];
    const docs = await Task.find({ boardId: String(boardId) });
    return docs.map(formatTask);
  },

  /**
   * Create a new task document in MongoDB
   */
  async create(taskData) {
    const rawStatus = taskData.status ?? 'todo';
    const status = rawStatus === 'in-progress' ? 'doing' : rawStatus;

    const doc = await Task.create({
      title: taskData.title?.trim(),
      description: taskData.description?.trim() ?? '',
      boardId: String(taskData.boardId),
      columnId: taskData.columnId ?? null,
      status,
      priority: taskData.priority ?? 'normal',
      assignee:
        typeof taskData.assignee === 'object' && taskData.assignee !== null
          ? taskData.assignee.name || taskData.assignee.id || ''
          : taskData.assignee ?? '',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      position:
        typeof taskData.position === 'number'
          ? taskData.position
          : typeof taskData.order === 'number'
          ? taskData.order
          : 0,
      done: taskData.done ?? (status === 'done'),
      version: 0,
    });

    return formatTask(doc);
  },

  /**
   * Update task atomically with Optimistic Concurrency Control (OCC).
   * If expectedVersion is specified, update matches version and increments it.
   */
  async update(taskId, updates, expectedVersion) {
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }

    const query = { _id: taskId };
    if (expectedVersion !== undefined && expectedVersion !== null) {
      query.version = Number(expectedVersion);
    }

    const { id, _id, version, ...payload } = updates;
    if (payload.status) {
      const rawStatus = payload.status;
      payload.status = rawStatus === 'in-progress' ? 'doing' : rawStatus;
    }
    if (payload.assignee && typeof payload.assignee === 'object') {
      payload.assignee = payload.assignee.name || payload.assignee.id || '';
    }
    if (payload.dueDate) {
      payload.dueDate = new Date(payload.dueDate);
    }

    const doc = await Task.findOneAndUpdate(
      query,
      {
        $set: payload,
        $inc: { version: 1 },
      },
      { new: true }
    );

    return formatTask(doc);
  },

  /**
   * Delete task by its MongoDB ObjectId
   */
  async delete(taskId) {
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return false;
    }
    const result = await Task.findByIdAndDelete(taskId);
    return Boolean(result);
  },
};


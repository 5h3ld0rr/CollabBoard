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
   * Aggregation Pipeline 1: "How many tasks per assignee are overdue on this board?"
   *
   * Matches overdue tasks on the board, groups them by assignee, counts the overdue tasks,
   * collects task IDs, and $lookup joins user details from the 'users' collection.
   *
   * @param {string} boardId - The board ID
   * @returns {Promise<Array<object>>} List of assignees with overdueCount, taskIds, and user info
   */
  async getOverdueTasksPerAssignee(boardId) {
    const now = new Date();
    const boardMatch = mongoose.Types.ObjectId.isValid(boardId)
      ? { $in: [String(boardId), new mongoose.Types.ObjectId(boardId)] }
      : String(boardId);

    const pipeline = [
      {
        $match: {
          boardId: boardMatch,
          dueDate: { $lt: now },
          status: { $ne: 'done' },
        },
      },
      {
        $addFields: {
          assigneeId: {
            $ifNull: [
              '$assigneeId',
              {
                $cond: {
                  if: { $eq: [{ $type: '$assignee' }, 'object'] },
                  then: '$assignee.id',
                  else: {
                    $cond: {
                      if: { $gt: [{ $strLenBytes: { $ifNull: ['$assignee', ''] } }, 0] },
                      then: '$assignee',
                      else: null,
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$assigneeId',
          overdueCount: { $sum: 1 },
          taskIds: { $push: '$_id' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'assignee',
        },
      },
      {
        $project: {
          overdueCount: 1,
          taskIds: 1,
          assignee: {
            $cond: {
              if: { $gt: [{ $size: '$assignee' }, 0] },
              then: {
                _id: { $arrayElemAt: ['$assignee._id', 0] },
                name: { $arrayElemAt: ['$assignee.name', 0] },
                email: { $arrayElemAt: ['$assignee.email', 0] },
              },
              else: null,
            },
          },
        },
      },
      { $sort: { overdueCount: -1 } },
    ];

    return Task.aggregate(pipeline);
  },

  /**
   * Aggregation Pipeline 2: Board summary metrics (task counts by priority and status).
   *
   * Aggregates tasks on the board into counts by status, counts by priority,
   * and total task count.
   *
   * @param {string} boardId - The board ID
   * @returns {Promise<object>} Summary metrics containing byStatus, byPriority, and totalTasks
   */
  async getBoardSummaryMetrics(boardId) {
    const boardMatch = mongoose.Types.ObjectId.isValid(boardId)
      ? { $in: [String(boardId), new mongoose.Types.ObjectId(boardId)] }
      : String(boardId);

    const pipeline = [
      { $match: { boardId: boardMatch } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          totalTasks: [{ $count: 'count' }],
        },
      },
      {
        $project: {
          byStatus: 1,
          byPriority: 1,
          totalTasks: { $ifNull: [{ $arrayElemAt: ['$totalTasks.count', 0] }, 0] },
        },
      },
    ];

    const [result] = await Task.aggregate(pipeline);
    return {
      totalTasks: result?.totalTasks ?? 0,
      byStatus: result?.byStatus ?? [],
      byPriority: result?.byPriority ?? [],
    };
  },

  /**
   * Board Analytics Aggregation Pipeline (Single Round-Trip)
   *
   * Runs a single $facet aggregation that answers two real analytical questions
   * for a given board in one MongoDB round-trip (Learning Outcome 4):
   *
   *   1. overduePerAssignee — "How many tasks per assignee are overdue on this board?"
   *      Matches tasks where dueDate < now AND status != 'done', groups by assignee,
   *      then $lookup-joins to the users collection to populate assignee details.
   *
   *   2. summary — task counts broken down by status and by priority,
   *      plus total task count and overdue task count for the board.
   *
   * @param {string} boardId - The board ID to aggregate tasks for
   * @returns {Promise<object>} Analytics payload with overduePerAssignee + summary
   */
  async getBoardAnalytics(boardId) {
    const now = new Date();
    const boardMatch = mongoose.Types.ObjectId.isValid(boardId)
      ? { $in: [String(boardId), new mongoose.Types.ObjectId(boardId)] }
      : String(boardId);

    const pipeline = [
      // ── Stage 1: Match only tasks that belong to this board ──────────────
      { $match: { boardId: boardMatch } },

      // ── Stage 2: Normalise the assignee field into a scalar _assigneeId ──
      // Handles documents with existing `assigneeId`, embedded object `assignee`,
      // or plain string `assignee`.
      {
        $addFields: {
          _assigneeId: {
            $ifNull: [
              '$assigneeId',
              {
                $cond: {
                  if: { $eq: [{ $type: '$assignee' }, 'object'] },
                  then: '$assignee.id',
                  else: {
                    $cond: {
                      if: { $gt: [{ $strLenBytes: { $ifNull: ['$assignee', ''] } }, 0] },
                      then: '$assignee',
                      else: null,
                    },
                  },
                },
              },
            ],
          },
        },
      },

      // ── Stage 3: $facet splits the stream into parallel sub-pipelines ─────
      // All sub-pipelines operate on the same matched+normalised documents,
      // meaning the entire analytics response is produced in a single DB round-trip.
      {
        $facet: {
          // ── Sub-pipeline A: Overdue tasks per assignee ─────────────────
          // Answers: "How many tasks per assignee are overdue on this board?"
          overduePerAssignee: [
            {
              $match: {
                dueDate: { $lt: now },          // past the deadline
                status: { $ne: 'done' },        // not yet completed
              },
            },
            {
              $group: {
                _id: '$_assigneeId',            // group by normalised assignee id
                overdueCount: { $sum: 1 },      // count overdue tasks
                taskIds: { $push: '$_id' },     // collect task ids for reference
              },
            },
            // Join to users collection to populate assignee name/email
            {
              $lookup: {
                from: 'users',
                localField: '_id',              // the assignee id we grouped by
                foreignField: '_id',            // users._id (also a string in seed data)
                as: 'assigneeDetails',
              },
            },
            // Flatten the single-element array returned by $lookup
            {
              $addFields: {
                assignee: { $arrayElemAt: ['$assigneeDetails', 0] },
              },
            },
            {
              $project: {
                assigneeDetails: 0,             // remove the raw lookup array
                'assignee.passwordHash': 0,     // never expose password hashes
                'assignee.__v': 0,
              },
            },
            { $sort: { overdueCount: -1 } },   // most overdue first
          ],

          // ── Sub-pipeline B: Task counts by status ──────────────────────
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // ── Sub-pipeline C: Task counts by priority ────────────────────
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // ── Sub-pipeline D: Total task count ──────────────────────────
          totalTasks: [{ $count: 'count' }],

          // ── Sub-pipeline E: Overdue task count (board-level) ──────────
          totalOverdue: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: 'done' },
              },
            },
            { $count: 'count' },
          ],
        },
      },

      // ── Stage 4: Reshape the $facet output into a clean response shape ───
      {
        $project: {
          overduePerAssignee: 1,
          byStatus: 1,
          byPriority: 1,
          totalTasks: { $ifNull: [{ $arrayElemAt: ['$totalTasks.count', 0] }, 0] },
          totalOverdue: { $ifNull: [{ $arrayElemAt: ['$totalOverdue.count', 0] }, 0] },
        },
      },
    ];

    const [result] = await Task.aggregate(pipeline);

    // Guarantee safe defaults when the board has no tasks yet
    const totalTasks = result?.totalTasks ?? 0;
    const totalOverdue = result?.totalOverdue ?? 0;
    const overduePerAssignee = result?.overduePerAssignee ?? [];
    const byStatus = result?.byStatus ?? [];
    const byPriority = result?.byPriority ?? [];

    return {
      boardId: String(boardId),
      generatedAt: now.toISOString(),
      totalTasks,
      totalOverdue,
      overduePerAssignee,
      byStatus,
      byPriority,
      summary: {
        totalTasks,
        totalOverdue,
        byStatus,
        byPriority,
      },
    };
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


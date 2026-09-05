import mongoose from 'mongoose';
import { Comment } from '../models/Comment.js';

function formatComment(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
  return {
    ...obj,
    id: String(obj.id || obj._id),
    taskId: String(obj.taskId),
    authorId: String(obj.authorId),
    content: obj.content,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export const commentRepo = {
  async listByTaskId(taskId) {
    if (!taskId) return [];
    const docs = await Comment.find({ taskId: String(taskId) }).sort({ createdAt: 1 });
    return docs.map(formatComment);
  },

  async findById(commentId) {
    if (!commentId) return null;
    let doc = null;
    if (mongoose.Types.ObjectId.isValid(commentId)) {
      doc = await Comment.findById(commentId);
    }
    if (!doc) {
      doc = await Comment.findOne({ _id: String(commentId) });
    }
    return formatComment(doc);
  },

  async create({ taskId, authorId, content }) {
    const doc = await Comment.create({
      taskId: String(taskId),
      authorId: String(authorId),
      content: content.trim(),
    });
    return formatComment(doc);
  },

  async delete(commentId) {
    if (!commentId) return false;
    const result = mongoose.Types.ObjectId.isValid(commentId)
      ? await Comment.findByIdAndDelete(commentId)
      : await Comment.findOneAndDelete({ _id: String(commentId) });
    return Boolean(result);
  },
};

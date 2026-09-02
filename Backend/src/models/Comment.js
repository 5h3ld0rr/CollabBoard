import mongoose from 'mongoose';

/**
 * Mongoose schema for Task Comments
 */
const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      default: 'Collaborator',
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    return ret;
  },
});

export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
export default Comment;

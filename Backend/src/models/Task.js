import mongoose from 'mongoose';

/**
 * Mongoose schema for Task
 * Includes version field for Optimistic Concurrency Control (OCC)
 * and compound indexes for fast board view queries.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    boardId: {
      type: String,
      required: [true, 'boardId is required'],
      index: true,
    },
    columnId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'doing', 'in-progress', 'done'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid task priority',
      },
      default: 'normal',
    },
    assignee: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    done: {
      type: Boolean,
      default: false,
    },
    // Optimistic Concurrency Control integer
    version: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Query Indexes (Slide 24)
taskSchema.index({ boardId: 1, status: 1, position: 1 });
taskSchema.index({ boardId: 1, dueDate: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

// toJSON transform: map _id to id and remove versionKey
taskSchema.set('toJSON', {
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

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;

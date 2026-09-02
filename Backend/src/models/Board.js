import mongoose from 'mongoose';

/**
 * Embedded column sub-document schema
 * Columns are bounded and always read together with the board
 */
const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true }
);

/**
 * Mongoose schema for Board
 * Embeds columns and members; references tasks in a separate collection
 */
const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      minlength: [3, 'Board title must be at least 3 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    workspaceId: {
      type: String,
      default: null,
      index: true,
    },
    workspaceName: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'from-indigo-600 to-violet-600',
    },
    icon: {
      type: String,
      default: 'Kanban',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    members: {
      type: [String],
      default: [],
    },
    columns: {
      type: [columnSchema],
      default: () => [
        { title: 'To Do', position: 0 },
        { title: 'In Progress', position: 1 },
        { title: 'Done', position: 2 },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// toJSON transform: map _id to id and remove versionKey
boardSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    if (Array.isArray(ret.columns)) {
      ret.columns = ret.columns.map((col) => {
        if (col._id) {
          const { _id, ...rest } = col;
          return { id: _id.toString(), ...rest };
        }
        return col;
      });
    }
    return ret;
  },
});

export const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);
export default Board;

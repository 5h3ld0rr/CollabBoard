import mongoose from 'mongoose';

/**
 * Mongoose schema for Workspace
 */
const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Workspace name must be at least 2 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: 'from-blue-600 to-indigo-600',
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    admins: {
      type: [String],
      default: [],
    },
    members: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.set('toJSON', {
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

export const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
export default Workspace;

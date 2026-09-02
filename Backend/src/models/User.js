import mongoose from 'mongoose';

/**
 * Mongoose schema for User
 * Implements email uniqueness index and toJSON transform to strip passwordHash
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'User',
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
  },
  {
    timestamps: true,
  }
);

// toJSON transform: automatically strip passwordHash and map _id to id
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

import mongoose from 'mongoose';

export const COLOR_PALETTES = [
  'from-indigo-600 to-violet-600',
  'from-emerald-600 to-teal-600',
  'from-fuchsia-600 to-pink-600',
  'from-amber-600 to-orange-600',
  'from-sky-600 to-cyan-600',
];

export function getRandomColor() {
  return COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
}

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
    color: {
      type: String,
      default: getRandomColor,
    },
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'pro'],
      default: 'basic',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    favoriteBoardIds: {
      type: [String],
      default: [],
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

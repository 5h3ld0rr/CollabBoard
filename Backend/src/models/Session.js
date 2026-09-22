import mongoose from 'mongoose';

/**
 * Mongoose schema for User Active Device Session
 * Tracks device, browser, OS, IP address, and revocation status
 */
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    device: {
      type: String,
      default: 'Web Browser',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    location: {
      type: String,
      default: 'Local Network',
    },
    iconType: {
      type: String,
      enum: ['laptop', 'smartphone'],
      default: 'laptop',
    },
    userAgent: {
      type: String,
      default: '',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    if (ret._id) {
      delete ret._id;
    }
    return ret;
  },
});

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export default Session;

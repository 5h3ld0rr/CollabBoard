import mongoose from 'mongoose';
import { config } from '../config.js';

/**
 * Establishes a persistent connection to the MongoDB database.
 * Enforces strictQuery mode and uses a 5000ms selection timeout.
 * Fails fast with a clear error message if the database is unreachable.
 */
export async function connectDb() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully to', config.mongoUri);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(error.message);
    console.error('Please verify that MongoDB service is running (Get-Service MongoDB) or check MONGODB_URI in .env');
    process.exit(1);
  }
}

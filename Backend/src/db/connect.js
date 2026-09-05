import mongoose from 'mongoose';
import dns from 'dns';
import { config } from '../config.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Establishes a persistent connection to the MongoDB database.
 * Enforces strictQuery mode and uses a 15000ms selection timeout.
 * Fails fast with a clear error message if the database is unreachable.
 */
export async function connectDb() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(error.message);
    console.error('Please verify that MongoDB service is running (Get-Service MongoDB) or check MONGODB_URI in .env');
    process.exit(1);
  }
}

import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config.js';
import { connectDb } from './db/connect.js';

// Connect to MongoDB first, then start listening
await connectDb();

const server = app.listen(config.port, () => {
  console.log(`🚀 CollabBoard API server listening on http://localhost:${config.port}`);
});

// Graceful shutdown lifecycle management
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
    console.log('HTTP server closed cleanly. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


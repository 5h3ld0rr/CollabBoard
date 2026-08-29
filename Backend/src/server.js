import app from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 CollabBoard API server listening on http://localhost:${config.port}`);
});

// Graceful shutdown lifecycle management
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed cleanly. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

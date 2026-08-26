import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

/* Application-Level Middleware */
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(requestId);
app.use(requestLogger);

/* Health Check Endpoint (Public) */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* API Routes */
app.use('/api/auth', authRoutes);

/* Central Error Catchers (Always registered last) */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

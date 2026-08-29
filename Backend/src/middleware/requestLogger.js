import fs from 'node:fs';
import path from 'node:path';

const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/* ANSI color helpers for terminal styling */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function getMethodBadge(method) {
  const padded = method.padEnd(6, ' ');
  switch (method) {
    case 'GET':
      return `${colors.cyan}${colors.bold}${padded}${colors.reset}`;
    case 'POST':
      return `${colors.green}${colors.bold}${padded}${colors.reset}`;
    case 'PATCH':
    case 'PUT':
      return `${colors.yellow}${colors.bold}${padded}${colors.reset}`;
    case 'DELETE':
      return `${colors.red}${colors.bold}${padded}${colors.reset}`;
    default:
      return `${colors.magenta}${colors.bold}${padded}${colors.reset}`;
  }
}

function getStatusBadge(status) {
  if (status >= 500) return `${colors.red}${colors.bold}${status}${colors.reset}`;
  if (status >= 400) return `${colors.yellow}${colors.bold}${status}${colors.reset}`;
  if (status >= 300) return `${colors.cyan}${colors.bold}${status}${colors.reset}`;
  return `${colors.green}${colors.bold}${status}${colors.reset}`;
}

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const shortId = req.id ? req.id.slice(0, 8) : '--------';

    // Pretty colored console output
    const consoleOutput = [
      `${colors.dim}[${timeStr}]${colors.reset}`,
      getMethodBadge(req.method),
      `${colors.bold}${req.originalUrl.padEnd(28, ' ')}${colors.reset}`,
      getStatusBadge(res.statusCode),
      `${colors.dim}${duration.toString().padStart(4, ' ')}ms${colors.reset}`,
      `${colors.dim}#${shortId}${colors.reset}`,
    ].join(' ');

    console.log(consoleOutput);

    // Clean, structured plain-text file log
    const fileLogLine = `[${new Date().toISOString()}] ${req.method.padEnd(6)} ${req.originalUrl} ${res.statusCode} ${duration}ms [${req.id || 'no-id'}]\n`;
    fs.promises.appendFile(path.join(logsDir, 'access.log'), fileLogLine).catch(() => {});
  });

  next();
}

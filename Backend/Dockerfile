FROM node:20-alpine

WORKDIR /app

# Lockfile first to cache dependency layers
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# Run as non-root node user for security
USER node

CMD ["node", "src/server.js"]

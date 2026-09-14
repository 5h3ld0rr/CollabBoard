# 🐳 DevOps & Containerization Guide

This document details the Dockerization, Nginx reverse proxying, and Docker Compose orchestration architecture for **CollabBoard** as established in Session 5 (Real-Time & DevOps).

---

## 🏗️ Architecture Overview

CollabBoard is containerized across three dedicated services managed via `docker-compose.yml`:

```
                    Browser / Client (http://localhost:9090)
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │            client (Nginx:Alpine)                 │
             │           Port 80 (Host Port 9090)               │
             ├────────────────────────┬─────────────────────────┤
             │  Static Assets & SPA   │   Reverse Proxy Paths   │
             │  try_files $uri /index │   /api/ & /socket.io/   │
             └───────────┬────────────┴────────────┬────────────┘
                         │                         │
                         │ (Internal Network)      │ Proxy Pass
                         │                         ▼
                         │            ┌─────────────────────────┐
                         │            │   server (Node.js 20)   │
                         │            │        Port 4000        │
                         │            └────────────┬────────────┘
                         │                         │ Mongoose connection
                         │                         ▼
                         │            ┌─────────────────────────┐
                         │            │     mongo (MongoDB 8)   │
                         │            │        Port 27017       │
                         │            │  Volume: mongodata      │
                         │            └─────────────────────────┘
```

---

## 📦 Container Specifications

### 1. MongoDB Service (`mongo:8`)
- **Image**: `mongo:8`
- **Volume**: Named volume `mongodata:/data/db` ensuring data persists across container restarts.
- **Healthcheck**: 
  ```yaml
  healthcheck:
    test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5
  ```
  Prevents crash loops by guaranteeing the database is fully ready before the backend attempts to connect.

### 2. Backend Server (`Backend/Dockerfile`)
- **Base Image**: `node:20-alpine` (lightweight, minimal attack surface).
- **Security**: Runs under non-root user `USER node`.
- **Port**: Exposes `4000`.
- **Caching**: `COPY package*.json ./` followed by `RUN npm ci --omit=dev` ensures layer caching when application code changes.
- **Orchestration**: Waits for `mongo` to report `service_healthy`.

### 3. Frontend Client & Reverse Proxy (`Frontend/Dockerfile`)
- **Multi-Stage Build**:
  - **Stage 1 (`build`)**: Compiles React TypeScript application into static bundle `/app/dist` via `RUN npm run build`. Injects build-time argument `ARG VITE_API_URL=""` so API requests use relative paths.
  - **Stage 2 (`production`)**: Lightweight `nginx:alpine` image copying `/app/dist` into `/usr/share/nginx/html` and applying custom `nginx.conf`.
- **Port Mapping**: Exposes container port `80`, mapped to host port `9090`.

---

## 🌐 Nginx Reverse Proxy & WebSocket Configuration

The `Frontend/nginx.conf` solves three critical production challenges in a single configuration:

1. **Single Page Application (SPA) Fallback**:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
   Ensures deep links (e.g., `/workspaces/ws-1/boards/b-123`) resolve to `index.html` on browser refresh instead of returning 404s.

2. **Same-Origin API Proxying (Zero CORS in Production)**:
   ```nginx
   location /api/ {
       proxy_pass http://server:4000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   Proxies all REST API requests from `http://localhost:9090/api/*` internally to the server container at `http://server:4000/api/*`.

3. **WebSocket Handshake & Upgrade**:
   ```nginx
   location /socket.io/ {
       proxy_pass http://server:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_read_timeout 86400s;
   }
   ```
   Upgrades HTTP connections to persistent full-duplex TCP WebSockets for real-time task sync and live presence broadcasting.

---

## 🚀 Running with Docker Compose

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+

### Step-by-Step Launch
1. Clone repository and navigate to root:
   ```bash
   git clone https://github.com/5h3ld0rr/CollabBoard.git
   cd CollabBoard
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Build and launch all containers:
   ```bash
   docker compose up --build
   ```

4. Access the application:
   - **Web Application**: [http://localhost:9090](http://localhost:9090)
   - **REST API Healthcheck**: [http://localhost:9090/api/health](http://localhost:9090/api/health)
   - **Interactive Swagger Docs**: [http://localhost:9090/api/docs](http://localhost:9090/api/docs)

---

## 🛠️ Docker CLI Reference Cheat Sheet

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Start stack** | `docker compose up -d` | Runs all services detached in background |
| **Rebuild stack** | `docker compose up --build` | Re-triggers multi-stage image builds |
| **View logs** | `docker compose logs -f server` | Streams live backend logs |
| **Shell access** | `docker compose exec server sh` | Spawns interactive shell in container |
| **Stop stack** | `docker compose down` | Halts containers while keeping MongoDB data intact |
| **Reset data** | `docker compose down -v` | Halts containers and wipes persistent volumes |

---

## ✅ Production Deployment Checklist

Before going live on a cloud platform (e.g., Render, Railway, AWS ECS, Fly.io):

1. **Managed Database**: Use MongoDB Atlas with SSL and strong credentials rather than an ephemeral container.
2. **Environment Variables**:
   - `MONGODB_URI`: Set to connection string with URL-encoded passwords.
   - `JWT_SECRET`: High-entropy 64-character secret.
   - `CLIENT_ORIGIN`: Set to public domain (e.g., `https://collabboard.example.com`).
   - `VITE_API_URL`: Empty string for Nginx reverse proxy deployments.
3. **CORS Alignment**: Ensure `CLIENT_ORIGIN` matches production frontend domain.
4. **WebSocket Headers**: Verify edge proxy / CDN forwards `Upgrade` and `Connection` headers without timeout truncation.
5. **HTTPS / WSS**: Serve frontend over `https://` so WebSockets automatically negotiate secure `wss://`.
6. **Health Endpoint**: Configure platform container orchestrator health probe to poll `/api/health`.

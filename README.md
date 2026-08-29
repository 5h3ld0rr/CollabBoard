# 🚀 CollabBoard

> A modern, enterprise-grade collaborative Kanban board and sprint planning platform built with **Node.js**, **Express**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

- 🏢 **Multi-Tenant Workspaces**: Organize projects into team workspaces (e.g., Core Engineering, Product & Design) with dynamic member roles (**Owner**, **Admin**, **Member**).
- 📋 **Agile Kanban Boards**: Interactive board columns (`To Do`, `In Progress`, `Done`), drag-and-drop workflow simulation, priority badges, tags, and due-date tracking.
- 📊 **Real-Time Dynamic Metrics**: Automatic workspace statistics including active boards, tasks in flight, completion percentage, and active collaborator sets.
- 🔐 **Secure JWT Authentication**: Stateless bearer token authentication, bcrypt password hashing, and client-side protected route navigation.
- 🛡️ **Defensive API Validation**: Robust schema parsing with **Zod** middleware, structured error codes, and strict ownership authorization.
- 📖 **Interactive Swagger Documentation**: Live API explorer and OpenAPI 3.0 specification available directly at `/api/docs`.

---

## 🏛️ System Architecture

CollabBoard follows a **4-Layer Architecture** to ensure clean separation of concerns and maintainability:

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React 19)                   │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / JSON (Bearer JWT)
┌────────────────────────────▼────────────────────────────┐
│ 1. Routes Layer       (URL routing & middleware binding)│
├─────────────────────────────────────────────────────────┤
│ 2. Controllers Layer  (HTTP req/res extraction & codes) │
├─────────────────────────────────────────────────────────┤
│ 3. Services Layer     (Business logic & authorization)  │
├─────────────────────────────────────────────────────────┤
│ 4. Repositories Layer (Data store & entity operations)  │
└─────────────────────────────────────────────────────────┘
```

### Response & Error Standards

- **Single Resource:**
  ```json
  {
    "data": { "id": "ws-1", "name": "Core Engineering" }
  }
  ```
- **Collection Resource:**
  ```json
  {
    "data": [ ... ],
    "meta": { "page": 1, "limit": 20, "total": 2 }
  }
  ```
- **Error Response:**
  ```json
  {
    "error": {
      "message": "Validation failed",
      "code": "VALIDATION_ERROR",
      "requestId": "req-12345",
      "details": [
        { "field": "email", "message": "Invalid email address format" }
      ]
    }
  }
  ```

---

## 📋 CollabBoard REST API Contract

All private endpoints require an `Authorization: Bearer <token>` header.

### 1. Authentication
| Method | Endpoint | Description | Request Body | Status |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user | `{ name?, email, password }` | `201 Created` |
| **POST** | `/api/auth/login` | Authenticate user & get token | `{ email, password }` | `200 OK` |
| **GET** | `/api/auth/me` | Fetch authenticated profile | *None* | `200 OK` |

### 2. Workspaces
| Method | Endpoint | Description | Request Body | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/workspaces` | List accessible workspaces with stats | *None* | `200 OK` |
| **POST** | `/api/workspaces` | Create a new workspace | `{ name, description?, color? }` | `201 Created` |
| **GET** | `/api/workspaces/:id` | Get single workspace & member list | *None* | `200 OK` |
| **PATCH** | `/api/workspaces/:id` | Update workspace name/color/members | `{ name?, description?, color?, admins?, members? }` | `200 OK` |
| **DELETE**| `/api/workspaces/:id` | Remove workspace *(Owner only)* | *None* | `204 No Content` |

### 3. Boards
| Method | Endpoint | Description | Request Body | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/boards` | List accessible sprint boards | *None* | `200 OK` |
| **POST** | `/api/boards` | Create a new board in a workspace | `{ title, description?, workspaceId, color?, icon?, tags? }` | `201 Created` |
| **GET** | `/api/boards/:id` | Get board details & live stats | *None* | `200 OK` |
| **PATCH** | `/api/boards/:id` | Update board title, tags, or theme | `{ title?, description?, isFavorite?, tags? }` | `200 OK` |
| **DELETE**| `/api/boards/:id` | Delete a board *(Owner only)* | *None* | `204 No Content` |
| **POST** | `/api/boards/:id/members` | Add a collaborator to board | `{ userId }` | `200 OK` |
| **DELETE**| `/api/boards/:id/members/:memberId` | Remove board collaborator | *None* | `200 OK` |

### 4. Tasks
| Method | Endpoint | Description | Request Body / Query | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/boards/:id/tasks` | Get tasks for a board (filterable) | `?status=&assignee=&search=&page=&limit=` | `200 OK` |
| **GET** | `/api/tasks` | Global tasks list across boards | `?boardId=&status=&assignee=&page=&limit=` | `200 OK` |
| **POST** | `/api/tasks` | Create a new task | `{ title, boardId, description?, status?, priority?, assignee?, dueDate?, tags? }` | `201 Created` |
| **GET** | `/api/tasks/:id` | Fetch task details | *None* | `200 OK` |
| **PATCH** | `/api/tasks/:id` | Update task details or status | `{ title?, description?, status?, priority?, assignee?, dueDate?, tags? }` | `200 OK` |
| **DELETE**| `/api/tasks/:id` | Delete a task | *None* | `204 No Content` |

### 5. Documentation
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/docs` | Interactive Swagger UI Explorer | `200 OK` |
| **GET** | `/api/docs.json` | OpenAPI 3.0 Contract Specification | `200 OK` |
| **GET** | `/api/health` | Service uptime and health status | `200 OK` |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 with Vite & TypeScript
- **Styling:** Tailwind CSS v4 + Glassmorphism UI
- **Routing:** React Router v7 with Protected Route guards
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 4
- **Validation:** Zod Schema Engine
- **Auth & Security:** JSON Web Tokens (JWT), Bcrypt.js, CORS, Custom Rate Limiter
- **API Docs:** Swagger UI Express & YAML OpenAPI spec
- **Testing:** Node.js Native Test Runner (`node:test`, `node:assert`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= v18.0.0
- **npm** >= v9.0.0

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd Backend

# Install dependencies
npm install

# Start development server
npm run dev
```
Backend runs at **`http://localhost:4000`**  
Interactive API Docs: **`http://localhost:4000/api/docs`**

### 3. Frontend Setup
```bash
# Navigate to the frontend directory
cd Frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend runs at **`http://localhost:5173`**


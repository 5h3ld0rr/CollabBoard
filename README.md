# SyncBoard / CollabBoard API

A full-stack collaborative kanban board application built with Node.js, Express, and React.

---

## 📋 SyncBoard API Contract

| Method & Path | Purpose | Request Body | Success | Errors |
| :--- | :--- | :--- | :--- | :--- |
| **POST** `/api/auth/register` | Create an account | `{ name?, email, password }` | `201` + `{ data: { token, user } }` | `400`, `409` |
| **POST** `/api/auth/login` | Exchange credentials for token | `{ email, password }` | `200` + `{ data: { token, user } }` | `400`, `401` |
| **GET** `/api/auth/me` | Current user from token | *None* | `200` + `{ data: { user } }` | `401` |
| **GET** `/api/boards` | Boards this user can see | *None* | `200` + `{ data: Board[] }` | `401` |
| **POST** `/api/boards` | Create a new board | `{ title, description?, members? }` | `201` + `{ data: Board }` | `400`, `401` |
| **GET** `/api/boards/:id` | Get specific board details | *None* | `200` + `{ data: Board }` | `401`, `403`, `404` |
| **PATCH** `/api/boards/:id` | Update board fields | `{ title?, description?, members? }` | `200` + `{ data: Board }` | `400`, `401`, `403`, `404` |
| **DELETE** `/api/boards/:id` | Remove a board (Owner only) | *None* | `204` No Content | `401`, `403`, `404` |
| **GET** `/api/boards/:id/tasks` | Tasks on a board (filterable) | *Query:* `?status=&assignee=&sort=&page=&limit=` | `200` + `{ data: Task[], meta: { page, limit, total } }` | `401`, `403`, `404` |
| **GET** `/api/tasks` | List all accessible tasks | *Query:* `?status=&assignee=&sort=&page=&limit=&boardId=` | `200` + `{ data: Task[], meta: { page, limit, total } }` | `401` |
| **POST** `/api/tasks` | Create a task | `{ title, boardId, description?, status?, priority?, assignee?, dueDate? }` | `201` + `{ data: Task }` | `400`, `401`, `403` |
| **GET** `/api/tasks/:id` | Get single task | *None* | `200` + `{ data: Task }` | `401`, `403`, `404` |
| **PATCH** `/api/tasks/:id` | Update task fields / status | `{ title?, status?, priority?, assignee?, dueDate? }` | `200` + `{ data: Task }` | `400`, `401`, `403`, `404` |
| **DELETE** `/api/tasks/:id` | Remove a task | *None* | `204` No Content | `401`, `403`, `404` |

---

## 🏛️ Architectural Design & Decisions

1. **4-Layer Architecture (`Routes -> Controllers -> Services -> Repositories`)**
   - **Routes:** Route matching, middleware declarations (`validate`, `authenticate`). Zero business logic.
   - **Controllers:** Request extraction, calling service functions, HTTP status code selection.
   - **Services:** Pure business rules, ownership authorization, query engines. Completely agnostic of `req` and `res`.
   - **Repositories:** Data storage abstraction. In-memory arrays for Session 2, seamlessly swappable with MongoDB in Session 3.

2. **Unified Response & Error Shape**
   - **Success (Single):** `{ "data": { ... } }`
   - **Success (Collection):** `{ "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 42 } }`
   - **Error:** `{ "error": { "message": "...", "code": "...", "requestId": "...", "details": [ ... ] } }`

3. **Security Model & Decisions**
   - **Bcrypt Hashing:** User passwords are never stored in plaintext and hashed using `bcryptjs` with cost factor 10. Password hashes are stripped before leaving the repository layer.
   - **JWT Tokens:** Issued upon login/register with 1-hour expiration. Passed via `Authorization: Bearer <token>` header.
   - **Ownership Authorization:** A user cannot view or modify boards or tasks they do not belong to (403 Forbidden vs 401 Unauthorized distinction).
   - **Token Storage Decision:** `localStorage` is used for client-side cross-domain development convenience, coupled with central `auth:expired` event dispatching when receiving a 401 response.

---

## 🚀 Running the Project

### Backend
```bash
cd Backend
npm install
npm run dev
```
Runs on `http://localhost:4000`.

### Frontend
```bash
cd Frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

# CollabBoard 📋⚡

> A modern, responsive, collaborative Kanban workspace and task management web application built for agile engineering teams.

---

## 📖 Table of Contents

- [What It Is](#-what-it-is)
- [Key Features](#-key-features)
- [How to Run It](#-how-to-run-it)
- [Folder Conventions](#-folder-conventions)
- [Architecture & State Management](#-architecture--state-management)
- [Known Limitations](#-known-limitations)

---

## 🚀 What It Is

**CollabBoard** is a full-featured collaborative project management and Kanban board application. Designed with modern developer ergonomics and rich dark aesthetics, it enables teams to organize sprints, track work items, discuss tasks, and manage project lifecycles effortlessly.

### Tech Stack
- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linter:** [Oxlint](https://oxc.rs/)

---

## ✨ Key Features

- 📌 **Interactive Kanban Boards:** 3-column structured workflow (`To Do`, `In Progress`, `Completed`) with status progressions and task counts.
- 🎯 **Task Management:** Create, edit, assign, tag, prioritize (`Low`, `Medium`, `High`, `Urgent`), and set due dates with automatic overdue detection.
- 💬 **Discussion & Comments System:** Standalone task detail view (`/tasks/:id`) featuring a conversation feed with relative timestamps, edit capabilities, and deletion confirmation dialogs.
- ⚡ **Global Search & Filter Bar:** Instant title search with keyboard shortcuts (<kbd>Ctrl</kbd> + <kbd>K</kbd> to focus, <kbd>Esc</kbd> to blur), assignee filtering, and status filters.
- 🌐 **Live Network Indicator:** Real-time Online / Offline network health indicator with automatic reconnect detection.
- 🏢 **Multi-Workspace & Board Switching:** Seamless workspace switching and board settings configuration modal.
- 🛡️ **Graceful 404 Recovery:** Custom orbit-themed 404 pages for non-existent routes, bad board IDs, and missing task IDs without application crashes.

---

## 💻 How to Run It

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/5h3ld0rr/CollabBoard.git
   cd CollabBoard
   ```

2. **Navigate into the Frontend directory:**
   ```bash
   cd Frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) (or the port indicated in your terminal) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 📁 Folder Conventions

```text
CollabBoard/
├── Backend/                    # Backend services (Milestone 2 integration)
├── Frontend/                   # Frontend React + TypeScript application
│   ├── public/                 # Static assets (favicons, SVG logos)
│   ├── src/
│   │   ├── api/                # Named API service modules (never raw fetch in UI)
│   │   │   ├── boards.ts       # Board queries & mutations
│   │   │   ├── tasks.ts        # Task & comment queries & mutations
│   │   │   └── index.ts        # Consolidated API exports
│   │   ├── components/         # Reusable UI component modules
│   │   │   ├── auth/           # Login & Registration cards
│   │   │   ├── board/          # TaskCard, Column, TaskModal, BoardSettingsModal
│   │   │   ├── common/         # Navbar, AmbientBackground, Logo, NetworkStatus
│   │   │   └── workspace/      # WorkspaceSwitcher, WorkspaceDropdown
│   │   ├── context/            # React Contexts & useReducer state machines
│   │   │   ├── BoardContext.tsx# BoardProvider & boardReducer (Tasks & Boards)
│   │   │   └── index.ts        # Context exports
│   │   ├── data/               # Seed data & in-memory stores
│   │   │   └── mockData.ts     # Initial boards, tasks, comments, and members
│   │   ├── pages/              # Application Route Views
│   │   │   ├── Home.tsx        # Landing & feature showcase page
│   │   │   ├── Dashboard.tsx   # Workspaces, board directory, and overview
│   │   │   ├── BoardView.tsx   # Kanban canvas (/boards/:id)
│   │   │   ├── TaskDetails.tsx # Standalone task page (/tasks/:id) with discussions
│   │   │   ├── Profile.tsx     # User profile, preferences, and session list
│   │   │   ├── Login.tsx       # Sign-in view
│   │   │   ├── Register.tsx    # Sign-up view
│   │   │   └── NotFound.tsx    # 404 catch-all page
│   │   ├── types/              # Central TypeScript definitions
│   │   │   └── index.ts        # Interfaces for Board, Task, User, Comment, etc.
│   │   ├── App.tsx             # Root router with BoardProvider wrapper
│   │   ├── main.tsx            # DOM entry point
│   │   └── index.css           # Global Tailwind CSS styles and theme variables
│   ├── package.json            # Project dependencies and run scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite build and plugin setup
└── README.md                   # Project documentation
```

---

## 🧠 Architecture & State Management

- **Centralized `BoardContext` (`useReducer`)**:
  All task list and board operations (`ADD_TASK`, `UPDATE_TASK`, `DELETE_TASK`, `MOVE_TASK_STATUS`, `SET_TASKS`, `CLEAR_BOARD_TASKS`, `ADD_BOARD`, `UPDATE_BOARD`, `DELETE_BOARD`) are dispatched through a deterministic `boardReducer`.
- **Decoupled API Layer (`src/api/`)**:
  UI components do not call raw HTTP `fetch` directly. All asynchronous operations are handled via named async service functions in `src/api/tasks.ts` and `src/api/boards.ts`.

---

## ⚠️ Known Limitations

1. **In-Memory Mock Persistence:**
   - As part of the **Milestone 1 (Static UI & Frontend Architecture)** scope, task and comment mutations persist in memory during the active session. Full page hard-refreshes will re-initialize to the mock seed data until backend database persistence is connected.
2. **WebSocket Real-time Broadcast:**
   - Multi-user live cursor broadcasting and cross-tab socket syncing are simulated in this milestone and will be wired to the live WebSocket server in Milestone 2.
3. **Mock Authentication Session:**
   - The active user profile is pre-authenticated as `Alex Chen` (`MOCK_CURRENT_USER`) for local testing.

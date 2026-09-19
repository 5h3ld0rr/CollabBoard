# Live Column UI, Header Counters & Echo Prevention

## 1. Preventing Echo Loops (Session 5 - Slide 17)
When a user performs a local operation (e.g., creates a task, updates status, moves cards):
1. The UI immediately applies optimistic updates in local React state and writes to PouchDB.
2. The REST mutation is sent to the server.
3. The server broadcasts a WebSocket event (`task:created`, `task:updated`, `task:deleted`, `board:updated`) containing `actorId`.
4. If the originating client receives this event, it must not duplicate or cause redundant re-renders:
   ```typescript
   if (payload.actorId && user?.id && String(payload.actorId) === String(user.id)) {
     return; // Echo loop ignored
   }
   ```

---

## 2. Dynamic Column Header Task Counters
Columns dynamically recompute their task counters without waiting for REST re-fetches:
- The `Column` component displays `<span data-testid="column-task-count-{status}">{tasks.length}</span>`.
- When real-time events (`task:created`, `task:updated`, `task:deleted`) arrive from other collaborators, `BoardContext` updates the tasks state, triggering reactive counter updates across column headers instantly.

---

## 3. Real-Time Testing Strategy
- **Backend Tests (`Backend/tests/boardRoomsPresence.test.js`)**: Tests `board:join`, `board:leave`, in-memory room scoping, multi-user `presence:update`, and `board:updated` emissions.
- **Frontend Tests (`LiveColumnUI.test.tsx`, `BoardViewSocketEvents.test.tsx`, `columnUtils.test.ts`)**: Tests reactive column counter badges, drag-and-drop actions, board join/leave lifecycle, and collaborator presence rendering.

# In-Memory Presence Tracking Architecture

## Overview
This document specifies the in-memory presence tracking subsystem of **CollabBoard**, designed according to Session 5 (*Real-Time Communication & DevOps - Slide 19 & 20*) standards.

---

## 1. Presence Data Structure (Session 5 - Slide 19)

Presence data is ephemeral and tracked in memory to achieve sub-millisecond response latency:

```javascript
// boardId -> Map(userId -> connectionCount)
const presence = new Map();
```

### Why a Two-Level Nested Map?
A simple `Set(userId)` is insufficient because a user may open multiple tabs or multiple devices connected to the same board:
- When Tab 1 opens: `connectionCount` increments from `0` to `1` (User becomes online, announce `presence:update`).
- When Tab 2 opens: `connectionCount` increments from `1` to `2` (User is already online, no duplicate status flips).
- When Tab 1 closes: `connectionCount` decrements from `2` to `1` (User remains online).
- When Tab 2 closes: `connectionCount` decrements from `1` to `0` (User is removed from presence, announce `presence:update`).

---

## 2. Broadcast Lifecycle

### `board:join`:
When a client sends `socket.emit('board:join', boardId)`:
1. Socket joins room `board:<id>`.
2. `presenceTracker.addConnection(boardId, userId)`.
3. Server emits `presence:update` to room `board:<id>` with an array of active `userId`s.

### `board:leave`:
When a user navigates away:
1. Socket leaves room `board:<id>`.
2. `presenceTracker.removeConnection(boardId, userId)`.
3. Server re-announces updated `presence:update` to the room.

### Disconnect & Socket Drops (`disconnecting`):
When a socket drops (network failure, browser tab closed, proxy timeout):
1. The server iterates over all active rooms in `socket.rooms`.
2. For each room prefixed with `board:`, decrements the connection count.
3. Broadcasts the updated collaborator list to the remaining occupants.

---

## 3. Horizontal Scaling Note (Session 5 - Slide 20)

> [!NOTE]
> In-memory presence is contained within a single Node.js process. In a distributed multi-container deployment, Socket.io Redis adapter (`@socket.io/redis-adapter`) or Redis key-value store is utilized to synchronize presence across container nodes.

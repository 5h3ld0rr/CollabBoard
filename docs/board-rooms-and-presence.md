# Board Rooms and Presence Architecture

## Overview
This document outlines the real-time room routing and collaborator presence architecture for CollabBoard, designed according to Session 5 (Real-Time Communication & DevOps) standards.

---

## 1. Room Scoping (`board:<id>`)
WebSockets broadcast messages across connections. To prevent cross-board data leakage and wasteful network overhead, sockets are scoped into rooms matching their active board ID:

```
Socket Handshake -> JWT Authentication -> socket.user = { id, email }
                                               │
                                               ▼
                              Client emits 'board:join', boardId
                                               │
                                               ▼
                                 Socket joins 'board:<id>'
```

### Event Routing:
- **Client to Server**: `board:join`, `board:leave`
- **Server to Room**: `io.to('board:' + boardId).emit(event, payload)`
- **Server to Others (Exclude Sender)**: `socket.to('board:' + boardId).emit(event, payload)`

---

## 2. Live Presence Tracking (`presence:update`)
The backend maintains an in-memory presence map:
```javascript
// boardId -> Map(userId -> connectionCount)
const presence = new Map();
```

When a user joins a board:
1. `presence.get(boardId)` increments the connection counter for `userId`.
2. Server broadcasts `presence:update` with an array of active `userId`s to `board:<id>`.
3. When a socket disconnects or leaves, the count is decremented; if 0, the user is removed from presence, and `presence:update` is re-announced.

---

## 3. Real-Time Reconnection Strategy
Socket.IO handles reconnection automatically, but in-memory socket room associations are lost upon reconnection.
To guarantee consistency:
1. Sockets re-emit `board:join` upon reconnection.
2. The client re-hydrates active board data from local PouchDB cache and re-validates with the server.

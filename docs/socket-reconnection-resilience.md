# Socket Client & Reconnection Resilience Architecture

## Overview
This document details the centralized WebSocket client architecture, connection lifecycle, and reconnection recovery resilience implemented for **CollabBoard**, aligned with Session 5 (*Real-Time Communication & DevOps*) standards.

---

## 1. Centralized Socket Client Wrapper

The frontend communicates through a centralized singleton wrapper (`Frontend/src/sync/socketClient.ts`):
- **Singleton Management**: Ensures a single persistent connection per active browser window.
- **Handshake Authentication**: Passes the JWT in `auth: { token }` payload rather than query parameters to prevent token leakage in server logs (Slide 11).
- **Connection State Tracking**: Exposes `isSocketConnected()` and `getActiveJoinedBoard()`.

---

## 2. Reconnection Recovery: Assume You Missed Something (Slide 18)

When a client temporarily loses connection and reconnects, Socket.io reconnects automatically with exponential backoff. However, **Socket.io does NOT replay missed events** that occurred during the outage, and in-memory socket rooms on the server are lost.

### Recovery Workflow (`useReconnectionRecovery`):
Upon the `connect` event:
1. **Set Online State**: Updates UI connection badges.
2. **Re-join Active Room**: Emits `board:join` with the active board ID so the server re-subscribes the socket to room broadcasts.
3. **Re-fetch Board from REST**: Calls REST `/api/boards/:id` to retrieve authoritative board and task states, catching any updates made by collaborators while offline.
4. **Drain Offline Mutation Queue**: Executes `flushSyncQueue()` in FIFO order to sync any optimistic offline mutations queued in PouchDB/IndexedDB (Session 3).

```
Client Disconnects ──> Network Recovers ──> Socket 'connect' event
                                                    │
    ┌───────────────────────────────────────────────┴───────────────────────────────────────────────┐
    ▼                                               ▼                                               ▼
1. Emit 'board:join'                        2. REST GET /api/boards/:id                   3. flushSyncQueue()
(Restore server room scoping)               (Reconcile missed board events)               (Drain offline mutations)
```

---

## 3. Disconnect & Authentication Error Handling (Slides 11 & 12)

### Handshake Auth Errors (`connect_error`):
If the server rejects the socket handshake due to invalid or missing credentials (`BAD_TOKEN` or `NO_TOKEN`):
1. The client intercepts the error in `connect_error`.
2. Triggers `onSocketAuthError` listeners.
3. Dispatches `auth:expired` event to prompt immediate navigation to `/login`.

### Forceful Server Disconnections:
When the server disconnects the socket forcefully (`reason === 'io server disconnect'`), Socket.io does not reconnect automatically. The client detects this and triggers `socket.connect()` to perform a manual restart.

---

## 4. Preventing Duplicate Listeners (Slide 17)

Component remounts (e.g. route transitions, React StrictMode in development) can register duplicate event handlers if not properly disposed:
- Every subscriber (`subscribeSocketConnection`, `subscribeTaskCreated`, `subscribePresenceUpdate`, `useReconnectionRecovery`) returns an explicit cleanup function.
- In `useEffect` return blocks, `socket.off(event, handler)` unbinds the specific listener, preventing memory leaks and multiple update triggers.

# Socket Handshake Authentication & Security Architecture

## Overview
This document specifies the WebSocket handshake authentication and transport security mechanisms for **CollabBoard**, designed according to Session 5 (*Real-Time Communication & DevOps*) security specifications.

---

## 1. Handshake Authentication Protocol (Session 5 - Slide 11)

A WebSocket connection is a persistent TCP connection rather than an episodic HTTP request. Consequently, authentication occurs **once at the start** during the initial HTTP upgrade handshake:

```
Client ───────────────── Handshake with auth: { token } ─────────────────> Server
                                                                              │
                                                                       io.use() middleware
                                                                              │
                 ┌────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┐
                 ▼                                                                                                                         ▼
       Missing Token ('NO_TOKEN')                                                                                                  Verify JWT Secret
                 │                                                                                                                         │
        next(new Error("NO_TOKEN"))                                                                             ┌──────────────────────────┴──────────────────────────┐
                 │                                                                                              ▼                                                     ▼
        Reject connection                                                                              Invalid / Expired Token                             Valid Signature
                                                                                                                │                                                     │
                                                                                                    next(new Error("BAD_TOKEN"))                socket.user = { id, email }
                                                                                                                │                                                     │
                                                                                                        Reject connection                              next() -> Connection allowed
```

---

## 2. Preventing Query String Token Leakage

> [!WARNING]
> **Slide 11 Principle:** Never place access tokens in query parameters (`/socket.io/?token=...`). Query parameters are retained in plaintext within server access logs, reverse proxy buffers, and browser histories.

The CollabBoard socket authentication middleware enforces:
1. Tokens are transmitted inside the handshake auth body:
   ```javascript
   const socket = io(SERVER_URL, {
     auth: { token: localStorage.getItem('token') }
   });
   ```
2. Any fallback query tokens encountered are immediately deleted from `socket.handshake.query` to prevent downstream log exposure.

---

## 3. Strict Error Codes & Client Handling

| Error Code | HTTP/Handshake Context | Trigger Condition | Client Action (Slide 12) |
|---|---|---|---|
| `NO_TOKEN` | 401 Unauthorized | Socket initiated without auth credentials | Redirect to `/login`, clear session |
| `BAD_TOKEN` | 403 Forbidden | Expired signature, corrupted token, invalid secret | Redirect to `/login`, notify user |

---

## 4. Verification & Testing

Security guarantees are verified by automated test suites in `Backend/tests/socketHandshakeSecurity.test.js`:
- Unauthenticated handshakes fail immediately with `NO_TOKEN`.
- Tampered or expired JWT tokens fail with `BAD_TOKEN`.
- Legitimate users receive authenticated session attachments in `socket.user`.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PresenceTracker } from '../src/socket/presenceTracker.js';

describe('Member 4: shamu-4 - In-Memory Presence Tracker Suite', () => {
  let tracker;

  beforeEach(() => {
    tracker = new PresenceTracker();
  });

  it('registers user connection and returns updated connection count (Slide 19)', () => {
    const count = tracker.addConnection('board-alpha', 'usr-1');
    expect(count).toBe(1);
    expect(tracker.getOnlineUserIds('board-alpha')).toEqual(['usr-1']);
  });

  it('tracks multiple tabs for the same collaborator without duplicate user IDs', () => {
    tracker.addConnection('board-alpha', 'usr-1'); // Tab 1
    const count2 = tracker.addConnection('board-alpha', 'usr-1'); // Tab 2

    expect(count2).toBe(2);
    expect(tracker.getUserConnectionCount('board-alpha', 'usr-1')).toBe(2);
    // Unique user list must NOT have duplicates
    expect(tracker.getOnlineUserIds('board-alpha')).toEqual(['usr-1']);
  });

  it('decrements connection count on leave while keeping user online if other tabs exist', () => {
    tracker.addConnection('board-beta', 'usr-2');
    tracker.addConnection('board-beta', 'usr-2');

    const remaining = tracker.removeConnection('board-beta', 'usr-2');
    expect(remaining).toBe(1);
    expect(tracker.getOnlineUserIds('board-beta')).toContain('usr-2');
  });

  it('removes user from active presence when last connection disconnects', () => {
    tracker.addConnection('board-gamma', 'usr-3');
    const remaining = tracker.removeConnection('board-gamma', 'usr-3');

    expect(remaining).toBe(0);
    expect(tracker.getOnlineUserIds('board-gamma')).toEqual([]);
    expect(tracker.getUserConnectionCount('board-gamma', 'usr-3')).toBe(0);
  });

  it('computes board presence statistics with distinct users and total connections', () => {
    tracker.addConnection('board-stats', 'user-a');
    tracker.addConnection('board-stats', 'user-a'); // 2 tabs
    tracker.addConnection('board-stats', 'user-b'); // 1 tab

    const stats = tracker.getBoardStats('board-stats');
    expect(stats.activeUserCount).toBe(2);
    expect(stats.totalConnections).toBe(3);
  });

  it('handles non-existent boards and users gracefully', () => {
    expect(tracker.getOnlineUserIds('non-existent')).toEqual([]);
    expect(tracker.getUserConnectionCount('non-existent', 'no-user')).toBe(0);
    expect(tracker.removeConnection('non-existent', 'no-user')).toBe(0);
  });
});

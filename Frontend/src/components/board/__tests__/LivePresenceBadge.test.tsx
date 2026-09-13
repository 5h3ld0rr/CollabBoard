import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LivePresenceBadge } from '../LivePresenceBadge';
import { formatOnlinePresenceLabel, resolveCollaboratorPresence } from '../../../utils/presenceUtils';

describe('Member 4: shamu-4 - Live Presence Badge & Utilities Suite', () => {
  describe('formatOnlinePresenceLabel', () => {
    it('returns "Online: just you" when array is empty or has 1 user (Slide 19)', () => {
      expect(formatOnlinePresenceLabel([])).toBe('Online: just you');
      expect(formatOnlinePresenceLabel(['u-1'])).toBe('Online: just you');
      expect(formatOnlinePresenceLabel(['u-1'], 'u-1')).toBe('Online: just you');
    });

    it('returns "Online: X active" when multiple collaborators are present', () => {
      expect(formatOnlinePresenceLabel(['u-1', 'u-2'])).toBe('Online: 2 active');
      expect(formatOnlinePresenceLabel(['u-1', 'u-2', 'u-3'])).toBe('Online: 3 active');
    });
  });

  describe('resolveCollaboratorPresence', () => {
    it('flags online status and current user correctly', () => {
      const members: any[] = [
        { id: 'm-1', name: 'Alice' },
        { id: 'm-2', name: 'Bob' },
        { id: 'm-3', name: 'Charlie' },
      ];

      const resolved = resolveCollaboratorPresence(['m-1', 'm-3'], members, 'm-1');
      expect(resolved[0].isOnline).toBe(true);
      expect(resolved[0].isCurrentUser).toBe(true);
      expect(resolved[1].isOnline).toBe(false);
      expect(resolved[1].isCurrentUser).toBe(false);
      expect(resolved[2].isOnline).toBe(true);
    });
  });

  describe('LivePresenceBadge Component', () => {
    it('renders with data-testid live-presence-indicator and "just you" fallback', () => {
      render(<LivePresenceBadge onlineUsers={['usr-self']} currentUserId="usr-self" />);

      const badge = screen.getByTestId('live-presence-indicator');
      expect(badge).toBeDefined();
      expect(badge.textContent).toContain('Online: just you');
    });

    it('renders updated label with multiple collaborators count', () => {
      render(<LivePresenceBadge onlineUsers={['usr-self', 'usr-alex', 'usr-clara']} currentUserId="usr-self" />);

      const badge = screen.getByTestId('live-presence-indicator');
      expect(badge.textContent).toContain('Online: 3 active');
    });
  });
});

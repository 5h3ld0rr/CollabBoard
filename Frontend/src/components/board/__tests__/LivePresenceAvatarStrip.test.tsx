import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LivePresenceAvatarStrip } from '../LivePresenceAvatarStrip';

describe('Member 4: shamu-4 - Live Presence Avatar Strip Suite', () => {
  const sampleMembers: any[] = [
    { id: 'usr-1', name: 'Shamudi Amodya', initials: 'SA', color: 'bg-emerald-600' },
    { id: 'usr-2', name: 'Alex Silva', initials: 'AS', color: 'bg-blue-600' },
    { id: 'usr-3', name: 'Clara Oswald', initials: 'CO', color: 'bg-purple-600' },
    { id: 'usr-4', name: 'Dan Lewis', initials: 'DL', color: 'bg-amber-600' },
  ];

  it('renders avatar strip with member avatars and presence indicator dots (Slide 19)', () => {
    render(
      <LivePresenceAvatarStrip
        members={sampleMembers}
        onlineUserIds={['usr-1', 'usr-2']}
        currentUserId="usr-1"
      />
    );

    const strip = screen.getByTestId('presence-avatar-strip');
    expect(strip).toBeDefined();

    expect(screen.getByTestId('presence-avatar-usr-1')).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-2')).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-3')).toBeDefined();
    expect(screen.getByTestId('presence-avatar-usr-4')).toBeDefined();

    // Check initials render
    expect(screen.getByText('SA')).toBeDefined();
    expect(screen.getByText('AS')).toBeDefined();
  });

  it('renders overflow count badge when members exceed maxVisible', () => {
    render(
      <LivePresenceAvatarStrip
        members={sampleMembers}
        onlineUserIds={['usr-1']}
        maxVisible={2}
      />
    );

    const overflow = screen.getByTestId('presence-avatar-overflow');
    expect(overflow).toBeDefined();
    expect(overflow.textContent).toBe('+2');
  });

  it('displays correct tooltip showing online status and (You) indicator', () => {
    render(
      <LivePresenceAvatarStrip
        members={sampleMembers}
        onlineUserIds={['usr-1']}
        currentUserId="usr-1"
      />
    );

    const selfAvatar = screen.getByTestId('presence-avatar-usr-1');
    expect(selfAvatar.getAttribute('title')).toContain('(You)');
    expect(selfAvatar.getAttribute('title')).toContain('Online');

    const offlineAvatar = screen.getByTestId('presence-avatar-usr-3');
    expect(offlineAvatar.getAttribute('title')).toContain('Offline');
  });
});

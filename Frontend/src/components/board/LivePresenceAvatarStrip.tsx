import React from 'react';
import type { User } from '../../types';

export interface LivePresenceAvatarStripProps {
  members: (User | { id: string; name: string; email?: string; avatar?: string; initials?: string; color?: string })[];
  onlineUserIds: string[];
  currentUserId?: string | null;
  maxVisible?: number;
  className?: string;
}

/**
 * Collaborator presence avatar strip (Session 5 - Slide 15 & 19)
 * Renders avatar stack with real-time green indicators for online collaborators.
 */
export const LivePresenceAvatarStrip: React.FC<LivePresenceAvatarStripProps> = ({
  members = [],
  onlineUserIds = [],
  currentUserId,
  maxVisible = 5,
  className = '',
}) => {
  const onlineSet = new Set(onlineUserIds);

  // Sort members: online members first, current user first among them
  const sortedMembers = [...members].sort((a, b) => {
    const aOnline = onlineSet.has(a.id);
    const bOnline = onlineSet.has(b.id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });

  const visibleMembers = sortedMembers.slice(0, maxVisible);
  const overflowCount = sortedMembers.length - maxVisible;

  const getInitials = (name: string, fallbackInitials?: string) => {
    if (fallbackInitials) return fallbackInitials;
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      data-testid="presence-avatar-strip"
      className={`flex items-center -space-x-2 overflow-hidden py-1 ${className}`}
    >
      {visibleMembers.map((member) => {
        const isOnline = onlineSet.has(member.id);
        const isSelf = Boolean(currentUserId && member.id === currentUserId);
        const initials = getInitials(member.name, member.initials);

        return (
          <div
            key={member.id}
            title={`${member.name} ${isSelf ? '(You)' : ''} — ${isOnline ? 'Online' : 'Offline'}`}
            data-testid={`presence-avatar-${member.id}`}
            className="relative inline-block transition-transform hover:scale-110 hover:z-10"
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-zinc-900 shadow-sm"
              />
            ) : (
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-zinc-900 shadow-sm ${
                  member.color || 'bg-indigo-600'
                }`}
              >
                {initials}
              </div>
            )}

            {/* Active presence status badge */}
            <span
              className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-1.5 ring-zinc-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            />
          </div>
        );
      })}

      {overflowCount > 0 && (
        <div
          data-testid="presence-avatar-overflow"
          className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 ring-2 ring-zinc-900 text-[10px] font-medium"
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

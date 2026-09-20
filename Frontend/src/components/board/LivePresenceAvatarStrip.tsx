import type { User } from '../../types';
import { getProfileGradient } from '../../utils';

export interface LivePresenceAvatarStripProps {
  members: (User | { id: string; name: string; email?: string; avatar?: string; initials?: string; color?: string })[];
  onlineUserIds: string[];
  currentUserId?: string | null;
  maxVisible?: number;
  className?: string;
  onlyShowOnline?: boolean;
}

const getMemberBackground = (id: string, name: string, color?: string) => {
  return getProfileGradient(color, name || id);
};

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
  onlyShowOnline = false,
}) => {
  const onlineSet = new Set(onlineUserIds);

  const filteredMembers = onlyShowOnline
    ? members.filter((m) => onlineSet.has(m.id))
    : members;

  // Sort members: online members first, current user first among them
  const sortedMembers = [...filteredMembers].sort((a, b) => {
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

  if (visibleMembers.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="presence-avatar-strip"
      className={`flex items-center -space-x-2 py-0.5 ${className}`}
    >
      {visibleMembers.map((member) => {
        const isOnline = onlineSet.has(member.id);
        const isSelf = Boolean(currentUserId && member.id === currentUserId);
        const initials = getInitials(member.name, member.initials);
        const bgGradient = getMemberBackground(member.id, member.name, member.color);

        return (
          <div
            key={member.id}
            title={`${member.name} ${isSelf ? '(You)' : ''} — ${isOnline ? 'Online' : 'Offline'}`}
            data-testid={`presence-avatar-${member.id}`}
            className="relative inline-block transition-transform hover:scale-110 hover:z-20"
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-950 shadow-sm"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white tracking-wider ring-2 ring-slate-950 shadow-sm ${bgGradient}`}
              >
                {initials}
              </div>
            )}

            {/* Active presence status badge */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-slate-950 ${
                isOnline
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                  : 'bg-slate-600'
              }`}
            />
          </div>
        );
      })}

      {overflowCount > 0 && (
        <div
          data-testid="presence-avatar-overflow"
          className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-200 ring-2 ring-slate-950 text-[11px] font-bold shadow-sm"
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

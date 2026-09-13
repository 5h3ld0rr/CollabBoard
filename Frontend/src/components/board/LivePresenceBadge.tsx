import React from 'react';
import { Users } from 'lucide-react';
import { formatOnlinePresenceLabel } from '../../utils/presenceUtils';

export interface LivePresenceBadgeProps {
  onlineUsers: string[];
  currentUserId?: string | null;
  className?: string;
}

/**
 * Live presence badge matching Session 5 - Slide 19
 * Displays live active collaborator counts and "just you" fallback.
 */
export const LivePresenceBadge: React.FC<LivePresenceBadgeProps> = ({
  onlineUsers = [],
  currentUserId,
  className = '',
}) => {
  const label = formatOnlinePresenceLabel(onlineUsers, currentUserId);
  const hasMultiple = onlineUsers.length > 1;

  return (
    <div
      data-testid="live-presence-indicator"
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-300 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {hasMultiple && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 animate-pulse" />
      </span>
      <Users className="w-3.5 h-3.5 opacity-70" />
      <span className="truncate">{label}</span>
    </div>
  );
};

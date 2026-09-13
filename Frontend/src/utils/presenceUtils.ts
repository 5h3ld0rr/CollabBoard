import type { BoardMember } from '../types';

/**
 * Formats the live presence indicator label (Session 5 - Slide 19)
 *
 * Examples:
 * - 0 online -> "Offline"
 * - 1 online (just current user) -> "Online: just you"
 * - 3 online -> "Online: 3 active"
 *
 * @param {string[]} onlineUserIds
 * @param {string} [currentUserId]
 * @returns {string}
 */
export function formatOnlinePresenceLabel(
  onlineUserIds: string[] = [],
  currentUserId?: string | null
): string {
  if (!onlineUserIds || onlineUserIds.length === 0) {
    return 'Offline';
  }

  const count = onlineUserIds.length;

  if (count === 1) {
    if (currentUserId && onlineUserIds[0] === currentUserId) {
      return 'Online: just you';
    }
    return 'Online: 1 active';
  }

  return `Online: ${count} active`;
}

/**
 * Resolves active collaborators from board member list with online status indicators
 *
 * @param {string[]} onlineUserIds
 * @param {BoardMember[]} [members=[]]
 * @param {string} [currentUserId]
 */
export function resolveCollaboratorPresence(
  onlineUserIds: string[] = [],
  members: BoardMember[] = [],
  currentUserId?: string | null
) {
  const onlineSet = new Set(onlineUserIds);

  return members.map((member) => ({
    ...member,
    isOnline: onlineSet.has(member.id),
    isCurrentUser: Boolean(currentUserId && member.id === currentUserId),
  }));
}

/**
 * Formats an ISO date string or Date object into human-readable relative time.
 * Examples: 'Just now', '5m ago', '2h ago', 'Yesterday', '3d ago', 'Oct 12'
 */
export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recently';
  if (dateInput === 'Just now' || dateInput === 'Recently') return dateInput;

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // If in the future or under 1 minute
    if (diffMs < 60 * 1000) {
      return 'Just now';
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    const isCurrentYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(isCurrentYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Formats a date into a standard friendly localized format (e.g. 'Oct 12, 2026, 4:30 PM')
 */
export function formatDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateInput);
  }
}

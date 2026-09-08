/**
 * Extracts uppercase initials from a person's name or title.
 * - Multi-word name ("Chirath Rajapaksha") -> "CR"
 * - Multi-word with extra/irregular whitespace ("  Chirath   Rajapaksha  ") -> "CR"
 * - Multi-word with middle names ("Chirath Timodh Rajapaksha") -> "CR" (first + last)
 * - Single word name ("Chirath") -> "CH" (first two letters)
 * - Clean fallback if empty or missing -> "U"
 */
export function getInitials(name?: string | null, fallback = 'U'): string {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

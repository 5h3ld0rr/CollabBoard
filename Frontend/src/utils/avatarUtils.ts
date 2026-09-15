import { COLOR_OPTIONS } from '../constants';

/**
 * Resolves the CSS classes for a profile's preferred color gradient.
 * Handles modern Tailwind gradient pairs (e.g., 'from-indigo-600 to-violet-600'),
 * standard background classes (e.g., 'bg-emerald-600'), and returns the default
 * gradient if color is missing.
 *
 * @param color The user's preferred color or gradient string
 * @param _seed Optional identifier (retained for backward compatibility)
 * @returns CSS class string e.g. "bg-linear-to-br from-indigo-600 to-violet-600"
 */
export function getProfileGradient(color?: string | null, _seed?: string | null): string {
  if (color) {
    const trimmed = color.trim();
    if (trimmed.startsWith('bg-linear-') || trimmed.startsWith('bg-gradient-')) {
      return trimmed;
    }
    if (trimmed.includes('from-')) {
      return `bg-linear-to-br ${trimmed}`;
    }
    if (trimmed.startsWith('bg-')) {
      return trimmed;
    }
  }

  return `bg-linear-to-br ${COLOR_OPTIONS[0].value}`;
}

/**
 * Normalizes a color string into its pure gradient value (e.g. 'from-indigo-600 to-violet-600')
 * for storing in user profile state.
 */
export function normalizeGradientValue(color?: string | null): string {
  if (!color) return COLOR_OPTIONS[0].value;
  const trimmed = color.trim();
  if (trimmed.includes('from-')) {
    return trimmed.replace(/^bg-(?:linear|gradient)-to-[a-z]+\s+/, '').trim();
  }
  return COLOR_OPTIONS[0].value;
}

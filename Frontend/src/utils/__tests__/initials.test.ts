import { describe, it, expect } from 'vitest';
import { getInitials } from '../initials';

describe('initials utils', () => {
  it('returns fallback if name is null, undefined, or not a string', () => {
    expect(getInitials(null)).toBe('U');
    expect(getInitials(undefined)).toBe('U');
    expect(getInitials('' as any)).toBe('U');
    expect(getInitials('   ')).toBe('U');
    expect(getInitials(undefined, 'FB')).toBe('FB');
  });

  it('handles single word names by taking first two characters uppercase', () => {
    expect(getInitials('Chirath')).toBe('CH');
    expect(getInitials('a')).toBe('A');
  });

  it('handles multi-word names by taking first and last word initials', () => {
    expect(getInitials('Chirath Rajapaksha')).toBe('CR');
    expect(getInitials('John Middle Doe')).toBe('JD');
  });

  it('handles irregular and extra whitespace correctly', () => {
    expect(getInitials('   Jane    Doe   ')).toBe('JD');
  });
}

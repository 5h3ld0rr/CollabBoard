import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime, formatDateTime } from '../date';

describe('date utils', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-12T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Recently" when no date input is provided', () => {
      expect(formatRelativeTime(null)).toBe('Recently');
      expect(formatRelativeTime(undefined)).toBe('Recently');
      expect(formatRelativeTime('')).toBe('Recently');
    });

    it('returns literal "Just now" or "Recently" if passed directly', () => {
      expect(formatRelativeTime('Just now')).toBe('Just now');
      expect(formatRelativeTime('Recently')).toBe('Recently');
    });

    it('returns string input directly if date is invalid', () => {
      expect(formatRelativeTime('not-a-valid-date')).toBe('not-a-valid-date');
    });

    it('returns "Just now" for times within the last 60 seconds', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
    });

    it('returns "Xm ago" for minutes under an hour', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');
    });

    it('returns "Xh ago" for hours under a day', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
    });

    it('returns "Yesterday" for 1 day ago', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('Yesterday');
    });

    it('returns "Xd ago" for days under a week', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 3600 * 1000);
      expect(formatRelativeTime(fourDaysAgo)).toBe('4d ago');
    });

    it('returns "Xw ago" for weeks under a month', () => {
      const now = new Date('2026-09-12T12:00:00.000Z');
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2w ago');
    });

    it('returns formatted date for older dates in the current year', () => {
      const monthsAgo = new Date('2026-02-10T12:00:00.000Z');
      const formatted = formatRelativeTime(monthsAgo);
      expect(formatted).toMatch(/Feb/);
    });

    it('returns formatted date including year for past years', () => {
      const pastYear = new Date('2024-05-15T12:00:00.000Z');
      const formatted = formatRelativeTime(pastYear);
      expect(formatted).toMatch(/2024/);
    });
  });

  describe('formatDateTime', () => {
    it('returns empty string if no date is given', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
    });

    it('returns the input as string if date is invalid', () => {
      expect(formatDateTime('invalid-date')).toBe('invalid-date');
    });

    it('formats a valid date into a localized string with month, day, year, time', () => {
      const date = new Date('2026-09-12T15:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBeTruthy();
      expect(result).toMatch(/2026/);
    });
  });
});
